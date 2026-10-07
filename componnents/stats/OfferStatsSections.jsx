import React, { useState } from "react";
import { Chart } from "primereact/chart";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { BASE_IMG_URL, imageUrl } from "@/services/tools/constants";
import { STATUS } from "@/services/tools/offerStatus";

/**
 * Sections de statistiques partagées entre la page `/admin-statistics` et
 * l'onglet « Généralités » du tableau de bord.
 *
 * Elles reçoivent le résultat de l'agrégation `aggregateOfferStats`
 * (services/tools/statistics.js), servi par `/api/admin/statistics/generalStatisticsDetailed`.
 */

export const STATS_PALETTE = {
  base: "#b105fb",
  promo: "#ff0303",
  decided: "#000000",
};

const pct = (value, total) => (total > 0 ? Math.round((value / total) * 100) : 0);

/** Panneau titré. */
export const StatsPanel = ({ title, subtitle, children, wide, actions }) => (
  <section className={`sts-panel${wide ? " sts-panel--wide" : ""}`}>
    <header className="sts-panel-head">
      <span className="sts-panel-head-text">
        <span className="lato-black text-dark"><em>{title}</em></span>
        {subtitle && <span className="sts-panel-sub">{subtitle}</span>}
      </span>
      {actions}
    </header>
    <div className="sts-panel-body">{children}</div>
  </section>
);

/** Un graphique, ou un message quand la série est vide. */
export const StatsGraph = ({ data, type, options, wide }) =>
  data ? (
    <div className={`sts-chart${wide ? " sts-chart--wide" : ""}`}>
      <Chart type={type} data={data} options={options} plugins={[ChartDataLabels]} />
    </div>
  ) : (
    <div className="sts-nodata">Aucune donnée sur ce périmètre.</div>
  );

/* ------------------------------------------------------------------------ */
/* 1. Proportion offres de base / promotionnelles                            */
/* ------------------------------------------------------------------------ */

export const OfferKindSplit = ({ stats }) => {
  if (!stats) return null;
  const base = stats.byKind?.BASE?.total ?? 0;
  const promo = stats.byKind?.PROMO?.total ?? 0;
  const total = stats.total ?? base + promo;
  return (
    <div className="sts-split">
      <div className="sts-split-head">
        <span>
          Offres de base <b>{base}</b> <small>({pct(base, total)} %)</small>
        </span>
        <span>
          Promotionnelles <b>{promo}</b> <small>({pct(promo, total)} %)</small>
        </span>
      </div>
      <div
        className="sts-split-bar"
        role="img"
        aria-label={`${base} offre(s) de base et ${promo} offre(s) promotionnelle(s)`}
      >
        <div
          className="sts-split-part"
          style={{ width: `${total > 0 ? (base / total) * 100 : 0}%`, background: STATS_PALETTE.base }}
          title={`${base} offre(s) de base`}
        ></div>
        <div
          className="sts-split-part"
          style={{ width: `${total > 0 ? (promo / total) * 100 : 0}%`, background: STATS_PALETTE.promo }}
          title={`${promo} offre(s) promotionnelle(s)`}
        ></div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------------ */
/* 2. Évolution mensuelle par type et catégorie                              */
/* ------------------------------------------------------------------------ */

export const trendChartOptions = {
  maintainAspectRatio: false,
  responsive: true,
  // plugins: {
  // },
  // scales: {
  //   x: { grid: { display: false } },
  //   y: { beginAtZero: true, ticks: { precision: 0 } },
  // },

    // maintainAspectRatio: false,
    aspectRatio: 1,
    plugins: {
      legend: {
        position: "top",
        labels: {
          labels: { boxWidth: 10, boxHeight: 10, padding: 12, font: { size: 11 } }
        },
        font: {
          family: "Lato", // Appliquer "Lato" avec poids Black
          weight: 900, // Poids 900 pour "Lato Black"
          size: 14, // Taille de la police de la légende
        },
      },
    // legend: { position: "bottom", labels: { boxWidth: 10, boxHeight: 10, padding: 12, font: { size: 11 } } },
    datalabels: { display: false },
    },
    scales: {
      x: {
        // ticks: {
        //   color: textColorSecondary,
        // },
        grid: { display: false },
        // grid: {
        //   color: surfaceBorder,
        // },
      },
      y: {
        ticks: { precision: 0 } ,
        // grid: {
        //   color: surfaceBorder,
        // },
        beginAtZero: true,
      }
    }
};

/* Choix de la maille : semaine, mois ou année ---------------------------- */

export const GRANULARITY_OPTIONS = [
  { value: "week", label: "Semaine", unit: "par semaine (lundi)" },
  { value: "month", label: "Mois", unit: "par mois" },
  { value: "year", label: "Année", unit: "par année" },
];

/** Maille par défaut adaptée à la longueur de la période. */
export const defaultGranularity = (from, to) => {
  const a = new Date(from);
  const b = to ? new Date(to) : new Date();
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return "month";
  const days = (b - a) / 86400000;
  if (days <= 120) return "week";
  if (days <= 365 * 3) return "month";
  return "year";
};

export const GranularitySwitch = ({ value, onChange }) => (
  <div className="sts-granularity" role="radiogroup" aria-label="Afficher l'évolution par">
    {GRANULARITY_OPTIONS.map((o) => (
      <button
        key={o.value}
        type="button"
        role="radio"
        aria-checked={value === o.value}
        className={value === o.value ? "is-active" : ""}
        onClick={() => onChange(o.value)}
      >
        {o.label}
      </button>
    ))}
  </div>
);

export const buildTrendChart = (stats, granularity = "month") => {
  const m = stats?.timelines?.[granularity] ?? (granularity === "month" ? stats?.monthly : null);
  if (!m?.length) return null;
  return {
    labels: m.map((x) => x.label),
    datasets: [
      { type: "bar", label: "Offres de base", backgroundColor: "rgba(177, 5, 251, 0.56)", data: m.map((x) => x.base) },
      { type: "bar", label: "Offres promotionnelles", backgroundColor: "rgba(255, 3, 3,.55)", data: m.map((x) => x.promo) },
      { type: "line", label: "Offres mobiles", borderColor: "#01717E", backgroundColor: "#53EAFD", data: m.map((x) => x.mobile), borderWidth: 2, tension: 0.4 },
      { type: "line", label: "Offres fixes", borderColor: "#BA30D5", backgroundColor: "#F4A8FF", data: m.map((x) => x.fixe), borderWidth: 2, tension: 0.4 },
      {
        type: "line",
        label: "Décisions rendues",
        borderColor: STATS_PALETTE.decided,
        backgroundColor: "rgba(229, 132, 5, 0.12)",
        data: m.map((x) => x.decided),
        borderWidth: 5,
        tension: 0.4,
        borderDash: [5, 5],
      },
    ],
  };
};

/**
 * Évolution des offres, par semaine, mois ou année, sur la période filtrée.
 * La maille est choisie par l'utilisateur (par défaut : selon la longueur de
 * la période) ; le changement est immédiat, les trois découpages étant
 * calculés par le serveur.
 */
export const OfferTrendPanel = ({ stats, from, to, subtitle = "sur la période retenue" }) => {
  const [chosen, setChosen] = useState(null);
  const granularity = chosen || defaultGranularity(from || stats?.timelines?.month?.[0]?.start, to);
  const unit = GRANULARITY_OPTIONS.find((o) => o.value === granularity)?.unit;
  return (
    <StatsPanel
      title="Évolution des offres par type et catégories"
      subtitle={`${unit}, ${subtitle}`}
      actions={<GranularitySwitch value={granularity} onChange={setChosen} />}
      wide
    >
      <StatsGraph type="bar" data={buildTrendChart(stats, granularity)} options={trendChartOptions} wide />
    </StatsPanel>
  );
};

/* ------------------------------------------------------------------------ */
/* 3. Détail par opérateur                                                   */
/* ------------------------------------------------------------------------ */

export const OperatorDetailTable = ({ stats }) => {
  const ops = stats?.byOperator ?? [];
  const total = stats?.total ?? 0;
  return (
    <section className="card bg-white sts-panel sts-panel--wide">
      {/* <header className="sts-panel-head">
        <span className="sts-panel-title">Détail par opérateur</span>
      </header> */}
      <div className="sts-table-wrap">
        {ops.length === 0 ? (
          <div className="sts-nodata">Aucune donnée sur ce périmètre.</div>
        ) : (
          <table className="sts-table">
            <thead>
              <tr>
                <th>Opérateur</th>
                <th className="num">Total</th>
                <th className="num">Base</th>
                <th className="num">Promo</th>
                <th className="num">{STATUS.PENDING.label}</th>
                <th className="num">{STATUS.ALLOW.label}</th>
                <th className="num">{STATUS.DINIED.label}</th>
                <th className="num">{STATUS.SUSPENDED.label}</th>
                <th className="num">Part</th>
              </tr>
            </thead>
            <tbody>
              {ops.map((op) => {
                const share = pct(op.total, total);
                return (
                  <tr key={`op-${op.id}`}>
                    <td>
                      <div className="sts-oper">
                        {op.imagePath ? <img alt={op.name} src={imageUrl(op.imagePath)} /> : null}
                        <span>{op.name}</span>
                      </div>
                    </td>
                    <td className="num">
                      <b>{op.total}</b>
                    </td>
                    <td className="num">{op.BASE}</td>
                    <td className="num">{op.PROMO}</td>
                    <td className="num">{op.PENDING}</td>
                    <td className="num">{op.ALLOW}</td>
                    <td className="num">{op.DINIED}</td>
                    <td className="num">{op.SUSPENDED}</td>
                    <td className="num">
                      <div className="sts-share">
                        <div className="sts-share-fill" style={{ width: `${share}%`, background: op.color || "#03832e" }}></div>
                        <span>{share}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
};
