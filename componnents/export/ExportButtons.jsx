import React, { useState } from "react";
import { EXPORTERS } from "@/services/tools/exportData";
import { toastSuccess, toastWarning } from "@/componnents/notification/notification";

/**
 * Boutons d'export Excel / CSV / PDF d'une liste.
 *
 * Exporte la sélection si des lignes sont cochées, sinon toutes les lignes
 * affichées (après filtres).
 *
 * @param rows       lignes affichées (après filtres)
 * @param selection  lignes cochées (facultatif)
 * @param columns    [{ header, value: (row) => … }]
 * @param fileName   base du nom de fichier
 * @param title      titre du document PDF
 * @param subtitle   précision (ex. filtres appliqués) pour le PDF
 */
const FORMATS = [
  { key: "xlsx", label: "Excel", icon: "fa fa-file-excel", className: "btn-success" },
  { key: "csv", label: "CSV", icon: "fa fa-file-csv", className: "btn-secondary" },
  { key: "pdf", label: "PDF", icon: "fa fa-file-pdf", className: "btn-warning" },
];

export default function ExportButtons({ rows, selection, columns, fileName, title, subtitle, className = "" }) {
  const [busy, setBusy] = useState(null);
  const selected = Array.isArray(selection) && selection.length > 0 ? selection : null;
  const data = selected || (Array.isArray(rows) ? rows : []);

  const run = async (format) => {
    if (!data.length) {
      toastWarning("Aucune donnée à exporter.");
      return;
    }
    setBusy(format);
    try {
      await EXPORTERS[format]({ rows: data, columns, fileName, title, subtitle: [selected ? "Sélection" : null, subtitle].filter(Boolean).join(" · ") });
      toastSuccess(`${data.length} ligne${data.length > 1 ? "s" : ""} exportée${data.length > 1 ? "s" : ""} (${format.toUpperCase()}).`, 2500);
    } catch (error) {
      console.error("Export impossible :", error);
      toastWarning("L'export n'a pas pu être généré.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <span className={`d-inline-flex flex-wrap gap-2 align-items-center ${className}`}>
      {FORMATS.map((f) => (
        <button
          key={f.key}
          type="button"
          className={`btn btn-sm ${f.className} mb-1 me-2 mt-2`}
          onClick={() => run(f.key)}
          disabled={!!busy}
          title={
            selected
              ? `Exporter les ${selected.length} ligne(s) sélectionnée(s) en ${f.label}`
              : `Exporter les ${data.length} ligne(s) affichée(s) en ${f.label}`
          }
        >
          {busy === f.key ? (
            <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
          ) : (
            <i className={`${f.icon} me-2`} aria-hidden="true"></i>
          )}
          {f.label}
        </button>
      ))}
      {selected && <small className="text-muted">{selected.length} sélectionnée(s)</small>}
    </span>
  );
}
