/**
 * Import en masse des FORMULES d'offres de services via `react-spreadsheet-import`.
 *
 * - `formulaImportFields` : configuration `fields` du composant <ReactSpreadsheetImport />
 *   (1 ligne = 1 formule ; les colonnes de niveau OFFRE se répètent par offre).
 * - `groupRowsToOffers(rows)` : transforme les lignes plates importées en une
 *   structure imbriquée Offre -> Formules -> (Prix, Services, Avantages), prête
 *   à être envoyée au backend (création via Prisma).
 *
 * Le gabarit Excel correspondant est disponible :
 *   public/templates/modele_import_formules_offres.xlsx
 */

// Valeurs d'énumération (miroir du schéma Prisma)
const CATEGORY = ["MOBILE", "FIXE"];
const BILLING = ["PREPAID", "POSTPAID", "HYBRID"];
const AREA = ["NATIONAL", "INTERNATIONAL", "ROAMING"];
const PROMO = ["FLASH", "PERIOD", "SPECIAL", "CUSTOMIZE"];
const COMTYPE = ["ON_NET", "OFF_NET", "Toux réseaux"];

const required = (msg) => [{ rule: "required", errorMessage: msg }];
const selectField = (options) => ({
  type: "select",
  options: options.map((v) => ({ label: v, value: v })),
});

export const formulaImportFields = [
  // ── Identification & regroupement (niveau OFFRE) ─────────────────────
  {
    key: "offerCode",
    label: "Code offre",
    alternateMatches: ["code offre", "offre", "offer code"],
    fieldType: { type: "input" },
    example: "OFF-2026-001",
    validations: required("Le code offre est obligatoire (sert au regroupement)"),
  },
  {
    key: "offerTitle",
    label: "Nom de l'offre",
    alternateMatches: ["nom de l'offre", "titre offre"],
    fieldType: { type: "input" },
    example: "Pass CEDEAO",
    validations: required("Le nom de l'offre est obligatoire"),
  },
  {
    key: "operateur",
    label: "Opérateur",
    alternateMatches: ["operateur", "opérateur", "operator"],
    fieldType: { type: "input" },
    example: "ORANGE",
    validations: required("L'opérateur est obligatoire"),
  },
  {
    key: "category",
    label: "Catégorie",
    alternateMatches: ["categorie", "catégorie", "category"],
    fieldType: selectField(CATEGORY),
    example: "MOBILE",
    validations: required("La catégorie est obligatoire"),
  },
  {
    key: "billingType",
    label: "Type de client",
    alternateMatches: ["type de client", "type client", "facturation", "type facturation", "billing"],
    fieldType: selectField(BILLING),
    example: "Pré-payé",
    validations: required("Le type de client est obligatoire"),
  },
  {
    key: "areaTitle",
    label: "Zone",
    alternateMatches: ["zone", "area"],
    fieldType: selectField(AREA),
    example: "INTERNATIONAL",
    validations: required("La zone est obligatoire"),
  },
  {
    key: "notifiDate",
    label: "Date Notification",
    alternateMatches: ["date de notification", "notifidate"],
    fieldType: { type: "input" },
    example: "2026-01-02",
    validations: required("La date de notification est obligatoire"),
  },
  {
    key: "desiredDate",
    label: "Date Mise en ligne",
    alternateMatches: ["date de mise en ligne", "desireddate", "date souhaitee"],
    fieldType: { type: "input" },
    example: "2026-01-05",
    validations: required("La date de mise en ligne est obligatoire"),
  },
  { key: "target", label: "Cible", alternateMatches: ["cible", "target"], fieldType: { type: "input" }, example: "Grand public" },
  { key: "partner", label: "Partenaire", alternateMatches: ["partenaire", "partner"], fieldType: { type: "input" }, example: "" },
  { key: "offerLink", label: "Lien", alternateMatches: ["lien", "link", "url"], fieldType: { type: "input" }, example: "" },
  { key: "offerDescription", label: "Description de l'offre", alternateMatches: ["description offre", "description de l'offre"], fieldType: { type: "input" }, example: "Appels vers la zone CEDEAO" },

  // ── Promotion (optionnel : vide = offre de base) ─────────────────────
  { key: "promoType", label: "Type Promotion", alternateMatches: ["type de promotion", "promo"], fieldType: selectField(PROMO), example: "SPECIAL" },
  { key: "promoDuration", label: "Durée promo", alternateMatches: ["duree promo", "durée promo", "promo duration"], fieldType: { type: "input" }, example: "30" },

  // ── Modes d'accès (multi, séparés par ||) ────────────────────────────
  { key: "accessModes", label: "Modes d'accès", alternateMatches: ["modes d'acces", "modes d'accès", "access modes"], fieldType: { type: "input" }, example: "Composer #123# || Application Orange et Moi" },

  // ── Zone internationale / roaming (indirect) ─────────────────────────
  { key: "zoneOrganizations", label: "Organisations - zones", alternateMatches: ["organisations", "zones", "organizations"], fieldType: { type: "input" }, example: "CEDEAO" },
  { key: "zoneCountries", label: "Pays concernés", alternateMatches: ["pays", "pays concernes", "countries"], fieldType: { type: "input" }, example: "Benin, Mali, Burkina Faso" },

  // ── Formule (niveau FORMULE) ─────────────────────────────────────────
  {
    key: "formulaCode",
    label: "Code formule",
    alternateMatches: ["code formule", "formula code"],
    fieldType: { type: "input" },
    example: "FRM-2026-001",
    validations: required("Le code formule est obligatoire"),
  },
  {
    key: "formulaTitle",
    label: "Nom de la formule",
    alternateMatches: ["nom de la formule", "titre formule"],
    fieldType: { type: "input" },
    example: "Pass CEDEAO 200",
    validations: required("Le nom de la formule est obligatoire"),
  },
  {
    key: "validity",
    label: "Validité",
    alternateMatches: ["validite", "validité", "validity"],
    fieldType: { type: "input" },
    example: "1",
    validations: required("La validité est obligatoire"),
  },
  {
    key: "price",
    label: "Prix",
    alternateMatches: ["prix", "price", "montant"],
    fieldType: { type: "input" },
    example: "200",
    validations: required("Le prix est obligatoire"),
  },

  // ── Service VOIX ─────────────────────────────────────────────────────
  { key: "voiceQuantity", label: "VOIX : minutes", alternateMatches: ["voix minutes", "voix", "voice"], fieldType: { type: "input" }, example: "20" },
  { key: "voiceComType", label: "VOIX : dest-réseau", alternateMatches: ["voix reseau", "voix réseau"], fieldType: selectField(COMTYPE), example: "Toux réseaux" },
  { key: "voiceBillingSteps", label: "VOIX : pas-facturation", alternateMatches: ["voix pas facturation"], fieldType: { type: "input" }, example: "60" },
  { key: "voiceRate", label: "VOIX : tarif hors forfait", alternateMatches: ["voix tarif"], fieldType: { type: "input" }, example: "" },

  // ── Service SMS ──────────────────────────────────────────────────────
  { key: "smsQuantity", label: "SMS : quantité", alternateMatches: ["sms quantite", "sms quantité", "sms"], fieldType: { type: "input" }, example: "50" },
  { key: "smsComType", label: "SMS : réseau", alternateMatches: ["sms reseau", "sms réseau"], fieldType: selectField(COMTYPE), example: "Toux réseaux" },
  { key: "smsBillingSteps", label: "SMS : pasfacturation", alternateMatches: ["sms palier"], fieldType: { type: "input" }, example: "" },
  { key: "smsRate", label: "SMS : tarif hors forfait", alternateMatches: ["sms tarif"], fieldType: { type: "input" }, example: "" },

  // ── Service INTERNET (DATA)   quantité en Mo ─────────────────────────
  { key: "dataQuantity", label: "DATA : quantité (Mo)", alternateMatches: ["internet quantite", "internet", "data", "data mo"], fieldType: { type: "input" }, example: "5120" },
  { key: "dataComType", label: "DATA : réseau", alternateMatches: ["internet reseau", "internet réseau"], fieldType: selectField(COMTYPE), example: "Toux réseaux" },
  { key: "dataBillingSteps", label: "DATA : pas-facturation", alternateMatches: ["internet palier"], fieldType: { type: "input" }, example: "" },
  { key: "dataRate", label: "DATA : tarif hors forfait", alternateMatches: ["internet tarif"], fieldType: { type: "input" }, example: "" },

  // ── Avantages (multi) ────────────────────────────────────────────────
  { key: "advantages", label: "Autres avantages", alternateMatches: ["avantages", "advantages"], fieldType: { type: "input" }, example: "Bonus data : 100 Mo offerts" },
];

// ── Helpers de transformation ──────────────────────────────────────────
const splitMulti = (v) =>
  (v ?? "")
    .toString()
    .split("||")
    .map((s) => s.trim())
    .filter(Boolean);

const toNum = (v) =>
  v === "" || v === null || v === undefined ? null : Number(v);

// Construit un détail de service si une quantité est renseignée
const buildServiceDetail = (title, qty, comtype, steps, rate) => {
  const q = toNum(qty);
  if (q === null || Number.isNaN(q)) return null;
  return {
    service: title, // "VOIX" | "SMS" | "DATA" (résolu côté backend par Service.title)
    quantity: q,
    comtype: comtype || null, // ON_NET | OFF_NET | Toux réseaux
    billingSteps: toNum(steps),
    offerRate: toNum(rate), // -> OfferRate.value (optionnel)
  };
};

/**
 * Transforme les lignes plates (issues de react-spreadsheet-import) en
 * structure imbriquée regroupée par offre.
 * @param {Array<Object>} rows - `data.validData` du composant d'import
 * @returns {Array<Object>} offres avec leurs formules
 */
export const groupRowsToOffers = (rows = []) => {
  const byOffer = new Map();

  for (const r of rows) {
    const code = (r.offerCode || "").toString().trim();
    if (!code) continue;

    // Créer l'offre au premier passage
    if (!byOffer.has(code)) {
      byOffer.set(code, {
        code,
        title: r.offerTitle?.trim(),
        operator: r.operateur?.trim(), // résolu par nom côté backend
        category: r.category,
        billingType: r.billingType,
        areaTitle: r.areaTitle,
        notifiDate: r.notifiDate,
        desiredDate: r.desiredDate,
        target: r.target || null,
        partner: r.partner || null,
        link: r.offerLink || null,
        description: r.offerDescription || null,
        specialPromotion: r.promoType
          ? { type: r.promoType, duration: toNum(r.promoDuration) || 0 }
          : null,
        accessModes: splitMulti(r.accessModes),
        zone: {
          organizations: splitMulti(r.zoneOrganizations),
          countries: splitMulti(r.zoneCountries),
        },
        formulas: [],
      });
    }

    const offer = byOffer.get(code);

    // Détails de services (uniquement ceux renseignés)
    const serviceDetail = [
      buildServiceDetail("VOIX", r.voiceQuantity, r.voiceComType, r.voiceBillingSteps, r.voiceRate),
      buildServiceDetail("SMS", r.smsQuantity, r.smsComType, r.smsBillingSteps, r.smsRate),
      buildServiceDetail("DATA", r.dataQuantity, r.dataComType, r.dataBillingSteps, r.dataRate),
    ].filter(Boolean);

    // Avantages : "Titre :: Description || Titre2 :: Description2"
    const advantages = splitMulti(r.advantages).map((a) => {
      const [title, ...desc] = a.split("::");
      return { title: (title || "").trim(), description: desc.join("::").trim() };
    });

    offer.formulas.push({
      code: r.formulaCode?.trim(),
      title: r.formulaTitle?.trim(),
      validity: toNum(r.validity),
      price: toNum(r.price),
      serviceDetail,
      advantages,
    });
  }

  return Array.from(byOffer.values());
};
