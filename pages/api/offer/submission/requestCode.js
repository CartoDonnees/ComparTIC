import { FKTND_H } from "@/services/tools/constants";
import { readSession, isOperatorUser } from "@/services/config/auth/session";
import { sendMail } from "@/services/config/mailer";
import {
  createSubmissionCode,
  submissionCodeEmail,
  maskEmail,
  CODE_TTL_MINUTES,
  MAX_ATTEMPTS,
  RESEND_COOLDOWN_SECONDS,
  CODE_LENGTH,
  PURPOSE_OFFER_SUBMISSION,
} from "@/services/config/submission/submissionCode";

/**
 * Étape 1 du processus : envoi du code de validation.
 *
 * L'appel se fait en même origine (`fetch("/api/offer/submission/requestCode")`)
 * afin que le cookie de session soit transmis : le destinataire de l'e-mail est
 * l'adresse enregistrée du point focal connecté, jamais une adresse fournie par
 * le client.
 *
 * La réponse ne contient évidemment pas le code   seulement de quoi renseigner
 * l'interface : adresse masquée, durée de validité, plafond de tentatives.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { verskth, reference, label } = req.body || {};

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
    return res.status(403).json({
      error:
        "Seul un point focal d'opérateur peut demander un code de soumission.",
    });
  }
  if (!user.email) {
    return res.status(400).json({
      error:
        "Aucune adresse e-mail n'est enregistrée pour votre compte. Contactez l'ARTCI.",
    });
  }
  if (!reference) {
    return res
      .status(400)
      .json({ error: "La référence de l'offre à soumettre est manquante." });
  }

  try {
    const forwarded = req.headers["x-forwarded-for"];
    const ip = Array.isArray(forwarded)
      ? forwarded[0]
      : String(forwarded || "").split(",")[0].trim() ||
        req.socket?.remoteAddress ||
        null;

    const created = await createSubmissionCode({
      userId: user.id,
      email: user.email,
      purpose: PURPOSE_OFFER_SUBMISSION,
      reference: String(reference),
      label: label ? String(label) : null,
      ip,
    });

    if (!created.ok && created.reason === "COOLDOWN") {
      return res.status(429).json({
        error: `Un code vient d'être envoyé. Patientez ${created.retryAfterSeconds} seconde(s) avant d'en demander un nouveau.`,
        reason: "COOLDOWN",
        retryAfterSeconds: created.retryAfterSeconds,
      });
    }
    if (!created.ok) {
      return res
        .status(500)
        .json({ error: "Le code de validation n'a pas pu être généré." });
    }

    const mail = submissionCodeEmail({
      firstName: user.firstName,
      code: created.plainCode,
      offerTitle: label,
      offerCode: reference,
      minutes: CODE_TTL_MINUTES,
    });

    const sent = await sendMail({
      to: user.email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });

    // En mode MAIL_DRY_RUN (tests), l'envoi est simulé : on poursuit.
    if (!sent.sent && !sent.dryRun) {
      // L'e-mail n'est pas parti : sans lui le point focal ne peut pas
      // continuer. On le dit franchement plutôt que d'afficher une modale que
      // rien ne pourra satisfaire.
      return res.status(502).json({
        error:
          "Le code n'a pas pu être envoyé par e-mail. " +
          (sent.reason || "Messagerie indisponible."),
        reason: "MAIL_FAILED",
      });
    }

    return res.status(200).json({
      success: true,
      maskedEmail: maskEmail(user.email),
      expiresAt: created.record.expiresAt,
      expiresInMinutes: CODE_TTL_MINUTES,
      maxAttempts: MAX_ATTEMPTS,
      codeLength: CODE_LENGTH,
      resendAvailableInSeconds: RESEND_COOLDOWN_SECONDS,
    });
  } catch (error) {
    console.error("requestCode :", error?.message);
    return res
      .status(500)
      .json({ error: "Erreur lors de l'envoi du code de validation." });
  }
}
