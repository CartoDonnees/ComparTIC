import React, { useMemo } from "react";
import { MultiSelect } from "primereact/multiselect";
import { BASE_IMG_URL, imageUrl } from "@/services/tools/constants";

/**
 * Barre de filtres des tableaux de bord statistiques (admin et opérateur).
 *
 * Présentation seule : l'état appartient à la page, qui reçoit chaque
 * changement via `onChange(nom, valeur)` avec les mêmes valeurs qu'avant
 * (catégorie -1 / 1 / 2, facturation -1 / 1 / 2 / 3)   l'API de statistiques
 * n'est pas modifiée.
 *
 * Corrige l'ancienne barre :
 *  - « HYBRIDE » portait la même valeur que « POST-PAYÉ » : il était
 *    impossible d'obtenir les statistiques des offres hybrides ;
 *  - les options « Veuillez sélectionner… » (valeur vide) étaient
 *    sélectionnables et envoyaient une valeur interprétée comme « hybride » ;
 *  - rien ne signalait qu'aucun opérateur sélectionné masque les statistiques.
 *
 * @param filter             { startDate, endDate, category, billingType }
 * @param onChange           (name, value) => void
 * @param operators          opérateurs proposés (facultatif : masque le champ)
 * @param selectedOperators  opérateurs sélectionnés
 * @param onOperatorsChange  (operators[]) => void
 * @param defaultMonths      profondeur de la période par défaut (réinitialisation)
 */
const CATEGORY = [
  { value: -1, label: "Toutes" },
  { value: 1, label: "Mobile" },
  { value: 2, label: "Fixe" },
];
const BILLING = [
  { value: -1, label: "Toutes" },
  { value: 1, label: "Prépayé" },
  { value: 2, label: "Postpayé" },
  { value: 3, label: "Hybride" },
];

const ymd = (d) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const monthsBefore = (months) => {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return ymd(d);
};

const PRESETS = [
  { key: "3m", label: "3 mois", months: 3 },
  { key: "12m", label: "12 mois", months: 12 },
  { key: "3y", label: "3 ans", months: 36 },
  { key: "5y", label: "5 ans", months: 60 },
];

export default function StatsFilterBar({
  filter,
  onChange,
  operators,
  selectedOperators,
  onOperatorsChange,
  defaultMonths = 60,
  title = "Filtres",
  subtitle = "Les statistiques se mettent à jour à chaque changement.",
}) {
  const today = ymd(new Date());
  const f = filter || {};
  const category = Number(f.category ?? -1);
  const billing = Number(f.billingType ?? -1);
  const showOperators = typeof onOperatorsChange === "function";

  // Opérateurs proposés selon la catégorie (hybrides dans les deux).
  const operatorOptions = useMemo(() => {
    const list = Array.isArray(operators) ? operators : [];
    if (category === 1) return list.filter((o) => ["MOBILE", "HYBRIDE"].includes(o?.type));
    if (category === 2) return list.filter((o) => ["FIXE", "HYBRIDE"].includes(o?.type));
    return list;
  }, [operators, category]);
  const selected = Array.isArray(selectedOperators) ? selectedOperators : [];

  const activePreset = PRESETS.find((p) => f.endDate === today && f.startDate === monthsBefore(p.months))?.key;
  const applyPreset = (months) => {
    onChange("startDate", monthsBefore(months));
    onChange("endDate", today);
  };

  const isDefault =
    category === -1 && billing === -1 && f.endDate === today && f.startDate === monthsBefore(defaultMonths) &&
    (!showOperators || selected.length === operatorOptions.length);

  const reset = () => {
    onChange("category", -1);
    onChange("billingType", -1);
    applyPreset(defaultMonths);
    if (showOperators) onOperatorsChange(Array.isArray(operators) ? operators : []);
  };

  const invalidRange = f.startDate && f.endDate && f.startDate > f.endDate;

  const operatorItem = (option) => (
    <div className="ofp-op">
      {option?.imagePath ? <img src={imageUrl(option.imagePath)} alt="" /> : <i className="bi bi-building"></i>}
      <span>{option?.name}</span>
    </div>
  );

  const segmented = (name, options, value, key) => (
    <div className="ofp-seg" role="radiogroup" aria-label={name}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={value === o.value ? "is-active" : ""}
          onClick={() => onChange(key, o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );

  return (
    <section className="ofp sfb bg-secondary" aria-label={title}>
      <header className="sfb-head">
        <div>
          <h2 className="sfb-title">
            <i className="bi bi-sliders" aria-hidden="true"></i> {title}
          </h2>
          {/* {subtitle && <p className="sfb-sub">{subtitle}</p>} */}
        </div>
        {!isDefault && (
          <button type="button" className="ofp-link" onClick={reset}>
            <i className="bi bi-arrow-counterclockwise" aria-hidden="true"></i> Réinitialiser
          </button>
        )}
      </header>
      <hr className="m-1"></hr>

      <div className="sfb-grid">
        {/* Période */}
        <div className="ofp-field sfb-period border p-1 rounded">
          <span className="ofp-label">
            <i className="bi bi-calendar-range" aria-hidden="true"></i> Période
          </span>
          <div className="sfb-dates ">
            <label>
              Du
              <input
                type="date"
                value={f.startDate || ""}
                max={f.endDate || today}
                onChange={(e) => onChange("startDate", e.target.value)}
                style={{ color:"black" }}
              />
            </label>
            <i className="bi bi-arrow-right sfb-arrow" aria-hidden="true"></i>
            <label>
              Au
              <input
                type="date"
                value={f.endDate || ""}
                min={f.startDate || undefined}
                max={today}
                onChange={(e) => onChange("endDate", e.target.value)}
                style={{ color:"black" }}
              />
            </label>
          </div>
          <div className="ofp-chips-toggle sfb-presets" role="group" aria-label="Périodes rapides">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                aria-pressed={activePreset === p.key}
                className={activePreset === p.key ? "is-active" : ""}
                onClick={() => applyPreset(p.months)}
              >
                {p.label}
              </button>
            ))}
          </div>
          {invalidRange && <p className="ofp-error">La date de début est postérieure à la date de fin.</p>}
        </div>

        {/* Catégorie et facturation */}
        <div className="ofp-field">
          <span className="ofp-label">
            <i className="bi bi-bookmark" aria-hidden="true"></i> Catégorie
          </span>
          {segmented("Catégorie", CATEGORY, category, "category")}
          <span className="ofp-label sfb-gap">
            <i className="bi bi-credit-card" aria-hidden="true"></i> Type de client
          </span>
          {segmented("Type de client", BILLING, billing, "billingType")}
        </div>

        {/* Opérateurs */}
        {showOperators && (
          <div className="ofp-field sfb-operators">
            <span className="ofp-label">
              <i className="bi bi-sd-card" aria-hidden="true"></i> Opérateurs
              <small className="text-white">
                {selected.length}/{operatorOptions.length} sélectionné{selected.length > 1 ? "s" : ""}
              </small>
            </span>
            <MultiSelect
              value={selected}
              options={operatorOptions}
              onChange={(e) => onOperatorsChange(e.value || [])}
              optionLabel="name"
              dataKey="id"
              placeholder={operators ? "Aucun opérateur sélectionné" : "Chargement…"}
              disabled={!operators}
              display="chip"
              filter
              filterPlaceholder="Rechercher un opérateur"
              itemTemplate={operatorItem}
              className="ofp-multiselect"
              panelClassName="ofp-multiselect-panel"
              emptyFilterMessage="Aucun opérateur"
            />
            <div className="sfb-op-actions">
              <button type="button" className="ofp-link sfb-link" onClick={() => onOperatorsChange(operatorOptions)}>
                Tout sélectionner
              </button>
              {selected.length > 0 && (
                <button type="button" className="ofp-link sfb-link" onClick={() => onOperatorsChange([])}>
                  Tout retirer
                </button>
              )}
            </div>
            {operators && selected.length === 0 && (
              <p className="sfb-warning" role="status">
                <i className="bi bi-info-circle" aria-hidden="true"></i> Sélectionnez au moins un opérateur pour afficher
                les statistiques.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
