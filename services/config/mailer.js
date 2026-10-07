import nodemailer from "nodemailer";

/**
 * Couche d'envoi d'e-mails centralisée.
 *
 * La configuration était dupliquée dans quatre routes API, toutes figées sur
 * `service: "Outlook"`. Impossible, dès lors, de basculer vers un autre
 * serveur SMTP (celui de l'ARTCI, un compte de secours, un relais interne...)
 * sans modifier le code.
 *
 * Deux modes de configuration, par ordre de priorité :
 *
 *  1. SMTP explicite (recommandé, fonctionne avec n'importe quel serveur) :
 *       SMTP_HOST=smtp.artci.ci
 *       SMTP_PORT=587
 *       SMTP_SECURE=false          # true si port 465
 *       SMTP_USER=...
 *       SMTP_PASSWORD=...
 *       SMTP_FROM="COMPARTIC ARTCI <no-reply@artci.ci>"   (optionnel)
 *
 *  2. Gmail (configuration retenue pour COMPARTIC) :
 *       GMAIL_EMAIL=compte@gmail.com
 *       GMAIL_PASSWORD=xxxx xxxx xxxx xxxx   # mot de passe D'APPLICATION
 *
 *     Gmail refuse le mot de passe habituel du compte : il faut un mot de
 *     passe d'application (16 caractères), généré depuis
 *     https://myaccount.google.com/apppasswords, la validation en deux étapes
 *     étant activée au préalable. Les espaces de présentation sont retirés
 *     automatiquement ci-dessous.
 *
 *  3. Repli historique Outlook / Microsoft 365 :
 *       OUTLOOK_EMAIL=...
 *       OUTLOOK_PASSWORD=...
 *
 * Aucun envoi ne doit jamais interrompre une opération métier : toutes les
 * fonctions renvoient un statut au lieu de lever une exception.
 */

/** Retourne la configuration active, ou null si la messagerie n'est pas configurée. */
export const getMailConfig = () => {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASSWORD,
    SMTP_FROM,
    GMAIL_EMAIL,
    GMAIL_PASSWORD,
    OUTLOOK_EMAIL,
    OUTLOOK_PASSWORD,
  } = process.env;

  // 1. SMTP explicite
  if (SMTP_HOST && SMTP_USER && SMTP_PASSWORD) {
    const port = Number(SMTP_PORT) || 587;
    return {
      mode: "smtp",
      from: SMTP_FROM || `"COMPARTIC ARTCI" <${SMTP_USER}>`,
      transport: {
        host: SMTP_HOST,
        port,
        // `secure: true` uniquement pour le port 465 (SMTPS)
        secure: SMTP_SECURE ? SMTP_SECURE === "true" : port === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
      },
    };
  }

  // 2. Gmail
  if (GMAIL_EMAIL && GMAIL_PASSWORD) {
    return {
      mode: "gmail",
      from: `"COMPARTIC ARTCI" <${GMAIL_EMAIL}>`,
      transport: {
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
          user: GMAIL_EMAIL,
          // Google affiche les mots de passe d'application par groupes de 4
          // ("abcd efgh ijkl mnop") : les espaces recopiés depuis l'interface
          // provoquent sinon un rejet EAUTH.
          pass: GMAIL_PASSWORD.replace(/\s+/g, ""),
        },
      },
    };
  }

  // 3. Repli Outlook / Microsoft 365
  if (OUTLOOK_EMAIL && OUTLOOK_PASSWORD) {
    return {
      mode: "outlook",
      from: `"COMPARTIC ARTCI" <${OUTLOOK_EMAIL}>`,
      transport: {
        host: "smtp-mail.outlook.com",
        port: 587,
        secure: false,
        requireTLS: true,
        auth: { user: OUTLOOK_EMAIL, pass: OUTLOOK_PASSWORD },
      },
    };
  }

  return null;
};

/**
 * Le serveur a-t-il refusé l'adresse du destinataire ? (boîte inexistante,
 * adresse mal formée, domaine inconnu : codes 5.1.x, 550/551/553 à l'étape RCPT.)
 */
const isRecipientRejection = (error) => {
  const raw = `${error?.response || ""} ${error?.message || ""}`;
  if (error?.code === "EENVELOPE") return true;
  if (/\b5\.1\.\d\b/.test(raw)) return true;
  if (error?.command === "RCPT TO" && Number(error?.responseCode) >= 500) return true;
  return [551, 553].includes(Number(error?.responseCode));
};

/**
 * Nature de l'échec, pour que l'appelant choisisse son message :
 * RECIPIENT_REJECTED | AUTH | UNREACHABLE | UNKNOWN.
 */
export const mailFailureCode = (error) => {
  if (isRecipientRejection(error)) return "RECIPIENT_REJECTED";
  if (error?.code === "EAUTH" || /Invalid login|password has expired|authentication is disabled|password required|not accepted/i.test(error?.message || "")) return "AUTH";
  if (["ECONNECTION", "ETIMEDOUT", "ESOCKET", "EDNS", "ECONNREFUSED", "ENOTFOUND"].includes(error?.code)) return "UNREACHABLE";
  return "UNKNOWN";
};

/** Traduit les erreurs SMTP courantes en message compréhensible. */
const explain = (error) => {
  const raw = error?.message || "";
  if (isRecipientRejection(error)) {
    return "Le serveur de messagerie a refusé l'adresse du destinataire (adresse inexistante ou invalide).";
  }
  if (/password has expired/i.test(raw)) {
    return "Le mot de passe de la boîte d'envoi a expiré. Renouvelez-le puis mettez à jour la configuration.";
  }
  if (/basic authentication is disabled|SmtpClientAuthentication is disabled/i.test(raw)) {
    return "L'authentification SMTP simple est désactivée sur ce compte. Activez SMTP AUTH ou utilisez un serveur SMTP dédié.";
  }
  if (/Application-specific password required/i.test(raw)) {
    return "Gmail exige un mot de passe d'application : générez-en un sur https://myaccount.google.com/apppasswords (validation en deux étapes activée) et placez-le dans GMAIL_PASSWORD.";
  }
  if (/Username and Password not accepted/i.test(raw)) {
    return "Gmail a refusé le couple GMAIL_EMAIL / GMAIL_PASSWORD. Vérifiez que GMAIL_PASSWORD est bien un mot de passe d'application (16 caractères) et non le mot de passe du compte.";
  }
  if (error?.code === "EAUTH" || /Invalid login/i.test(raw)) {
    return "Identifiants de messagerie refusés par le serveur.";
  }
  if (["ECONNECTION", "ETIMEDOUT", "ESOCKET", "EDNS", "ECONNREFUSED", "ENOTFOUND"].includes(error?.code)) {
    return "Serveur de messagerie injoignable (hôte, port ou réseau).";
  }
  return raw || "Erreur inconnue lors de l'envoi de l'e-mail.";
};

/**
 * Envoie un e-mail. N'échoue jamais : retourne toujours un statut.
 *
 * `attachments` : pièces jointes nodemailer (ex. logo intégré par `cid`).
 * En cas d'échec, `code` donne sa nature (NOT_CONFIGURED, NO_RECIPIENT,
 * RECIPIENT_REJECTED, AUTH, UNREACHABLE, UNKNOWN). `rejected` liste les adresses
 * refusées par le serveur, y compris quand le message est parti aux autres.
 *
 * @returns {Promise<{sent:boolean, reason?:string, code?:string, rejected?:string[], mode?:string}>}
 */
export const sendMail = async ({ to, subject, html, text, from, attachments }) => {
  // Mode « à blanc » : aucun e-mail ne part, l'envoi est seulement journalisé.
  // Indispensable pour les tests et le développement, afin de ne jamais écrire
  // à de vraies adresses. Activé par MAIL_DRY_RUN=true.
  if (process.env.MAIL_DRY_RUN === "true") {
    const list = Array.isArray(to) ? to.filter(Boolean) : to ? [to] : [];
    console.log(`[MAIL_DRY_RUN] ${subject} -> ${list.join(", ")}`);
    // Hors production, le texte est aussi journalisé (ex. code de soumission
    // d'un compte de test dont l'adresse n'est pas délivrable).
    if (process.env.NODE_ENV !== "production" && text) {
      console.log(`[MAIL_DRY_RUN:text] ${String(text).replace(/\s+/g, " ").slice(0, 600)}`);
    }
    return { sent: false, dryRun: true, recipients: list };
  }

  const config = getMailConfig();

  if (!config) {
    return {
      sent: false,
      code: "NOT_CONFIGURED",
      reason:
        "Messagerie non configurée (SMTP_HOST/SMTP_USER/SMTP_PASSWORD ou OUTLOOK_EMAIL/OUTLOOK_PASSWORD).",
    };
  }

  const recipients = Array.isArray(to) ? to.filter(Boolean) : to ? [to] : [];
  if (recipients.length === 0) {
    return { sent: false, code: "NO_RECIPIENT", reason: "Aucun destinataire.", mode: config.mode };
  }

  try {
    const transporter = nodemailer.createTransport(config.transport);
    const info = await transporter.sendMail({
      from: from || config.from,
      to: recipients.join(","),
      subject,
      html,
      text,
      ...(attachments?.length ? { attachments } : {}),
    });
    // Envoi partiel : le message est parti, mais le serveur a refusé certaines
    // adresses (si toutes sont refusées, nodemailer lève EENVELOPE).
    const rejected = (info?.rejected || []).map((entry) => String(entry?.address || entry));
    if (rejected.length) return { sent: true, rejected, mode: config.mode };
    return { sent: true, mode: config.mode };
  } catch (error) {
    return {
      sent: false,
      code: mailFailureCode(error),
      rejected: (error?.rejected || []).map((entry) => String(entry?.address || entry)),
      reason: explain(error),
      mode: config.mode,
    };
  }
};

/** Vérifie la connexion au serveur (diagnostic). */
export const verifyMailer = async () => {
  const config = getMailConfig();
  if (!config) return { ok: false, reason: "Messagerie non configurée." };
  try {
    await nodemailer.createTransport(config.transport).verify();
    return { ok: true, mode: config.mode };
  } catch (error) {
    return { ok: false, mode: config.mode, reason: explain(error) };
  }
};

export default sendMail;
