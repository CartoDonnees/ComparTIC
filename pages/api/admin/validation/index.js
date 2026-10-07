import { retiredRoute } from "@/services/workflow/legacyRoute";

/**
 * Route retirée (workflow de validation des offres).
 * Remplacée par : POST /api/workflow/offers/:id/decide
 * L'ancienne implémentation reste consultable dans l'historique git.
 */
export default retiredRoute("POST /api/workflow/offers/:id/decide", "Les décisions de validation passent désormais par le workflow à niveaux (V1 → V4) : commentaire obligatoire, niveau contrôlé, historique conservé.");
