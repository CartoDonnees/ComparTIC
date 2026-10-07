import { readSession } from "@/services/config/auth/session";
import { answerPreflight } from "@/services/config/preflight";

/**
 * Compte associé au jeton fourni (application mobile).
 *
 *   GET /api/public/auth/me   (en-tête Authorization: Bearer <jeton>)
 *
 * Permet à l'application de savoir, au lancement, si la session mémorisée est
 * encore valide  - sans exposer d'autres données que celles du compte.
 */
export default async function handler(req, res) {
  if (answerPreflight(req, res)) return;
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  const { user, unavailable } = await readSession(req);
  if (unavailable) {
    return res.status(503).json({ error: "Service momentanément indisponible.", code: "SERVICE_UNAVAILABLE" });
  }
  if (!user) {
    return res.status(401).json({ error: "Session expirée. Reconnectez-vous.", code: "UNAUTHENTICATED" });
  }

  return res.status(200).json({
    user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
  });
}
