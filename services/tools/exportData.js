/**
 * Export des listes (Excel, CSV, PDF)   module unique, côté navigateur.
 *
 * Chaque liste décrit ses colonnes une fois :
 *   [{ header: "Code", value: (row) => row.code, width?: 14 }]
 * et le même descripteur produit les trois formats. On n'exporte ainsi que
 * des champs métier lisibles (jamais d'objets bruts ni de champs techniques).
 *
 * Remplace des boutons qui appelaient des fonctions inexistantes (listes
 * d'offres, zones, pays, organisations) ou exportaient via le DataTable des
 * colonnes vides.
 */

import { PROFILE_CODE_TO_ROLE, ROLE_LABELS } from "@/services/rbac/roles";

const stamp = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
};

const safeName = (name) =>
  String(name || "export")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase();

/** Valeur de cellule en texte (dates, booléens, tableaux, nombres). */
export const cellText = (value) => {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toLocaleDateString("fr-FR");
  if (Array.isArray(value)) return value.map(cellText).filter(Boolean).join(", ");
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  return String(value);
};

/**
 * Neutralise l'injection de formules (CSV / Excel) : une cellule commençant
 * par = + - @ serait exécutée par le tableur à l'ouverture.
 */
const neutralize = (text) => (/^[=+\-@\t\r]/.test(text) ? `'${text}` : text);

const buildMatrix = (rows, columns) =>
  (rows || []).map((row, index) =>
    columns.map((col) => {
      try {
        return cellText(col.value(row, index));
      } catch {
        return "";
      }
    }),
  );

const download = async (blob, fileName) => {
  const mod = await import("file-saver");
  const saveAs = mod.saveAs || mod.default?.saveAs || mod.default;
  saveAs(blob, fileName);
};

/** Excel (.xlsx) : en-têtes, largeurs de colonnes, filtre automatique. */
export const exportToExcel = async ({ rows, columns, fileName, sheetName = "Données" }) => {
  const XLSX = await import("xlsx");
  const matrix = buildMatrix(rows, columns).map((r) => r.map(neutralize));
  const sheet = XLSX.utils.aoa_to_sheet([columns.map((c) => c.header), ...matrix]);
  sheet["!cols"] = columns.map((c, i) => ({
    wch: c.width || Math.min(60, Math.max(c.header.length, ...matrix.map((r) => (r[i] || "").length)) + 2),
  }));
  if (matrix.length) sheet["!autofilter"] = { ref: sheet["!ref"] };
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, sheetName.slice(0, 31));
  const buffer = XLSX.write(book, { bookType: "xlsx", type: "array" });
  await download(
    new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `${safeName(fileName)}_${stamp()}.xlsx`,
  );
};

/** CSV : séparateur « ; » et BOM UTF-8 (ouverture correcte dans Excel en français). */
export const exportToCsv = async ({ rows, columns, fileName }) => {
  const escape = (text) => {
    const t = neutralize(text);
    return /[";\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const lines = [columns.map((c) => escape(c.header)).join(";"), ...buildMatrix(rows, columns).map((r) => r.map(escape).join(";"))];
  await download(new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" }), `${safeName(fileName)}_${stamp()}.csv`);
};

/** PDF (A4 paysage) : titre, date, filtre appliqué, tableau paginé, numéros de page. */
export const exportToPdf = async ({ rows, columns, fileName, title, subtitle }) => {
  const [{ jsPDF }, autoTableModule] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const autoTable = autoTableModule.default?.default || autoTableModule.default || autoTableModule.autoTable;
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4", compress: true });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(title || "Export", 40, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  const info = [
    `ARTCI · ComparTIC   ${new Date().toLocaleString("fr-FR")}`,
    `${(rows || []).length} élément${(rows || []).length > 1 ? "s" : ""}`,
    subtitle,
  ]
    .filter(Boolean)
    .join("   ·   ");
  doc.text(info, 40, 56, { maxWidth: pageWidth - 80 });

  const options = {
    startY: 70,
    head: [columns.map((c) => c.header)],
    body: buildMatrix(rows, columns),
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak", textColor: [30, 41, 59], lineColor: [226, 232, 240] },
    headStyles: { fillColor: [3, 131, 46], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 40, right: 40 },
    didDrawPage: () => {
      const page = doc.internal.getCurrentPageInfo().pageNumber;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Page ${page}`, pageWidth - 40, doc.internal.pageSize.getHeight() - 20, { align: "right" });
    },
  };
  if (typeof autoTable === "function") autoTable(doc, options);
  else doc.autoTable(options);

  doc.save(`${safeName(fileName)}_${stamp()}.pdf`);
};

export const EXPORTERS = { xlsx: exportToExcel, csv: exportToCsv, pdf: exportToPdf };

/* -------------------------------------------------------------------------- */
/* Colonnes réutilisées                                                        */
/* -------------------------------------------------------------------------- */

const date = (v) => (v ? new Date(v).toLocaleDateString("fr-FR") : "");

const WORKFLOW_LABELS = {
  DRAFT: "Brouillon",
  SUBMITTED: "Soumise",
  IN_VALIDATION: "En cours de validation",
  VALIDATED: "Validée",
  REFUSED: "Refusée",
  DEACTIVATED: "Désactivée",
};
const BILLING_LABELS = { PREPAID: "Prépayé", POSTPAID: "Postpayé", HYBRID: "Hybride" };
const PROMO_LABELS = { FLASH: "Flash", PERIOD: "Périodique", SPECIAL: "Spéciale", CUSTOMIZE: "Personnalisée" };

/** Colonnes d'une liste d'offres (ou de monitorings). */
export const OFFER_EXPORT_COLUMNS = [
  { header: "Code", value: (o) => o.code },
  { header: "Nom", value: (o) => o.title },
  { header: "Opérateur", value: (o) => o.operator?.name },
  {
    header: "Type",
    value: (o) =>
      o.specialPromotion
        ? `Promotion${PROMO_LABELS[o.specialPromotion.type] ? ` ${PROMO_LABELS[o.specialPromotion.type]}` : ""}${o.specialPromotion.duration ? ` (${o.specialPromotion.duration} j)` : ""}`
        : "Offre de base",
  },
  { header: "Catégorie", value: (o) => (o.category === "MOBILE" ? "Mobile" : o.category === "FIXE" ? "Fixe" : o.category) },
  { header: "Type de client", value: (o) => BILLING_LABELS[o.billingType] || o.billingType },
  {
    header: "Statut",
    value: (o) =>
      o.workflowStatus
        ? `${WORKFLOW_LABELS[o.workflowStatus] || o.workflowStatus}${o.currentValidationLevel && ["SUBMITTED", "IN_VALIDATION"].includes(o.workflowStatus) ? ` (niveau ${o.currentValidationLevel})` : ""}`
        : o.validation?.status === "ALLOW"
          ? "Validée"
          : o.validation?.status === "DINIED"
            ? "Refusée"
            : o.validation?.status === "SUSPENDED"
              ? "Suspendue"
              : "En attente",
  },
  { header: "Notification", value: (o) => date(o.notifiDate) },
  { header: "Lancement souhaité", value: (o) => date(o.desiredDate) },
  { header: "Enregistrement", value: (o) => date(o.updatedAt || o.createdAt) },
];

export { date as formatExportDate };

const AREA_LABELS = { NATIONAL: "Nationale", INTERNATIONAL: "Internationale", ROAMING: "Roaming" };
const STATUS_LABELS = { ENABLE: "Actif", PENDING: "En attente", SUSPENDED: "Suspendu", DISABLE: "Désactivé" };
const OPERATOR_TYPE_LABELS = { MOBILE: "Mobile", FIXE: "Fixe", HYBRIDE: "Hybride" };

export const AREA_EXPORT_COLUMNS = [
  { header: "Code", value: (a) => a.code },
  { header: "Type de zone", value: (a) => AREA_LABELS[a.title] || a.title },
  { header: "Description", value: (a) => a.description },
  { header: "Offres liées", value: (a) => a._count?.offers ?? (a.offers || []).length },
  { header: "Organisations ciblées", value: (a) => a._count?.areaOrganizations ?? "" },
  { header: "Créée le", value: (a) => date(a.createdAt) },
];

export const COUNTRY_EXPORT_COLUMNS = [
  { header: "Code", value: (c) => c.code },
  { header: "Pays", value: (c) => c.name },
  { header: "Indicatif", value: (c) => (c.indicator ? `+${c.indicator}` : "") },
  { header: "Organisations", value: (c) => c._count?.organizations ?? "" },
  { header: "Sélections dans des offres", value: (c) => c._count?.organisationCountries ?? "" },
  { header: "Description", value: (c) => c.description },
];

export const ORGANIZATION_EXPORT_COLUMNS = [
  { header: "Code", value: (o) => o.code },
  { header: "Nom", value: (o) => o.name },
  { header: "Zone", value: (o) => AREA_LABELS[o.area?.title] || o.area?.title || "" },
  { header: "Pays membres", value: (o) => (o.countries ? o.countries.length : "") },
  { header: "Organisations membres", value: (o) => o._count?.organizations ?? "" },
  { header: "Liste des pays", value: (o) => (o.countries || []).map((c) => c.name) },
  { header: "Description", value: (o) => o.description },
];

export const USER_EXPORT_COLUMNS = [
  { header: "Code", value: (u) => u.code },
  { header: "Nom", value: (u) => u.lastName },
  { header: "Prénom", value: (u) => u.firstName },
  { header: "E-mail", value: (u) => u.email },
  { header: "Téléphone", value: (u) => u.phone },
  { header: "Profil", value: (u) => ROLE_LABELS[u.role || PROFILE_CODE_TO_ROLE[u.profile?.code]] || u.profile?.name },
  { header: "Opérateur", value: (u) => u.focalPoint?.operator?.name },
  { header: "Statut", value: (u) => STATUS_LABELS[u.status] || u.status },
  { header: "Créé le", value: (u) => date(u.createdAt) },
];

export const OPERATOR_EXPORT_COLUMNS = [
  { header: "Code", value: (o) => o.code },
  { header: "Nom", value: (o) => o.name },
  { header: "Type de réseau", value: (o) => OPERATOR_TYPE_LABELS[o.type] || o.type },
  { header: "Statut", value: (o) => STATUS_LABELS[o.status] || o.status },
  { header: "Offres déclarées", value: (o) => o._count?.offers ?? "" },
  { header: "Points focaux", value: (o) => o._count?.focalPoints ?? "" },
  { header: "Description", value: (o) => o.description },
];

const serviceText = (sd) => {
  const q = Number(sd?.quantity) || 0;
  switch (sd?.service?.title) {
    case "VOIX":
      return `Appels : ${q} min`;
    case "SMS":
      return `SMS : ${q}`;
    case "DATA":
      return `Internet : ${q >= 1024 ? `${(q / 1024).toFixed(q % 1024 ? 1 : 0).replace(".", ",")} Go` : `${q} Mo`}`;
    default:
      return sd?.service?.title ? `${sd.service.title} : ${q}` : "";
  }
};

/** Colonnes des formules affichées par le comparateur public. */
export const FORMULA_EXPORT_COLUMNS = [
  { header: "N°", value: (f, i) => i + 1, width: 5 },
  { header: "Formule", value: (f) => f.title },
  { header: "Offre", value: (f) => f.offer?.title },
  { header: "Opérateur", value: (f) => f.offer?.operator?.name },
  { header: "Type", value: (f) => (f.offer?.specialPromotion ? `Promotion${PROMO_LABELS[f.offer.specialPromotion.type] ? ` ${PROMO_LABELS[f.offer.specialPromotion.type]}` : ""}` : "Offre de base") },
  { header: "Catégorie", value: (f) => (f.offer?.category === "MOBILE" ? "Mobile" : f.offer?.category === "FIXE" ? "Fixe" : f.offer?.category) },
  { header: "Type de client", value: (f) => BILLING_LABELS[f.offer?.billingType] || f.offer?.billingType },
  { header: "Zone", value: (f) => AREA_LABELS[f.offer?.area?.title] || f.offer?.area?.title || "" },
  { header: "Validité", value: (f) => (f.validity ? `${f.validity} jour${f.validity > 1 ? "s" : ""}` : "") },
  { header: "Prix (FCFA)", value: (f) => (f.price?.value !== undefined && f.price?.value !== null ? new Intl.NumberFormat("fr-FR").format(f.price.value) : "") },
  { header: "Services", value: (f) => (f.serviceDetail || []).map(serviceText).filter(Boolean).join(" · ") },
];
