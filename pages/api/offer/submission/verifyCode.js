import { FKTND_H } from "@/services/tools/constants";
import { readSession, isOperatorUser } from "@/services/config/auth/session";
import {
  verifySubmissionCode,
  PURPOSE_OFFER_SUBMISSION,
} from "@/services/config/submission/submissionCode";

/** Message rendu au point focal pour chaque motif de refus. */
const MESSAGES = {
  INVALID_FORMAT: "Le code attendu comporte 6 chiffres.",
  NO_CODE:
    "Aucun code n'a été demandé pour cette offre. Utilisez « Renvoyer le code ».",
  EXPIRED:
    "Ce code a expiré. Demandez un nouveau code pour poursuivre la soumission.",
  ALREADY_USED:
    "Ce code a déjà été validé. Demandez un nouveau code si la soumission n'a pas abouti.",
  TOO_MANY_ATTEMPTS:
    "Nombre de tentatives dépassé. Demandez un nouveau code pour réessayer.",
  INVALID: "Code incorrect.",
};

/**
 * Étape 2 : vérification du code saisi.
 *
 * Une validation réussie ne soumet rien par elle-même : elle délivre un jeton à
 * usage unique, seul habilité à autoriser l'enregistrement de l'offre. L'offre
 * ne peut donc pas être créée sans passage par ici.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { verskth, reference, code } = req.body || {};

  if (verskth != FKTND_H) {
    return res.status(405).json({ error: "Requête non autorisée" });
  }

  const { user, unavailable } = await readSession(req);
  if (unavailable) {
    return res.status(503).json({ error: "Service momentanément indisponible. Réessayez dans quelques instants.", code: "SERVICE_UNAVAILABLE" });
  }
  if (!user) {
    return res.status(401).json({
      error: "Session expirée. Reconnectez-vous pour soumettre l'offre.",
    });
  }
  if (!isOperatorUser(user) || !user.focalPoint) {
    return res
      .status(403)
      .json({ error: "Seul un point focal d'opérateur peut valider un code." });
  }
  if (!reference) {
    return res
      .status(400)
      .json({ error: "La référence de l'offre à soumettre est manquante." });
  }

  try {
    const result = await verifySubmissionCode({
      userId: user.id,
      purpose: PURPOSE_OFFER_SUBMISSION,
      reference: String(reference),
      input: code,
    });

    if (result.ok) {
      return res.status(200).json({
        success: true,
        ticket: result.ticket,
        ticketExpiresAt: result.ticketExpiresAt,
      });
    }

    let message = MESSAGES[result.reason] || "Code incorrect.";
    if (result.reason === "INVALID" && result.remainingAttempts != null) {
      message += ` Il vous reste ${result.remainingAttempts} tentative(s).`;
    }

    return res.status(400).json({
      success: false,
      reason: result.reason,
      remainingAttempts: result.remainingAttempts,
      // `mustRenew` indique à l'interface de proposer directement un renvoi.
      mustRenew: ["EXPIRED", "TOO_MANY_ATTEMPTS", "NO_CODE", "ALREADY_USED"].includes(
        result.reason,
      ),
      error: message,
    });
  } catch (error) {
    console.error("verifyCode :", error?.message);
    return res
      .status(500)
      .json({ error: "Erreur lors de la vérification du code." });
  }
}
