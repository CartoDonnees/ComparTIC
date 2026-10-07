import React, { useEffect, useState } from "react";

/**
 * Attente de chargement d'une page  - identité CompareTIC / ARTCI.
 *
 * Remplace l'attente générique (roue `react-spinners` sur fond blanc) par un
 * écran aux couleurs de la plateforme : logo, ondes de propagation évoquant le
 * réseau, barre de progression indéterminée vert → orange et message
 * explicite. Sans dépendance externe (SVG et CSS), donc rien à télécharger
 * avant de pouvoir afficher l'attente.
 *
 * Les anciens loaders (MainLoader, DefaultLoader, CircleLoader, DataLoader)
 * restent disponibles : celui-ci ne les remplace que pour le chargement des
 * pages.
 *
 * @param title    message principal
 * @param hint     précision facultative (affichée après 2,5 s d'attente)
 * @param variant  "overlay" (plein écran, changement de page) | "inline"
 * @param brand    afficher le nom CompareTIC sous le logo
 */
export default function PageLoader({
  title = "Chargement de la page…",
  hint = "Merci de patienter quelques instants.",
  variant = "overlay",
  brand = true,
}) {
  // Message d'attente prolongée : évite de laisser croire à un blocage.
  const [longWait, setLongWait] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setLongWait(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`cpl cpl--${variant}`} role="status" aria-live="polite" aria-busy="true">
      <div className="cpl-box">
        <div className="cpl-mark" aria-hidden="true">
          <span className="cpl-wave"></span>
          <span className="cpl-wave"></span>
          <span className="cpl-wave"></span>
          <svg viewBox="0 0 48 48" className="cpl-logo" focusable="false">
            {/* Antenne stylisée : arcs de propagation + pylône */}
            <path d="M16.5 15.5a10.5 10.5 0 0 0 0 17" className="cpl-arc cpl-arc--l1" />
            <path d="M11.5 10.5a17.5 17.5 0 0 0 0 27" className="cpl-arc cpl-arc--l2" />
            <path d="M31.5 15.5a10.5 10.5 0 0 1 0 17" className="cpl-arc cpl-arc--r1" />
            <path d="M36.5 10.5a17.5 17.5 0 0 1 0 27" className="cpl-arc cpl-arc--r2" />
            <circle cx="24" cy="24" r="4" className="cpl-core" />
            <path d="M24 28.5 20.5 40h7L24 28.5Z" className="cpl-mast" />
          </svg>
        </div>

        {brand && (
          <p className="cpl-brand">
            Compare<span>TIC</span>
          </p>
        )}

        <p className="cpl-title">{title}</p>

        <div className="cpl-bar" aria-hidden="true">
          <span></span>
        </div>

        <p className={`cpl-hint${longWait ? " is-visible" : ""}`}>{longWait ? hint : " "}</p>
      </div>
    </div>
  );
}
