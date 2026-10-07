import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Chart } from "primereact/chart";
import ClientMainContainerPage from "../ClientMainContainerPage";
import DataLoader from "@/componnents/Loader/DataLoader";
import { exportToCsv, exportToExcel } from "@/services/tools/exportData";
import { handleNumThousand } from "@/services/tools/convertions";

/**
 * Observatoire tarifaire public.
 *
 * Évolution du prix médian par opérateur et par service, reconstituée à
 * partir des offres déjà validées et de leurs versions successives : aucune
 * donnée nouvelle n'est collectée, et la page reste lisible sans connexion.
 */

const SERVICE_LABELS = { DATA: "Internet", VOIX: "Appels", SMS: "SMS" };
const PERIODS = [
  { value: 12, label: "12 mois" },
  { value: 24, label: "24 mois" },
  { value: 36, label: "36 mois" },
];

const monthLabel = (key) => {
  const [y, m] = String(key).split("-");
  const noms = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  return `${noms[Number(m) - 1] || m} ${String(y).slice(2)}`;
};

const trendOf = (points) => {
  const values = points.filter((p) => p.medianUnit !== null);
  if (values.length < 2) return null;
  const first = values[0].medianUnit;
  const last = values[values.length - 1].medianUnit;
  if (!first) return null;
  return Math.round(((last - first) / first) * 100);
};

export default function ClientObservatoryPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [months, setMonths] = useState(24);
  // Période personnalisée (AAAA-MM-JJ) : prend le pas sur les raccourcis.
  const [range, setRange] = useState({ from: "", to: "" });
  const rangeActive = !!(range.from || range.to);
  const rangeInvalid = !!(range.from && range.to && range.from > range.to);
  const [service, setService] = useState("DATA");
  const [hidden, setHidden] = useState([]); // opérateurs masqués
  const abortRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;
    // Intervalle incohérent : rien n'est demandé, le message s'affiche sous les dates.
    if (rangeInvalid) return () => controller.abort();
    setData(null);
    setError(null);
    const params = new URLSearchParams({ months: String(months) });
    if (range.from) params.set("from", range.from);
    if (range.to) params.set("to", range.to);
    fetch(`/api/client/statistics/priceObservatory?${params}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("indisponible"))))
      .then(setData)
      .catch((e) => {
        if (e.name !== "AbortError") setError("Les données de l'observatoire ne sont pas disponibles pour le moment.");
      });
    return () => controller.abort();
  }, [months, range.from, range.to, rangeInvalid]);

  const operators = useMemo(
    () => (data?.operators || []).filter((o) => !hidden.includes(o.id)),
    [data, hidden],
  );

  const chart = useMemo(() => {
    if (!data) return null;
    const points = data.series?.[service] || {};
    return {
      labels: data.months.map(monthLabel),
      datasets: operators
        .filter((op) => points[op.id])
        .map((op) => ({
          label: op.name,
          data: points[op.id].map((p) => p.medianUnit),
          borderColor: op.color || "#0f766e",
          backgroundColor: `${op.color || "#0f766e"}22`,
          tension: 0.35,
          spanGaps: true,
          pointRadius: 3,
          borderWidth: 2,
        })),
    };
  }, [data, service, operators]);

  const chartOptions = useMemo(
    () => ({
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        // Légende masquée : les pastilles au-dessus du graphique jouent ce
        // rôle et permettent d'afficher ou de masquer un opérateur.
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) =>
              `${ctx.dataset.label} : ${ctx.parsed.y === null ? " -" : handleNumThousand(ctx.parsed.y)} ${data?.unitLabels?.[service] || ""}`,
          },
        },
      },
      scales: {
        y: { beginAtZero: false, ticks: { callback: (v) => handleNumThousand(v) } },
        x: { grid: { display: false } },
      },
    }),
    [data, service],
  );

  // Nombre de mois réellement renseignés : en dessous de deux, une courbe
  // n'a pas de sens (cas d'une plateforme récemment mise en service).
  const pointsCount = useMemo(() => {
    if (!data) return 0;
    const points = data.series?.[service] || {};
    const mois = new Set();
    Object.values(points).forEach((serie) =>
      serie.forEach((p) => {
        if (p.medianUnit !== null) mois.add(p.month);
      }),
    );
    return mois.size;
  }, [data, service]);

  const rows = useMemo(() => {
    if (!data) return [];
    const points = data.series?.[service] || {};
    return (data.operators || [])
      .filter((op) => points[op.id])
      .map((op) => {
        const serie = points[op.id];
        const last = [...serie].reverse().find((p) => p.medianUnit !== null);
        const values = serie.filter((p) => p.medianUnit !== null).map((p) => p.medianUnit);
        return {
          operateur: op.name,
          dernierPrix: last?.medianUnit ?? null,
          mois: last?.month ?? "",
          minimum: values.length ? Math.min(...values) : null,
          maximum: values.length ? Math.max(...values) : null,
          offres: serie.reduce((sum, p) => sum + p.offers, 0),
          evolution: trendOf(serie),
        };
      });
  }, [data, service]);

  const exportColumns = [
    { field: "operateur", header: "Opérateur" },
    { field: "dernierPrix", header: `Dernier prix médian (${data?.unitLabels?.[service] || ""})` },
    { field: "mois", header: "Mois de référence" },
    { field: "minimum", header: "Minimum de la période" },
    { field: "maximum", header: "Maximum de la période" },
    { field: "offres", header: "Offres observées" },
    { field: "evolution", header: "Évolution (%)" },
  ];

  const toggleOperator = (id) => setHidden((h) => (h.includes(id) ? h.filter((x) => x !== id) : [...h, id]));

  return (
    <ClientMainContainerPage activeHeader="observatoire">
      <div className="container">
        <header className="obs-hero">
          <div>
            <p className="obs-kicker">ARTCI - Indices tarifaires</p>
            <h1>Évolution des prix moyens constatés</h1>
            <p className="obs-lead">
              Prix moyen constaté par opérateur et par service, à partir des offres validées par l'ARTCI et de leurs
              versions successives. Les tarifs sont ramenés à une unité comparable ( la minute, le SMS, le Go).
            </p>
          </div>
          <Link href="/comparator" className="obs-cta">
            <i className="bi bi-radar me-2" aria-hidden="true"></i> Comparer les offres du moment
          </Link>
        </header>

        <div className="obs-toolbar">
          <div className="obs-seg" role="tablist" aria-label="Service">
            {["DATA", "VOIX", "SMS"].map((s) => (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={service === s}
                className={service === s ? "is-active" : ""}
                onClick={() => setService(s)}
              >
                {SERVICE_LABELS[s]}
              </button>
            ))}
          </div>
          <div className="obs-seg" role="tablist" aria-label="Période">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                type="button"
                role="tab"
                aria-selected={!rangeActive && months === p.value}
                className={!rangeActive && months === p.value ? "is-active" : ""}
                onClick={() => {
                  setRange({ from: "", to: "" });
                  setMonths(p.value);
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className={`obs-range${rangeActive ? " is-active" : ""}`} role="group" aria-label="Période personnalisée">
            <label htmlFor="obs-from">
              <span>Du</span>
              <input
                id="obs-from"
                type="date"
                value={range.from}
                max={range.to || undefined}
                onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
                aria-invalid={rangeInvalid}
              />
            </label>
            <label htmlFor="obs-to">
              <span>au</span>
              <input
                id="obs-to"
                type="date"
                value={range.to}
                min={range.from || undefined}
                onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
                aria-invalid={rangeInvalid}
              />
            </label>
            {rangeActive && (
              <button type="button" className="obs-range-reset" onClick={() => setRange({ from: "", to: "" })} title="Revenir aux raccourcis de période">
                <i className="bi bi-arrow-counterclockwise" aria-hidden="true"></i> Réinitialiser
              </button>
            )}
          </div>
          <div className="obs-actions">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              disabled={!rows.length}
              onClick={() => exportToCsv({ rows, columns: exportColumns, fileName: `observatoire_${service.toLowerCase()}` })}
            >
              <i className="bi bi-filetype-csv me-1" aria-hidden="true"></i> CSV
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              disabled={!rows.length}
              onClick={() =>
                exportToExcel({ rows, columns: exportColumns, fileName: `observatoire_${service.toLowerCase()}`, sheetName: "Observatoire" })
              }
            >
              <i className="bi bi-file-earmark-spreadsheet me-1" aria-hidden="true"></i> Excel
            </button>
          </div>
        </div>

        {rangeInvalid && (
          <div className="obs-error" role="alert">
            <i className="bi bi-calendar-x me-2" aria-hidden="true"></i>
            La date de début ne peut pas être postérieure à la date de fin.
          </div>
        )}
        {rangeActive && !rangeInvalid && data?.months?.length > 0 && (
          <p className="obs-range-note">
            Période affichée : de {monthLabel(data.months[0])} à {monthLabel(data.months[data.months.length - 1])} ({data.months.length} mois).
          </p>
        )}

        {error && (
          <div className="obs-error" role="alert">
            <i className="bi bi-exclamation-triangle me-2" aria-hidden="true"></i>
            {error}
          </div>
        )}

        {!data && !error && <DataLoader label="Calcul de l'observatoire…" variant="chart" rows={6} />}

        {data && (
          <>
            <div className="obs-cards">
              {rows.map((r) => (
                <article key={r.operateur} className="obs-card">
                  <h3>{r.operateur}</h3>
                  <div className="obs-price">
                    {r.dernierPrix === null ? " -" : handleNumThousand(r.dernierPrix)}
                    <small> {data.unitLabels?.[service]}</small>
                  </div>
                  <div className="obs-card-meta">
                    <span>{r.offres} offre(s) observée(s)</span>
                    {r.evolution !== null && (
                      <span className={r.evolution <= 0 ? "obs-down" : "obs-up"}>
                        <i className={`bi ${r.evolution <= 0 ? "bi-arrow-down-right" : "bi-arrow-up-right"}`} aria-hidden="true"></i>
                        {Math.abs(r.evolution)} % sur la période
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>

            <section className="obs-panel">
              <header>
                <h2>Prix médian du {SERVICE_LABELS[service].toLowerCase()} ({data.unitLabels?.[service]})</h2>
                <div className="obs-legend">
                  {(data.operators || []).map((op) => (
                    <button
                      key={op.id}
                      type="button"
                      className={`obs-chip${hidden.includes(op.id) ? " is-off" : ""}`}
                      onClick={() => toggleOperator(op.id)}
                      aria-pressed={!hidden.includes(op.id)}
                    >
                      <span style={{ background: op.color || "#0f766e" }} aria-hidden="true"></span>
                      {op.name}
                    </button>
                  ))}
                </div>
              </header>
              <div className="obs-chart">
                {chart?.datasets?.length && pointsCount > 1 ? (
                  <Chart type="line" data={chart} options={chartOptions} style={{ height: "100%" }} />
                ) : chart?.datasets?.length ? (
                  <p className="obs-empty">
                    Un seul mois de données disponible pour ce service : la courbe d'évolution apparaîtra dès qu'une
                    deuxième période aura été validée. Les prix du mois en cours restent affichés ci-dessus.
                  </p>
                ) : (
                  <p className="obs-empty">Aucune donnée pour ce service sur la période choisie.</p>
                )}
              </div>
            </section>

            <section className="obs-panel">
              <header>
                <h2>Détail par opérateur</h2>
              </header>
              <div className="obs-table-wrap">
                <table className="obs-table">
                  <thead>
                    <tr>
                      <th>Opérateur</th>
                      <th>Dernier prix médian</th>
                      <th>Mois</th>
                      <th>Minimum</th>
                      <th>Maximum</th>
                      <th>Offres</th>
                      <th>Évolution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.operateur}>
                        <td>{r.operateur}</td>
                        <td>
                          <b>{r.dernierPrix === null ? " -" : handleNumThousand(r.dernierPrix)}</b>
                        </td>
                        <td>{r.mois ? monthLabel(r.mois) : " -"}</td>
                        <td>{r.minimum === null ? " -" : handleNumThousand(r.minimum)}</td>
                        <td>{r.maximum === null ? " -" : handleNumThousand(r.maximum)}</td>
                        <td>{r.offres}</td>
                        <td className={r.evolution === null ? "" : r.evolution <= 0 ? "obs-down" : "obs-up"}>
                          {r.evolution === null ? " -" : `${r.evolution > 0 ? "+" : ""}${r.evolution} %`}
                        </td>
                      </tr>
                    ))}
                    {!rows.length && (
                      <tr>
                        <td colSpan={7} className="obs-empty">
                          Aucune donnée pour ce service.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <p className="obs-note">
              Source : offres validées par l'ARTCI ({data.totals?.offers} offres, {data.totals?.formulas} formules
              analysées). Prix médian par unité, calculé à partir du tarif de chaque formule réparti entre les services
              qu'elle contient. Dernière actualisation :{" "}
              {new Date(data.generatedAt).toLocaleString("fr-FR")}.
            </p>
          </>
        )}
      </div>
    </ClientMainContainerPage>
  );
}
