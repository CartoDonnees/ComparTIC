import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { MultiSelect } from "primereact/multiselect";
import DataLoader from "@/componnents/Loader/DataLoader";
import ExportButtons from "@/componnents/export/ExportButtons";
import { toastSuccess } from "@/componnents/notification/notification";
import {
  createReferential,
  deleteReferential,
  listReferential,
  updateReferential,
} from "@/services/api/admin/referentialApiService";

/**
 * Gestion d'un référentiel (pays, organisations, zones) : liste paginée,
 * recherche, filtres, consultation, création, modification et suppression.
 *
 * L'écran ne porte aucune règle métier : doublons, champs obligatoires et
 * éléments encore utilisés sont jugés par le serveur, dont le message est
 * affiché tel quel (dans le formulaire, ou dans la confirmation de suppression).
 *
 * @param config {
 *   resource      "country" | "organization" | "area"
 *   title, icon   en-tête de page
 *   singular      « le pays », « l'organisation »… (messages)
 *   addLabel      libellé du bouton d'ajout
 *   columns       [{ field, header, body?, sortable?, style? }]
 *   name          (item) => nom affiché (titres, confirmations)
 *   search        (item) => texte dans lequel chercher
 *   filters       [{ key, label, options: [{ value, label }], test: (item, value) => bool }]
 *   fields        (ctx) => [{ name, label, type, required, options, help, readOnlyOnEdit }]
 *   toForm        (item|null, ctx) => valeurs du formulaire
 *   toPayload     (form) => corps envoyé à l'API
 *   view          (item) => [{ label, value }]
 *   usage         (item) => texte « utilisé par… » ou null (bloque la suppression)
 *   canAdd        (ctx) => bool ; addDisabledHint si faux
 *   exportColumns, exportFile
 * }
 * @param stats      panneau de statistiques conservé au-dessus de la liste
 * @param onChanged  rappel après chaque modification (rechargement des statistiques)
 * @param onLoaded   (items, extra) => void, à chaque chargement de la liste
 * @param context    données annexes des formulaires (pays, zones…)
 */
export default function ReferentialManager({ config, stats = null, onChanged, onLoaded, context = {} }) {
  const [items, setItems] = useState(null);
  const [extra, setExtra] = useState({});
  const [loadError, setLoadError] = useState(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});
  const [selection, setSelection] = useState(null);

  const [form, setForm] = useState(null); // { id?, values }
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [viewed, setViewed] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Nom affiché d'un élément (titres, confirmations).
  const nameOf = (item) => (config.name ? config.name(item) : config.search(item));

  const ctx = useMemo(() => ({ ...context, ...extra, items }), [context, extra, items]);

  const load = useCallback(async () => {
    const res = await listReferential(config.resource);
    if (!res.ok) {
      setLoadError(res.error);
      setItems([]);
      return;
    }
    const { items: list, ...rest } = res.data;
    setLoadError(null);
    setExtra(rest);
    setItems(Array.isArray(list) ? list : []);
    onLoaded?.(Array.isArray(list) ? list : [], rest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.resource]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    if (!items) return null;
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (q && !String(config.search(item) || "").toLowerCase().includes(q)) return false;
      return (config.filters || []).every((f) => {
        const value = filters[f.key];
        return value === undefined || value === "ALL" || f.test(item, value);
      });
    });
  }, [items, search, filters, config]);

  const activeFilters = (search.trim() ? 1 : 0) + Object.values(filters).filter((v) => v !== undefined && v !== "ALL").length;
  const fields = form ? config.fields(ctx, form) : [];
  const canAdd = config.canAdd ? config.canAdd(ctx) : true;

  const openForm = (item = null) => {
    setFormError(null);
    setForm({ id: item?.id || null, values: config.toForm(item, ctx) });
  };

  const setValue = (name, value) => setForm((f) => ({ ...f, values: { ...f.values, [name]: value } }));

  const missing = fields.filter((f) => f.required && (form.values[f.name] === "" || form.values[f.name] === null || form.values[f.name] === undefined));

  const submit = async (e) => {
    e?.preventDefault();
    if (missing.length) {
      setFormError({ message: `Champ obligatoire : ${missing.map((f) => f.label).join(", ")}.`, field: missing[0].name });
      return;
    }
    setSaving(true);
    setFormError(null);
    const payload = config.toPayload(form.values);
    const res = form.id ? await updateReferential(config.resource, form.id, payload) : await createReferential(config.resource, payload);
    setSaving(false);
    if (!res.ok) {
      setFormError({ message: res.error, field: res.details?.field || null });
      return;
    }
    toastSuccess(form.id ? "Modification enregistrée." : "Élément créé.");
    setForm(null);
    await load();
    onChanged?.();
  };

  const askDelete = (item) => {
    setDeleteError(null);
    setToDelete(item);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    const res = await deleteReferential(config.resource, toDelete.id);
    setDeleting(false);
    if (!res.ok) {
      setDeleteError(res.error);
      return;
    }
    toastSuccess("Élément supprimé.");
    setToDelete(null);
    setSelection(null);
    await load();
    onChanged?.();
  };

  const actions = (item) => (
    <div className="ref-row-actions">
      <button type="button" className="ref-icon-btn" onClick={() => setViewed(item)} title="Consulter" aria-label={`Consulter ${nameOf(item)}`}>
        <i className="bi bi-eye" aria-hidden="true"></i>
      </button>
      <button type="button" className="ref-icon-btn" onClick={() => openForm(item)} title="Modifier" aria-label={`Modifier ${nameOf(item)}`}>
        <i className="bi bi-pencil" aria-hidden="true"></i>
      </button>
      <button type="button" className="ref-icon-btn ref-icon-btn--danger" onClick={() => askDelete(item)} title="Supprimer" aria-label={`Supprimer ${nameOf(item)}`}>
        <i className="bi bi-trash" aria-hidden="true"></i>
      </button>
    </div>
  );

  const renderField = (f) => {
    const value = form.values[f.name];
    const invalid = formError?.field === f.name;
    const disabled = saving || (f.readOnlyOnEdit && !!form.id);
    const id = `ref-${config.resource}-${f.name}`;
    let control;
    if (f.type === "textarea") {
      control = <textarea id={id} rows={3} value={value || ""} onChange={(e) => setValue(f.name, e.target.value)} disabled={disabled} maxLength={2000} placeholder={f.placeholder} />;
    } else if (f.type === "select") {
      control = (
        <select id={id} value={value ?? ""} onChange={(e) => setValue(f.name, e.target.value)} disabled={disabled}>
          <option value="" disabled>
            Choisir…
          </option>
          {(f.options || []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    } else if (f.type === "multiselect") {
      control = (
        <MultiSelect
          inputId={id}
          value={value || []}
          options={f.options || []}
          onChange={(e) => setValue(f.name, e.value || [])}
          optionLabel="label"
          optionValue="value"
          filter
          filterPlaceholder="Rechercher"
          display="chip"
          maxSelectedLabels={6}
          selectedItemsLabel="{0} sélectionnés"
          placeholder={f.placeholder || "Aucun"}
          disabled={disabled}
          className="ref-multiselect"
          emptyFilterMessage="Aucun résultat"
        />
      );
    } else {
      control = (
        <input
          id={id}
          type={f.type === "number" ? "number" : "text"}
          value={value ?? ""}
          onChange={(e) => setValue(f.name, e.target.value)}
          disabled={disabled}
          maxLength={f.type === "number" ? undefined : 100}
          min={f.min}
          max={f.max}
          placeholder={f.placeholder}
          autoComplete="off"
        />
      );
    }
    return (
      <div key={f.name} className={`ref-field${invalid ? " is-invalid" : ""}`}>
        <label htmlFor={id}>
          {f.label} {f.required && <span className="ref-required">*</span>}
        </label>
        {control}
        {f.help && <small>{f.readOnlyOnEdit && form.id ? f.readOnlyHelp || f.help : f.help}</small>}
      </div>
    );
  };

  const usage = toDelete && config.usage ? config.usage(toDelete) : null;

  return (
    <div className="ref">
      <div className="ref-head">
        <div>
          <h1 className="ref-title">
            <i className={`bi ${config.icon}`} aria-hidden="true"></i> {config.title}
          </h1>
          {config.subtitle && <p className="ref-sub">{config.subtitle}</p>}
        </div>
        <button type="button" className="ref-btn ref-btn--accent" onClick={() => openForm(null)} disabled={!canAdd || !items} title={!canAdd ? config.addDisabledHint : undefined}>
          <i className="bi bi-plus-lg" aria-hidden="true"></i> {config.addLabel}
        </button>
      </div>

      {stats}

      <div className="ref-panel">
        <div className="ref-toolbar">
          <div className="ref-search">
            <i className="bi bi-search" aria-hidden="true"></i>
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={config.searchPlaceholder || "Rechercher…"} aria-label="Rechercher" />
          </div>
          {(config.filters || []).map((f) => (
            <select key={f.key} value={filters[f.key] ?? "ALL"} onChange={(e) => setFilters((p) => ({ ...p, [f.key]: e.target.value }))} aria-label={f.label}>
              <option value="ALL">{f.label} : tous</option>
              {(typeof f.options === "function" ? f.options(ctx) : f.options).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ))}
          {activeFilters > 0 && (
            <button
              type="button"
              className="ref-btn ref-btn--ghost"
              onClick={() => {
                setSearch("");
                setFilters({});
              }}
            >
              <i className="bi bi-arrow-counterclockwise" aria-hidden="true"></i> Réinitialiser
            </button>
          )}
          <span className="ref-count" aria-live="polite">
            <b>{rows?.length ?? 0}</b> / {items?.length ?? 0}
          </span>
          {config.exportColumns && (
            <ExportButtons rows={rows || []} selection={selection} columns={config.exportColumns} fileName={config.exportFile} title={config.title} />
          )}
        </div>

        {loadError && (
          <div className="ref-alert ref-alert--error" role="alert">
            <i className="bi bi-exclamation-triangle" aria-hidden="true"></i> {loadError}
          </div>
        )}

        {rows === null ? (
          <DataLoader label="Chargement…" />
        ) : rows.length === 0 ? (
          <div className="ref-empty">
            <i className="bi bi-inbox" aria-hidden="true"></i>
            <b>{items.length ? "Aucun résultat" : "Aucun élément"}</b>
            <span>{items.length ? "Aucun élément ne correspond à la recherche ou aux filtres." : `Commencez par « ${config.addLabel} ».`}</span>
          </div>
        ) : (
          <DataTable
            value={rows}
            dataKey="id"
            selectionMode="checkbox"
            selection={selection}
            onSelectionChange={(e) => setSelection(e.value)}
            paginator={rows.length > 10}
            rows={10}
            rowsPerPageOptions={[10, 25, 50]}
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="{first} à {last} sur {totalRecords}"
            stripedRows
            size="small"
            className="ref-table"
          >
            <Column selectionMode="multiple" exportable={false} style={{ width: 40 }} />
            {config.columns.map((c) => (
              <Column key={c.header} field={c.field} header={c.header} body={c.body} sortable={c.sortable !== false && !!c.field} style={c.style} />
            ))}
            <Column header="Actions" body={actions} alignHeader="right" style={{ width: 130 }} />
          </DataTable>
        )}
      </div>

      {/* ------------------------------------------------- Création / modification */}
      <Dialog
        visible={!!form}
        onHide={() => !saving && setForm(null)}
        header={form?.id ? `Modifier ${config.singular}` : config.addLabel}
        style={{ width: "min(560px, 96vw)" }}
        className="ref-dialog"
        modal
      >
        {form && (
          <form onSubmit={submit} noValidate>
            {formError && (
              <div className="ref-alert ref-alert--error" role="alert">
                <i className="bi bi-exclamation-octagon" aria-hidden="true"></i> {formError.message}
              </div>
            )}
            {fields.map(renderField)}
            <div className="ref-dialog-foot">
              <button type="button" className="ref-btn" onClick={() => setForm(null)} disabled={saving}>
                Annuler
              </button>
              <button type="submit" className="ref-btn ref-btn--accent" disabled={saving}>
                {saving && <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>}
                Enregistrer
              </button>
            </div>
          </form>
        )}
      </Dialog>

      {/* ------------------------------------------------------------ Consultation */}
      <Dialog visible={!!viewed} onHide={() => setViewed(null)} header={viewed ? nameOf(viewed) : ""} style={{ width: "min(560px, 96vw)" }} className="ref-dialog" modal dismissableMask>
        {viewed && (
          <>
            <dl className="ref-dl">
              {config.view(viewed).map((row) => (
                <React.Fragment key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.value === null || row.value === undefined || row.value === "" ? "  " : row.value}</dd>
                </React.Fragment>
              ))}
            </dl>
            <div className="ref-dialog-foot">
              <button type="button" className="ref-btn" onClick={() => setViewed(null)}>
                Fermer
              </button>
              <button
                type="button"
                className="ref-btn ref-btn--accent"
                onClick={() => {
                  const item = viewed;
                  setViewed(null);
                  openForm(item);
                }}
              >
                <i className="bi bi-pencil" aria-hidden="true"></i> Modifier
              </button>
            </div>
          </>
        )}
      </Dialog>

      {/* ------------------------------------------------------------- Suppression */}
      <Dialog visible={!!toDelete} onHide={() => !deleting && setToDelete(null)} header={`Supprimer ${config.singular}`} style={{ width: "min(500px, 96vw)" }} className="ref-dialog" modal>
        {toDelete && (
          <>
            <p className="ref-confirm">
              Supprimer définitivement <b>« {nameOf(toDelete)} »</b> ?
            </p>
            {deleteError ? (
              <div className="ref-alert ref-alert--error" role="alert">
                <i className="bi bi-exclamation-octagon" aria-hidden="true"></i> {deleteError}
              </div>
            ) : usage ? (
              <div className="ref-alert ref-alert--warning">
                <i className="bi bi-link-45deg" aria-hidden="true"></i> Suppression impossible : {usage}. Retirez d'abord ces liens.
              </div>
            ) : (
              <div className="ref-alert ref-alert--info">
                <i className="bi bi-info-circle" aria-hidden="true"></i> Cet élément n'est utilisé nulle part. La suppression sera tracée dans le journal d'activité.
              </div>
            )}
            <div className="ref-dialog-foot">
              <button type="button" className="ref-btn" onClick={() => setToDelete(null)} disabled={deleting}>
                Annuler
              </button>
              <button type="button" className="ref-btn ref-btn--danger" onClick={confirmDelete} disabled={deleting || !!usage}>
                {deleting && <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>}
                Supprimer
              </button>
            </div>
          </>
        )}
      </Dialog>
    </div>
  );
}
