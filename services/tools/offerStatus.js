/**
 * Référentiel unique des statuts d'offre et de décision.
 *
 * La même table était recopiée d'un écran à l'autre, avec des divergences : le
 * calendrier a planté parce qu'un statut absent de SA copie y était lu sans
 * garde. Une seule définition, et une résolution qui ne renvoie jamais
 * `undefined`.
 *
 * Deux notions distinctes cohabitent dans le modèle :
 *
 *  - `Offer.status`      (PENDING | DONE)                       : avancement du dossier ;
 *  - `Validation.status` (PENDING | ALLOW | DINIED | SUSPENDED) : décision de l'ARTCI.
 *
 * C'est la décision qui fait foi dès qu'elle existe : une offre « DONE » dont
 * la validation est « DINIED » est une offre refusée, pas une offre traitée.
 */

export const STATUS = {
  PENDING: {
    key: "PENDING",
    label: "En attente",
    bg: "#FFC104",
    light: "#fef6d8",
    dot: "#FFC104",
    text: "#7a5b00",
  },
  DONE: {
    key: "DONE",
    label: "Traitée",
    bg: "#059669",
    light: "#d1fae5",
    dot: "#059669",
    text: "#065f46",
  },
  ALLOW: {
    key: "ALLOW",
    label: "Validée",
    bg: "#00a806",
    light: "#dcfce7",
    dot: "#00a806",
    text: "#166534",
  },
  DINIED: {
    key: "DINIED",
    label: "Refusée",
    bg: "#dc2626",
    light: "#fee2e2",
    dot: "#dc2626",
    text: "#991b1b",
  },
  SUSPENDED: {
    key: "SUSPENDED",
    label: "Suspendue",
    bg: "#475569",
    light: "#e2e8f0",
    dot: "#475569",
    text: "#334155",
  },
};

/** Statut absent ou inconnu : jamais `undefined`, jamais de plantage. */
export const UNKNOWN_STATUS = {
  key: "UNKNOWN",
  label: "Non renseigné",
  bg: "#94a3b8",
  light: "#f1f5f9",
  dot: "#94a3b8",
  text: "#475569",
};

/** Résolution sûre d'un statut, quelle que soit la valeur reçue. */
export const statusOf = (value) => STATUS[value] || UNKNOWN_STATUS;

/**
 * Statut effectif d'une offre ou d'un monitoring : la décision de l'ARTCI
 * l'emporte sur l'avancement du dossier.
 */
export const resolveStatusKey = (record) =>
  record?.validation?.status || record?.status || null;

/** Le descripteur complet correspondant. */
export const resolveStatus = (record) => statusOf(resolveStatusKey(record));

/** Options prêtes pour un filtre par statut. */
export const STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "Tous les statuts" },
  { value: "PENDING", label: STATUS.PENDING.label },
  { value: "ALLOW", label: STATUS.ALLOW.label },
  { value: "DINIED", label: STATUS.DINIED.label },
  { value: "SUSPENDED", label: STATUS.SUSPENDED.label },
];

export default STATUS;
