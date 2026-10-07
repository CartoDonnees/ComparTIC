/**
 * Critères du comparateur  - référence commune au site et à l'application.
 *
 * Intitulés, valeurs et paliers sont ceux de la barre latérale du comparateur
 * web (`componnents/layouts/sidebar/ComparatorSideBarComponent.jsx`). Ils sont
 * transmis à l'application mobile par `GET /api/public/filters` : les deux
 * interfaces proposent donc exactement les mêmes choix.
 *
 * Les valeurs numériques sont celles attendues par `handleInitFilter`
 * (services/filter/filterServices.js) : une borne haute à -1 signifie
 * « illimité ». Les volumes internet sont en Mo, les durées en jours.
 */

export const OFFER_TYPES = [
  { value: -1, label: "Toutes les offres" },
  { value: 1, label: "Offre de base" },
  { value: 2, label: "Offres promotionnelles" },
];

export const CATEGORIES = [
  { value: 1, label: "Mobile", code: "MOBILE" },
  { value: 2, label: "Fixe", code: "FIXE" },
  { value: -1, label: "Toutes", code: null },
];

/** Type de client : cases cumulables, comme sur le site. */
export const CLIENT_TYPES = [
  { key: "cTPrepay", label: "Pré-payé", code: "PREPAID" },
  { key: "cTPostpay", label: "Post-payé", code: "POSTPAID" },
  { key: "cTHybride", label: "Hybride", code: "HYBRID" },
];

export const ZONES = [
  { key: "national", label: "Nationale", area: "NATIONAL" },
  { key: "internat", label: "Internationale", area: "INTERNATIONAL" },
  { key: "roaming", label: "Roaming", area: "ROAMING" },
];

/** Panneau « Nationale » : « Mon besoin » ou « Mon budget ». */
export const NATIONAL_MODES = [
  { key: "need", label: "Mon Besoin" },
  { key: "budget", label: "Mon budget et mes préférences" },
];

/**
 * « Autres avantages » (Mon Besoin) et « Services d'intérêt » (Mon budget) :
 * présents dans le formulaire du site. NB : `handleInitFilter` ne les lit pas
 *  - ils n'influencent pas les résultats, ni sur le site ni dans l'application.
 */
export const OTHER_ADVANTAGES = [{ key: "social_networks", label: "Réseaux sociaux" }];

export const INTEREST_SERVICES = [
  { value: 1, label: "Appel" },
  { value: 2, label: "SMS" },
  { value: 3, label: "Internet" },
];

export const INTEREST_SLOTS = [
  { key: "s_call", label: "1er service d'intérêt" },
  { key: "s_sms", label: "2eme service d'intérêt" },
  { key: "s_data", label: "3eme service d'intérêt" },
];

/** Opérateur exclu des listes du comparateur (même règle que getOperators). */
export const EXCLUDED_OPERATOR_CODE = "OPE-000";

export const RANGES = {
  need: [
    {
      key: "call",
      label: "Volume d'appel (Min)",
      min: "call_volume_min",
      max: "call_volume_max",
      unit: "min",
      presets: [
        { label: "< 10 min", min: 0, max: 10 },
        { label: "10-50 min", min: 10, max: 50 },
        { label: "50-500 min", min: 50, max: 500 },
        { label: "500-1k min", min: 500, max: 1000 },
        { label: "1k- illimité", min: 1000, max: -1 },
      ],
    },
    {
      key: "sms",
      label: "Nombre de SMS",
      min: "nb_sms_min",
      max: "nb_sms_max",
      unit: "SMS",
      presets: [
        { label: "< 10", min: 0, max: 10 },
        { label: "10-50", min: 10, max: 50 },
        { label: "50-500", min: 50, max: 500 },
        { label: "500-1k", min: 500, max: 1000 },
        { label: "1k-Illimités", min: 1000, max: -1 },
      ],
    },
    {
      key: "data",
      label: "Volume internet (Mo)",
      min: "data_volume_min",
      max: "data_volume_max",
      unit: "Mo",
      presets: [
        { label: "< 500 Mo", min: 0, max: 500 },
        { label: "500Mo-1Go", min: 500, max: 1024 },
        { label: "1-5Go", min: 1024, max: 5120 },
        { label: "5-10Go", min: 5120, max: 10240 },
        { label: "10Go-Illimités", min: 10240, max: -1 },
      ],
    },
  ],
  budget: [
    {
      key: "budget",
      label: "Budget (FCFA)",
      min: "budg_min",
      max: "budg_max",
      unit: "F",
      presets: [
        { label: "< 500F", min: 0, max: 500 },
        { label: "500F-1k F", min: 500, max: 1000 },
        { label: "1k-5k F", min: 1000, max: 5000 },
        { label: "5k-10k F", min: 5000, max: 10000 },
        { label: "10k-100k F", min: 10000, max: 100000 },
      ],
    },
    {
      key: "period",
      label: "Validité de l'offre (jours)",
      min: "period_min",
      max: "period_max",
      unit: "jours",
      presets: [
        { label: "< 3 jrs", min: 0, max: 3 },
        { label: "3-7 jrs", min: 3, max: 7 },
        { label: "7-14 jrs", min: 7, max: 14 },
        { label: "14 jrs - 1 mois", min: 14, max: 30 },
        { label: "1 mois - 1 an", min: 30, max: 365 },
      ],
    },
  ],
};

/** En-tête « Trier par » de la liste de résultats. */
export const SORTS = [
  { key: "price", label: "Prix" },
  { key: "validity", label: "Validité" },
  { key: "voice", label: "Voix" },
  { key: "sms", label: "SMS" },
  { key: "data", label: "Internet" },
];

/** Nombre maximal de formules comparées côte à côte (ResultComponent). */
export const MAX_COMPARE = 4;

/** Tous les champs numériques de plage, pour la lecture des paramètres. */
export const RANGE_FIELDS = [...RANGES.need, ...RANGES.budget].flatMap((r) => [r.min, r.max]);

