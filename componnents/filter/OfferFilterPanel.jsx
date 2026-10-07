import React, { useEffect, useMemo, useState } from "react";
import { MultiSelect } from "primereact/multiselect";
import { BASE_IMG_URL, imageUrl } from "@/services/tools/constants";
import {
  BILLING_OPTIONS,
  CATEGORY_OPTIONS,
  DEFAULT_OFFER_FILTERS,
  OFFER_TYPE_OPTIONS,
  STATUS_OPTIONS,
  countActiveFilters,
  operatorsForCategory,
} from "@/services/tools/offerFilters";

/**
 * Panneau de filtres des listes d'offres.
 *
 * Présentation seule : l'état des filtres appartient à la page, la liste
 * filtrée est calculée par `applyOfferFilters`.
 *
 * @param filters       état courant (voir DEFAULT_OFFER_FILTERS)
 * @param onChange      (nextFilters) => void
 * @param operators     opérateurs proposés (null = chargement ; masqué si showOperators est faux)
 * @param showOperators afficher le filtre opérateurs (inutile pour un point focal)
 * @param resultCount   nombre d'éléments affichés après filtrage
 * @param totalCount    nombre d'éléments chargés
 * @param statusCounts  { [statut]: nombre } pour les puces de statut (voir countByStatus) ;
 *                      absent = puces sans compteur
 * @param storageKey    mémorisation de l'état replié
 */
export default function OfferFilterPanel({
  filters,
  onChange,
  operators,
  showOperators = true,
  resultCount,
  totalCount,
  statusCounts = null,
  storageKey = "offer-filters",
}) {
  const f = { ...DEFAULT_OFFER_FILTERS, ...(filters || {}) };
  const set = (patch) => onChange({ ...f, ...patch });
  const active = countActiveFilters(f);

  const [open, setOpen] = useState(true);
  useEffect(() => {
    try {
      const v = localStorage.getItem(`compartic:${storageKey}`);
      if (v !== null) setOpen(v === "1");
    } catch {
      /* stockage indisponible */
    }
  }, [storageKey]);
  const toggle = () =>
    setOpen((o) => {
      try {
        localStorage.setItem(`compartic:${storageKey}`, o ? "0" : "1");
      } catch {
        /* stockage indisponible */
      }
      return !o;
    });

  // Les opérateurs proposés dépendent de la catégorie ; une sélection devenue
  // hors catégorie est retirée.
  const operatorOptions = useMemo(() => operatorsForCategory(operators, f.category), [operators, f.category]);
  const selectedOperators = useMemo(
    () => operatorOptions.filter((o) => (f.operatorIds || []).map(Number).includes(Number(o.id))),
    [operatorOptions, f.operatorIds],
  );
  const setCategory = (category) => {
    const allowed = new Set(operatorsForCategory(operators, category).map((o) => Number(o.id)));
    set({ category, operatorIds: (f.operatorIds || []).filter((id) => allowed.has(Number(id))) });
  };

  const toggleBilling = (value) => {
    const current = new Set(f.billing || []);
    current.has(value) ? current.delete(value) : current.add(value);
    // Les trois cochés équivaut à « tous » : on revient à l'état neutre.
    set({ billing: current.size === BILLING_OPTIONS.length ? [] : [...current] });
  };

  const toggleStatus = (value) => {
    const current = new Set(f.statuses || []);
    current.has(value) ? current.delete(value) : current.add(value);
    // Tous cochés équivaut à « tous » : retour à l'état neutre.
    set({ statuses: current.size === STATUS_OPTIONS.length ? [] : STATUS_OPTIONS.map((o) => o.value).filter((v) => current.has(v)) });
  };

  const setRange = (key, patch) => set({ [key]: { ...f[key], ...patch } });

  const operatorItem = (option) => (
    <div className="ofp-op">
      {option?.imagePath ? <img src={imageUrl(option.imagePath)} alt="" /> : <i className="bi bi-building"></i>}
      <span>{option?.name}</span>
    </div>
  );

  // Puces des critères actifs, chacune retirable.
  const chips = [];
  if (String(f.search || "").trim()) chips.push({ key: "search", label: `« ${f.search.trim()} »`, clear: { search: "" } });
  if (f.offerType !== "ALL")
    chips.push({ key: "type", label: OFFER_TYPE_OPTIONS.find((o) => o.value === f.offerType)?.label, clear: { offerType: "ALL" } });
  if (f.category !== "ALL")
    chips.push({ key: "cat", label: CATEGORY_OPTIONS.find((o) => o.value === f.category)?.label, clear: { category: "ALL" } });
  if ((f.billing || []).length)
    chips.push({
      key: "bill",
      label: BILLING_OPTIONS.filter((o) => f.billing.includes(o.value)).map((o) => o.label).join(", "),
      clear: { billing: [] },
    });
  if (selectedOperators.length)
    chips.push({ key: "ops", label: selectedOperators.map((o) => o.name).join(", "), clear: { operatorIds: [] } });
  const fmt = (v) => (v ? new Date(`${v}T00:00:00`).toLocaleDateString("fr-FR") : "…");
  if (f.notif.enabled && (f.notif.from || f.notif.to))
    chips.push({ key: "notif", label: `Notification ${fmt(f.notif.from)} → ${fmt(f.notif.to)}`, clear: { notif: DEFAULT_OFFER_FILTERS.notif } });
  if (f.launch.enabled && (f.launch.from || f.launch.to))
    chips.push({ key: "launch", label: `Lancement ${fmt(f.launch.from)} → ${fmt(f.launch.to)}`, clear: { launch: DEFAULT_OFFER_FILTERS.launch } });

  const renderSegmented = ({ name, options, value, onSelect }) => (
    <div className="ofp-seg" role="radiogroup" aria-label={name}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={value === o.value ? "is-active" : ""}
          onClick={() => onSelect(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );

  const renderDateRange = ({ id, title, icon, rangeKey }) => {
    const r = f[rangeKey];
    const invalid = r.enabled && r.from && r.to && r.from > r.to;
    return (
      <div className={`ofp-range ${r.enabled ? "is-on" : ""}`}>
        <div className="ofp-range-head">
          <span className="ofp-label ofp-range-title" title={title}>
            <i className={`bi ${icon}`} aria-hidden="true"></i>
            <span>{title}</span>
          </span>
          <label className="ofp-switch" htmlFor={`${id}-on`}>
            <input
              id={`${id}-on`}
              type="checkbox"
              checked={r.enabled}
              onChange={(e) => setRange(rangeKey, { enabled: e.target.checked })}
            />
            <span aria-hidden="true"></span>
            <span className="visually-hidden">Filtrer par {title.toLowerCase()}</span>
          </label>
        </div>
        <div className="ofp-range-fields">
          <label htmlFor={`${id}-from`}>
            <span>Du</span>
            <input
              id={`${id}-from`}
              type="date"
              value={r.from || ""}
              max={r.to || undefined}
              disabled={!r.enabled}
              onChange={(e) => setRange(rangeKey, { from: e.target.value })}
            />
          </label>
          <label htmlFor={`${id}-to`}>
            <span>Au</span>
            <input
              id={`${id}-to`}
              type="date"
              value={r.to || ""}
              min={r.from || undefined}
              disabled={!r.enabled}
              onChange={(e) => setRange(rangeKey, { to: e.target.value })}
            />
          </label>
        </div>
        {invalid && <p className="ofp-error">La date de début est postérieure à la date de fin.</p>}
      </div>
    );
  };

  return (
    <section className="ofp bg-secondary text-white" aria-label="Filtres des offres" >
      <header className="ofp-head">
        <div className="ofp-search">
          <i className="bi bi-search" aria-hidden="true"></i>
          <input
            type="search"
            value={f.search}
            onChange={(e) => set({ search: e.target.value })}
            placeholder="Rechercher par code ou par nom d'offre…"
            aria-label="Rechercher par code ou par nom d'offre"
          />
        </div>
        <div className="ofp-head-right ">
          {typeof resultCount === "number" && (
            <span className="ofp-count" aria-live="polite">
              <b>{resultCount}</b>
              {typeof totalCount === "number" ? ` / ${totalCount}` : ""} offre{resultCount > 1 ? "s" : ""}
            </span>
          )}
          {active > 0 && (
            <button type="button" className="ofp-link" onClick={() => onChange({ ...DEFAULT_OFFER_FILTERS })}>
              <i className="bi bi-arrow-counterclockwise" aria-hidden="true"></i> Réinitialiser
            </button>
          )}
          <button type="button" className="ofp-toggle" onClick={toggle} aria-expanded={open}>
            <i className="bi bi-sliders" aria-hidden="true"></i>
            Filtres{active > 0 && <span className="ofp-badge">{active}</span>}
            <i className={`bi bi-chevron-${open ? "up" : "down"}`} aria-hidden="true"></i>
          </button>
        </div>
      </header>

      {/* Statuts : toujours visibles, application immédiate, combinables. */}
      <div className="ofp-status" role="group" aria-label="Filtrer par statut">
        <button type="button" aria-pressed={!(f.statuses || []).length} className={!(f.statuses || []).length ? "is-active" : ""} onClick={() => set({ statuses: [] })}>
          Tous
          {statusCounts && <span className="ofp-status-count">{statusCounts.ALL ?? 0}</span>}
        </button>
        {STATUS_OPTIONS.map((o) => {
          const on = (f.statuses || []).includes(o.value);
          return (
            <button key={o.value} type="button" aria-pressed={on} className={`ofp-status-${o.tone}${on ? " is-active" : ""}`} onClick={() => toggleStatus(o.value)}>
              <i className="ofp-status-dot" aria-hidden="true"></i>
              {o.label}
              {statusCounts && <span className="ofp-status-count">{statusCounts[o.value] ?? 0}</span>}
            </button>
          );
        })}
      </div>

      {open && (
        <div className="ofp-body">
          <div className="ofp-grid">
            <div className="ofp-field">
              <span className="ofp-label">Type d'offre</span>
              {renderSegmented({ name: "Type d'offre", options: OFFER_TYPE_OPTIONS, value: f.offerType, onSelect: (v) => set({ offerType: v }) })}
            </div>
            <div className="ofp-field">
              <span className="ofp-label">Catégorie</span>
              {renderSegmented({ name: "Catégorie", options: CATEGORY_OPTIONS, value: f.category, onSelect: setCategory })}
            </div>
            <div className="ofp-field">
              <span className="ofp-label">Type de client</span>
              <div className="ofp-chips-toggle" role="group" aria-label="Type de client">
                {BILLING_OPTIONS.map((o) => {
                  const on = (f.billing || []).includes(o.value);
                  return (
                    <button
                      key={o.value}
                      type="button"
                      aria-pressed={on}
                      className={on ? "is-active" : ""}
                      onClick={() => toggleBilling(o.value)}
                    >
                      {on && <i className="bi bi-check2" aria-hidden="true"></i>}
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {showOperators && (
              <div className="ofp-field ofp-field-wide">
                <span className="ofp-label">
                  Opérateurs
                  {/* <small>{f.category === "ALL" ? "tous types de réseau" : `réseau ${f.category === "MOBILE" ? "mobile" : "fixe"}`}</small> */}
                </span>
                <MultiSelect
                  value={selectedOperators}
                  options={operatorOptions}
                  onChange={(e) => set({ operatorIds: (e.value || []).map((o) => o.id) })}
                  optionLabel="name"
                  dataKey="id"
                  placeholder={operators ? "Tous les opérateurs" : "Chargement…"}
                  disabled={!operators}
                  display="chip"
                  filter
                  filterPlaceholder="Rechercher un opérateur"
                  itemTemplate={operatorItem}
                  className="ofp-multiselect"
                  panelClassName="ofp-multiselect-panel"
                  emptyFilterMessage="Aucun opérateur"
                />
              </div>
            )}

            {renderDateRange({ id: "ofp-notif", title: "Date de notification", icon: "bi-bell", rangeKey: "notif" })}
            {renderDateRange({ id: "ofp-launch", title: "Lancement souhaité", icon: "bi-rocket-takeoff", rangeKey: "launch" })}
          </div>
        </div>
      )}

      {/* {chips.length > 0 && (
        <ul className="ofp-active" aria-label="Filtres actifs">
          {chips.map((c) => (
            <li key={c.key}>
              <span>{c.label}</span>
              <button type="button" onClick={() => set(c.clear)} aria-label={`Retirer le filtre ${c.label}`}>
                <i className="bi bi-x" aria-hidden="true"></i>
              </button>
            </li>
          ))}
        </ul>
      )} */}
    </section>
  );
}
