import ExcelJS from "exceljs";
import {
  DATA_ROWS,
  EXAMPLES,
  FIRST_DATA_ROW,
  HEADER_ROW,
  HINT_ROW,
  LISTS,
  MULTI_SEPARATOR,
  SECTIONS,
  SHEETS,
  TEMPLATE_MARKER,
  TEMPLATE_VERSION,
  columnLetter,
  headerOf,
  isRequired,
  letterResolver,
} from "@/services/import/offerImportSchema";

/**
 * Génération du modèle Excel d'import des offres.
 *
 * Construit à la demande à partir de offerImportSchema.js (structure) et de
 * la base (opérateurs, organisations, pays) : le fichier téléchargé est donc
 * toujours celui que l'analyse attend, avec les référentiels du moment.
 *
 * Contenu : Instructions · Offres de base · Offres promotionnelles · Exemples
 * · Référentiels · Dictionnaire · Listes (masquée, sources des listes).
 */

const GREEN = "FF03832E";
const GREEN_DARK = "FF0B3D2C";
const ORANGE = "FFD65308";
const REQUIRED_FILL = "FFFFF1E8";
const OPTIONAL_FILL = "FFF1F5F9";
const AUTO_FILL = "FFEAF5EE";
const HINT_COLOR = "FF64748B";
const BORDER = { style: "thin", color: { argb: "FFE2E8F0" } };
const BORDERS = { top: BORDER, left: BORDER, bottom: BORDER, right: BORDER };
const LAST_ROW = FIRST_DATA_ROW + DATA_ROWS - 1;

const fill = (argb) => ({ type: "pattern", pattern: "solid", fgColor: { argb } });

/** Plages des listes déroulantes (feuille « Listes »). */
const buildLists = (wb, { operators }) => {
  const ws = wb.addWorksheet("Listes", { state: "hidden" });
  const columns = [
    ["operator", "Opérateurs", operators.map((o) => o.name)],
    ["category", "Catégories", LISTS.category.map((i) => i.label)],
    ["billing", "Type de client", LISTS.billing.map((i) => i.label)],
    ["zone", "Zones", LISTS.zone.map((i) => i.label)],
    ["network", "Réseaux", LISTS.network.map((i) => i.label)],
    ["promoType", "Types de promotion", LISTS.promoType.map((i) => i.label)],
  ];
  const names = {};
  columns.forEach(([key, title, values], index) => {
    const letter = columnLetter(index);
    ws.getCell(`${letter}1`).value = title;
    (values.length ? values : [" -"]).forEach((value, i) => {
      ws.getCell(`${letter}${i + 2}`).value = value;
    });
    const name = `LST_${key}`;
    wb.definedNames.add(`'Listes'!$${letter}$2:$${letter}$${Math.max(values.length, 1) + 1}`, name);
    names[key] = name;
  });
  // Marqueur de version : vérifié à l'import (structure du modèle).
  ws.getCell("Z1").value = TEMPLATE_MARKER;
  ws.getCell("Z2").value = TEMPLATE_VERSION;
  return names;
};

/** Contrôle de saisie Excel d'une colonne (lignes de saisie). */
const validationFor = (column, sheet, col, listNames) => {
  const cell = `${col(column.key)}${FIRST_DATA_ROW}`;
  const base = {
    allowBlank: true,
    showInputMessage: true,
    promptTitle: column.header,
    prompt: column.hint || "",
    showErrorMessage: true,
    errorStyle: "stop",
    errorTitle: "Valeur non conforme",
  };
  switch (column.type) {
    case "list":
      return { ...base, type: "list", formulae: [listNames[column.list]], error: "Choisissez une valeur dans la liste." };
    case "date":
      return { ...base, type: "date", operator: "greaterThan", formulae: [new Date(Date.UTC(2000, 0, 1))], error: "Saisissez une date valide (JJ/MM/AAAA)." };
    case "int":
      return { ...base, type: "whole", operator: "greaterThanOrEqual", formulae: [column.min ?? 0], error: `Saisissez un nombre entier ≥ ${column.min ?? 0}.` };
    case "number": {
      if (column.key === "price" || column.key === "rate") {
        const other = column.key === "price" ? "rate" : "price";
        return {
          ...base,
          type: "custom",
          formulae: [`AND(ISNUMBER(${cell}),${cell}>=0,${col(other)}${FIRST_DATA_ROW}="")`],
          error: "Nombre ≥ 0. Une formule a SOIT un prix forfait, SOIT un tarif à l'acte.",
        };
      }
      return { ...base, type: "decimal", operator: "greaterThanOrEqual", formulae: [column.min ?? 0], error: `Saisissez un nombre ≥ ${column.min ?? 0}.` };
    }
    case "quantity":
      return { ...base, type: "custom", formulae: [`AND(ISNUMBER(${cell}),OR(${cell}=-1,${cell}>=0))`], error: "Nombre ≥ 0, ou -1 pour illimité." };
    case "code":
      if (column.key === "formulaCode") {
        const c = col("formulaCode");
        return {
          ...base,
          type: "custom",
          formulae: [`AND(LEN(${cell})<=60,ISERROR(FIND(" ",${cell})),COUNTIF($${c}$${FIRST_DATA_ROW}:$${c}$${LAST_ROW},${cell})=1)`],
          error: "Code sans espace, 60 caractères au plus, unique dans la feuille.",
        };
      }
      return { ...base, type: "custom", formulae: [`AND(LEN(${cell})<=60,ISERROR(FIND(" ",${cell})))`], error: "Code sans espace, 60 caractères au plus." };
    case "url":
      return { ...base, type: "custom", formulae: [`OR(LEFT(${cell},7)="http://",LEFT(${cell},8)="https://")`], error: "Adresse web commençant par http:// ou https://." };
    case "text":
    case "multi":
      return { ...base, type: "textLength", operator: "lessThanOrEqual", formulae: [column.type === "multi" ? 2000 : 1000], error: "Texte trop long." };
    default:
      return null;
  }
};

/** Bandeau de sections (ligne 1), en-têtes (2), formats (3). */
const writeHeader = (ws, sheet) => {
  let start = 0;
  sheet.columns.forEach((column, index) => {
    const next = sheet.columns[index + 1];
    if (!next || next.section !== column.section) {
      const section = SECTIONS[column.section];
      const from = `${columnLetter(start)}1`;
      const to = `${columnLetter(index)}1`;
      if (from !== to) ws.mergeCells(`${from}:${to}`);
      const cell = ws.getCell(from);
      cell.value = section.label;
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      for (let c = start; c <= index; c += 1) ws.getCell(`${columnLetter(c)}1`).fill = fill(`FF${section.color}`);
      start = index + 1;
    }
  });
  ws.getRow(1).height = 22;

  sheet.columns.forEach((column, index) => {
    const letter = columnLetter(index);
    const required = isRequired(column, sheet);
    const header = ws.getCell(`${letter}${HEADER_ROW}`);
    header.value = headerOf(column, sheet);
    header.font = { bold: true, color: { argb: required ? ORANGE : GREEN_DARK }, size: 10 };
    header.fill = fill(column.type === "auto" ? AUTO_FILL : required ? REQUIRED_FILL : OPTIONAL_FILL);
    header.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    header.border = BORDERS;
    if (column.type === "auto") header.note = "Calculé automatiquement  - ne pas saisir. Non importé.";

    const hint = ws.getCell(`${letter}${HINT_ROW}`);
    hint.value = column.type === "auto" ? "Automatique" : column.hint || "";
    hint.font = { italic: true, size: 9, color: { argb: HINT_COLOR } };
    hint.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    hint.fill = fill("FFFAFBFC");
    hint.border = BORDERS;

    ws.getColumn(index + 1).width = column.width || 14;
  });
  ws.getRow(HEADER_ROW).height = 34;
  ws.getRow(HINT_ROW).height = 26;
};

const buildDataSheet = (wb, sheet, listNames, { examples = null } = {}) => {
  const ws = wb.addWorksheet(examples ? "Exemples" : sheet.name, {
    views: [{ state: "frozen", xSplit: 2, ySplit: HINT_ROW, zoomScale: 100 }],
    properties: { tabColor: { argb: examples ? "FF94A3B8" : sheet.promo ? ORANGE : GREEN } },
  });
  const col = letterResolver(sheet);
  writeHeader(ws, sheet);
  ws.autoFilter = { from: { row: HEADER_ROW, column: 1 }, to: { row: HEADER_ROW, column: sheet.columns.length } };

  const rows = examples || [];
  const lastRow = examples ? FIRST_DATA_ROW + rows.length - 1 : LAST_ROW;

  for (let r = FIRST_DATA_ROW; r <= lastRow; r += 1) {
    const data = rows[r - FIRST_DATA_ROW] || {};
    sheet.columns.forEach((column, index) => {
      const cell = ws.getCell(`${columnLetter(index)}${r}`);
      if (column.type === "auto") {
        cell.value = { formula: column.formula(r, col) };
        cell.font = { italic: true, color: { argb: "FF0B3D2C" } };
        cell.fill = fill(AUTO_FILL);
      } else if (data[column.key] !== undefined) {
        cell.value = column.type === "date" ? new Date(`${data[column.key]}T00:00:00Z`) : data[column.key];
      }
      if (column.type === "date" || column.numFmt) cell.numFmt = column.numFmt || "dd/mm/yyyy";
      if (column.type === "multi" || column.type === "text") cell.alignment = { wrapText: false, vertical: "top" };
      cell.border = BORDERS;
    });
  }

  if (!examples) {
    // Contrôles de saisie, colonne par colonne.
    sheet.columns.forEach((column) => {
      const validation = validationFor(column, sheet, col, listNames);
      if (!validation) return;
      const letter = col(column.key);
      ws.dataValidations.add(`${letter}${FIRST_DATA_ROW}:${letter}${LAST_ROW}`, validation);
    });

    const code = col("offerCode");
    const first = FIRST_DATA_ROW;
    const offerCols = sheet.columns.filter((c) => c.level === "offer" && c.key !== "offerCode" && c.type !== "auto");

    // Propagation : sur les lignes suivantes d'une même offre, les champs de
    // l'offre peuvent rester vides (repris de la première ligne) ; ils sont
    // grisés pour le signaler.
    offerCols.forEach((column) => {
      const letter = col(column.key);
      ws.addConditionalFormatting({
        ref: `${letter}${first}:${letter}${LAST_ROW}`,
        rules: [
          {
            type: "expression",
            priority: 2,
            formulae: [`AND($${code}${first}<>"",$${code}${first}=$${code}${first - 1})`],
            style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: "FFF1F5F9" } }, font: { color: { argb: "FF94A3B8" } } },
          },
        ],
      });
    });

    // Champ obligatoire manquant sur une ligne commencée : surligné.
    const formulaCode = col("formulaCode");
    sheet.columns
      .filter((c) => isRequired(c, sheet) && c.key !== "offerCode")
      .forEach((column) => {
        const letter = col(column.key);
        const condition =
          column.level === "offer"
            ? `AND($${code}${first}<>"",$${code}${first}<>$${code}${first - 1},${letter}${first}="")`
            : `AND(OR($${code}${first}<>"",$${formulaCode}${first}<>""),${letter}${first}="")`;
        ws.addConditionalFormatting({
          ref: `${letter}${first}:${letter}${LAST_ROW}`,
          rules: [
            {
              type: "expression",
              priority: 1,
              formulae: [condition],
              style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: "FFFEE2E2" } } },
            },
          ],
        });
      });
  }
  return ws;
};

const buildInstructions = (wb, { generatedAt, operatorScope }) => {
  const ws = wb.addWorksheet("Instructions", { properties: { tabColor: { argb: GREEN_DARK } } });
  ws.getColumn(1).width = 4;
  ws.getColumn(2).width = 110;
  ws.mergeCells("A1:B1");
  const title = ws.getCell("A1");
  title.value = "CompareTIC  - Modèle d'import des offres de services";
  title.font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
  title.fill = fill(GREEN_DARK);
  title.alignment = { vertical: "middle", indent: 1 };
  ws.getRow(1).height = 32;
  ws.mergeCells("A2:B2");
  const meta = ws.getCell("A2");
  meta.value = `Version du modèle ${TEMPLATE_VERSION}  - généré le ${generatedAt}${operatorScope ? `  - opérateur : ${operatorScope}` : ""}. Téléchargez toujours le modèle depuis la plateforme.`;
  meta.font = { italic: true, size: 10, color: { argb: HINT_COLOR } };

  const lines = [
    ["h", "Étapes"],
    ["", "1. Renseignez la feuille « Offres de base » et, si besoin, « Offres promotionnelles ». La feuille « Exemples » montre le format attendu."],
    ["", "2. UNE LIGNE = UNE FORMULE. Toutes les formules d'une même offre portent le même « Code offre »."],
    ["", "3. Les champs de l'offre (nom, opérateur, dates…) ne sont à saisir que sur la PREMIÈRE ligne de l'offre : ils sont repris automatiquement sur les lignes suivantes (cellules grisées)."],
    ["", "4. Enregistrez le fichier (.xlsx), puis chargez-le dans CompareTIC : il est contrôlé avant tout enregistrement, avec la liste précise des erreurs."],
    ["", "5. Les offres importées sont soumises automatiquement à la validation de l'ARTCI : la personne qui importe le fichier en est le soumissionnaire (un point focal confirme l'import par le code reçu par e-mail)."],
    ["", "6. Type de client d'une promotion et de son offre parente : une offre prépayée ne peut pas être rattachée à une offre postpayée, ni l'inverse. Seule une offre HYBRIDE peut être associée aux deux."],
    ["h", "Légende"],
    ["req", "En-tête orange (*) : champ obligatoire. Une cellule obligatoire vide sur une ligne commencée devient rouge."],
    ["opt", "En-tête gris : champ facultatif."],
    ["auto", "En-tête vert pâle : colonne calculée automatiquement (type de formule, fin de promotion, nom de l'offre parente). Ne pas saisir, non importée."],
    ["h", "Règles de saisie"],
    ["", "• Dates : JJ/MM/AAAA (cellules au format date). La date de lancement doit suivre la date de notification."],
    ["", "• Formule : renseignez SOIT « Prix forfait » (forfait : volumes de services inclus), SOIT « Tarif à l'acte » (un seul service facturé à l'unité)."],
    ["", "• Services : remplissez uniquement les blocs utiles (VOIX, SMS, INTERNET). Volume -1 = illimité. Internet en Mo (1 Go = 1024 Mo)."],
    ["", `• Champs multiples séparés par « ${MULTI_SEPARATOR} » : modes d'accès, organisations, pays. Avantages : « Titre :: Description ${MULTI_SEPARATOR} Titre 2 :: Description 2 ».`],
    ["", "• Zone Internationale ou Roaming : indiquez les organisations et les pays (voir l'onglet « Référentiels »). Zone Nationale : laissez ces colonnes vides."],
    ["", "• Offre promotionnelle : type et durée obligatoires. L'offre parente (facultative) doit être une offre de base du même opérateur, déjà dans CompareTIC ou présente dans la feuille « Offres de base »."],
    ["", "• Codes : sans espace, uniques. Un code d'offre ou de formule déjà présent dans CompareTIC est refusé (pas de doublon)."],
    ["", "• Ne modifiez pas l'ordre ni le nom des colonnes, ni les noms des feuilles : la structure est vérifiée au chargement."],
  ];
  lines.forEach(([kind, text], i) => {
    const r = 4 + i;
    ws.mergeCells(`A${r}:B${r}`);
    const cell = ws.getCell(`A${r}`);
    cell.value = text;
    cell.alignment = { wrapText: true, vertical: "middle", indent: kind === "h" ? 0 : 1 };
    if (kind === "h") {
      cell.font = { bold: true, size: 12, color: { argb: GREEN } };
      ws.getRow(r).height = 24;
    } else {
      cell.font = { size: 10.5 };
      ws.getRow(r).height = text.length > 120 ? 30 : 18;
    }
    if (kind === "req") cell.fill = fill(REQUIRED_FILL);
    if (kind === "opt") cell.fill = fill(OPTIONAL_FILL);
    if (kind === "auto") cell.fill = fill(AUTO_FILL);
  });
  return ws;
};

const buildReferentials = (wb, { operators, organizations }) => {
  const ws = wb.addWorksheet("Référentiels", { properties: { tabColor: { argb: "FFB45309" } }, views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = [
    { header: "Opérateur", key: "op", width: 18 },
    { header: "Type de réseau", key: "type", width: 16 },
    { header: "", key: "sep", width: 3 },
    { header: "Organisation / zone", key: "org", width: 26 },
    { header: "Pays de l'organisation (à reprendre dans « Pays concernés »)", key: "countries", width: 90 },
  ];
  const typeLabels = { MOBILE: "Mobile", FIXE: "Fixe", HYBRIDE: "Mobile & fixe" };
  const max = Math.max(operators.length, organizations.length);
  for (let i = 0; i < max; i += 1) {
    ws.addRow({
      op: operators[i]?.name || "",
      type: operators[i] ? typeLabels[operators[i].type] || operators[i].type : "",
      org: organizations[i]?.name || "",
      countries: organizations[i] ? organizations[i].countries.map((c) => c.name).join(` ${MULTI_SEPARATOR} `) : "",
    });
  }
  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  ["A1", "B1", "D1", "E1"].forEach((ref) => {
    ws.getCell(ref).fill = fill(GREEN_DARK);
  });
  return ws;
};

const buildDictionary = (wb) => {
  const ws = wb.addWorksheet("Dictionnaire", { properties: { tabColor: { argb: "FF64748B" } }, views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = [
    { header: "Feuille", key: "sheet", width: 22 },
    { header: "Section", key: "section", width: 22 },
    { header: "Colonne", key: "column", width: 30 },
    { header: "Obligatoire", key: "required", width: 12 },
    { header: "Format / valeurs", key: "format", width: 60 },
  ];
  const formats = {
    code: "Texte sans espace (60 caractères max.)",
    text: "Texte",
    date: "Date JJ/MM/AAAA",
    int: "Nombre entier",
    number: "Nombre",
    quantity: "Nombre (-1 = illimité)",
    multi: `Valeurs séparées par « ${MULTI_SEPARATOR} »`,
    url: "Adresse web (http/https)",
    auto: "Calcul automatique (non importé)",
  };
  for (const sheet of SHEETS) {
    for (const column of sheet.columns) {
      const values = column.type === "list" && column.list !== "operator" ? LISTS[column.list].map((i) => i.label).join(" | ") : null;
      ws.addRow({
        sheet: sheet.name,
        section: SECTIONS[column.section].label,
        column: column.header,
        required: isRequired(column, sheet) ? "Oui" : "Non",
        format: values || (column.list === "operator" ? "Liste des opérateurs (onglet Référentiels)" : formats[column.type]) + (column.hint && column.type !== "list" ? `  - ${column.hint}` : ""),
      });
    }
  }
  ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  ["A1", "B1", "C1", "D1", "E1"].forEach((ref) => {
    ws.getCell(ref).fill = fill(GREEN_DARK);
  });
  return ws;
};

/**
 * @param {object} ctx
 * @param {{name:string,type:string}[]} ctx.operators     opérateurs proposés
 * @param {{name:string,countries:{name:string}[]}[]} ctx.organizations
 * @param {string|null} ctx.operatorScope                  opérateur du point focal
 * @returns {Promise<Buffer>}
 */
export const buildOfferImportTemplate = async ({ operators = [], organizations = [], operatorScope = null } = {}) => {
  const wb = new ExcelJS.Workbook();
  wb.creator = "CompareTIC  - ARTCI";
  wb.title = "Modèle d'import des offres";
  wb.subject = `${TEMPLATE_MARKER} ${TEMPLATE_VERSION}`;
  wb.created = new Date();

  const generatedAt = new Date().toLocaleDateString("fr-FR");
  buildInstructions(wb, { generatedAt, operatorScope });
  // Les feuilles de saisie référencent les listes : on crée « Listes » d'abord
  // en mémoire, puis on la replace en fin de classeur.
  const listNames = buildLists(wb, { operators });
  const [base, promo] = SHEETS;
  buildDataSheet(wb, base, listNames);
  buildDataSheet(wb, promo, listNames);
  buildDataSheet(wb, base, listNames, { examples: [...EXAMPLES.base] });
  // Exemple promotionnel ajouté sous les exemples de base, avec ses en-têtes.
  const exWs = wb.getWorksheet("Exemples");
  const promoStart = FIRST_DATA_ROW + EXAMPLES.base.length + 2;
  exWs.getCell(`A${promoStart - 1}`).value = "Exemple d'offre promotionnelle (feuille « Offres promotionnelles ») :";
  exWs.getCell(`A${promoStart - 1}`).font = { bold: true, color: { argb: ORANGE } };
  promo.columns.forEach((column, index) => {
    const letter = columnLetter(index);
    const h = exWs.getCell(`${letter}${promoStart}`);
    h.value = headerOf(column, promo);
    h.font = { bold: true, size: 9, color: { argb: GREEN_DARK } };
    h.fill = fill(OPTIONAL_FILL);
    const value = EXAMPLES.promo[0][column.key];
    const cell = exWs.getCell(`${letter}${promoStart + 1}`);
    if (value !== undefined) cell.value = column.type === "date" ? new Date(`${value}T00:00:00Z`) : value;
    if (column.type === "date") cell.numFmt = "dd/mm/yyyy";
  });

  buildReferentials(wb, { operators, organizations });
  buildDictionary(wb);

  // Ordre des onglets : Instructions, saisie, exemples, aides, listes masquées.
  const order = ["Instructions", base.name, promo.name, "Exemples", "Référentiels", "Dictionnaire", "Listes"];
  wb.worksheets.forEach((ws) => {
    ws.orderNo = order.indexOf(ws.name);
  });
  wb.views = [{ activeTab: 1 }];

  return Buffer.from(await wb.xlsx.writeBuffer());
};

export default buildOfferImportTemplate;
