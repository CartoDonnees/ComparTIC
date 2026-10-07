import Link from "next/link";
import React from "react";

/**
 * Pied de page de l'ESPACE DE GESTION.
 *
 * Reprenait le pied de page du site public : le texte de présentation du
 * comparateur destiné aux consommateurs et les liens « FAQ / Comparer les
 * offres » s'affichaient sous la file de validation. Ce pied de page est
 * désormais sobre et utile aux agents : version, rappel de confidentialité et
 * accès rapide au comparateur et à l'aide.
 */
export default function AdminFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="adf" role="contentinfo">
      <div className="adf-inner">
        <p className="adf-left">
          <strong>
            Compare<em>TIC</em>
          </strong>{" "}
          · ARTCI  - Espace de gestion des offres de communications électroniques
        </p>

        <nav className="adf-links" aria-label="Liens du pied de page">
          <Link href="/comparator" target="_blank" rel="noopener noreferrer">
            Comparateur public
          </Link>
          <Link href="/observatoire" target="_blank" rel="noopener noreferrer">
            Observatoire des tarifs
          </Link>
          <Link href="/account">Mon compte</Link>
        </nav>

        <p className="adf-right">
          Données internes  - usage strictement professionnel · © {year}
        </p>
      </div>
    </footer>
  );
}
