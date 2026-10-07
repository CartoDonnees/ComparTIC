/**
 * Évolution d'une offre dans le temps, pour l'opérateur.
 *
 * Une offre mise à jour (monitoring) donne une nouvelle version : l'ancienne
 * est conservée et reliée à la nouvelle (`sourceOfferId`). Ce module regroupe
 * les versions d'une même offre en « lignées » et dit ce qui a changé d'une
 * version à la suivante : c'est le lien entre le présent et le passé.
 *
 * Il ne parle pas du circuit de validation, qui reste interne à l'ARTCI.
 *
 * Module pur (aucune dépendance) : utilisé par l'API et testé seul.
 */

const BILLING = { PREPAID: "prépayé", POSTPAID: "postpayé", HYBRID: "hybride" };

const money = (value) => `${Number(value).toLocaleString("fr-FR")} FCFA`;
const key = (text) =>
  String(text ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

/**
 * Regroupe des offres en lignées (versions successives d'une même offre).
 * Chaque lignée est rendue de la version la plus récente à la plus ancienne.
 *
 * @param offers  offres portant `id`, `sourceOfferId`, `version`
 * @returns {Array<Array<object>>}
 */
export const buildLineages = (offers = []) => {
  const byId = new Map(offers.map((o) => [o.id, o]));
  const rootOf = (offer) => {
    const seen = new Set();
    let current = offer;
    // La version d'origine peut appartenir à un autre périmètre (absente de la liste) : on s'arrête à la plus ancienne connue.
    while (current.sourceOfferId && byId.has(current.sourceOfferId) && !seen.has(current.id)) {
      seen.add(current.id);
      current = byId.get(current.sourceOfferId);
    }
    return current.id;
  };
  const groups = new Map();
  offers.forEach((offer) => {
    const root = rootOf(offer);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(offer);
  });
  return [...groups.values()].map((versions) => versions.sort((a, b) => (b.version || 1) - (a.version || 1) || b.id - a.id));
};

/** Résumé chiffré d'une version : nombre de formules et fourchette de prix. */
export const offerSummary = (offer) => {
  const formulas = offer?.formulas || [];
  const prices = formulas.map((f) => Number(f.price?.value)).filter((n) => Number.isFinite(n));
  return {
    formulas: formulas.length,
    priceMin: prices.length ? Math.min(...prices) : null,
    priceMax: prices.length ? Math.max(...prices) : null,
  };
};

/**
 * Ce qui a changé entre deux versions consécutives d'une offre.
 *
 * @param previous  version précédente (avec `formulas`)
 * @param next      version suivante
 * @returns {Array<{ kind: string, label: string, from?: string, to?: string }>}
 */
export const versionChanges = (previous, next, { limit = 12 } = {}) => {
  if (!previous || !next) return [];
  const changes = [];
  if (key(previous.title) !== key(next.title)) changes.push({ kind: "changed", label: "Nom de l'offre", from: previous.title, to: next.title });
  if (previous.billingType !== next.billingType) {
    changes.push({ kind: "changed", label: "Type de client", from: BILLING[previous.billingType] || previous.billingType || "non précisé", to: BILLING[next.billingType] || next.billingType || "non précisé" });
  }

  const before = new Map((previous.formulas || []).map((f) => [key(f.title), f]));
  const after = new Map((next.formulas || []).map((f) => [key(f.title), f]));
  after.forEach((formula, name) => {
    const old = before.get(name);
    if (!old) {
      changes.push({ kind: "added", label: `Formule ajoutée : ${formula.title}`, to: formula.price ? money(formula.price.value) : null });
      return;
    }
    const oldPrice = old.price ? Number(old.price.value) : null;
    const newPrice = formula.price ? Number(formula.price.value) : null;
    if (oldPrice !== newPrice) {
      changes.push({ kind: "changed", label: `Prix de « ${formula.title} »`, from: oldPrice === null ? "non renseigné" : money(oldPrice), to: newPrice === null ? "non renseigné" : money(newPrice) });
    }
    if (Number(old.validity) !== Number(formula.validity)) {
      changes.push({ kind: "changed", label: `Validité de « ${formula.title} »`, from: `${old.validity} jour(s)`, to: `${formula.validity} jour(s)` });
    }
  });
  before.forEach((formula, name) => {
    if (!after.has(name)) changes.push({ kind: "removed", label: `Formule retirée : ${formula.title}`, from: formula.price ? money(formula.price.value) : null });
  });

  if (changes.length <= limit) return changes;
  return [...changes.slice(0, limit), { kind: "more", label: `et ${changes.length - limit} autre(s) changement(s)` }];
};

/**
 * État actuel d'une offre en une phrase, sans vocabulaire du circuit.
 * @returns {{ label: string, tone: string, at: Date|string|null }}
 */
export const presentState = (offer, { published = false } = {}) => {
  switch (offer?.workflowStatus) {
    case "DRAFT":
      return { label: "Brouillon : l'offre n'a pas encore été soumise à l'ARTCI.", tone: "neutral", at: offer.updatedAt || offer.createdAt || null };
    case "SUBMITTED":
    case "IN_VALIDATION":
      return { label: "En cours d'examen par l'ARTCI.", tone: "info", at: offer.submittedAt || null };
    case "VALIDATED":
      return { label: published ? "Validée par l'ARTCI et publiée sur le comparateur." : "Validée par l'ARTCI.", tone: "success", at: offer.validatedAt || null };
    case "REFUSED":
      return { label: "Refusée par l'ARTCI. Une nouvelle déclaration est nécessaire pour la représenter.", tone: "danger", at: offer.refusedAt || null };
    case "DEACTIVATED":
      return offer.deactivationReason === "MONITORING"
        ? { label: published ? "Remplacée par une nouvelle version, encore affichée sur le comparateur jusqu'à la décision." : "Remplacée par une nouvelle version.", tone: "warning", at: offer.deactivatedAt || null }
        : { label: "Désactivée : l'offre n'est plus publiée sur le comparateur.", tone: "warning", at: offer.deactivatedAt || null };
    default:
      return { label: "État inconnu.", tone: "neutral", at: null };
  }
};

/** Familles d'état proposées en filtre. */
export const EVOLUTION_FILTERS = {
  REVIEW: ["SUBMITTED", "IN_VALIDATION"],
  VALIDATED: ["VALIDATED"],
  REFUSED: ["REFUSED"],
  DEACTIVATED: ["DEACTIVATED"],
  DRAFT: ["DRAFT"],
};
