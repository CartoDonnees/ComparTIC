"use client";

import { getModernStats } from "@/services/api/admin/statisticsModernApiServices";
import { useAdmin } from "@/services/providers/AdminProvider";
import { BASE_IMG_URL, imageUrl } from "@/services/tools/constants";
import { handleNumThousand } from "@/services/tools/convertions";
import { STATUS } from "@/services/tools/offerStatus";
import { Chart } from "primereact/chart";
import { MultiSelect } from "primereact/multiselect";
import ChartDataLabels from "chartjs-plugin-datalabels";
import React, { useEffect, useMemo, useState } from "react";
import {
  OfferKindSplit,
  OfferTrendPanel,
  OperatorDetailTable,
} from "@/componnents/stats/OfferStatsSections";

/**
 * Statistiques détaillées sur les offres de télécommunications   page dédiée.
 *
 * PAGE SÉPARÉE, à l'adresse `/admin-statistics`. L'onglet « GENERALITES » du
 * tableau de bord reste inchangé : il conserve son écran d'origine et son point
 * d'API historique. Rien de ce qui suit ne l'affecte.
 *
 * ─── Ce que cette page reprend de l'écran du tableau de bord ──────────────
 *
 * Les NEUF graphiques y sont tous présents :
 *   1. statut des offres                     6. répartition par zone et par opérateur
 *   2. répartition par zones                 7. par opérateur et par type
 *   3. répartition par type d'offre          8. par opérateur et par catégorie
 *   4. répartition par opérateur             9. évolution par type et catégorie
 *   5. par type d'offre et par opérateur
 *
 * ─── Ce qu'elle fait différemment ─────────────────────────────────────────
 *
 *  1. UNE SEULE SOURCE. L'écran du tableau de bord interroge deux services :
 *     l'un donne des compteurs (soixante requêtes, tableau positionnel lu en
 *     `stats[43]`), l'autre alimente les graphiques. Les deux ne réagissent pas
 *     aux mêmes filtres   d'où des chiffres insensibles aux critères affichés,
 *     à côté de courbes filtrées. Ici, tout vient d'une agrégation unique
 *     (`services/tools/statistics.js`), en une seule requête.
 *  2. DES FILTRES QUI FILTRENT. Période, catégorie, facturation et opérateurs
 *     sont transmis au serveur et s'appliquent à TOUT l'écran.
 *  3. DES COMPTEURS CORRIGÉS. Les « refusées » par zone, côté tableau de bord,
 *     ne comptent que les offres promotionnelles (un `specialPromotion` de trop,
 *     hérité du bloc voisin). L'agrégation utilisée ici n'a pas ce défaut.
 *  4. DES STATUTS COHÉRENTS. La décision de l'ARTCI l'emporte sur l'avancement
 *     du dossier, comme dans l'onglet « Suivi ».
 *  5. UN RENDU SERVEUR POSSIBLE : aucune lecture de `document` hors navigateur.
 */

const PALETTE = {
  base: "#0ea5e9",
  promo: "#a855f7",
  mobile: "#53EAFD",
  fixe: "#F4A8FF",
  prepaid: "#6366f1",
  postpaid: "#f59e0b",
  hybrid: "#64748b",
  national: "#22c55e",
  international: "#ec4899",
  roaming: "#8b5cf6",
  declared: "#0ea5e9",
  decided: "#03832e",
};

const ZONE_LABEL = {
  NATIONAL: "Nationale",
  INTERNATIONAL: "Internationale",
  ROAMING: "Roaming",
  UNKNOWN: "Non renseignée",
};

/** Étiquettes de valeur sur les graphiques, comme dans la version d'origine. */
const dataLabels = (opts = {}) => ({
  display: true,
  color: "#fff",
  font: { weight: 700, size: 11 },
  formatter: (value) => (value === 0 || value == null ? null : value),
  ...opts,
});

const legendBottom = {
  position: "bottom",
  labels: { boxWidth: 10, boxHeight: 10, padding: 12, font: { size: 11 } },
};

const roundOptions = {
  maintainAspectRatio: false,
  responsive: true,
  plugins: { legend: legendBottom, datalabels: dataLabels() },
};

const barOptions = (stacked = false, horizontal = false) => ({
  maintainAspectRatio: false,
  responsive: true,
  indexAxis: horizontal ? "y" : "x",
  plugins: {
    legend: legendBottom,
    datalabels: dataLabels({ color: "#0f172a", anchor: "end", align: "end" }),
  },
  scales: {
    x: { stacked, grid: { display: false }, ticks: { precision: 0 } },
    y: { stacked, beginAtZero: true, ticks: { precision: 0 } },
  },
});

const todayISO = () => new Date().toISOString().slice(0, 10);
const monthsAgoISO = (n) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 10);
};

export default function AdminStatisticsModernPage() {
  const { operators } = useAdmin();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOperators, setSelectedOperators] = useState([]);
  const [filter, setFilter] = useState({
    from: "",
    to: "",
    category: "ALL",
    billingType: "ALL",
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getModernStats({
          operatorIds: selectedOperators.map((o) => o?.id).filter(Boolean),
          from: filter.from || undefined,
          to: filter.to || undefined,
          category: filter.category === "ALL" ? undefined : filter.category,
          billingType:
            filter.billingType === "ALL" ? undefined : filter.billingType,
        });
        if (!cancelled) setStats(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [
    selectedOperators,
    filter.from,
    filter.to,
    filter.category,
    filter.billingType,
  ]);

  const hasData = stats && stats.total > 0;
  const ops = stats?.byOperator ?? [];
  const operLabels = ops.map((o) => o.name);
  const operColors = ops.map((o) => o.color || "#03832e");

  /* ── 1. Statut des offres ─────────────────────────────────────────────── */
  const chartStatus = useMemo(() => {
    if (!stats) return null;
    const keys = ["ALLOW", "DINIED", "PENDING", "SUSPENDED"];
    const values = keys.map((k) => stats.byStatus[k]);
    if (values.every((v) => v === 0)) return null;
    return {
      labels: keys.map((k) => STATUS[k].label),
      datasets: [
        {
          data: values,
          backgroundColor: keys.map((k) => STATUS[k].bg),
          label: "offres",
          borderColor: "#fff",
          borderWidth: 2,
        },
      ],
    };
  }, [stats]);

  /* ── 2. Répartition par zones ─────────────────────────────────────────── */
  const chartZones = useMemo(() => {
    if (!stats) return null;
    const values = [
      stats.byZone.NATIONAL.total,
      stats.byZone.INTERNATIONAL.total,
      stats.byZone.ROAMING.total,
    ];
    if (values.every((v) => v === 0)) return null;
    return {
      labels: ["Nationale", "Internationale", "Roaming"],
      datasets: [
        {
          data: values,
          backgroundColor: [
            PALETTE.national,
            PALETTE.international,
            PALETTE.roaming,
          ],
          label: "offres",
          borderColor: "#fff",
          borderWidth: 2,
        },
      ],
    };
  }, [stats]);

  /* ── 3. Répartition par type d'offre ──────────────────────────────────── */
  const chartKind = useMemo(() => {
    if (!stats) return null;
    const values = [stats.byKind.BASE.total, stats.byKind.PROMO.total];
    if (values.every((v) => v === 0)) return null;
    return {
      labels: ["Offre de base", "Offre en promotion"],
      datasets: [
        {
          data: values,
          backgroundColor: [PALETTE.base, PALETTE.promo],
          label: "offres",
          borderColor: "#fff",
          borderWidth: 2,
        },
      ],
    };
  }, [stats]);

  /* ── 4. Répartition par opérateur ─────────────────────────────────────── */
  const chartOperators = useMemo(() => {
    if (!ops.length) return null;
    return {
      labels: operLabels,
      datasets: [
        {
          data: ops.map((o) => o.total),
          backgroundColor: operColors,
          label: "offres",
          borderColor: "#fff",
          borderWidth: 2,
        },
      ],
    };
  }, [stats]);

  /* ── 5. Par type d'offre et par opérateur ─────────────────────────────── */
  const chartKindByOperator = useMemo(() => {
    if (!ops.length) return null;
    return {
      labels: ["Offres de base", "Offres promotionnelles"],
      datasets: ops.map((o) => ({
        type: "bar",
        label: o.name,
        backgroundColor: o.color || "#03832e",
        data: [o.BASE, o.PROMO],
        borderColor: "#fff",
        borderWidth: 2,
      })),
    };
  }, [stats]);

  /* ── 6. Par zone et par opérateur ─────────────────────────────────────── */
  const chartZoneByOperator = useMemo(() => {
    if (!ops.length) return null;
    return {
      labels: ["Zone nationale", "Zone internationale", "Zone roaming"],
      datasets: ops.map((o) => ({
        type: "bar",
        label: o.name,
        backgroundColor: o.color || "#03832e",
        data: [o.NATIONAL, o.INTERNATIONAL, o.ROAMING],
        borderColor: "#fff",
        borderWidth: 2,
      })),
    };
  }, [stats]);

  /* ── 7. Par opérateur et par type ─────────────────────────────────────── */
  const chartOperatorByKind = useMemo(() => {
    if (!ops.length) return null;
    return {
      labels: operLabels,
      datasets: [
        {
          type: "bar",
          label: "Offre de base",
          backgroundColor: PALETTE.base,
          data: ops.map((o) => o.BASE),
        },
        {
          type: "bar",
          label: "Offre promotionnelle",
          backgroundColor: PALETTE.promo,
          data: ops.map((o) => o.PROMO),
        },
      ],
    };
  }, [stats]);

  /* ── 8. Par opérateur et par catégorie ────────────────────────────────── */
  const chartOperatorByCategory = useMemo(() => {
    if (!ops.length) return null;
    return {
      labels: operLabels,
      datasets: [
        {
          type: "bar",
          label: "Mobile",
          backgroundColor: PALETTE.mobile,
          data: ops.map((o) => o.MOBILE),
        },
        {
          type: "bar",
          label: "Fixe",
          backgroundColor: PALETTE.fixe,
          data: ops.map((o) => o.FIXE),
        },
      ],
    };
  }, [stats]);

  const onFilter = (name, value) =>
    setFilter((prev) => ({ ...prev, [name]: value }));

  const resetFilters = () => {
    setSelectedOperators([]);
    setFilter({ from: "", to: "", category: "ALL", billingType: "ALL" });
  };

  const operatorTemplate = (option) => (
    <div className="d-flex align-items-center gap-2">
      <img
        alt={option?.name}
        src={imageUrl(option?.imagePath)}
        style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover" }}
      />
      <span className="text-dark">{option?.name}</span>
    </div>
  );

  const Kpi = ({ value, label, color, hint }) => (
    <div className="sts-kpi" style={{ "--sts-kpi-color": color }}>
      <div className="sts-kpi-value" style={{ color }}>
        {handleNumThousand(value ?? 0)}
      </div>
      <div className="sts-kpi-label">{label}</div>
      {hint && <div className="sts-kpi-hint">{hint}</div>}
    </div>
  );

  const Panel = ({ title, subtitle, children, wide }) => (
    <section className={`sts-panel${wide ? " sts-panel--wide" : ""}`}>
      <header className="sts-panel-head">
        <span className="sts-panel-title">{title}</span>
        {subtitle && <span className="sts-panel-sub">{subtitle}</span>}
      </header>
      <div className="sts-panel-body">{children}</div>
    </section>
  );

  /** Un graphique, ou un message quand la série est vide. */
  const Graph = ({ data, type, options, wide }) =>
    data ? (
      <div className={`sts-chart${wide ? " sts-chart--wide" : ""}`}>
        <Chart type={type} data={data} options={options} plugins={[ChartDataLabels]} />
      </div>
    ) : (
      <div className="sts-nodata">Aucune donnée sur ce périmètre.</div>
    );

  return (
    <div className="sts">
      <div className="sts-head">
        <div>
          <h1 className="sts-title">
            Statistiques générales détaillées sur les offres de
            télécommunications
          </h1>
          <p className="sts-sub">
            Combinez la période, la catégorie, le type de client et les opérateurs :
            tous les chiffres et graphiques de cette page suivent le périmètre
            choisi.
          </p>
        </div>
      </div>

      <div className="sts-filters">
        <div className="sts-filters-grid">
          <div className="sts-field">
            <label htmlFor="sts-from">Du</label>
            <input
              id="sts-from"
              type="date"
              className="form-control"
              max={filter.to || todayISO()}
              value={filter.from}
              onChange={(e) => onFilter("from", e.target.value)}
            />
          </div>
          <div className="sts-field">
            <label htmlFor="sts-to">Au</label>
            <input
              id="sts-to"
              type="date"
              className="form-control"
              min={filter.from}
              value={filter.to}
              onChange={(e) => onFilter("to", e.target.value)}
            />
          </div>
          <div className="sts-field">
            <label htmlFor="sts-cat">Catégorie</label>
            <select
              id="sts-cat"
              className="form-select"
              value={filter.category}
              onChange={(e) => onFilter("category", e.target.value)}
            >
              <option value="ALL">Toutes</option>
              <option value="MOBILE">Mobile</option>
              <option value="FIXE">Fixe</option>
            </select>
          </div>
          <div className="sts-field">
            <label htmlFor="sts-bill">Type d'offres</label>
            <select
              id="sts-bill"
              className="form-select"
              value={filter.billingType}
              onChange={(e) => onFilter("billingType", e.target.value)}
            >
              <option value="ALL">Toutes</option>
              <option value="PREPAID">Prépayé</option>
              <option value="POSTPAID">Postpayé</option>
              <option value="HYBRID">Hybride</option>
            </select>
          </div>
          <div className="sts-field">
            <label>Opérateurs</label>
            <MultiSelect
              value={selectedOperators}
              options={Array.isArray(operators) ? operators : []}
              onChange={(e) => setSelectedOperators(e.value || [])}
              optionLabel="name"
              placeholder="Tous les opérateurs"
              maxSelectedLabels={2}
              selectedItemsLabel="{0} opérateurs"
              itemTemplate={operatorTemplate}
              className="w-100"
              display="chip"
            />
          </div>
          <div className="sts-field sts-field--actions">
            <button
              type="button"
              className="sts-btn"
              onClick={() =>
                setFilter((f) => ({ ...f, from: monthsAgoISO(12), to: todayISO() }))
              }
            >
              12 derniers mois
            </button>
            <button
              type="button"
              className="sts-btn sts-btn--accent"
              onClick={resetFilters}
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="sts-loading">
          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
          Calcul des statistiques…
        </div>
      ) : !hasData ? (
        <div className="sts-empty">
          <i className="bi bi-bar-chart-line"></i>
          <div className="sts-empty-title">Aucune offre sur ce périmètre</div>
          <div className="sts-empty-text">
            Élargissez la période ou retirez les filtres.
          </div>
        </div>
      ) : (
        <>
          <div className="sts-kpis">
            <Kpi value={stats.total} label="Offres déclarées" color="#0f172a" />
            <Kpi
              value={stats.byStatus.PENDING}
              label={STATUS.PENDING.label}
              color={STATUS.PENDING.bg}
            />
            <Kpi
              value={stats.byStatus.ALLOW}
              label={STATUS.ALLOW.label}
              color={STATUS.ALLOW.bg}
            />
            <Kpi
              value={stats.byStatus.DINIED}
              label={STATUS.DINIED.label}
              color={STATUS.DINIED.bg}
            />
            <Kpi
              value={stats.byStatus.SUSPENDED}
              label={STATUS.SUSPENDED.label}
              color={STATUS.SUSPENDED.bg}
            />
            <Kpi
              value={stats.decisionRate}
              label="Taux de traitement"
              color="#6366f1"
              hint="% d'offres ayant reçu une décision"
            />
            <Kpi value={stats.monitorings} label="Monitorings" color="#0ea5e9" />
          </div>

          {/* Proportion base / promotionnelle : la part se lit sans avoir à
              comparer deux nombres. */}
          <OfferKindSplit stats={stats} />

          {/* ── Les quatre répartitions circulaires d'origine ────────────── */}
          <div className="sts-grid sts-grid--quarters">
            <Panel title="Statut des offres" subtitle="décision de l'ARTCI">
              <Graph type="polarArea" data={chartStatus} options={roundOptions} />
            </Panel>
            <Panel title="Répartition par zones">
              <Graph type="doughnut" data={chartZones} options={roundOptions} />
            </Panel>
            <Panel title="Répartition par type d'offre">
              <Graph type="doughnut" data={chartKind} options={roundOptions} />
            </Panel>
            <Panel title="Répartition par opérateurs">
              <Graph type="doughnut" data={chartOperators} options={roundOptions} />
            </Panel>
          </div>

          {/* ── Les quatre croisements d'origine ─────────────────────────── */}
          <div className="sts-grid">
            <Panel title="Par type d'offre et par opérateur">
              <Graph
                type="bar"
                data={chartKindByOperator}
                options={barOptions(false)}
              />
            </Panel>
            <Panel title="Par zone et par opérateur">
              <Graph
                type="bar"
                data={chartZoneByOperator}
                options={barOptions(false)}
              />
            </Panel>
            <Panel title="Par opérateur et par type d'offre">
              <Graph
                type="bar"
                data={chartOperatorByKind}
                options={barOptions(true, true)}
              />
            </Panel>
            <Panel title="Par opérateur et par catégorie">
              <Graph
                type="bar"
                data={chartOperatorByCategory}
                options={barOptions(true, true)}
              />
            </Panel>

            {/* ── L'évolution dans le temps ─────────────────────────────── */}
            <OfferTrendPanel stats={stats} from={filter.from || undefined} to={filter.to || undefined} />
          </div>

          <OperatorDetailTable stats={stats} />
        </>
      )}
    </div>
  );
}
