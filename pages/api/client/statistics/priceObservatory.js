import prisma from "@/services/config/auth/prisma";
import { serverError } from "@/services/config/apiError";

/**
 * Observatoire tarifaire public.
 *
 *   GET /api/client/statistics/priceObservatory[?months=24][&from=AAAA-MM-JJ][&to=AAAA-MM-JJ]
 *
 * Période : sans date, les `months` derniers mois. Avec `from` et/ou `to`,
 * seuls les mois de l'intervalle sont renvoyés (bornes incluses) :
 *   - `from` seul  : du mois de `from` au mois courant ;
 *   - `to` seul    : les `months` mois qui se terminent au mois de `to` ;
 *   - les deux     : du mois de `from` au mois de `to` (400 si `from` > `to`).
 *
 * Évolution des tarifs par opérateur et par service, reconstituée à partir de
 * l'historique déjà en base : offres validées (y compris les versions
 * remplacées par un monitoring), leurs formules et leurs prix, datées du mois
 * de validation. Aucune donnée nouvelle n'est collectée.
 *
 * Réponse :
 *   {
 *     generatedAt, months: ["2026-01", …],
 *     operators: [{ id, name, color, logo }],
 *     services: ["DATA", "VOIX", "SMS"],
 *     series: { DATA: { <operatorId>: [{ month, offers, medianPrice, medianUnit }] } },
 *     latest:  [{ operatorId, service, medianPrice, medianUnit, offers }],
 *     totals:  { offers, formulas }
 *   }
 *
 * Route publique (comme le comparateur) : aucune donnée nominative, seulement
 * des tarifs déjà affichés au public. Résultat mis en cache 10 minutes pour
 * éviter de recalculer à chaque visite.
 */

const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_FORMULAS = 8000;
let cache = { key: null, at: 0, payload: null };

const SERVICES = ["DATA", "VOIX", "SMS"];
/** Unité de référence par service, pour un prix comparable. */
const UNIT_LABEL = { DATA: "FCFA / Go", VOIX: "FCFA / min", SMS: "FCFA / SMS" };

const median = (values) => {
  const list = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  if (!list.length) return null;
  const mid = Math.floor(list.length / 2);
  return list.length % 2 ? list[mid] : Math.round(((list[mid - 1] + list[mid]) / 2) * 100) / 100;
};

const monthKey = (date) => {
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};

/** Quantité du service dans une formule, ramenée à l'unité de référence. */
const quantityOf = (formula, service) => {
  const detail = (formula.serviceDetail || []).find((d) => d.service?.title === service);
  if (!detail || !Number.isFinite(Number(detail.quantity))) return null;
  const qty = Number(detail.quantity);
  if (qty <= 0) return null;
  return service === "DATA" ? qty / 1024 : qty; // Mo -> Go
};

const MAX_MONTHS = 60;

/** « AAAA-MM-JJ » → Date (UTC), sinon null. */
const parseDay = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** Mois (« AAAA-MM ») de la période demandée, dans l'ordre chronologique. */
const buildMonthList = ({ months, fromDate, toDate }) => {
  const end = toDate ? new Date(toDate) : new Date();
  end.setUTCDate(1);
  end.setUTCHours(0, 0, 0, 0);
  let start;
  if (fromDate) {
    start = new Date(fromDate);
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
  } else {
    start = new Date(end);
    start.setUTCMonth(start.getUTCMonth() - months + 1);
  }
  const list = [];
  const cursor = new Date(start);
  while (cursor <= end && list.length < MAX_MONTHS) {
    list.push(monthKey(cursor));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return list;
};

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  const months = Math.min(60, Math.max(6, Number(req.query?.months || req.body?.months || 24)));
  const fromDate = parseDay(req.query?.from || req.body?.from);
  const toDate = parseDay(req.query?.to || req.body?.to);
  if (fromDate && toDate && fromDate > toDate) {
    return res.status(400).json({ error: "La date de début ne peut pas être postérieure à la date de fin.", code: "INVALID_RANGE" });
  }
  const monthList = buildMonthList({ months, fromDate, toDate });
  const key = `months:${months}|${fromDate ? monthKey(fromDate) : ""}|${toDate ? monthKey(toDate) : ""}`;
  const now = Date.now();
  if (cache.key === key && now - cache.at < CACHE_TTL_MS) {
    res.setHeader("Cache-Control", "public, max-age=600");
    return res.status(200).json({ ...cache.payload, cached: true });
  }

  try {
    // Offres ayant été publiées : validées, ou remplacées par une version
    // ultérieure (l'historique tarifaire doit rester visible).
    const formulas = await prisma.offerFormula.findMany({
      where: {
        price: { isNot: null },
        offer: {
          code: { not: "OF-000000000000000" },
          OR: [
            { workflowStatus: "VALIDATED" },
            { workflowStatus: "DEACTIVATED", validatedAt: { not: null } },
          ],
        },
      },
      select: {
        id: true,
        validity: true,
        price: { select: { value: true } },
        serviceDetail: {
          select: { quantity: true, service: { select: { title: true } } },
        },
        offer: {
          select: {
            id: true,
            category: true,
            validatedAt: true,
            notifiDate: true,
            operator: { select: { id: true, name: true, color: true, imagePath: true } },
          },
        },
      },
      take: MAX_FORMULAS,
    });

    const monthSet = new Set(monthList);

    const operators = new Map();
    // service -> operatorId -> month -> [prix unitaires]
    const buckets = {};
    SERVICES.forEach((s) => {
      buckets[s] = new Map();
    });
    const offerIds = new Set();

    for (const f of formulas) {
      const offer = f.offer;
      const op = offer?.operator;
      const when = offer?.validatedAt || offer?.notifiDate;
      if (!op || !when) continue;
      const month = monthKey(when);
      if (!monthSet.has(month)) continue;

      operators.set(op.id, { id: op.id, name: op.name, color: op.color, logo: op.imagePath || null });
      offerIds.add(offer.id);

      const price = Number(f.price?.value);
      if (!Number.isFinite(price) || price <= 0) continue;

      for (const service of SERVICES) {
        const qty = quantityOf(f, service);
        if (qty === null) continue;
        // Formule multi-services : le prix est réparti au prorata du nombre
        // de services présents, pour ne pas surévaluer chaque unité.
        const serviceCount = SERVICES.filter((s) => quantityOf(f, s) !== null).length || 1;
        const unitPrice = Math.round(((price / serviceCount) / qty) * 100) / 100;

        if (!buckets[service].has(op.id)) buckets[service].set(op.id, new Map());
        const byMonth = buckets[service].get(op.id);
        if (!byMonth.has(month)) byMonth.set(month, { prices: [], units: [], offers: new Set() });
        const entry = byMonth.get(month);
        entry.prices.push(price);
        entry.units.push(unitPrice);
        entry.offers.add(offer.id);
      }
    }

    const series = {};
    const latest = [];
    for (const service of SERVICES) {
      series[service] = {};
      for (const [operatorId, byMonth] of buckets[service]) {
        const points = monthList.map((month) => {
          const e = byMonth.get(month);
          return {
            month,
            offers: e ? e.offers.size : 0,
            medianPrice: e ? median(e.prices) : null,
            medianUnit: e ? median(e.units) : null,
          };
        });
        series[service][operatorId] = points;

        const last = [...points].reverse().find((p) => p.medianUnit !== null);
        if (last) {
          latest.push({
            operatorId,
            service,
            month: last.month,
            medianPrice: last.medianPrice,
            medianUnit: last.medianUnit,
            unitLabel: UNIT_LABEL[service],
            offers: last.offers,
          });
        }
      }
    }

    const payload = {
      generatedAt: new Date().toISOString(),
      months: monthList,
      operators: [...operators.values()].sort((a, b) => a.name.localeCompare(b.name)),
      services: SERVICES,
      unitLabels: UNIT_LABEL,
      series,
      latest,
      totals: { offers: offerIds.size, formulas: formulas.length },
    };

    cache = { key, at: now, payload };
    res.setHeader("Cache-Control", "public, max-age=600");
    return res.status(200).json(payload);
  } catch (error) {
    return serverError(res, error, "Observatoire tarifaire");
  }
}
