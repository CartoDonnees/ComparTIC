import { resolveStatusKey } from "@/services/tools/offerStatus";
import { normalizeAreaTitle } from "@/services/tools/areaTitle";

/**
 * Agrégation des statistiques générales sur les offres.
 *
 * ─── Ce que faisait la version précédente ─────────────────────────────────
 *
 * Soixante `prisma.offer.count()` lancés en parallèle, dont le résultat était
 * un TABLEAU POSITIONNEL consommé à l'écran sous la forme `stats[43]`. Outre
 * l'illisibilité   insérer un compteur décalait tous les suivants   cette
 * approche portait trois défauts de fond :
 *
 *  1. SOIXANTE ALLERS-RETOURS en base pour ce qu'un seul parcours suffit à
 *     calculer.
 *  2. DES CONDITIONS FAUSSÉES PAR COPIER-COLLER. Les compteurs « refusées »
 *     par zone (NATIONAL, INTERNATIONAL, ROAMING) traînaient un
 *     `specialPromotion: { isNot: null }` hérité du bloc voisin : ils ne
 *     comptaient donc que les offres PROMOTIONNELLES refusées, jamais les
 *     offres de base. Et le compteur « international validées » oubliait
 *     d'exclure l'offre repère, contrairement aux 59 autres.
 *  3. DEUX SOURCES DE STATUT MÊLÉES. « En attente » était lu sur
 *     `Offer.status`, tandis que « validée / refusée / suspendue » venait de
 *     `Validation.status`. Une offre portant les deux était comptée deux fois,
 *     une offre n'en portant aucune n'était comptée nulle part : les totaux ne
 *     se recoupaient qu'au hasard des données.
 *
 * Ici, un seul parcours, une seule règle de statut   la décision de l'ARTCI
 * l'emporte sur l'avancement du dossier, comme dans l'onglet « Suivi »   et
 * des libellés de zone normalisés, faute de quoi une zone saisie
 * « INTERNATIONALE » ne serait comptée nulle part.
 */

export const STATUS_KEYS = ["PENDING", "ALLOW", "DINIED", "SUSPENDED", "UNKNOWN"];
export const ZONE_KEYS = ["NATIONAL", "INTERNATIONAL", "ROAMING", "UNKNOWN"];

const emptyStatusBucket = () =>
  STATUS_KEYS.reduce((acc, k) => ({ ...acc, [k]: 0 }), { total: 0 });

const bump = (bucket, statusKey) => {
  bucket.total += 1;
  const key = STATUS_KEYS.includes(statusKey) ? statusKey : "UNKNOWN";
  bucket[key] += 1;
};

/** Mois au format « 2026-09 », pour regrouper sans dépendre du fuseau. */
const monthKey = (date) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};

const MONTH_LABELS = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];

/** Les `months` derniers mois, du plus ancien au plus récent. */
export const buildMonthScale = (months = 12, reference = new Date()) => {
  const out = [];
  const ref = new Date(reference);
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() - i, 1));
    out.push({
      key: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
      label: `${MONTH_LABELS[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`,
    });
  }
  return out;
};

/* ------------------------------------------------------------------------ */
/* Chronologie par semaine, mois ou année                                    */
/* ------------------------------------------------------------------------ */

export const GRANULARITIES = ["week", "month", "year"];

const utcDay = (date) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

/** Début de la période (semaine du lundi, 1er du mois, 1er janvier), en UTC. */
export const periodStart = (date, granularity) => {
  const d = utcDay(date);
  if (!d) return null;
  if (granularity === "year") return new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  if (granularity === "month") return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  const dow = (d.getUTCDay() + 6) % 7; // lundi = 0
  return new Date(d.getTime() - dow * 86400000);
};

const nextPeriod = (d, granularity) => {
  if (granularity === "year") return new Date(Date.UTC(d.getUTCFullYear() + 1, 0, 1));
  if (granularity === "month") return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
  return new Date(d.getTime() + 7 * 86400000);
};

const periodKey = (d) => d.toISOString().slice(0, 10);

const pad2 = (n) => String(n).padStart(2, "0");
const periodLabel = (d, granularity) => {
  if (granularity === "year") return String(d.getUTCFullYear());
  if (granularity === "month") return `${MONTH_LABELS[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`;
  return `${pad2(d.getUTCDate())}/${pad2(d.getUTCMonth() + 1)}/${String(d.getUTCFullYear()).slice(2)}`;
};

/** Plafond de points par chronologie (évite un graphique illisible). */
const MAX_POINTS = { week: 520, month: 240, year: 50 };

/** Échelle continue de `from` à `to` (périodes vides incluses). */
export const buildTimeScale = (granularity, from, to) => {
  let cur = periodStart(from, granularity);
  const last = periodStart(to, granularity);
  if (!cur || !last || cur > last) return [];
  const out = [];
  while (cur <= last && out.length < MAX_POINTS[granularity]) {
    out.push({ key: periodKey(cur), label: periodLabel(cur, granularity), start: periodKey(cur) });
    cur = nextPeriod(cur, granularity);
  }
  return out;
};

/**
 * @param {Array} offers  offres allégées (statut, zone, type, opérateur, dates)
 * @param {Object} options
 *   months     profondeur de la courbe mensuelle
 *   reference  dernier mois de la courbe (par défaut : aujourd'hui)
 *   dateField  date qui situe une offre dans le temps : `createdAt` (défaut)
 *              ou `notifiDate` (celle du tableau de bord historique)
 */
export const aggregateOfferStats = (
  offers,
  { months = 12, reference = new Date(), dateField = "createdAt", from = null, to = null } = {},
) => {
  const list = Array.isArray(offers) ? offers : [];

  // Chronologies semaine / mois / année sur la période : bornes du filtre, ou
  // à défaut les dates extrêmes des offres (jamais au-delà d'aujourd'hui).
  const dated = list.map((o) => o?.[dateField] ?? o?.createdAt).filter(Boolean).map((v) => new Date(v)).filter((d) => !Number.isNaN(d.getTime()));
  const rangeFrom = from ? new Date(from) : dated.length ? new Date(Math.min(...dated)) : new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() - 11, 1));
  const rangeTo = to ? new Date(to) : new Date();
  const timelines = Object.fromEntries(
    GRANULARITIES.map((g) => [
      g,
      new Map(
        buildTimeScale(g, rangeFrom, rangeTo).map((p) => [
          p.key,
          { ...p, declared: 0, decided: 0, base: 0, promo: 0, mobile: 0, fixe: 0 },
        ]),
      ),
    ]),
  );

  const byStatus = emptyStatusBucket();
  const byKind = { BASE: emptyStatusBucket(), PROMO: emptyStatusBucket() };
  const byZone = ZONE_KEYS.reduce(
    (acc, z) => ({ ...acc, [z]: emptyStatusBucket() }),
    {},
  );
  // Zone croisée avec le type (base / promotionnelle).
  const byZoneKind = ZONE_KEYS.reduce(
    (acc, z) => ({
      ...acc,
      [z]: { BASE: emptyStatusBucket(), PROMO: emptyStatusBucket() },
    }),
    {},
  );
  const byCategory = { MOBILE: 0, FIXE: 0, UNKNOWN: 0 };
  const byBilling = { PREPAID: 0, POSTPAID: 0, HYBRID: 0, UNKNOWN: 0 };
  const operatorMap = new Map();

  const scale = buildMonthScale(months, reference);
  // Séries mensuelles : déclarations, décisions, et ventilation par type et
  // catégorie   de quoi reconstituer la courbe « évolution des offres par type
  // et catégories » qui existait déjà, sur une échelle mensuelle plutôt
  // qu'hebdomadaire (lisible sur une longue période).
  const monthly = new Map(
    scale.map((m) => [
      m.key,
      { ...m, declared: 0, decided: 0, base: 0, promo: 0, mobile: 0, fixe: 0 },
    ]),
  );

  let monitorings = 0;

  list.forEach((o) => {
    const statusKey = resolveStatusKey(o) || "UNKNOWN";

    bump(byStatus, statusKey);
    bump(o?.specialPromotion ? byKind.PROMO : byKind.BASE, statusKey);

    const zone = normalizeAreaTitle(o?.area?.title) || "UNKNOWN";
    bump(byZone[zone] || byZone.UNKNOWN, statusKey);
    const zk = byZoneKind[zone] || byZoneKind.UNKNOWN;
    bump(o?.specialPromotion ? zk.PROMO : zk.BASE, statusKey);

    const cat = o?.category;
    byCategory[cat in byCategory ? cat : "UNKNOWN"] += 1;

    const bill = o?.billingType === "HYBRIDE" ? "HYBRID" : o?.billingType;
    byBilling[bill in byBilling ? bill : "UNKNOWN"] += 1;

    const op = o?.operator;
    if (op?.id != null) {
      if (!operatorMap.has(op.id)) {
        operatorMap.set(op.id, {
          id: op.id,
          code: op.code,
          name: op.name,
          color: op.color,
          imagePath: op.imagePath,
          ...emptyStatusBucket(),
          BASE: 0,
          PROMO: 0,
          MOBILE: 0,
          FIXE: 0,
          NATIONAL: 0,
          INTERNATIONAL: 0,
          ROAMING: 0,
        });
      }
      const bucket = operatorMap.get(op.id);
      bump(bucket, statusKey);
      // Ventilations par opérateur : elles alimentent les graphiques croisés
      // (type, catégorie, zone) que l'écran présentait déjà.
      bucket[o?.specialPromotion ? "PROMO" : "BASE"] += 1;
      if (cat === "MOBILE" || cat === "FIXE") bucket[cat] += 1;
      if (zone !== "UNKNOWN") bucket[zone] += 1;
    }

    monitorings += o?._count?.monitorings ?? o?.monitorings?.length ?? 0;

    const refDate = o?.[dateField] ?? o?.createdAt;
    GRANULARITIES.forEach((g) => {
      const start = refDate ? periodStart(refDate, g) : null;
      const bucket = start ? timelines[g].get(periodKey(start)) : null;
      if (bucket) {
        bucket.declared += 1;
        bucket[o?.specialPromotion ? "promo" : "base"] += 1;
        if (cat === "MOBILE") bucket.mobile += 1;
        if (cat === "FIXE") bucket.fixe += 1;
      }
      const decided = o?.validation?.updatedAt ? periodStart(o.validation.updatedAt, g) : null;
      const decidedBucket = decided ? timelines[g].get(periodKey(decided)) : null;
      if (decidedBucket) decidedBucket.decided += 1;
    });

    const declaredAt = monthKey(o?.[dateField] ?? o?.createdAt);
    if (declaredAt && monthly.has(declaredAt)) {
      const bucket = monthly.get(declaredAt);
      bucket.declared += 1;
      bucket[o?.specialPromotion ? "promo" : "base"] += 1;
      if (cat === "MOBILE") bucket.mobile += 1;
      if (cat === "FIXE") bucket.fixe += 1;
    }
    const decidedAt = o?.validation?.updatedAt
      ? monthKey(o.validation.updatedAt)
      : null;
    if (decidedAt && monthly.has(decidedAt)) {
      monthly.get(decidedAt).decided += 1;
    }
  });

  const byOperator = [...operatorMap.values()].sort((a, b) => b.total - a.total);

  return {
    total: list.length,
    byStatus,
    byKind,
    byZone,
    byZoneKind,
    byCategory,
    byBilling,
    byOperator,
    monitorings,
    monthly: [...monthly.values()],
    // Évolution sur la période, par semaine (lundi), mois ou année.
    timelines: Object.fromEntries(GRANULARITIES.map((g) => [g, [...timelines[g].values()]])),
    // Taux de traitement : part des offres ayant reçu une décision.
    decisionRate:
      list.length > 0
        ? Math.round(
            ((byStatus.ALLOW + byStatus.DINIED + byStatus.SUSPENDED) /
              list.length) *
              100,
          )
        : 0,
  };
};

export default aggregateOfferStats;
