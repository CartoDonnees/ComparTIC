import { guardRoute } from "@/services/rbac/guardRoute";
import { PERMISSIONS } from "@/services/rbac/permissions";
import { FKTND_H } from "@/services/tools/constants";
import { getMailConfig, sendMail, verifyMailer } from "@/services/config/mailer";

/**
 * Diagnostic de la messagerie.
 *
 * POST /api/admin/mail/test  { verskth, to? }
 *
 * - sans `to` : vérifie seulement la connexion au serveur SMTP ;
 * - avec `to` : envoie un e-mail de test à cette adresse.
 *
 * Permet de valider la configuration sans créer d'utilisateur ni statuer sur
 * une offre, et de savoir précisément ce qui bloque.
 */
async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { verskth, to } = req.body || {};
  if (verskth != FKTND_H) {
    return res.status(405).json({ message: "Requête non autorisée" });
  }

  const config = getMailConfig();
  if (!config) {
    return res.status(200).json({
      configured: false,
      message:
        "Aucune messagerie configurée. Renseignez dans le fichier .env : " +
        "GMAIL_EMAIL / GMAIL_PASSWORD (configuration retenue ; GMAIL_PASSWORD " +
        "doit être un mot de passe d'application Google, pas celui du compte), " +
        "ou SMTP_HOST / SMTP_USER / SMTP_PASSWORD, ou OUTLOOK_EMAIL / OUTLOOK_PASSWORD.",
    });
  }

  const summary = {
    configured: true,
    mode: config.mode,
    host: config.transport.host,
    port: config.transport.port,
    from: config.from,
  };

  const check = await verifyMailer();
  if (!check.ok) {
    return res.status(200).json({ ...summary, connection: check });
  }

  if (!to) {
    return res.status(200).json({ ...summary, connection: { ok: true } });
  }

  const sent = await sendMail({
    to,
    subject: "[CompareTIC] Test de configuration de la messagerie",
    html:
      "<p>Cet e-mail confirme que la messagerie de la plateforme CompareTIC " +
      "est correctement configurée.</p>",
  });

  return res.status(200).json({ ...summary, connection: { ok: true }, sent });
}

// Autorisation vérifiée côté serveur (session + permission).
export default guardRoute(handler, { methods: { POST: PERMISSIONS.NOTIFICATION_MANAGE } });
