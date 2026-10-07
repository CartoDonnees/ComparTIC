import { retiredRoute } from "@/services/workflow/legacyRoute";

/**
 * Route retirée : doublon sans contrôle d'accès.
 * Remplacée par : POST /api/admin/operator
 */
export default retiredRoute("POST /api/admin/operator", "Cette route n'est plus disponible.");
