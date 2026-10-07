import React from "react";
import { hasCoverage, offerCoverage } from "@/services/filter/zoneFilter";

/**
 * Organisations et pays concernés par une offre internationale ou de roaming.
 *
 * L'information existait en base mais n'était affichée nulle part côté public :
 * le comparateur n'indiquait que le mot « Internationale » ou « Roaming », sans
 * jamais dire QUELS pays sont concernés   pourtant l'élément décisif pour
 * choisir une offre d'appel vers l'étranger ou de roaming.
 *
 * Deux informations, présentées en DEUX SECTIONS distinctes : les
 * ORGANISATIONS d'une part, les PAYS d'autre part. Ni compteur, ni mention
 * complémentaire, ni bouton de repli.
 *
 *  - `variant="compact"` : sur la carte de résultat (débordement géré en CSS) ;
 *  - `variant="full"`    : dans la modale de détail.
 */

/** Dédoublonne par identifiant (à défaut par nom) et trie par libellé. */
const uniqueSorted = (items) =>
  [
    ...new Map(
      items.filter(Boolean).map((item) => [item.id ?? item.name, item]),
    ).values(),
  ].sort((a, b) =>
    String(a?.name || "").localeCompare(String(b?.name || ""), "fr"),
  );

export default function OfferCoverage({ offer, variant = "compact" }) {
  // Rien à présenter pour une offre nationale ou sans détail de zone.
  if (!hasCoverage(offer)) return null;

  const coverage = offerCoverage(offer);

  // Les deux listes sont indépendantes : les pays sont regroupés toutes
  // organisations confondues, puisqu'ils forment leur propre section.
  const organizations = uniqueSorted(coverage.map((c) => c.organization));
  const countries = uniqueSorted(coverage.flatMap((c) => c.countries));

  /* ---------------------------------------------------------------- compact */
  if (variant === "compact") {
    return (
      <div className="cmp-cov cmp-cov--compact">
        {organizations.length > 0 && (
          <div className="cmp-cov__block">
            <span className="cmp-cov__label">Organisations</span>
            <span
              className="cmp-cov__values cmp-cov__values--orgs"
              title={organizations.map((o) => o.name).join(", ")}
            >
              {organizations.map((o) => o.name).join(", ")}
            </span>
          </div>
        )}
        {countries.length > 0 && (
          <div className="cmp-cov__block">
            <span className="cmp-cov__label">Pays</span>
            <span
              className="cmp-cov__values"
              title={countries.map((c) => c.name).join(", ")}
            >
              {countries.map((c) => c.name).join(", ")}
            </span>
          </div>
        )}
      </div>
    );
  }

  /* ------------------------------------------------------------------- full */
  return (
    <div className="cmp-cov cmp-cov--full">
      {organizations.length > 0 && (
        <div className="cmp-cov__section">
          <h4 className="cmp-detail__section-title">
            <i className="bi bi-diagram-3 me-2" aria-hidden="true"></i>
            Organisations concernées
          </h4>
          <div className="cmp-cov__chips">
            {organizations.map((o, i) => (
              <span className="cmp-cov__chip" key={"org" + (o.id ?? i)}>
                {o.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {countries.length > 0 && (
        <div className="cmp-cov__section">
          <h4 className="cmp-detail__section-title">
            <i className="bi bi-geo-alt me-2" aria-hidden="true"></i>
            Pays concernés
          </h4>
          <div className="cmp-cov__chips">
            {countries.map((c, i) => (
              <span className="cmp-cov__chip" key={"cty" + (c.id ?? i)}>
                {c.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
