import React from "react";

/**
 * Indicateur de chargement des modules de l'espace d'administration.
 *
 * Affiché tant que les données ne sont pas arrivées (état `null`), pour ne
 * plus confondre « en cours de chargement » avec « aucune donnée » : les
 * listes affichaient « Aucune offre disponible » ou un tableau vide pendant
 * l'appel au serveur.
 *
 * @param label    message principal
 * @param hint     précision facultative
 * @param variant  "table" | "cards" | "chart"   forme des blocs d'attente
 * @param rows     nombre de lignes / cartes d'attente
 * @param compact  version réduite (dans un panneau)
 */
export default function DataLoader({
  label = "Chargement des données…",
  hint = "Merci de patienter quelques instants.",
  variant = "table",
  rows = 6,
  compact = false,
}) {
  return (
    <div className={`dld${compact ? " dld--compact" : ""}`} role="status" aria-live="polite" aria-busy="true">
      <div className="dld-head">
        <span className="dld-spinner" aria-hidden="true"></span>
        <div>
          <div className="dld-label">{label}</div>
          {hint && !compact && <div className="dld-hint">{hint}</div>}
        </div>
      </div>

      {variant === "table" && (
        <div className="dld-table" aria-hidden="true">
          <div className="dld-row dld-row--head">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className="dld-bone" style={{ width: `${[14, 26, 14, 18, 12][i]}%` }}></span>
            ))}
          </div>
          {Array.from({ length: rows }).map((_, r) => (
            <div key={r} className="dld-row">
              {Array.from({ length: 5 }).map((__, i) => (
                <span key={i} className="dld-bone" style={{ width: `${[12, 30, 10, 16, 20][i]}%`, animationDelay: `${r * 60}ms` }}></span>
              ))}
            </div>
          ))}
        </div>
      )}

      {variant === "cards" && (
        <div className="dld-cards" aria-hidden="true">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="dld-card" style={{ animationDelay: `${i * 60}ms` }}>
              <span className="dld-bone dld-bone--circle"></span>
              <span className="dld-bone" style={{ width: "70%" }}></span>
              <span className="dld-bone" style={{ width: "45%" }}></span>
            </div>
          ))}
        </div>
      )}

      {variant === "chart" && (
        <div className="dld-chart" aria-hidden="true">
          {Array.from({ length: rows * 2 }).map((_, i) => (
            <span key={i} className="dld-bar" style={{ height: `${30 + ((i * 37) % 60)}%`, animationDelay: `${i * 40}ms` }}></span>
          ))}
        </div>
      )}
    </div>
  );
}
