import { getSessionUser, isSessionLookupFailure } from "@/services/config/auth/session";
import { clearedSessionCookie } from "@/services/config/auth/sessionCookie";

/**
 * Vérifie la session du navigateur.
 *
 * Contrôlait seulement la signature du jeton : après une réinitialisation de la
 * base, une session périmée restait « valide », les pages s'ouvraient, mais
 * toutes les API refusaient et aucune offre ne se chargeait. Le compte est
 * désormais rechargé en base.
 *
 * Le cookie n'est effacé QUE lorsque la session est réellement invalide
 * (jeton illisible, expiré, compte supprimé ou désactivé). En cas d'incident
 * technique (base injoignable), la réponse est un 503 et la session est
 * conservée : une coupure de quelques secondes déconnectait sinon tout le
 * monde.
 */
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  let actor = null;
  try {
    actor = await getSessionUser(req);
  } catch (error) {
    if (isSessionLookupFailure(error)) {
      return res.status(503).json({
        error: "Service momentanément indisponible. Votre session est conservée.",
        code: "SERVICE_UNAVAILABLE",
      });
    }
    throw error;
  }

  if (!actor) {
    res.setHeader("Set-Cookie", clearedSessionCookie(req));
    return res.status(401).json({ error: "Session expirée. Reconnectez-vous.", code: "UNAUTHENTICATED" });
  }

  return res.status(200).json({
    message: "Session valide",
    user: { userId: actor.id, profile: actor.profile },
  });
}
