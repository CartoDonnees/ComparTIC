import { retiredRoute } from "@/services/workflow/legacyRoute";

/**
 * Route retirée (workflow de validation des offres).
 * Remplacée par : POST /api/workflow/offers/:id/monitor
 * L'ancienne implémentation reste consultable dans l'historique git.
 */
export default retiredRoute("POST /api/workflow/offers/:id/monitor", "Le monitoring crée désormais une nouvelle version de l'offre via le workflow.");
