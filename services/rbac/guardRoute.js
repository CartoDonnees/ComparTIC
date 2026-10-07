import { requireActor } from "@/services/config/auth/session";
import { ROLES } from "@/services/rbac/roles";
import { stripValidationCircuit } from "@/services/workflow/operatorView";

/**
 * Enveloppe d'autorisation pour les routes d'API existantes.
 *
 *   export default guardRoute(handler, {
 *     methods: { POST: PERMISSIONS.OFFER_READ, DELETE: PERMISSIONS.REFERENTIAL_MANAGE },
 *     focalPoint: "operator",   // ou "deny"
 *   });
 *
 * - `methods` : permission exigée par méthode HTTP. Une méthode absente de la
 *   table reste publique (lectures de référentiel utilisées par le comparateur).
 * - `focalPoint` :
 *     "operator" → pour un point focal, les filtres d'opérateur du corps
 *                  (`operatorId`, `operatorIds`) sont REMPLACÉS par son
 *                  opérateur : il ne peut pas lire les offres d'un concurrent,
 *                  quoi qu'envoie le navigateur ;
 *     "deny"     → la route est refusée au point focal (données tous opérateurs).
 *
 * Pour un point focal, les réponses JSON sont en outre débarrassées du niveau
 * de validation des offres (`stripValidationCircuit`).
 *
 * L'acteur authentifié est exposé dans `req.actor`.
 */
export const guardRoute = (handler, { methods = {}, focalPoint = null } = {}) =>
  async function guarded(req, res) {
    const permission = methods[req.method];
    if (!permission) return handler(req, res);

    const actor = await requireActor(req, res, permission);
    if (!actor) return undefined;
    req.actor = actor;

    // Opérateur : le niveau de validation d'une offre est interne à l'ARTCI. Il
    // est retiré de toute réponse JSON, quelle que soit la route.
    if (actor.role === ROLES.FOCAL_POINT) {
      const json = res.json.bind(res);
      res.json = (body) => json(stripValidationCircuit(body));
    }

    if (actor.role === ROLES.FOCAL_POINT && focalPoint) {
      if (focalPoint === "deny") {
        return res.status(403).json({
          error: "Ces données couvrent tous les opérateurs : elles ne sont pas accessibles à un point focal.",
          code: "OPERATOR_SCOPE",
        });
      }
      if (!actor.operatorId) {
        return res.status(403).json({ error: "Votre compte n'est rattaché à aucun opérateur.", code: "NO_OPERATOR" });
      }
      req.body = {
        ...(req.body || {}),
        operatorId: Number(actor.operatorId),
        operatorIds: [Number(actor.operatorId)],
      };
    }
    return handler(req, res);
  };

export default guardRoute;
