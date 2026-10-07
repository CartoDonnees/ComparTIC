/**
 * Route historique retirée au profit du workflow de validation.
 *
 * Ces routes permettaient de changer le statut d'une offre ou d'enregistrer un
 * monitoring sans passer par les niveaux de validation, sans commentaire
 * obligatoire et sans journal d'audit. Elles répondent désormais 410 (Gone),
 * y compris à un appel direct, et indiquent la route qui les remplace.
 */
export const retiredRoute = (replacement, message) =>
  function handler(req, res) {
    return res.status(410).json({
      error:
        message ||
        "Cette opération passe désormais par le workflow de validation des offres.",
      code: "ROUTE_RETIRED",
      replacement,
    });
  };

export default retiredRoute;
