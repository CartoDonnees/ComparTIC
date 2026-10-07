import { retiredRoute } from "@/services/workflow/legacyRoute";

/**
 * Route retirée : doublon sans contrôle d'accès.
 * Remplacée par : POST /api/admin/offer/saveAccessMode
 */
export default retiredRoute("POST /api/admin/offer/saveAccessMode", "Cette route n'est plus disponible.");
