import { hashPassword } from "@/services/config/auth/hash";
import prisma from "@/services/config/auth/prisma";
import { isValidEmail, isValidPassword } from "@/services/config/auth/userValidation";
import { FKTND_H } from "@/services/tools/constants";
import { appBaseUrl } from "@/services/config/appUrl";
import { sendMail } from "@/services/config/mailer";
import { serverError } from "@/services/config/apiError";
import { notify, NOTIFICATION_TYPES } from "@/services/config/notifications";

/**
 * Création d'un compte GRAND PUBLIC (site et application mobile).
 *
 * BUGFIX : la création écrivait des champs qui n'existent plus dans le modèle
 * (`first_name`, `last_name`, `role`) et le compte n'était jamais rattaché au
 * profil « client ». Prisma levait donc une erreur, avalée par un `catch`
 * vide : la requête n'obtenait AUCUNE réponse et restait en attente jusqu'au
 * délai du navigateur. Personne ne pouvait s'inscrire.
 *
 * Désormais : champs corrects, profil client, statut PENDING jusqu'à la
 * confirmation par e-mail (`/api/auth/confirmEmail` passe ensuite à ENABLE),
 * notification de bienvenue, et une réponse dans tous les cas.
 */

const CLIENT_PROFILE_CODE = "PRF3-TEST";

const randomToken = (length = 24) =>
  [...Array(length)].map(() => Math.random().toString(36)[2] || "0").join("");

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  const { verskth, first_name, last_name, email, password, acceptNotif } = req.body || {};
  if (verskth != FKTND_H) {
    return res.status(405).json({ message: "Requête non autorisée" });
  }

  const firstName = String(first_name || "").trim().slice(0, 80);
  const lastName = String(last_name || "").trim().slice(0, 80);
  const mail = String(email || "").trim().toLowerCase().slice(0, 160);

  if (!lastName || !mail || !password) {
    return res.status(400).json({ error: "Tous les champs sont requis." });
  }
  if (!isValidEmail(mail)) {
    return res.status(400).json({ error: "Email non valide." });
  }
  if (!isValidPassword(password)) {
    return res.status(400).json({
      error:
        "Le mot de passe doit contenir au moins 8 caractères, une lettre majuscule, un chiffre et un caractère spécial.",
    });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email: mail }, select: { id: true } });
    if (existingUser) {
      return res.status(400).json({ error: "Cet email est déjà utilisé." });
    }

    const profile = await prisma.profile.findUnique({
      where: { code: CLIENT_PROFILE_CODE },
      select: { id: true },
    });
    if (!profile) {
      return res.status(503).json({
        error: "Les inscriptions ne sont pas disponibles pour le moment.",
        code: "PROFILE_MISSING",
      });
    }

    const token = randomToken();
    const user = await prisma.user.create({
      data: {
        code: "USR-" + Date.now().toString(36).toUpperCase(),
        firstName: firstName || lastName,
        lastName,
        email: mail,
        password: await hashPassword(password),
        // Le compte reste inactif jusqu'à la confirmation de l'adresse.
        status: "PENDING",
        confirmToken: token,
        confirmNotif: Boolean(acceptNotif),
        profile: { connect: { id: profile.id } },
      },
      select: { id: true, firstName: true, email: true },
    });

    const confirmationUrl = `${appBaseUrl(req)}/confirm-email?email=${encodeURIComponent(mail)}&token=${token}`;

    // L'envoi ne doit jamais faire échouer l'inscription : le compte existe.
    const sent = await sendMail({
      to: mail,
      subject: "CompareTIC  - confirmez votre inscription",
      text: `Bienvenue sur CompareTIC. Confirmez votre inscription : ${confirmationUrl}`,
      html: `<h1>Bienvenue ${firstName || lastName}</h1>
             <p>Merci de votre inscription sur <b>CompareTIC</b>, la plateforme de comparaison des offres de communications électroniques de l'ARTCI.</p>
             <p><a href="${confirmationUrl}">Confirmer mon compte</a></p>`,
    }).catch(() => ({ sent: false, reason: "Envoi impossible." }));

    await notify({
      userIds: [user.id],
      type: NOTIFICATION_TYPES.ACCOUNT_CREATED,
      title: "Bienvenue sur CompareTIC",
      content:
        "Votre compte est créé. Confirmez votre adresse e-mail pour l'activer, puis comparez les offres des opérateurs.",
    });

    return res.status(200).json({
      success: true,
      mailSent: Boolean(sent?.sent),
      message: sent?.sent
        ? "Compte créé. Consultez votre messagerie pour confirmer votre adresse."
        : `Compte créé, mais l'e-mail de confirmation n'a pas pu être envoyé. ${sent?.reason || ""}`.trim(),
    });
  } catch (error) {
    return serverError(res, error, "Inscription");
  }
}
