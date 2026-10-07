/**
 * Import des offres par Excel  - DÉFINITION UNIQUE DU MODÈLE.
 *
 * Ce module est la seule source de vérité sur la structure du fichier :
 *   - la génération du modèle téléchargeable (offerImportTemplate.js) ;
 *   - l'analyse des fichiers déposés (offerImportParser.js).
 * Ajouter, renommer ou déplacer une colonne ici met donc à jour les deux à la
 * fois : le modèle téléchargé correspond toujours à ce que le système accepte.
 *
 * Correspondance avec le modèle de données (prisma/schema.prisma) :
 *   OFFRE     -> Offer, Area (+ AreaOrganization, OrganisationCountry),
 *                AccessMode, SpecialPromotion (feuille promotionnelle)
 *   FORMULE   -> OfferFormula, OfferPrice (forfait) ou OfferRate (à l'acte)
 *   SERVICES  -> OfferServiceDetail (VOIX / SMS / DATA)
 *   AVANTAGES -> FormulaAdvantage
 *
 * Module sans dépendance serveur : il peut être importé côté navigateur.
 */

export const TEMPLATE_VERSION = "2026.11";
export const TEMPLATE_MARKER = "COMPARTIC_IMPORT_OFFRES";
export const TEMPLATE_FILENAME = "modele_import_offres_CompareTIC.xlsx";

/** Lignes du modèle : 1 = sections, 2 = en-têtes, 3 = format attendu, 4+ = saisie. */
export const HEADER_ROW = 2;
export const HINT_ROW = 3;
export const FIRST_DATA_ROW = 4;
export const DATA_ROWS = 500;

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MULTI_SEPARATOR = "||";

/* ------------------------------------------------------------------ listes */

const strip = (v) =>
  String(v ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/**
 * Valeurs contrôlées : libellé affiché dans le modèle (liste déroulante) et
 * valeur enregistrée. Les synonymes tolèrent les saisies courantes (codes
 * techniques de l'ancien modèle, majuscules, accents oubliés).
 */
export const LISTS = {
  category: [
    { label: "Mobile", value: "MOBILE" },
    { label: "Fixe", value: "FIXE" },
  ],
  billing: [
    { label: "Prépayé", value: "PREPAID", synonyms: ["pre paye", "prepaid", "prepaye"] },
    { label: "Postpayé", value: "POSTPAID", synonyms: ["post paye", "postpaid", "postpaye"] },
    { label: "Hybride", value: "HYBRID", synonyms: ["hybrid"] },
  ],
  zone: [
    { label: "Nationale", value: "NATIONAL", synonyms: ["national"] },
    { label: "Internationale", value: "INTERNATIONAL", synonyms: ["international"] },
    { label: "Roaming", value: "ROAMING", synonyms: ["itinerance"] },
  ],
  network: [
    { label: "Tous réseaux", value: "ALL_NET", synonyms: ["all net", "tous reseaux", "tout reseau", "toux reseaux", "tous resseaux"] },
    { label: "Même réseau (on-net)", value: "ON_NET", synonyms: ["on net", "meme reseau", "onnet"] },
    { label: "Autres réseaux (off-net)", value: "OFF_NET", synonyms: ["off net", "autres reseaux", "offnet"] },
  ],
  // Libellés de services/tools/promotion.js (PROMO_LABELS).
  promoType: [
    { label: "Flash", value: "FLASH" },
    { label: "Périodique", value: "PERIOD", synonyms: ["period", "periodique"] },
    { label: "Spéciale", value: "SPECIAL", synonyms: ["special", "speciale"] },
    { label: "Personnalisée", value: "CUSTOMIZE", synonyms: ["customize", "personnalisee", "personalisee"] },
  ],
};

/** Valeur contrôlée -> code enregistré (null si inconnue). */
export const resolveListValue = (listName, raw) => {
  const wanted = strip(raw);
  if (!wanted) return null;
  for (const item of LISTS[listName] || []) {
    const candidates = [item.label, item.value, ...(item.synonyms || [])].map(strip);
    if (candidates.includes(wanted)) return item.value;
  }
  return null;
};

export const labelOf = (listName, value) => (LISTS[listName] || []).find((i) => i.value === value)?.label || value;

/* ---------------------------------------------------------------- colonnes */

/**
 * Sections (bandeau de la ligne 1), dans l'ordre d'affichage.
 * `color` : teinte de la plateforme (en-têtes du modèle).
 */
export const SECTIONS = {
  offer: { label: "OFFRE", color: "0B3D2C" },
  promo: { label: "PROMOTION", color: "D65308" },
  formula: { label: "FORMULE", color: "03832E" },
  voice: { label: "VOIX", color: "0E7490" },
  sms: { label: "SMS", color: "4F46E5" },
  data: { label: "INTERNET", color: "075BF7" },
  advantages: { label: "AVANTAGES", color: "7C3AED" },
  zone: { label: "INTERNATIONAL / ROAMING", color: "B45309" },
};

/**
 * Définition d'une colonne :
 *   key       clé technique (analyse)
 *   header    en-tête affiché (ligne 2) ; « * » ajouté si obligatoire
 *   hint      format attendu (ligne 3)
 *   section   bandeau
 *   level     "offer" (répété sur chaque formule, propagé) | "formula"
 *   type      text | code | date | int | number | quantity | list | multi | url | auto
 *   list      liste contrôlée (type list)
 *   required  true | false | "promo" (feuille promotionnelle)
 *   width     largeur Excel
 *   formula   (type auto) fonction (ligne, lettre(clé)) -> formule Excel ; non importée
 */
const OFFER_COLUMNS = [
  { key: "offerCode", header: "Code offre", hint: "Ex. OFF-2026-001", section: "offer", level: "offer", type: "code", required: true, width: 16 },
  { key: "offerTitle", header: "Nom de l'offre", hint: "Texte", section: "offer", level: "offer", type: "text", required: true, width: 26 },
  { key: "operator", header: "Opérateur", hint: "Liste", section: "offer", level: "offer", type: "list", list: "operator", required: true, width: 15 },
  { key: "category", header: "Catégorie", hint: "Liste", section: "offer", level: "offer", type: "list", list: "category", required: true, width: 12 },
  { key: "billingType", header: "Type de client", hint: "Liste", section: "offer", level: "offer", type: "list", list: "billing", required: true, width: 17 },
  { key: "zone", header: "Zone", hint: "Liste", section: "offer", level: "offer", type: "list", list: "zone", required: true, width: 15 },
  { key: "notifiDate", header: "Date de notification", hint: "JJ/MM/AAAA", section: "offer", level: "offer", type: "date", required: true, width: 15 },
  { key: "desiredDate", header: "Date de lancement souhaitée", hint: "JJ/MM/AAAA", section: "offer", level: "offer", type: "date", required: true, width: 17 },
  { key: "target", header: "Cible", hint: "Texte", section: "offer", level: "offer", type: "text", width: 18 },
  { key: "partner", header: "Partenaire", hint: "Texte", section: "offer", level: "offer", type: "text", width: 16 },
  { key: "link", header: "Lien", hint: "https://…", section: "offer", level: "offer", type: "url", width: 22 },
  { key: "description", header: "Description de l'offre", hint: "Texte", section: "offer", level: "offer", type: "text", width: 30 },
  { key: "accessModes", header: "Modes d'accès", hint: "*123# || Application…", section: "offer", level: "offer", type: "multi", width: 26 },
];

const PROMO_COLUMNS = [
  { key: "parentCode", header: "Code offre parente", hint: "Offre de base existante ou de la feuille « Offres de base »", section: "promo", level: "offer", type: "code", width: 18 },
  {
    key: "parentTitle",
    header: "Nom offre parente",
    hint: "Automatique",
    section: "promo",
    level: "offer",
    type: "auto",
    width: 22,
    // Reprise du nom depuis la feuille des offres de base (si l'offre parente y figure).
    formula: (r, col) =>
      `IF(${col("parentCode")}${r}="","",IFERROR(INDEX('Offres de base'!$B:$B,MATCH(${col("parentCode")}${r},'Offres de base'!$A:$A,0)),"Offre existante dans CompareTIC"))`,
  },
  { key: "promoType", header: "Type de promotion", hint: "Liste", section: "promo", level: "offer", type: "list", list: "promoType", required: "promo", width: 16 },
  { key: "promoDuration", header: "Durée de la promotion (jours)", hint: "Entier > 0", section: "promo", level: "offer", type: "int", required: "promo", min: 1, width: 16 },
  {
    key: "promoEnd",
    header: "Fin de la promotion",
    hint: "Automatique",
    section: "promo",
    level: "offer",
    type: "auto",
    width: 15,
    formula: (r, col) =>
      `IF(OR(${col("desiredDate")}${r}="",${col("promoDuration")}${r}=""),"",${col("desiredDate")}${r}+${col("promoDuration")}${r})`,
    numFmt: "dd/mm/yyyy",
  },
];

const FORMULA_COLUMNS = [
  { key: "formulaCode", header: "Code formule", hint: "Unique. Ex. FRM-2026-001", section: "formula", level: "formula", type: "code", required: true, width: 16 },
  { key: "formulaTitle", header: "Nom de la formule", hint: "Texte", section: "formula", level: "formula", type: "text", required: true, width: 22 },
  { key: "validity", header: "Validité (jours)", hint: "Entier ≥ 1", section: "formula", level: "formula", type: "int", required: true, min: 1, width: 11 },
  { key: "price", header: "Prix forfait (FCFA)", hint: "Forfait : prix", section: "formula", level: "formula", type: "number", min: 0, width: 13, numFmt: '#,##0 "F"' },
  { key: "rate", header: "Tarif à l'acte (FCFA)", hint: "À l'acte : tarif", section: "formula", level: "formula", type: "number", min: 0, width: 13, numFmt: '#,##0.## "F"' },
  {
    key: "formulaKind",
    header: "Type de formule",
    hint: "Automatique",
    section: "formula",
    level: "formula",
    type: "auto",
    width: 13,
    formula: (r, col) =>
      `IF(AND(${col("price")}${r}<>"",${col("rate")}${r}<>""),"⚠ Prix OU tarif",IF(${col("price")}${r}<>"","Forfait",IF(${col("rate")}${r}<>"","À l'acte","")))`,
  },
  { key: "voiceQuantity", header: "Volume (min)", hint: "-1 = illimité", section: "voice", level: "formula", type: "quantity", width: 11 },
  { key: "voiceNetwork", header: "Réseau", hint: "Liste", section: "voice", level: "formula", type: "list", list: "network", width: 14 },
  { key: "voiceSteps", header: "Pas de facturation (s)", hint: "Ex. 60", section: "voice", level: "formula", type: "number", min: 0, width: 12 },
  { key: "smsQuantity", header: "Nombre de SMS", hint: "-1 = illimité", section: "sms", level: "formula", type: "quantity", width: 11 },
  { key: "smsNetwork", header: "Réseau", hint: "Liste", section: "sms", level: "formula", type: "list", list: "network", width: 14 },
  { key: "smsSteps", header: "Pas de facturation", hint: "Ex. 1", section: "sms", level: "formula", type: "number", min: 0, width: 12 },
  { key: "dataQuantity", header: "Volume (Mo)", hint: "1 Go = 1024 ; -1 = illimité", section: "data", level: "formula", type: "quantity", width: 12 },
  { key: "dataNetwork", header: "Réseau", hint: "Liste", section: "data", level: "formula", type: "list", list: "network", width: 14 },
  { key: "dataSteps", header: "Pas de facturation (Mo)", hint: "Ex. 1", section: "data", level: "formula", type: "number", min: 0, width: 12 },
  { key: "advantages", header: "Autres avantages", hint: "Titre :: Description || …", section: "advantages", level: "formula", type: "multi", width: 30 },
];

const ZONE_COLUMNS = [
  { key: "organizations", header: "Organisations / zones", hint: "CEDEAO || UEMOA", section: "zone", level: "offer", type: "multi", width: 20 },
  { key: "countries", header: "Pays concernés", hint: "Mali || Bénin", section: "zone", level: "offer", type: "multi", width: 22 },
];

/** Les trois services d'une formule et leurs colonnes. */
export const SERVICES = [
  { title: "VOIX", label: "Voix", unit: "min", quantity: "voiceQuantity", network: "voiceNetwork", steps: "voiceSteps" },
  { title: "SMS", label: "SMS", unit: "", quantity: "smsQuantity", network: "smsNetwork", steps: "smsSteps" },
  { title: "DATA", label: "Internet", unit: "Mo", quantity: "dataQuantity", network: "dataNetwork", steps: "dataSteps" },
];

/** Feuilles de saisie. `promo` : feuille des offres promotionnelles. */
export const SHEETS = [
  {
    key: "base",
    name: "Offres de base",
    promo: false,
    columns: [...OFFER_COLUMNS, ...FORMULA_COLUMNS, ...ZONE_COLUMNS],
  },
  {
    key: "promo",
    name: "Offres promotionnelles",
    promo: true,
    columns: [...OFFER_COLUMNS.slice(0, 2), ...PROMO_COLUMNS, ...OFFER_COLUMNS.slice(2), ...FORMULA_COLUMNS, ...ZONE_COLUMNS],
  },
];

export const isRequired = (column, sheet) => column.required === true || (column.required === "promo" && sheet.promo);

/** En-tête affiché (avec astérisque pour un champ obligatoire). */
export const headerOf = (column, sheet) => `${column.header}${isRequired(column, sheet) ? " *" : ""}`;

/** Clé -> lettre de colonne Excel, pour une feuille. */
export const columnLetter = (index) => {
  let n = index + 1;
  let s = "";
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
};

export const letterResolver = (sheet) => {
  const map = Object.fromEntries(sheet.columns.map((c, i) => [c.key, columnLetter(i)]));
  return (key) => map[key];
};

/** Exemples (feuille « Exemples » du modèle). */
export const EXAMPLES = {
  base: [
    {
      offerCode: "OFF-2026-001", offerTitle: "Pass CEDEAO", operator: "ORANGE", category: "Mobile", billingType: "Prépayé", zone: "Internationale",
      notifiDate: "2026-01-02", desiredDate: "2026-02-05", target: "Grand public", description: "Appels vers la zone CEDEAO", accessModes: "#123# || Application Orange et Moi",
      formulaCode: "FRM-2026-001", formulaTitle: "Pass CEDEAO 200", validity: 1, price: 200, voiceQuantity: 20, voiceNetwork: "Tous réseaux", voiceSteps: 60,
      organizations: "CEDEAO", countries: "Mali || Bénin",
    },
    {
      offerCode: "OFF-2026-001", formulaCode: "FRM-2026-002", formulaTitle: "Pass CEDEAO 500", validity: 3, price: 500, smsQuantity: 50, smsNetwork: "Tous réseaux",
      dataQuantity: 5120, dataNetwork: "Tous réseaux", advantages: "Bonus data :: 100 Mo offerts",
    },
    {
      offerCode: "OFF-2026-002", offerTitle: "Forfait Zen", operator: "MTN", category: "Mobile", billingType: "Postpayé", zone: "Nationale",
      notifiDate: "2026-02-01", desiredDate: "2026-03-10", target: "Jeunes", description: "Forfait tout compris", accessModes: "*123#",
      formulaCode: "FRM-2026-003", formulaTitle: "Zen illimité", validity: 30, price: 10000, voiceQuantity: -1, voiceNetwork: "Tous réseaux", voiceSteps: 60,
      smsQuantity: -1, smsNetwork: "Tous réseaux", dataQuantity: 10240, dataNetwork: "Tous réseaux", advantages: "Réseaux sociaux :: Illimités || Streaming :: 2 Go dédiés",
    },
    {
      offerCode: "OFF-2026-003", offerTitle: "Appel à la seconde", operator: "MOOV", category: "Mobile", billingType: "Prépayé", zone: "Nationale",
      notifiDate: "2026-02-01", desiredDate: "2026-03-10", formulaCode: "FRM-2026-004", formulaTitle: "Tarif seconde", validity: 30, rate: 1.5,
      voiceQuantity: 1, voiceNetwork: "Tous réseaux", voiceSteps: 1,
    },
  ],
  promo: [
    {
      offerCode: "PRM-2026-001", offerTitle: "Zen week-end", parentCode: "OFF-2026-002", promoType: "Flash", promoDuration: 3,
      operator: "MTN", category: "Mobile", billingType: "Postpayé", zone: "Nationale", notifiDate: "2026-02-20", desiredDate: "2026-02-25",
      formulaCode: "FRM-2026-010", formulaTitle: "Zen week-end 2 Go", validity: 2, price: 500, dataQuantity: 2048, dataNetwork: "Tous réseaux",
    },
  ],
};
