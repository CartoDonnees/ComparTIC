import React, { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Dialog } from "primereact/dialog";
import PageLoader from "@/componnents/Loader/PageLoader";
import SubmissionCodeModal from "@/componnents/modal/offer/SubmissionCodeModal";
import { requestSubmissionCode } from "@/services/api/offers/submissionApiService";
import { JWT_TOKEN } from "@/services/tools/constants";
import { MAX_FILE_BYTES, TEMPLATE_FILENAME, TEMPLATE_VERSION } from "@/services/import/offerImportSchema";

/**
 * Import d'offres par fichier Excel.
 *
 * Parcours : Télécharger le modèle → Remplir hors de la plateforme → Charger
 * → Contrôle (serveur) → Aperçu → Import (confirmation) → Rapport.
 *
 * Toute vérification est faite par le serveur (analyse puis ré-analyse à
 * l'import) : l'écran n'affiche que ses conclusions. Les offres importées sont
 * soumises immédiatement (à valider) : l'utilisateur qui importe en est le
 * soumissionnaire. Un point focal confirme l'import par le code reçu par
 * e-mail, une seule fois pour tout le fichier (même règle que la saisie).
 *
 * @param isOpen / setIsOpen  ouverture de la fenêtre
 * @param listHref            liste des offres (lien après import)
 * @param onImported          rappel après un import réussi
 */

const STEPS = [
  { key: "file", label: "Fichier" },
  { key: "review", label: "Contrôle et aperçu" },
  { key: "done", label: "Rapport" },
];

const formatSize = (bytes) =>
  bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} Mo` : `${Math.max(1, Math.round(bytes / 1024))} Ko`;

const authHeaders = () => {
  try {
    const token = localStorage.getItem(JWT_TOKEN);
    return token && token !== "null" ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
};

const readAsBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(new Error("Lecture du fichier impossible."));
    reader.readAsDataURL(file);
  });

const fmtNumber = (n) => (n === null || n === undefined ? " -" : Number(n).toLocaleString("fr-FR"));

/** Rapport Excel (erreurs + offres) généré dans le navigateur. */
const downloadReport = async ({ fileName, analysis, report }) => {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  if (report) {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        report.results.map((r) => ({
          Feuille: r.sheet,
          "Code offre": r.code,
          "Nom de l'offre": r.title || "",
          Lignes: r.rows.join(", "),
          Résultat: r.status === "created" ? (r.submitted === false ? "Créée (brouillon)" : "Soumise pour validation") : r.status === "skipped" ? "Ignorée" : "Erreur",
          Message: r.message || "",
        })),
      ),
      "Import",
    );
  }
  if (analysis?.errors?.length) {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        analysis.errors.map((e) => ({
          Niveau: e.level === "error" ? "Erreur" : "Avertissement",
          Feuille: e.sheet,
          Ligne: e.row,
          Cellule: e.cell,
          Colonne: e.column,
          Valeur: e.value === null || e.value === undefined ? "" : String(e.value),
          Message: e.message,
        })),
      ),
      "Erreurs",
    );
  }
  if (analysis?.offers?.length) {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        analysis.offers.map((o) => ({
          Statut: o.valid ? "Valide" : `${o.errorCount} erreur(s)`,
          Feuille: o.sheet,
          "Code offre": o.code,
          "Nom de l'offre": o.title || "",
          Opérateur: o.operator || "",
          Zone: o.zone || "",
          Formules: o.formulas.length,
        })),
      ),
      "Offres",
    );
  }
  const base = String(fileName || "import").replace(/\.xlsx$/i, "");
  XLSX.writeFile(wb, `rapport_import_${base}.xlsx`);
};

function Stepper({ step }) {
  const index = STEPS.findIndex((s) => s.key === step);
  return (
    <ol className="oxi-steps" aria-label="Étapes de l'import">
      {STEPS.map((s, i) => (
        <li key={s.key} className={i < index ? "is-done" : i === index ? "is-current" : ""} aria-current={i === index ? "step" : undefined}>
          <span className="oxi-steps__dot">{i < index ? <i className="bi bi-check-lg" /> : i + 1}</span>
          <span className="oxi-steps__label">{s.label}</span>
        </li>
      ))}
    </ol>
  );
}

function Stat({ label, value, tone = "neutral", icon }) {
  return (
    <div className={`oxi-stat oxi-stat--${tone}`}>
      <i className={`bi ${icon}`} aria-hidden="true" />
      <div>
        <div className="oxi-stat__value">{fmtNumber(value)}</div>
        <div className="oxi-stat__label">{label}</div>
      </div>
    </div>
  );
}

function FormulaLine({ f }) {
  return (
    <div className="oxi-formula">
      <span className="oxi-formula__code">{f.code}</span>
      <span className="oxi-formula__title">{f.title || " -"}</span>
      <span className="oxi-formula__meta">{f.validity ? `${f.validity} j` : " -"}</span>
      <span className="oxi-formula__price">
        {f.kind === "bill" ? `${fmtNumber(f.rate)} F / unité` : f.price != null ? `${fmtNumber(f.price)} F` : " -"}
      </span>
      <span className="oxi-formula__services">
        {f.services.length
          ? f.services.map((s) => `${s.label} ${s.quantity === -1 ? "illimité" : `${fmtNumber(s.quantity)}${s.unit ? ` ${s.unit}` : ""}`}`).join(" · ")
          : "Aucun service"}
        {f.advantages.length ? ` · + ${f.advantages.length} avantage(s)` : ""}
      </span>
    </div>
  );
}

export default function OfferExcelImport({ isOpen, setIsOpen, listHref = "/admin-offer-list", onImported }) {
  const [step, setStep] = useState("file");
  const [busy, setBusy] = useState(null); // "analyze" | "import" | "template"
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [structure, setStructure] = useState(null); // erreur de structure (422)
  const [analysis, setAnalysis] = useState(null);
  const [report, setReport] = useState(null);
  const [tab, setTab] = useState("offers");
  const [levelFilter, setLevelFilter] = useState("all");
  const [expanded, setExpanded] = useState({});
  const [confirming, setConfirming] = useState(false);
  const [onlyValid, setOnlyValid] = useState(false);
  // Confirmation par code (point focal) : une fois pour tout le fichier.
  const [codeInfo, setCodeInfo] = useState(null);
  const [showCode, setShowCode] = useState(false);
  const [codeError, setCodeError] = useState(null);
  const [requestingCode, setRequestingCode] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const reset = useCallback(() => {
    setStep("file");
    setBusy(null);
    setFile(null);
    setFileError(null);
    setStructure(null);
    setAnalysis(null);
    setReport(null);
    setTab("offers");
    setLevelFilter("all");
    setExpanded({});
    setConfirming(false);
    setOnlyValid(false);
    setCodeInfo(null);
    setShowCode(false);
    setCodeError(null);
  }, []);

  const close = () => {
    if (busy === "import") return; // l'import en cours ne doit pas être interrompu
    setIsOpen(false);
    reset();
  };

  /* ------------------------------------------------------------ modèle */
  const downloadTemplate = async () => {
    setBusy("template");
    try {
      const res = await fetch("/api/admin/offer/import/template", { headers: authHeaders(), credentials: "same-origin" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || "Téléchargement impossible.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = TEMPLATE_FILENAME;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (error) {
      setFileError(error.message);
    } finally {
      setBusy(null);
    }
  };

  /* ------------------------------------------------------------ fichier */
  const pickFile = (candidate) => {
    setFileError(null);
    setStructure(null);
    if (!candidate) return;
    if (!/\.xlsx$/i.test(candidate.name)) {
      setFileError("Format non pris en charge : chargez le modèle au format Excel (.xlsx).");
      return;
    }
    if (candidate.size > MAX_FILE_BYTES) {
      setFileError(`Le fichier dépasse ${Math.round(MAX_FILE_BYTES / 1048576)} Mo.`);
      return;
    }
    setFile(candidate);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    pickFile(e.dataTransfer.files?.[0]);
  };

  const send = async (path, extra = {}) => {
    const fileBase64 = await readAsBase64(file);
    const res = await fetch(path, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ fileName: file.name, fileBase64, ...extra }),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  };

  /* ------------------------------------------------------------ analyse */
  const analyze = async () => {
    if (!file) return;
    setBusy("analyze");
    setFileError(null);
    setStructure(null);
    try {
      const { ok, status, data } = await send("/api/admin/offer/import/analyze");
      if (status === 422) {
        setStructure({ message: data.error, code: data.code, details: data.details || [] });
        return;
      }
      if (!ok) throw new Error(data.error || "Analyse impossible.");
      setAnalysis(data);
      setTab(data.summary.errors ? "errors" : "offers");
      setStep("review");
    } catch (error) {
      setFileError(error.message || "Analyse impossible. Réessayez.");
    } finally {
      setBusy(null);
    }
  };

  /* ------------------------------------------------------------ import */
  const runImport = async (submissionTicket = null) => {
    setConfirming(false);
    setCodeError(null);
    setBusy("import");
    try {
      const { ok, data } = await send("/api/admin/offer/import/commit", {
        confirm: true,
        onlyValid: onlyValid || !analysis.summary.errors,
        ...(submissionTicket ? { submissionTicket } : {}),
      });
      if (!ok) {
        // La ré-analyse du serveur fait foi ; la référence du fichier ne change pas.
        if (data.analysis) setAnalysis((prev) => ({ ...data.analysis, submission: prev?.submission }));
        throw new Error(data.error || "Import impossible.");
      }
      setShowCode(false);
      setReport(data);
      setStep("done");
      onImported?.(data);
    } catch (error) {
      if (submissionTicket) setCodeError(error.message);
      setFileError(error.message);
    } finally {
      setBusy(null);
    }
  };

  const importLabel = `Import Excel : ${analysis?.summary?.validOffers || 0} offre(s)    ${file?.name || ""}`.slice(0, 120);

  /** Confirmation : envoi direct (administration) ou code e-mail (point focal). */
  const confirmImport = async () => {
    if (!analysis?.submission?.codeRequired) return runImport();
    setRequestingCode(true);
    setFileError(null);
    try {
      const res = await requestSubmissionCode({ reference: analysis.submission.reference, label: importLabel });
      if (!res?.success) {
        setFileError(res?.error || "Le code de validation n'a pas pu être envoyé.");
        setConfirming(false);
        return undefined;
      }
      setCodeInfo(res);
      setCodeError(null);
      setConfirming(false);
      setShowCode(true);
    } finally {
      setRequestingCode(false);
    }
    return undefined;
  };

  const issues = useMemo(
    () => (analysis?.errors || []).filter((e) => levelFilter === "all" || e.level === levelFilter),
    [analysis, levelFilter],
  );

  const summary = analysis?.summary;
  const canImport = summary?.validOffers > 0;

  /* ------------------------------------------------------------ rendu */
  const header = (
    <div className="oxi-header">
      <div>
        <div className="oxi-header__title">
          <i className="fa fa-file-excel" aria-hidden="true" /> Importer des offres depuis Excel
        </div>
        <div className="oxi-header__sub">Télécharger → Remplir → Charger → Contrôler → Importer</div>
      </div>
      <button type="button" className="oxi-btn oxi-btn--template" onClick={downloadTemplate} disabled={busy === "template"}>
        <span aria-hidden="true"><fa className="fa fa-download" /></span> {busy === "template" ? "Préparation…" : "Télécharger le modèle Excel"}
      </button>
    </div>
  );

  return (
    <Dialog
      visible={isOpen}
      onHide={close}
      header={header}
      className="oxi-dialog"
      style={{ width: "min(1180px, 96vw)" }}
      contentClassName="oxi-content"
      maximizable
      modal
      dismissableMask={false}
      closeOnEscape={busy !== "import"}
    >
      <Stepper step={step} />

      {busy === "analyze" ? (
        <PageLoader variant="inline" brand={false} title="Analyse du fichier…" hint="Contrôle de la structure, des formats et des règles métier." />
      ) : busy === "import" ? (
        <PageLoader variant="inline" brand={false} title="Import en cours…" hint="Chaque offre est enregistrée entière ou pas du tout. Ne fermez pas la fenêtre." />
      ) : step === "file" ? (
        <div className="oxi-file">
          <div className="oxi-card oxi-card--template">
            <div className="oxi-card__num">1</div>
            <div className="oxi-card__body">
              <h3>Téléchargez le modèle officiel</h3>
              <p>
                Version {TEMPLATE_VERSION}, toujours à jour avec la plateforme : listes déroulantes, contrôles de saisie,
                exemples et instructions intégrés. Une ligne = une formule ; les formules d'une même offre partagent le même
                code d'offre.
              </p>
              <button type="button" className="oxi-btn oxi-btn--primary" onClick={downloadTemplate} disabled={busy === "template"}>
                <span aria-hidden="true"><fa className="fa fa-download" /></span> Télécharger le modèle Excel
              </button>
            </div>
          </div>

          <div className="oxi-card">
            <div className="oxi-card__num">2</div>
            <div className="oxi-card__body">
              <h3>Chargez le fichier rempli</h3>
              <div
                className={`oxi-drop${dragOver ? " is-over" : ""}${file ? " has-file" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
                role="button"
                tabIndex={0}
                aria-label="Choisir ou déposer un fichier Excel"
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  hidden
                  onChange={(e) => {
                    pickFile(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
                <i className="bi bi-cloud-arrow-up" aria-hidden="true" />
                <div className="oxi-drop__title">Glissez-déposez votre fichier ici</div>
                <div className="oxi-drop__sub">ou cliquez pour le sélectionner  - Excel .xlsx, {Math.round(MAX_FILE_BYTES / 1048576)} Mo maximum</div>
              </div>

              {file ? (
                <div className="oxi-filechip">
                  <i className="fa fa-file-excel" aria-hidden="true" />
                  <div className="oxi-filechip__info">
                    <div className="oxi-filechip__name">{file.name}</div>
                    <div className="oxi-filechip__meta">Classeur Excel (.xlsx) · {formatSize(file.size)}</div>
                  </div>
                  <button type="button" className="oxi-icon-btn" onClick={() => setFile(null)} aria-label="Retirer le fichier">
                    <i className="bi bi-x-lg" />
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          {fileError ? (
            <div className="oxi-alert oxi-alert--error" role="alert">
              <i className="bi bi-exclamation-octagon" /> {fileError}
            </div>
          ) : null}

          {structure ? (
            <div className="oxi-alert oxi-alert--error" role="alert">
              <div>
                <i className="bi bi-file-earmark-x" /> <b>{structure.message}</b>
              </div>
              {structure.details.length ? (
                <ul className="oxi-structure">
                  {structure.details.slice(0, 8).map((d, i) => (
                    <li key={i}>
                      {d.sheet}  - cellule {d.cell} : {d.message} {d.value ? `(trouvé : « ${d.value} »)` : ""}
                    </li>
                  ))}
                  {structure.details.length > 8 ? <li>… et {structure.details.length - 8} autre(s) écart(s).</li> : null}
                </ul>
              ) : null}
              <button type="button" className="oxi-btn oxi-btn--ghost" onClick={downloadTemplate}>
                <span aria-hidden="true"><i className="fa fa-download" /></span> Télécharger le modèle actuel
              </button>
            </div>
          ) : null}

          <div className="oxi-actions">
            <button type="button" className="oxi-btn oxi-btn--ghost" onClick={close}>
              Annuler
            </button>
            <button type="button" className="oxi-btn oxi-btn--primary" onClick={analyze} disabled={!file}>
              <i className="bi bi-search" /> Analyser le fichier
            </button>
          </div>
        </div>
      ) : step === "review" && analysis ? (
        <div className="oxi-review">
          <div className="oxi-filechip oxi-filechip--compact">
            <i className="fa fa-file-excel" aria-hidden="true" />
            <div className="oxi-filechip__info">
              <div className="oxi-filechip__name">{file?.name}</div>
              <div className="oxi-filechip__meta">{file ? formatSize(file.size) : ""}</div>
            </div>
          </div>

          <div className="oxi-stats">
            <Stat label="Lignes analysées" value={summary.rows} icon="bi-list-ol" />
            <Stat label="Lignes valides" value={summary.validRows} tone="success" icon="bi-check-circle" />
            <Stat label="Lignes en erreur" value={summary.invalidRows} tone={summary.invalidRows ? "danger" : "neutral"} icon="bi-x-circle" />
            <Stat label={`Offres valides / ${summary.offers}`} value={summary.validOffers} tone={summary.validOffers ? "success" : "neutral"} icon="bi-box-seam" />
            <Stat label="Avertissements" value={summary.warnings} tone={summary.warnings ? "warning" : "neutral"} icon="bi-exclamation-triangle" />
          </div>

          {summary.errors ? (
            <div className="oxi-alert oxi-alert--warning">
              <i className="bi bi-info-circle" /> {summary.errors} erreur(s) bloquent {summary.invalidOffers} offre(s). Corrigez le fichier
              puis rechargez-le, ou importez uniquement les {summary.validOffers} offre(s) valide(s) : une offre n'est jamais importée
              partiellement.
            </div>
          ) : (
            <div className="oxi-alert oxi-alert--success">
              <i className="bi bi-check2-circle" /> Fichier conforme : {summary.offers} offre(s) et {summary.formulas} formule(s) prêtes à être
              importées et soumises à la validation de l'ARTCI.
            </div>
          )}

          <div className="oxi-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={tab === "offers"} className={tab === "offers" ? "is-active" : ""} onClick={() => setTab("offers")}>
              Aperçu des offres ({summary.offers})
            </button>
            <button type="button" role="tab" aria-selected={tab === "errors"} className={tab === "errors" ? "is-active" : ""} onClick={() => setTab("errors")}>
              Erreurs et avertissements ({summary.errors + summary.warnings})
            </button>
            <button type="button" className="oxi-tabs__report" onClick={() => downloadReport({ fileName: file?.name, analysis })}>
              <i className="bi bi-download" /> Rapport (.xlsx)
            </button>
          </div>

          {tab === "offers" ? (
            <div className="oxi-table-wrap">
              <table className="oxi-table">
                <thead>
                  <tr>
                    <th />
                    <th>Statut</th>
                    <th>Code</th>
                    <th>Offre</th>
                    <th>Opérateur</th>
                    <th>Type</th>
                    <th>Zone</th>
                    <th>Lancement</th>
                    <th>Formules</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.offers.map((o) => (
                    <React.Fragment key={o.key}>
                      <tr className={o.valid ? "" : "is-invalid"}>
                        <td>
                          <button
                            type="button"
                            className="oxi-icon-btn"
                            aria-expanded={Boolean(expanded[o.key])}
                            aria-label={`Formules de ${o.code}`}
                            onClick={() => setExpanded((p) => ({ ...p, [o.key]: !p[o.key] }))}
                          >
                            <i className={`bi ${expanded[o.key] ? "bi-chevron-down" : "bi-chevron-right"}`} />
                          </button>
                        </td>
                        <td>
                          {o.valid ? (
                            <span className="oxi-badge oxi-badge--success">Valide</span>
                          ) : (
                            <button type="button" className="oxi-badge oxi-badge--danger" onClick={() => { setTab("errors"); setLevelFilter("error"); }}>
                              {o.errorCount} erreur(s)
                            </button>
                          )}
                        </td>
                        <td className="oxi-mono">{o.code}</td>
                        <td>
                          <div className="oxi-strong">{o.title || " -"}</div>
                          <div className="oxi-muted">
                            {o.sheet} · ligne{o.rows.length > 1 ? "s" : ""} {o.rows.join(", ")}
                          </div>
                        </td>
                        <td>{o.operator || " -"}</td>
                        <td>
                          {o.promo ? (
                            <>
                              <span className="oxi-badge oxi-badge--promo">{o.promotion?.type || "Promotion"}</span>
                              {o.promotion?.duration ? <span className="oxi-muted"> {o.promotion.duration} j</span> : null}
                              {o.parent ? <div className="oxi-muted">Parente : {o.parent.code}</div> : null}
                            </>
                          ) : (
                            <span className="oxi-badge">Offre de base</span>
                          )}
                        </td>
                        <td>
                          {o.zone || " -"}
                          {o.organizations.length ? (
                            <div className="oxi-muted">{o.organizations.map((g) => `${g.name}${g.countries.length ? ` (${g.countries.length} pays)` : ""}`).join(", ")}</div>
                          ) : null}
                        </td>
                        <td>{o.desiredDate ? o.desiredDate.split("-").reverse().join("/") : " -"}</td>
                        <td>{o.formulas.length}</td>
                      </tr>
                      {expanded[o.key] ? (
                        <tr className="oxi-subrow">
                          <td />
                          <td colSpan={8}>
                            {o.formulas.map((f) => (
                              <FormulaLine key={`${f.row}-${f.code}`} f={f} />
                            ))}
                            {o.accessModes.length ? <div className="oxi-muted">Modes d'accès : {o.accessModes.join(" · ")}</div> : null}
                          </td>
                        </tr>
                      ) : null}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <>
              <div className="oxi-filters" role="radiogroup" aria-label="Filtrer">
                {[
                  ["all", `Tout (${summary.errors + summary.warnings})`],
                  ["error", `Erreurs (${summary.errors})`],
                  ["warning", `Avertissements (${summary.warnings})`],
                ].map(([key, label]) => (
                  <button key={key} type="button" role="radio" aria-checked={levelFilter === key} className={levelFilter === key ? "is-active" : ""} onClick={() => setLevelFilter(key)}>
                    {label}
                  </button>
                ))}
              </div>
              {issues.length ? (
                <div className="oxi-table-wrap">
                  <table className="oxi-table">
                    <thead>
                      <tr>
                        <th>Niveau</th>
                        <th>Feuille</th>
                        <th>Ligne</th>
                        <th>Cellule</th>
                        <th>Colonne</th>
                        <th>Valeur</th>
                        <th>Problème</th>
                      </tr>
                    </thead>
                    <tbody>
                      {issues.map((e, i) => (
                        <tr key={i}>
                          <td>
                            <span className={`oxi-badge ${e.level === "error" ? "oxi-badge--danger" : "oxi-badge--warning"}`}>
                              {e.level === "error" ? "Erreur" : "Avertissement"}
                            </span>
                          </td>
                          <td>{e.sheet}</td>
                          <td>{e.row}</td>
                          <td className="oxi-mono">{e.cell}</td>
                          <td>{e.column}</td>
                          <td className="oxi-value">{e.value === "" || e.value === null ? <span className="oxi-muted">(vide)</span> : String(e.value)}</td>
                          <td>{e.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="oxi-empty">
                  <i className="bi bi-check2-circle" /> Rien à signaler dans cette catégorie.
                </div>
              )}
            </>
          )}

          {fileError ? (
            <div className="oxi-alert oxi-alert--error" role="alert">
              <i className="bi bi-exclamation-octagon" /> {fileError}
            </div>
          ) : null}

          <div className="oxi-actions">
            <button type="button" className="oxi-btn oxi-btn--ghost" onClick={() => { setStep("file"); setAnalysis(null); setFile(null); setFileError(null); }}>
              <i className="bi bi-arrow-repeat" /> Charger un fichier corrigé
            </button>
            <button type="button" className="oxi-btn oxi-btn--primary" disabled={!canImport} onClick={() => { setOnlyValid(false); setConfirming(true); }}>
              <i className="bi bi-box-arrow-in-down" /> Importer {summary.validOffers} offre{summary.validOffers > 1 ? "s" : ""}
            </button>
          </div>
        </div>
      ) : step === "done" && report ? (
        <div className="oxi-done">
          <div className={`oxi-done__hero${report.summary.created ? "" : " is-empty"}`}>
            <i className={`bi ${report.summary.created ? "bi-check2-circle" : "bi-exclamation-circle"}`} aria-hidden="true" />
            <div>
              <h3>
                {report.summary.created
                  ? `${report.summary.submitted ?? report.summary.created} offre(s) importée(s) et soumise(s) pour validation`
                  : "Aucune offre n'a été importée"}
              </h3>
              <p>
                {report.summary.formulasCreated} formule(s) enregistrée(s). Les offres sont dans la file de validation de l'ARTCI :
                vous en êtes le soumissionnaire, aucune autre démarche n'est nécessaire.
                {report.summary.created > (report.summary.submitted ?? report.summary.created)
                  ? ` ${report.summary.created - report.summary.submitted} offre(s) sont restées en brouillon : voir le détail ci-dessous.`
                  : ""}
              </p>
            </div>
          </div>
          <div className="oxi-stats">
            <Stat label="Lignes analysées" value={report.summary.analyzedRows} icon="bi-list-ol" />
            <Stat label="Offres ajoutées" value={report.summary.created} tone="success" icon="bi-plus-circle" />
            <Stat label="Offres ignorées" value={report.summary.skipped} tone={report.summary.skipped ? "warning" : "neutral"} icon="bi-skip-forward-circle" />
            <Stat label="Offres en erreur" value={report.summary.failed} tone={report.summary.failed ? "danger" : "neutral"} icon="bi-x-circle" />
          </div>
          <div className="oxi-table-wrap">
            <table className="oxi-table">
              <thead>
                <tr>
                  <th>Résultat</th>
                  <th>Code</th>
                  <th>Offre</th>
                  <th>Feuille / lignes</th>
                  <th>Détail</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {report.results.map((r) => (
                  <tr key={r.key}>
                    <td>
                      <span className={`oxi-badge ${r.status === "created" ? (r.submitted === false ? "oxi-badge--warning" : "oxi-badge--success") : r.status === "skipped" ? "oxi-badge--warning" : "oxi-badge--danger"}`}>
                        {r.status === "created" ? (r.submitted === false ? "Brouillon" : "Soumise") : r.status === "skipped" ? "Ignorée" : "Erreur"}
                      </span>
                    </td>
                    <td className="oxi-mono">{r.code}</td>
                    <td>{r.title || " -"}</td>
                    <td className="oxi-muted">
                      {r.sheet} · {r.rows.join(", ")}
                    </td>
                    <td>{r.message || (r.status === "created" ? `${r.formulas} formule(s)` : "")}</td>
                    <td>
                      {r.id ? (
                        <Link href={`/offer-workflow/${r.id}`} className="oxi-link">
                          Ouvrir <i className="bi bi-arrow-right" />
                        </Link>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="oxi-actions">
            <button type="button" className="oxi-btn oxi-btn--ghost" onClick={() => downloadReport({ fileName: file?.name, analysis, report })}>
              <i className="bi bi-download" /> Télécharger le rapport
            </button>
            <button type="button" className="oxi-btn oxi-btn--ghost" onClick={reset}>
              <i className="bi bi-arrow-repeat" /> Nouvel import
            </button>
            <Link href={listHref} className="oxi-btn oxi-btn--primary" onClick={close}>
              <i className="bi bi-list-check" /> Voir la liste des offres
            </Link>
          </div>
        </div>
      ) : null}

      <Dialog
        visible={confirming}
        onHide={() => setConfirming(false)}
        header="Confirmer l'import"
        className="oxi-confirm"
        style={{ width: "min(520px, 94vw)" }}
        modal
      >
        {summary ? (
          <>
            <p>
              <b>{summary.validOffers}</b> offre(s) et leurs formules vont être créées et <b>soumises à la validation de l'ARTCI</b> en
              votre nom. Elles ne seront visibles du public qu'après validation.
              {analysis?.submission?.codeRequired ? " Un code de confirmation vous sera envoyé par e-mail." : ""}
            </p>
            {summary.errors ? (
              <label className="oxi-check">
                <input type="checkbox" checked={onlyValid} onChange={(e) => setOnlyValid(e.target.checked)} />
                <span>
                  J'importe uniquement les {summary.validOffers} offre(s) valide(s). Les {summary.invalidOffers} offre(s) en erreur seront
                  ignorées.
                </span>
              </label>
            ) : null}
            <div className="oxi-actions">
              <button type="button" className="oxi-btn oxi-btn--ghost" onClick={() => setConfirming(false)}>
                Annuler
              </button>
              <button type="button" className="oxi-btn oxi-btn--primary" disabled={(Boolean(summary.errors) && !onlyValid) || requestingCode} onClick={confirmImport}>
                <i className="bi bi-check2" /> {requestingCode ? "Envoi du code…" : "Confirmer et soumettre"}
              </button>
            </div>
          </>
        ) : null}
      </Dialog>

      {/* Point focal : même confirmation par code que pour une soumission manuelle. */}
      <SubmissionCodeModal
        visible={showCode}
        onHide={() => {
          setShowCode(false);
          setCodeError(null);
        }}
        reference={analysis?.submission?.reference}
        label={importLabel}
        info={codeInfo}
        submitting={busy === "import"}
        error={codeError}
        onValidated={runImport}
      />
    </Dialog>
  );
}
