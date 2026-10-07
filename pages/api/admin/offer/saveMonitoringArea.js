import { retiredRoute } from "@/services/workflow/legacyRoute";

/**
 * Route retirée (workflow de validation des offres).
 * Remplacée par : POST /api/admin/offer/saveArea (sur la nouvelle version)
 * L'ancienne implémentation reste consultable dans l'historique git.
 */
export default retiredRoute("POST /api/admin/offer/saveArea (sur la nouvelle version)");
