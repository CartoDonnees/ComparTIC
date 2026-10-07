import React from "react";
import AdminMonitoringPage from "@/componnents/screens/admin/admin/offer/monitoring/AdminMonitoringPage";
import { getOperatorOffers } from "@/services/api/offers/offersApiServices";
import { useClient } from "@/services/providers/ClientProvider";

/**
 * Monitoring d'une offre   espace OPÉRATEUR.
 *
 * Le module n'existait pas côté opérateur : le bouton « Monitoring » de la
 * liste appelait `setStep(2)`, mais aucun rendu n'était prévu pour cette
 * étape   l'écran restait vide.
 *
 * Plutôt que de dupliquer les ~1300 lignes du parcours (et ses 5 étapes),
 * on réutilise la page de monitoring existante en lui injectant une source
 * d'offres RESTREINTE à l'opérateur connecté : un opérateur ne doit voir et
 * rattacher que ses propres offres (le chargement admin renvoyait toutes les
 * offres de tous les opérateurs).
 */
export default function OperatorMonitoringPage({
  goTo,
  setGoTo,
  offers,
  setOffers,
  offer,
  setOffer,
  operators,
  services,
  countries,
}) {
  const { user } = useClient();
  const operatorId = user?.focalPoint?.operatorId;

  return (
    <AdminMonitoringPage
      goTo={goTo}
      setGoTo={setGoTo}
      offers={offers}
      setOffers={setOffers}
      offer={offer}
      setOffer={setOffer}
      // L'opérateur ne travaille que sur ses propres opérateurs/offres
      operators={operators}
      services={services}
      countries={countries}
      fetchOffers={() => getOperatorOffers(operatorId)}
    />
  );
}
