import React, { useState } from "react";
import OperatorOfferViewDialog from "./OperatorOfferViewDialog";
import { getOperatorOffers } from "@/services/api/offers/offersApiServices";

/**
 * Bouton « Voir les détails » d'une offre, côté opérateur : ouvre la fiche
 * détaillée (formules, tarifs, zones, modes d'accès).
 *
 * La fiche attend l'offre complète. Elle est lue à la demande dans la liste
 * des offres de l'opérateur, gardée en mémoire le temps de la visite pour ne
 * pas la relire à chaque clic. Le serveur ne rend que les offres de
 * l'opérateur du point focal, quel que soit l'identifiant envoyé.
 *
 * @param offerId    offre à afficher (version actuelle ou ancienne version)
 * @param label      texte du bouton
 * @param className  classes du bouton
 * @param onError    appelé avec un message si le détail est introuvable
 */

let cache = null; // { at, offers }
const CACHE_MS = 60 * 1000;

const loadOffers = async ({ fresh = false } = {}) => {
  if (!fresh && cache && Date.now() - cache.at < CACHE_MS) return cache.offers;
  const offers = (await getOperatorOffers(0)) || [];
  cache = { at: Date.now(), offers };
  return offers;
};

export default function OperatorOfferDetailsButton({ offerId, label = "Voir les détails", className = "evo-btn", onError }) {
  const [offer, setOffer] = useState(null);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  const open = async () => {
    setBusy(true);
    try {
      let found = (await loadOffers()).find((o) => o.id === offerId);
      // Offre déclarée ou modifiée depuis la dernière lecture : une relecture.
      if (!found) found = (await loadOffers({ fresh: true })).find((o) => o.id === offerId);
      if (!found) {
        onError?.("Le détail de cette offre n'a pas pu être chargé.");
        return;
      }
      setOffer(found);
      setVisible(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button type="button" className={className} onClick={open} disabled={busy}>
        {busy ? <span className="spinner-border spinner-border-sm" aria-hidden="true"></span> : <i className="bi bi-eye" aria-hidden="true"></i>} {label}
      </button>
      {offer && <OperatorOfferViewDialog visible={visible} setVisible={setVisible} offer={offer} />}
    </>
  );
}
