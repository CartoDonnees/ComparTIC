import React, { useEffect, useState } from "react";

/**
 * Panneau de statistiques des pages de gestion (utilisateurs, opérateurs,
 * organisations).
 *
 * Remplace l'ancien bloc « STATISTIQUES » (alerte bleue, cartes de simples
 * nombres, repli fermé par défaut) par :
 *  - des cartes indicateurs : valeur, part du total (barre), précision ;
 *  - des répartitions en barre segmentée avec légende chiffrée ;
 *  - un repli dont l'état est mémorisé par page.
 *
 * Composant de présentation : les chiffres sont calculés par la page.
 *
 * @param storageKey  clé de mémorisation du repli (ex. "stats-users")
 * @param title       titre du panneau
 * @param subtitle    phrase de contexte (facultative)
 * @param loading     vrai tant que les données ne sont pas chargées
 * @param kpis        [{ key, label, value, icon, tone, total?, hint? }]
 * @param breakdowns  [{ key, title, icon?, items: [{ key, label, value, tone? }], empty? }]
 * @param lists       [{ key, title, icon?, items: [{ key, label, value, image? }], empty? }]
 */
const TONES = ["green", "blue", "orange", "violet", "teal", "red", "slate", "amber", "pink"];

const readOpen = (key) => {
  try {
    const v = localStorage.getItem(`compartic:${key}`);
    return v === null ? true : v === "1";
  } catch {
    return true;
  }
};

const pct = (value, total) => (total > 0 ? Math.round((value / total) * 100) : 0);
const fmt = (n) => new Intl.NumberFormat("fr-FR").format(Number(n) || 0);

export default function EntityStatsPanel({
  storageKey,
  title = "Statistiques",
  subtitle,
  loading = false,
  kpis = [],
  breakdowns = [],
  lists = [],
}) {
  // Ouvert par défaut ; l'état mémorisé n'est lu qu'après le montage (le rendu
  // serveur ne connaît pas le stockage du navigateur).
  const [open, setOpen] = useState(true);
  useEffect(() => {
    if (storageKey) setOpen(readOpen(storageKey));
  }, [storageKey]);

  const toggle = () => {
    setOpen((o) => {
      const next = !o;
      try {
        if (storageKey) localStorage.setItem(`compartic:${storageKey}`, next ? "1" : "0");
      } catch {
        /* stockage indisponible : l'état reste en mémoire */
      }
      return next;
    });
  };

  const bodyId = `esp-body-${storageKey || "stats"}`;

  return (
    <section className="esp" aria-label={title}>
      <header className="esp-head">
        <div className="esp-head-text">
          <h2 className="esp-title">
            <i className="bi bi-bar-chart-line" aria-hidden="true"></i>
            {title}
          </h2>
          {subtitle && <p className="esp-sub">{subtitle}</p>}
        </div>
        <button
          type="button"
          className="esp-toggle"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={bodyId}
        >
          {open ? "Masquer" : "Afficher"}
          <i className={`bi bi-chevron-${open ? "up" : "down"}`} aria-hidden="true"></i>
        </button>
      </header>

      {open && (
        <div id={bodyId} className="esp-body">
          {/* ---- Indicateurs ------------------------------------------------ */}
          <div className="esp-kpis">
            {kpis.map((k, i) => {
              const tone = k.tone || TONES[i % TONES.length];
              const share = k.total !== undefined ? pct(k.value, k.total) : null;
              return (
                <article key={k.key} className={`esp-kpi esp-tone-${tone}`}>
                  <div className="esp-kpi-top">
                    <span className="esp-kpi-ico" aria-hidden="true">
                      <i className={`bi ${k.icon || "bi-dot"}`}></i>
                    </span>
                    <span className="esp-kpi-label">{k.label}</span>
                  </div>
                  {loading ? (
                    <span className="esp-skeleton esp-skeleton-value" aria-hidden="true"></span>
                  ) : (
                    <div className="esp-kpi-value">{fmt(k.value)}</div>
                  )}
                  {share !== null && !loading && (
                    <>
                      <div
                        className="esp-meter"
                        role="progressbar"
                        aria-valuenow={share}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${k.label} : ${share} % du total`}
                      >
                        <span style={{ width: `${share}%` }}></span>
                      </div>
                      <div className="esp-kpi-hint">{share} % du total{k.hint ? ` · ${k.hint}` : ""}</div>
                    </>
                  )}
                  {share === null && k.hint && !loading && <div className="esp-kpi-hint">{k.hint}</div>}
                </article>
              );
            })}
          </div>

          {/* ---- Répartitions ----------------------------------------------- */}
          {(breakdowns.length > 0 || lists.length > 0) && (
            <div className="esp-panels">
              {breakdowns.map((b) => {
                const items = (b.items || []).filter((it) => it.value > 0);
                const total = items.reduce((s, it) => s + it.value, 0);
                return (
                  <div key={b.key} className="esp-panel">
                    <h3 className="esp-panel-title">
                      {b.icon && <i className={`bi ${b.icon}`} aria-hidden="true"></i>}
                      {b.title}
                      {!loading && <span className="esp-panel-count">{fmt(total)}</span>}
                    </h3>
                    {loading ? (
                      <span className="esp-skeleton esp-skeleton-bar" aria-hidden="true"></span>
                    ) : total === 0 ? (
                      <p className="esp-empty">{b.empty || "Aucune donnée."}</p>
                    ) : (
                      <>
                        <div className="esp-stack" role="img" aria-label={`${b.title} : ${items.map((it) => `${it.label} ${it.value}`).join(", ")}`}>
                          {items.map((it, i) => (
                            <span
                              key={it.key}
                              className={`esp-seg esp-tone-${it.tone || TONES[i % TONES.length]}`}
                              style={{ width: `${(it.value / total) * 100}%` }}
                              title={`${it.label} : ${it.value} (${pct(it.value, total)} %)`}
                            ></span>
                          ))}
                        </div>
                        <ul className="esp-legend">
                          {items.map((it, i) => (
                            <li key={it.key} className={`esp-tone-${it.tone || TONES[i % TONES.length]}`}>
                              <span className="esp-dot" aria-hidden="true"></span>
                              <span className="esp-legend-label">{it.label}</span>
                              <b>{fmt(it.value)}</b>
                              <span className="esp-legend-pct">{pct(it.value, total)} %</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                );
              })}

              {lists.map((l) => {
                const items = l.items || [];
                const max = Math.max(1, ...items.map((it) => it.value || 0));
                return (
                  <div key={l.key} className="esp-panel">
                    <h3 className="esp-panel-title">
                      {l.icon && <i className={`bi ${l.icon}`} aria-hidden="true"></i>}
                      {l.title}
                    </h3>
                    {loading ? (
                      <span className="esp-skeleton esp-skeleton-bar" aria-hidden="true"></span>
                    ) : items.length === 0 ? (
                      <p className="esp-empty">{l.empty || "Aucune donnée."}</p>
                    ) : (
                      <ul className="esp-rank">
                        {items.map((it) => (
                          <li key={it.key}>
                            <span className="esp-rank-label">
                              {it.image && <img src={it.image} alt="" loading="lazy" />}
                              {it.label}
                            </span>
                            <span className="esp-rank-bar" aria-hidden="true">
                              <span style={{ width: `${((it.value || 0) / max) * 100}%` }}></span>
                            </span>
                            <b>{fmt(it.value)}</b>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
