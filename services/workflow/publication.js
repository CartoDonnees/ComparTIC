/**
 * Publication des offres sur le comparateur public   règle UNIQUE.
 *
 * Une offre est publiée si elle représente la dernière version VALIDÉE
 * DÉFINITIVEMENT de sa lignée :
 *  - elle est VALIDÉE ;
 *  - ou elle a été désactivée par un MONITORING et aucune version suivante
 *    n'a encore été validée définitivement.
 *
 * Le second cas évite qu'une offre validée disparaisse du comparateur dès
 * qu'un monitoring est lancé : l'ancienne version reste affichée tant que la
 * nouvelle parcourt le circuit (et si celle-ci est refusée), puis lui cède la
 * place au moment de sa validation définitive. Une désactivation manuelle,
 * elle, retire l'offre immédiatement.
 *
 * Module sans dépendance serveur : partagé par l'API et l'interface.
 */

export const SENTINEL_OFFER_CODE = "OF-000000000000000";

/** Filtre Prisma des offres publiées (à placer sous `where` ou `offer`). */
export const publishedOfferWhere = () => ({
  code: { not: SENTINEL_OFFER_CODE },
  OR: [
    { workflowStatus: "VALIDATED" },
    {
      workflowStatus: "DEACTIVATED",
      deactivationReason: "MONITORING",
      versions: { none: { validatedAt: { not: null } } },
    },
  ],
});

/**
 * Même règle en mémoire. `offer.versions` doit contenir les versions suivantes
 * directes avec leur `validatedAt`.
 */
export const isPublishedOffer = (offer) => {
  if (!offer || offer.code === SENTINEL_OFFER_CODE) return false;
  if (offer.workflowStatus === "VALIDATED") return true;
  return (
    offer.workflowStatus === "DEACTIVATED" &&
    offer.deactivationReason === "MONITORING" &&
    !(offer.versions || []).some((v) => v?.validatedAt)
  );
};

export default publishedOfferWhere;
