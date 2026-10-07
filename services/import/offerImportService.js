import * as XLSX from "xlsx";
import prisma from "@/services/config/auth/prisma";
import { ROLES } from "@/services/rbac/roles";
import { NOTICE_DAYS, DAY_MS } from "@/services/workflow/deadlines";
import { buildPromotionData } from "@/services/tools/promotion";
import { isBaseOffer } from "@/services/tools/parentOffers";
import { clientTypeConflict } from "@/services/tools/clientTypeRules";
import { initializeCreatedOffer } from "@/services/workflow/offerWorkflow";
import { dispatchWorkflowEvents } from "@/services/workflow/workflowNotifications";
import {
  FIRST_DATA_ROW,
  HEADER_ROW,
  LISTS,
  MAX_FILE_BYTES,
  MULTI_SEPARATOR,
  SERVICES,
  SHEETS,
  TEMPLATE_MARKER,
  TEMPLATE_VERSION,
  columnLetter,
  headerOf,
  isRequired,
  labelOf,
  resolveListValue,
} from "@/services/import/offerImportSchema";

/**
 * Import des offres par Excel  - analyse et création (côté serveur).
 *
 * Le navigateur n'est jamais cru : le fichier est relu et entièrement
 * recontrôlé ici, à l'analyse comme à l'import. Les règles appliquées sont
 * celles de la création manuelle :
 *   - auteur = utilisateur de la session ; un point focal n'importe que pour
 *     SON opérateur (cf. resolveCreationContext) ;
 *   - promotion : type et durée obligatoires (buildPromotionData) ;
 *   - offre parente : offre de base du même opérateur (isBaseOffer), de type
 *     de client compatible (clientTypeRules : prépayé / postpayé / hybride) ;
 *   - zone : NATIONAL sans détail ; INTERNATIONAL / ROAMING avec organisations
 *     et pays rattachés à ces organisations (cf. saveArea) ;
 *   - formule « forfait » (prix + services) ou « à l'acte » (un service +
 *     tarif appliqué), comme les deux types du formulaire (cf. saveFormula) ;
 *   - état initial SOUMISE (à valider, niveau 1) : l'utilisateur qui importe
 *     est le soumissionnaire. La barrière de soumission (code e-mail d'un
 *     point focal) est appliquée par la route d'import, une fois par fichier.
 * Chaque offre est créée en une seule transaction : jamais d'offre partielle.
 */

export class ImportFileError extends Error {
  constructor(message, code = "INVALID_FILE") {
    super(message);
    this.code = code;
  }
}

const norm = (v) =>
  String(v ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

/** Clé de recherche tolérante : sans accents, casse ni ponctuation. */
const lookupKey = (v) => norm(v).replace(/[^a-z0-9]/g, "");

/**
 * Clés d'un libellé de référentiel : « CEDEAO (ECOWAS) » est trouvé par
 * « CEDEAO (ECOWAS) », « CEDEAO », « ECOWAS » ou son code.
 */
const aliasKeys = (...labels) => {
  const keys = new Set();
  for (const label of labels.filter(Boolean)) {
    keys.add(lookupKey(label));
    const m = String(label).match(/^(.*?)\s*\((.*)\)\s*$/);
    if (m) {
      keys.add(lookupKey(m[1]));
      keys.add(lookupKey(m[2]));
    }
  }
  keys.delete("");
  return [...keys];
};

const isBlank = (v) => v === null || v === undefined || String(v).trim() === "";

const splitMulti = (v) =>
  String(v ?? "")
    .split(/\|\||;|\n|,/)
    .map((s) => s.trim())
    .filter(Boolean);

const uid = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`.toUpperCase();

/* ------------------------------------------------------------------ lecture */

const EXCEL_EPOCH = Date.UTC(1899, 11, 30);

/** Date Excel (numéro de série) ou texte (AAAA-MM-JJ, JJ/MM/AAAA) -> Date UTC. */
const parseDate = (raw) => {
  if (isBlank(raw)) return null;
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return new Date(Date.UTC(raw.getFullYear(), raw.getMonth(), raw.getDate()));
  }
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return new Date(EXCEL_EPOCH + Math.round(raw) * DAY_MS);
  }
  const s = String(raw).trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return validDate(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (m) return validDate(+m[3], +m[2], +m[1]);
  return null;
};

const validDate = (y, mo, d) => {
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d ? date : null;
};

const toNumber = (raw) => {
  if (isBlank(raw)) return null;
  if (typeof raw === "number") return raw;
  const n = Number(String(raw).replace(/\s/g, "").replace(/F(CFA)?$/i, "").replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
};

const fmtDate = (d) => (d ? d.toISOString().slice(0, 10) : null);

/** Valeur telle que l'utilisateur la voit dans Excel (dates en JJ/MM/AAAA). */
const displayValue = (column, raw) => {
  if (raw === null || raw === undefined) return "";
  if (column?.type === "date") {
    const d = parseDate(raw);
    return d ? d.toISOString().slice(0, 10).split("-").reverse().join("/") : String(raw);
  }
  return raw;
};

/** Lit le classeur et vérifie qu'il s'agit du modèle attendu. */
export const readWorkbook = (buffer) => {
  if (!buffer?.length) throw new ImportFileError("Le fichier est vide.");
  if (buffer.length > MAX_FILE_BYTES) {
    throw new ImportFileError(`Le fichier dépasse ${Math.round(MAX_FILE_BYTES / 1048576)} Mo.`, "TOO_LARGE");
  }
  let wb;
  try {
    wb = XLSX.read(buffer, { type: "buffer", cellDates: false, cellFormula: false });
  } catch {
    throw new ImportFileError("Le fichier n'est pas un classeur Excel lisible (.xlsx attendu).", "UNREADABLE");
  }

  const lists = wb.Sheets.Listes;
  const marker = lists?.Z1?.v;
  const version = lists?.Z2?.v;
  if (marker !== TEMPLATE_MARKER) {
    const legacy = wb.SheetNames.includes("Base") || wb.SheetNames.includes("Formules");
    throw new ImportFileError(
      legacy
        ? "Ce fichier utilise une ancienne version du modèle. Téléchargez le modèle actuel depuis la plateforme et reportez-y vos données."
        : "Ce fichier n'est pas le modèle d'import CompareTIC. Téléchargez le modèle depuis la plateforme.",
      "NOT_TEMPLATE",
    );
  }
  if (String(version) !== TEMPLATE_VERSION) {
    throw new ImportFileError(
      `Version du modèle ${version || "inconnue"} : la version ${TEMPLATE_VERSION} est attendue. Téléchargez le modèle actuel.`,
      "TEMPLATE_VERSION",
    );
  }

  const structureErrors = [];
  for (const sheet of SHEETS) {
    const ws = wb.Sheets[sheet.name];
    if (!ws) {
      structureErrors.push({ sheet: sheet.name, row: HEADER_ROW, column: " -", cell: " -", value: "", message: "Feuille absente ou renommée." });
      continue;
    }
    sheet.columns.forEach((column, index) => {
      const ref = `${columnLetter(index)}${HEADER_ROW}`;
      const found = ws[ref]?.v;
      if (norm(found) !== norm(headerOf(column, sheet))) {
        structureErrors.push({
          sheet: sheet.name,
          row: HEADER_ROW,
          column: headerOf(column, sheet),
          cell: ref,
          value: found ?? "",
          message: `Colonne attendue : « ${headerOf(column, sheet)} ». Ne modifiez ni l'ordre ni le nom des colonnes.`,
        });
      }
    });
  }
  if (structureErrors.length) {
    const error = new ImportFileError("La structure du fichier ne correspond pas au modèle.", "STRUCTURE");
    error.details = structureErrors;
    throw error;
  }
  return wb;
};

/** Lignes saisies d'une feuille (lignes entièrement vides ignorées). */
const readRows = (wb, sheet) => {
  const ws = wb.Sheets[sheet.name];
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1:A1");
  const rows = [];
  for (let r = FIRST_DATA_ROW; r <= range.e.r + 1; r += 1) {
    const values = {};
    const cells = {};
    let filled = false;
    sheet.columns.forEach((column, index) => {
      if (column.type === "auto") return;
      const ref = `${columnLetter(index)}${r}`;
      const cell = ws[ref];
      const value = cell ? (cell.t === "s" ? String(cell.v).trim() : cell.v) : null;
      values[column.key] = value === "" ? null : value;
      cells[column.key] = ref;
      if (!isBlank(value)) filled = true;
    });
    if (filled) rows.push({ sheet: sheet.name, sheetKey: sheet.key, promo: sheet.promo, row: r, values, cells, display: {} });
  }
  return rows;
};

/* ------------------------------------------------------------------ analyse */

const OFFER_FIELDS = (sheet) => sheet.columns.filter((c) => c.level === "offer" && c.type !== "auto");

/**
 * Analyse complète d'un classeur.
 * @returns {{summary, errors, offers}} rapport détaillé (ligne, colonne, valeur)
 */
export const analyzeWorkbook = async (wb, actor) => {
  const issues = [];
  const add = (row, key, message, level = "error", sheetDef = null) => {
    const sheet = sheetDef || SHEETS.find((s) => s.name === row.sheet);
    const column = key ? sheet.columns.find((c) => c.key === key) : null;
    issues.push({
      level,
      sheet: row.sheet,
      row: row.row,
      column: column ? column.header : " -",
      cell: key ? row.cells[key] : `${row.row}`,
      value: key ? displayValue(column, row.values[key]) : "",
      message,
      offerCode: row.values.offerCode || null,
    });
    if (level === "error") row.invalid = true;
  };

  const rowsBySheet = Object.fromEntries(SHEETS.map((s) => [s.key, readRows(wb, s)]));
  const allRows = [...rowsBySheet.base, ...rowsBySheet.promo];

  // Référentiels (une requête chacun).
  const [operators, organizations, services] = await Promise.all([
    prisma.operator.findMany({ where: { NOT: { code: "OPE-000" } }, select: { id: true, code: true, name: true } }),
    prisma.organization.findMany({ select: { id: true, name: true, code: true, countries: { select: { id: true, name: true, code: true } } } }),
    prisma.service.findMany({ select: { id: true, title: true } }),
  ]);
  const operatorByName = new Map(operators.flatMap((o) => aliasKeys(o.name, o.code).map((k) => [k, o])));
  const orgByName = new Map(organizations.flatMap((o) => aliasKeys(o.name, o.code).map((k) => [k, o])));
  const countryMatches = (country, name) => aliasKeys(country.name, country.code).includes(lookupKey(name));
  const serviceByTitle = new Map(services.map((s) => [s.title, s]));

  /* --- 1. Regroupement par offre et propagation des champs de l'offre --- */
  const groups = new Map(); // `${sheetKey}:${code}` -> {rows}
  const sheetOfCode = new Map();
  for (const row of allRows) {
    const sheet = SHEETS.find((s) => s.key === row.sheetKey);
    const code = isBlank(row.values.offerCode) ? null : String(row.values.offerCode).trim();
    if (!code) {
      add(row, "offerCode", "Code offre manquant : chaque ligne (formule) doit indiquer le code de son offre.");
      continue;
    }
    row.values.offerCode = code;
    if (sheetOfCode.has(code) && sheetOfCode.get(code) !== row.sheet) {
      add(row, "offerCode", `Ce code d'offre est déjà utilisé dans la feuille « ${sheetOfCode.get(code)} ».`);
      continue;
    }
    sheetOfCode.set(code, row.sheet);
    const key = `${row.sheetKey}:${code}`;
    if (!groups.has(key)) groups.set(key, { key, sheet, code, rows: [] });
    const group = groups.get(key);
    const first = group.rows[0];
    if (first) {
      // Lignes suivantes : champs de l'offre vides = repris ; renseignés = identiques.
      for (const column of OFFER_FIELDS(sheet)) {
        if (column.key === "offerCode") continue;
        const own = row.values[column.key];
        const ref = first.values[column.key];
        if (isBlank(own)) {
          row.values[column.key] = ref;
        } else if (!isBlank(ref) && norm(own instanceof Date ? fmtDate(own) : own) !== norm(ref instanceof Date ? fmtDate(ref) : ref)) {
          add(row, column.key, `Valeur différente de la première ligne de l'offre ${code} (« ${ref} »). Les champs de l'offre doivent être identiques sur toutes ses formules.`);
        }
      }
    }
    group.rows.push(row);
  }

  /* --- 2. Doublons de codes (fichier et base) --- */
  const formulaCodes = new Map();
  for (const row of allRows) {
    const fc = isBlank(row.values.formulaCode) ? null : String(row.values.formulaCode).trim();
    if (!fc) continue;
    row.values.formulaCode = fc;
    if (formulaCodes.has(fc)) {
      const other = formulaCodes.get(fc);
      add(row, "formulaCode", `Code formule en double (déjà utilisé ligne ${other.row} de « ${other.sheet} »).`);
    } else formulaCodes.set(fc, row);
  }
  const offerCodes = [...new Set([...groups.values()].map((g) => g.code))];
  const [existingOffers, existingFormulas] = await Promise.all([
    offerCodes.length ? prisma.offer.findMany({ where: { code: { in: offerCodes } }, select: { code: true, title: true } }) : [],
    formulaCodes.size ? prisma.offerFormula.findMany({ where: { code: { in: [...formulaCodes.keys()] } }, select: { code: true } }) : [],
  ]);
  const existingOfferCodes = new Map(existingOffers.map((o) => [o.code, o]));
  const existingFormulaCodes = new Set(existingFormulas.map((f) => f.code));

  /* --- 3. Contrôle ligne par ligne --- */
  const codePattern = /^[A-Za-z0-9][A-Za-z0-9._\-/]{0,59}$/;

  for (const group of groups.values()) {
    const { sheet } = group;
    const head = group.rows[0];
    const v = head.values;

    if (existingOfferCodes.has(group.code)) {
      add(head, "offerCode", `Une offre existe déjà avec ce code dans CompareTIC (« ${existingOfferCodes.get(group.code).title} »). Import refusé pour éviter un doublon.`);
    } else if (!codePattern.test(group.code)) {
      add(head, "offerCode", "Code invalide : lettres, chiffres et . _ - / uniquement, sans espace, 60 caractères au plus.");
    }

    // Champs obligatoires de l'offre (première ligne, après propagation).
    for (const column of OFFER_FIELDS(sheet)) {
      if (isRequired(column, sheet) && column.key !== "offerCode" && isBlank(v[column.key])) {
        add(head, column.key, `Champ obligatoire manquant : « ${column.header} ».`);
      }
    }

    // Opérateur
    if (!isBlank(v.operator)) {
      const operator = operatorByName.get(lookupKey(v.operator));
      if (!operator) add(head, "operator", "Opérateur inconnu : choisissez-le dans la liste du modèle (onglet Référentiels).");
      else if (actor.role === ROLES.FOCAL_POINT && Number(actor.operatorId) !== operator.id) {
        add(head, "operator", "Vous ne pouvez importer des offres que pour votre propre opérateur.");
      } else group.operator = operator;
    }

    // Listes contrôlées
    const lists = { category: "category", billingType: "billing", zone: "zone" };
    for (const [key, list] of Object.entries(lists)) {
      if (isBlank(v[key])) continue;
      const value = resolveListValue(list, v[key]);
      if (!value) add(head, key, `Valeur non reconnue. Valeurs possibles : ${LISTS_LABEL(list)}.`);
      else group[key] = value;
    }

    // Dates
    group.notifiDate = parseDate(v.notifiDate);
    group.desiredDate = parseDate(v.desiredDate);
    if (!isBlank(v.notifiDate) && !group.notifiDate) add(head, "notifiDate", "Date invalide (format attendu : JJ/MM/AAAA).");
    if (!isBlank(v.desiredDate) && !group.desiredDate) add(head, "desiredDate", "Date invalide (format attendu : JJ/MM/AAAA).");
    if (group.notifiDate && group.desiredDate && group.desiredDate < group.notifiDate) {
      add(head, "desiredDate", "La date de lancement souhaitée précède la date de notification.");
    }

    // Lien, textes
    if (!isBlank(v.link) && !/^https?:\/\/\S+$/i.test(String(v.link).trim())) add(head, "link", "Adresse web invalide (http:// ou https://).");
    for (const key of ["offerTitle", "target", "partner"]) {
      if (!isBlank(v[key]) && String(v[key]).length > 255) add(head, key, "Texte trop long (255 caractères au plus).");
    }

    // Promotion
    group.promotion = null;
    if (sheet.promo) {
      const promoType = isBlank(v.promoType) ? null : resolveListValue("promoType", v.promoType);
      if (!isBlank(v.promoType) && !promoType) add(head, "promoType", `Type de promotion inconnu. Valeurs possibles : ${LISTS_LABEL("promoType")}.`);
      const duration = toNumber(v.promoDuration);
      if (!isBlank(v.promoDuration) && (!Number.isInteger(duration) || duration < 1)) {
        add(head, "promoDuration", "Durée invalide : nombre entier de jours supérieur à zéro.");
      }
      if (promoType && Number.isInteger(duration) && duration >= 1) {
        const built = buildPromotionData({ offerType: 1, promoType, duration });
        if (!built.ok) add(head, "promoType", built.error);
        else group.promotion = { type: promoType, duration };
      }
    }

    // Délai réglementaire de notification : avertissement (non bloquant).
    if (group.notifiDate && group.desiredDate && group.desiredDate >= group.notifiDate) {
      const kind = group.promotion ? group.promotion.type : "BASE";
      const days = Math.round((group.desiredDate - group.notifiDate) / DAY_MS);
      if (days < NOTICE_DAYS[kind]) {
        add(head, "desiredDate", `Préavis de ${days} jour(s) : le délai réglementaire est de ${NOTICE_DAYS[kind]} jours entre la notification et le lancement.`, "warning");
      }
    }

    // Modes d'accès
    group.accessModes = splitMultiStrict(v.accessModes);

    // Zone géographique
    group.organizations = [];
    const orgNames = splitMultiStrict(v.organizations);
    const countryNames = splitMulti(v.countries);
    if (group.zone === "NATIONAL") {
      if (orgNames.length || countryNames.length) add(head, "organizations", "Zone nationale : organisations et pays sont ignorés.", "warning");
    } else if (group.zone) {
      if (!orgNames.length) add(head, "organizations", "Zone internationale ou roaming : indiquez au moins une organisation (onglet Référentiels).");
      const orgs = [];
      for (const name of orgNames) {
        const org = orgByName.get(lookupKey(name));
        if (!org) add(head, "organizations", `Organisation inconnue : « ${name} ».`);
        else orgs.push({ org, countries: [] });
      }
      for (const name of countryNames) {
        const holder = orgs.find(({ org }) => org.countries.some((c) => countryMatches(c, name)));
        if (!holder) {
          add(head, "countries", `Pays « ${name} » inconnu ou non rattaché aux organisations indiquées.`);
          continue;
        }
        const country = holder.org.countries.find((c) => countryMatches(c, name));
        if (!holder.countries.some((c) => c.id === country.id)) holder.countries.push(country);
      }
      group.organizations = orgs;
    }

    // Formules
    group.formulas = [];
    const titles = new Set();
    for (const row of group.rows) {
      const f = row.values;
      if (isBlank(f.formulaCode)) add(row, "formulaCode", "Code formule obligatoire.");
      else if (!codePattern.test(f.formulaCode)) add(row, "formulaCode", "Code invalide : lettres, chiffres et . _ - / uniquement, sans espace.");
      else if (existingFormulaCodes.has(f.formulaCode)) add(row, "formulaCode", "Une formule existe déjà avec ce code dans CompareTIC.");
      if (isBlank(f.formulaTitle)) add(row, "formulaTitle", "Nom de la formule obligatoire.");
      else if (titles.has(norm(f.formulaTitle))) add(row, "formulaTitle", "Deux formules de cette offre portent le même nom.", "warning");
      titles.add(norm(f.formulaTitle));

      const validity = toNumber(f.validity);
      if (isBlank(f.validity)) add(row, "validity", "Validité obligatoire (nombre de jours).");
      else if (!Number.isInteger(validity) || validity < 1) add(row, "validity", "Validité invalide : nombre entier de jours ≥ 1.");

      const price = toNumber(f.price);
      const rate = toNumber(f.rate);
      if (Number.isNaN(price) || (price !== null && price < 0)) add(row, "price", "Prix invalide : nombre positif.");
      if (Number.isNaN(rate) || (rate !== null && rate < 0)) add(row, "rate", "Tarif invalide : nombre positif.");
      const kind = price !== null && rate === null ? "price" : rate !== null && price === null ? "bill" : null;
      if (price === null && rate === null) add(row, "price", "Renseignez le prix du forfait OU le tarif à l'acte.");
      if (price !== null && rate !== null) add(row, "rate", "Une formule a SOIT un prix forfait, SOIT un tarif à l'acte, pas les deux.");

      const details = [];
      for (const service of SERVICES) {
        const qRaw = f[service.quantity];
        const quantity = toNumber(qRaw);
        const steps = toNumber(f[service.steps]);
        const network = isBlank(f[service.network]) ? null : resolveListValue("network", f[service.network]);
        if (!isBlank(f[service.network]) && !network) add(row, service.network, `Réseau non reconnu. Valeurs possibles : ${LISTS_LABEL("network")}.`);
        if (Number.isNaN(steps) || (steps !== null && steps < 0)) add(row, service.steps, "Pas de facturation invalide : nombre positif.");
        if (isBlank(qRaw)) {
          if (network || steps !== null) add(row, service.quantity, `${service.label} : volume manquant alors que d'autres informations du service sont renseignées.`);
          continue;
        }
        if (Number.isNaN(quantity) || (quantity < 0 && quantity !== -1)) {
          add(row, service.quantity, "Volume invalide : nombre ≥ 0, ou -1 pour illimité.");
          continue;
        }
        const svc = serviceByTitle.get(service.title);
        if (!svc) {
          add(row, service.quantity, `Service ${service.title} absent du référentiel CompareTIC.`);
          continue;
        }
        details.push({ serviceId: svc.id, title: service.title, label: service.label, unit: service.unit, quantity, network: network || "ALL_NET", steps: Number.isNaN(steps) ? null : steps });
      }
      if (kind === "bill" && details.length !== 1) {
        add(row, "rate", "Formule à l'acte : renseignez exactement UN service (celui auquel le tarif s'applique).");
      }
      if (kind === "price" && details.length === 0) {
        add(row, "price", "Forfait sans aucun service (voix, SMS ou internet).", "warning");
      }

      const advantages = [];
      for (const item of String(f.advantages ?? "").split(MULTI_SEPARATOR).map((s) => s.trim()).filter(Boolean)) {
        const [title, ...rest] = item.split("::");
        if (!title?.trim()) add(row, "advantages", `Avantage sans titre : « ${item} » (format : Titre :: Description).`);
        else advantages.push({ title: title.trim().slice(0, 255), description: rest.join("::").trim() || null });
      }

      group.formulas.push({
        row: row.row,
        code: f.formulaCode,
        title: isBlank(f.formulaTitle) ? null : String(f.formulaTitle).trim(),
        validity,
        kind,
        price: kind === "price" ? price : null,
        rate: kind === "bill" ? rate : null,
        details,
        advantages,
      });
    }
  }

  /* --- 4. Offres parentes (promotions) --- */
  const parentCodes = [...new Set([...groups.values()].filter((g) => g.sheet.promo && !isBlank(g.rows[0].values.parentCode)).map((g) => String(g.rows[0].values.parentCode).trim()))];
  const dbParents = parentCodes.length
    ? await prisma.offer.findMany({
        where: { code: { in: parentCodes } },
        select: { id: true, code: true, title: true, operatorId: true, parentId: true, billingType: true, specialPromotion: { select: { id: true } } },
      })
    : [];
  const dbParentByCode = new Map(dbParents.map((p) => [p.code, p]));
  for (const group of groups.values()) {
    if (!group.sheet.promo) continue;
    const head = group.rows[0];
    const code = isBlank(head.values.parentCode) ? null : String(head.values.parentCode).trim();
    group.parent = null;
    if (!code) continue;
    const inFile = groups.get(`base:${code}`);
    const inDb = dbParentByCode.get(code);
    if (inFile) {
      if (group.operator && inFile.operator && inFile.operator.id !== group.operator.id) add(head, "parentCode", "L'offre parente appartient à un autre opérateur.");
      else group.parent = { inFile: inFile.key, code, title: inFile.rows[0].values.offerTitle };
    } else if (inDb) {
      if (!isBaseOffer(inDb)) add(head, "parentCode", "L'offre parente doit être une offre de base (ni promotionnelle, ni dérivée).");
      else if (group.operator && inDb.operatorId !== group.operator.id) add(head, "parentCode", "L'offre parente appartient à un autre opérateur.");
      else group.parent = { id: inDb.id, code, title: inDb.title };
    } else {
      add(head, "parentCode", "Offre parente introuvable (ni dans CompareTIC, ni dans la feuille « Offres de base »).");
    }
    // Type de client : une offre prépayée ne se rattache pas à une postpayée
    // (et inversement) ; l'hybride est compatible avec les deux.
    const parentType = inFile ? inFile.billingType : inDb?.billingType;
    const conflict = group.parent ? clientTypeConflict(group.billingType, parentType, code) : null;
    if (conflict) {
      add(head, "billingType", conflict);
      group.parent = null;
    }
  }

  /* --- 5. Statut des offres et synthèse --- */
  const offers = [...groups.values()].map((g) => {
    const errors = issues.filter((i) => i.level === "error" && i.sheet === g.sheet.name && g.rows.some((r) => r.row === i.row));
    return { group: g, errorCount: errors.length };
  });
  // Une promotion dont l'offre parente (du fichier) est invalide l'est aussi.
  for (const o of offers) {
    if (o.group.parent?.inFile) {
      const parent = offers.find((p) => p.group.key === o.group.parent.inFile);
      if (parent?.errorCount) {
        add(o.group.rows[0], "parentCode", "L'offre parente (feuille « Offres de base ») contient des erreurs : elle doit être corrigée d'abord.");
        o.errorCount += 1;
      }
    }
  }

  const rowsWithError = new Set(issues.filter((i) => i.level === "error").map((i) => `${i.sheet}:${i.row}`));
  const preview = offers.map(({ group: g, errorCount }) => ({
    key: g.key,
    sheet: g.sheet.name,
    promo: g.sheet.promo,
    code: g.code,
    title: g.rows[0].values.offerTitle || null,
    operator: g.operator?.name || g.rows[0].values.operator || null,
    category: g.category ? labelOf("category", g.category) : null,
    billingType: g.billingType ? labelOf("billing", g.billingType) : null,
    zone: g.zone ? labelOf("zone", g.zone) : null,
    notifiDate: fmtDate(g.notifiDate),
    desiredDate: fmtDate(g.desiredDate),
    promotion: g.promotion ? { type: labelOf("promoType", g.promotion.type), duration: g.promotion.duration } : null,
    parent: g.parent ? { code: g.parent.code, title: g.parent.title } : null,
    organizations: (g.organizations || []).map(({ org, countries }) => ({ name: org.name, countries: countries.map((c) => c.name) })),
    accessModes: g.accessModes || [],
    rows: g.rows.map((r) => r.row),
    formulas: (g.formulas || []).map((f) => ({
      row: f.row,
      code: f.code,
      title: f.title,
      validity: f.validity,
      kind: f.kind,
      price: f.price,
      rate: f.rate,
      services: f.details.map((d) => ({ label: d.label, unit: d.unit, quantity: d.quantity, network: labelOf("network", d.network), steps: d.steps })),
      advantages: f.advantages.map((a) => a.title),
    })),
    valid: errorCount === 0,
    errorCount,
  }));

  const summary = {
    rows: allRows.length,
    validRows: allRows.filter((r) => !rowsWithError.has(`${r.sheet}:${r.row}`)).length,
    invalidRows: allRows.filter((r) => rowsWithError.has(`${r.sheet}:${r.row}`)).length,
    offers: preview.length,
    validOffers: preview.filter((o) => o.valid).length,
    invalidOffers: preview.filter((o) => !o.valid).length,
    formulas: preview.reduce((n, o) => n + o.formulas.length, 0),
    errors: issues.filter((i) => i.level === "error").length,
    warnings: issues.filter((i) => i.level === "warning").length,
  };

  issues.sort((a, b) => (a.sheet === b.sheet ? a.row - b.row : a.sheet.localeCompare(b.sheet)));
  return { summary, errors: issues, offers: preview, _groups: groups };
};

const LISTS_LABEL = (list) => LISTS[list].map((i) => i.label).join(", ");

/** Modes d'accès / organisations : séparateur « || » (ou retour à la ligne). */
const splitMultiStrict = (v) =>
  String(v ?? "")
    .split(/\|\||\n/)
    .map((s) => s.trim())
    .filter(Boolean);

/* ------------------------------------------------------------------- import */

/** Données Prisma d'une offre analysée (création en une seule écriture). */
const offerData = (g, actor, parentId) => ({
  code: g.code,
  title: String(g.rows[0].values.offerTitle).trim(),
  description: g.rows[0].values.description ? String(g.rows[0].values.description).trim() : null,
  target: g.rows[0].values.target ? String(g.rows[0].values.target).trim() : null,
  partner: g.rows[0].values.partner ? String(g.rows[0].values.partner).trim() : null,
  link: g.rows[0].values.link ? String(g.rows[0].values.link).trim() : null,
  category: g.category,
  billingType: g.billingType,
  notifiDate: g.notifiDate,
  desiredDate: g.desiredDate,
  status: "PENDING",
  user: { connect: { id: actor.id } },
  operator: { connect: { id: g.operator.id } },
  ...(parentId ? { parent: { connect: { id: parentId } } } : {}),
  ...(g.promotion
    ? { specialPromotion: { create: { code: uid("PROMO"), type: g.promotion.type, duration: g.promotion.duration } } }
    : {}),
  area: {
    create: {
      code: uid("ARE"),
      title: g.zone,
      ...(g.zone !== "NATIONAL" && g.organizations.length
        ? {
            areaOrganizations: {
              create: g.organizations.map(({ org, countries }) => ({
                organization: { connect: { id: org.id } },
                organisationCountries: { create: countries.map((c) => ({ country: { connect: { id: c.id } } })) },
              })),
            },
          }
        : {}),
    },
  },
  accessModes: { create: g.accessModes.map((content) => ({ code: uid("ACM"), content })) },
  formulas: {
    create: g.formulas.map((f) => ({
      code: f.code,
      title: f.title,
      validity: f.validity,
      ...(f.kind === "price" ? { price: { create: { code: uid("PRI"), value: f.price } } } : {}),
      serviceDetail: {
        create: f.details.map((d) => ({
          code: uid("OFF-SD"),
          quantity: d.quantity,
          billingSteps: d.steps,
          comtype: d.network,
          service: { connect: { id: d.serviceId } },
          ...(f.kind === "bill" ? { offerRate: { create: { code: uid("RAT"), value: f.rate } } } : {}),
        })),
      },
      advantages: { create: f.advantages.map((a) => ({ code: uid("ADV"), title: a.title, description: a.description })) },
    })),
  },
});

/**
 * Crée les offres valides d'une analyse.
 * Offres de base d'abord (une promotion peut y faire référence), chacune dans
 * sa propre transaction ; état initial SOUMISE, soumissionnaire = `actor`.
 */
export const commitAnalysis = async (analysis, actor) => {
  const groups = [...analysis._groups.values()];
  const validKeys = new Set(analysis.offers.filter((o) => o.valid).map((o) => o.key));
  const createdIds = new Map();
  const results = [];
  const ordered = [...groups.filter((g) => !g.sheet.promo), ...groups.filter((g) => g.sheet.promo)];

  for (const g of ordered) {
    const base = { key: g.key, sheet: g.sheet.name, code: g.code, title: g.rows[0].values.offerTitle || null, rows: g.rows.map((r) => r.row) };
    if (!validKeys.has(g.key)) {
      results.push({ ...base, status: "skipped", message: "Ignorée : la ligne contient des erreurs." });
      continue;
    }
    let parentId = g.parent?.id || null;
    if (g.parent?.inFile) {
      parentId = createdIds.get(g.parent.inFile) || null;
      if (!parentId) {
        results.push({ ...base, status: "skipped", message: "Ignorée : son offre parente n'a pas pu être créée." });
        continue;
      }
    }
    try {
      // Écriture imbriquée unique : offre, zone, formules, prix, services,
      // tarifs, avantages et modes d'accès sont créés ensemble ou pas du tout.
      const offer = await prisma.offer.create({ data: offerData(g, actor, parentId), select: { id: true, code: true, title: true } });
      createdIds.set(g.key, offer.id);
      // Soumission immédiate par le moteur de workflow : statut SOUMISE,
      // niveau 1, traces CREATE + SUBMIT au nom de l'importateur, puis
      // notifications prévues. Les deux temps sont distingués pour que le
      // rapport dise exactement où en est l'offre.
      let submitted = false;
      let note = null;
      try {
        const { events } = await initializeCreatedOffer(offer.id, actor, { submit: true });
        submitted = true;
        try {
          await dispatchWorkflowEvents(events);
        } catch (error) {
          console.error("[import offres] notifications", g.code, error);
          note = "Offre soumise ; les notifications n'ont pas pu être envoyées.";
        }
      } catch (error) {
        console.error("[import offres] soumission", g.code, error);
        note = "Offre créée, mais sa soumission automatique a échoué : soumettez-la depuis la liste des offres.";
      }
      results.push({ ...base, status: "created", submitted, id: offer.id, formulas: g.formulas.length, ...(note ? { message: note } : {}) });
    } catch (error) {
      const duplicate = error?.code === "P2002";
      results.push({
        ...base,
        status: "error",
        message: duplicate
          ? "Un code d'offre ou de formule a été créé entre-temps par un autre utilisateur : relancez l'analyse."
          : "Enregistrement impossible. Aucune donnée de cette offre n'a été conservée.",
      });
      if (!duplicate) console.error("[import offres]", g.code, error);
    }
  }

  return {
    summary: {
      analyzedRows: analysis.summary.rows,
      offers: groups.length,
      created: results.filter((r) => r.status === "created").length,
      submitted: results.filter((r) => r.submitted).length,
      formulasCreated: results.filter((r) => r.status === "created").reduce((n, r) => n + (r.formulas || 0), 0),
      skipped: results.filter((r) => r.status === "skipped").length,
      failed: results.filter((r) => r.status === "error").length,
    },
    results,
  };
};

/** Sérialisation d'une analyse pour le navigateur (sans les données internes). */
export const publicAnalysis = ({ _groups, ...rest }) => rest;
