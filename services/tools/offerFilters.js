/**
 * Filtres des listes d'offres (Gestion des offres, Validation, Mes offres).
 *
 * Source unique, fonction pure : les pages gardent l'état des filtres et
 * calculent la liste affichée à partir de la liste chargée. Remplace trois
 * copies divergentes qui présentaient les défauts suivants :
 *  - « Type de client » : les trois cases étant cochées par défaut, seule la
 *    première branche (prépayé) s'appliquait   les post-payées et hybrides
 *    disparaissaient dès qu'on touchait un filtre ;
 *  - recherche par code : filtrait avec la valeur du DERNIER champ modifié
 *    (plantage si ce champ était numérique, ex. la catégorie) ;
 *  - dates : bornes lues pour moitié dans l'ancien état (la date de fin
 *    n'était prise en compte qu'au changement suivant) ; la date de fin du
 *    lancement écrasait la date de début ; une période « désactivée » restait
 *    appliquée ;
 *  - onglet « Offres en monitoring » : le résultat remplaçait la liste des
 *    offres principales ;
 *  - opérateurs : filtrés à part, sans les autres critères, et jamais
 *    réinitialisés quand la sélection était vidée.
 *
 * Module sans dépendance serveur : importé côté navigateur.
 */

export const BILLING_OPTIONS = [
  { value: "PREPAID", label: "Prépayé" },
  { value: "POSTPAID", label: "Postpayé" },
  { value: "HYBRID", label: "Hybride" },
];

export const OFFER_TYPE_OPTIONS = [
  { value: "ALL", label: "Toutes" },
  { value: "BASE", label: "Offre de base" },
  { value: "PROMO", label: "Promotionnelle" },
];

export const CATEGORY_OPTIONS = [
  { value: "ALL", label: "Toutes" },
  { value: "MOBILE", label: "Mobile" },
  { value: "FIXE", label: "Fixe" },
];

/**
 * Statuts du circuit de validation, dans l'ordre de vie d'une offre. Les
 * libellés sont ceux des pastilles de statut (`workflowLabels.js`).
 */
export const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Brouillon", tone: "neutral" },
  { value: "SUBMITTED", label: "Soumise", tone: "info" },
  { value: "IN_VALIDATION", label: "En attente de validation", tone: "warning" },
  { value: "VALIDATED", label: "Validée", tone: "success" },
  { value: "REFUSED", label: "Refusée", tone: "danger" },
  { value: "DEACTIVATED", label: "Désactivée", tone: "muted" },
];

export const DEFAULT_OFFER_FILTERS = {
  search: "",
  // Vide = tous les statuts.
  statuses: [],
  offerType: "ALL",
  category: "ALL",
  // Vide = tous les types de client.
  billing: [],
  // Vide = tous les opérateurs.
  operatorIds: [],
  notif: { enabled: false, from: "", to: "" },
  launch: { enabled: false, from: "", to: "" },
};

const dayStart = (value) => {
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
};
const dayEnd = (value) => {
  const d = new Date(`${value}T23:59:59.999`);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** La date (ISO) est-elle dans la période ? Bornes facultatives et incluses. */
const inRange = (iso, range) => {
  if (!range?.enabled || (!range.from && !range.to)) return true;
  if (!iso) return false;
  const t = new Date(iso).getTime();
  const from = range.from ? dayStart(range.from) : null;
  const to = range.to ? dayEnd(range.to) : null;
  if (from && t < from.getTime()) return false;
  if (to && t > to.getTime()) return false;
  return true;
};

/** Opérateurs proposés selon la catégorie (les hybrides valent pour les deux). */
export const operatorsForCategory = (operators, category) => {
  const list = Array.isArray(operators) ? operators : [];
  if (category === "MOBILE") return list.filter((o) => ["MOBILE", "HYBRIDE"].includes(o?.type));
  if (category === "FIXE") return list.filter((o) => ["FIXE", "HYBRIDE"].includes(o?.type));
  return list;
};

/**
 * Statut d'une ligne. Les monitorings antérieurs au workflow n'ont pas de
 * `workflowStatus` : leur validation historique en tient lieu.
 */
const LEGACY_STATUS = { PENDING: "SUBMITTED", ALLOW: "VALIDATED", DINIED: "REFUSED", SUSPENDED: "DEACTIVATED" };
export const statusOfItem = (item) => item?.workflowStatus || LEGACY_STATUS[item?.validation?.status] || null;

/** Applique tous les critères à une liste d'offres (ou de monitorings). */
export const applyOfferFilters = (list, filters = DEFAULT_OFFER_FILTERS, { ignoreStatus = false } = {}) => {
  if (!Array.isArray(list)) return list ?? null;
  const f = { ...DEFAULT_OFFER_FILTERS, ...(filters || {}) };
  const statuses = new Set(ignoreStatus ? [] : f.statuses || []);
  const search = String(f.search || "").trim().toLowerCase();
  const operatorIds = new Set((f.operatorIds || []).map(Number));
  const billing = new Set(f.billing || []);

  return list.filter((item) => {
    if (!item) return false;
    if (statuses.size && !statuses.has(statusOfItem(item))) return false;
    const operatorId = Number(item.operator?.id ?? item.operatorId);
    if (operatorIds.size && !operatorIds.has(operatorId)) return false;
    if (f.offerType === "BASE" && item.specialPromotion) return false;
    if (f.offerType === "PROMO" && !item.specialPromotion) return false;
    if (f.category !== "ALL" && item.category !== f.category) return false;
    if (billing.size && !billing.has(item.billingType)) return false;
    if (search) {
      const haystack = `${item.code || ""} ${item.title || ""}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    if (!inRange(item.notifiDate, f.notif)) return false;
    if (!inRange(item.desiredDate, f.launch)) return false;
    return true;
  });
};

/**
 * Nombre d'offres par statut, tous les AUTRES critères appliqués : les
 * compteurs des puces suivent donc la recherche, l'opérateur, les dates…
 */
export const countByStatus = (list, filters = DEFAULT_OFFER_FILTERS) => {
  const counts = Object.fromEntries(STATUS_OPTIONS.map((o) => [o.value, 0]));
  const rows = applyOfferFilters(list, filters, { ignoreStatus: true });
  if (!Array.isArray(rows)) return null;
  rows.forEach((item) => {
    const status = statusOfItem(item);
    if (status in counts) counts[status] += 1;
  });
  // Toutes les lignes, y compris celles sans statut (anciens monitorings).
  counts.ALL = rows.length;
  return counts;
};

/** Nombre de critères actifs (pour le badge et le bouton de réinitialisation). */
export const countActiveFilters = (filters = DEFAULT_OFFER_FILTERS) => {
  const f = { ...DEFAULT_OFFER_FILTERS, ...(filters || {}) };
  let n = 0;
  if (String(f.search || "").trim()) n += 1;
  if ((f.statuses || []).length) n += 1;
  if (f.offerType !== "ALL") n += 1;
  if (f.category !== "ALL") n += 1;
  if ((f.billing || []).length) n += 1;
  if ((f.operatorIds || []).length) n += 1;
  if (f.notif?.enabled && (f.notif.from || f.notif.to)) n += 1;
  if (f.launch?.enabled && (f.launch.from || f.launch.to)) n += 1;
  return n;
};
