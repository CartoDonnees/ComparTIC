import React from "react";

const PROMO_LABELS = {
  FLASH: "Flash",
  PERIOD: "Périodique",
  SPECIAL: "Spéciale",
  CUSTOMIZE: "Personnalisée",
};

/**
 * Type d'une offre : offre de base ou offre promotionnelle (avec son type et
 * sa durée). Le type détermine le circuit : V1 → V4 pour une offre de base,
 * V1 → V3 pour une promotion.
 */
export default function OfferTypeBadge({ offer, showCircuit = false }) {
  if (!offer) return null;
  const promo = offer.specialPromotion;

  if (!promo) {
    return (
      <span className="wf-type">
        <span className="wf-badge wf-tone-neutral">
          <small>
          <i className="bi bi-box me-1" aria-hidden="true"></i>
          Offre de base
          </small>
        </span>
        {showCircuit && <span className="wf-badge-level">Circuit V1 → V4</span>}
      </span>
    );
  }

  const type = PROMO_LABELS[promo.type] || promo.type;
  const duration = Number(promo.duration);
  return (
    <span className="wf-type">
      <span className="wf-badge wf-tone-promo" title="Offre promotionnelle" style={{fontSize:9}}>
        <i className="bi bi-lightning-charge" aria-hidden="true"></i>
        Promotion{type ? ` · ${type}` : ""}
      </span>
      {(duration > 0 || showCircuit) && (
        <span className="wf-badge-level">
          {duration > 0 ? `${duration} jour${duration > 1 ? "s" : ""}` : ""}
          {duration > 0 && showCircuit ? " · " : ""}
          {showCircuit ? "Circuit V1 → V3" : ""}
        </span>
      )}
    </span>
  );
}
