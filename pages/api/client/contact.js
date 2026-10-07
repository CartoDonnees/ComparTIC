import prisma from "@/services/config/auth/prisma";
import { serverError } from "@/services/config/apiError";
import { sendMail } from "@/services/config/mailer";
import { notify, NOTIFICATION_TYPES, getSupervisionUserIds } from "@/services/config/notifications";
import { blockedByRateLimit } from "@/services/config/auth/rateLimit";

/**
 * Formulaire de contact public.
 *
 *   POST /api/client/contact { name, email, subject?, message, website? }
 *
 * Le formulaire existait à l'écran mais n'était relié à rien : aucun message
 * n'arrivait jamais à l'ARTCI. Chaque envoi crée désormais une notification
 * interne pour l'administration et un e-mail (si la messagerie est
 * configurée), avec l'adresse de l'expéditeur en réponse.
 *
 * Protections : limitation par adresse IP (5 messages / quart d'heure), champ
 * piège pour les robots (`website`), longueurs bornées, et aucun contenu
 * n'est interprété comme du HTML.
 */

const MAX = { name: 120, email: 160, subject: 160, message: 4000 };

const clean = (value, max) => String(value ?? "").trim().slice(0, max);
const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
const escapeHtml = (text) =>
  String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  // Robot : le champ « website » est invisible pour un humain.
  if (clean(req.body?.website, 50)) {
    return res.status(200).json({ ok: true });
  }

  const name = clean(req.body?.name, MAX.name);
  const email = clean(req.body?.email, MAX.email).toLowerCase();
  const subject = clean(req.body?.subject, MAX.subject) || "Message depuis le site CompareTIC";
  const message = clean(req.body?.message, MAX.message);

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Nom, adresse e-mail et message sont obligatoires." });
  }
  if (!isEmail(email)) {
    return res.status(400).json({ error: "Adresse e-mail invalide." });
  }
  if (message.length < 10) {
    return res.status(400).json({ error: "Votre message est trop court." });
  }

  if (blockedByRateLimit(req, res, { preset: "password", key: email })) return undefined;

  try {
    const recipients = await getSupervisionUserIds();
    const content = `De : ${name} (${email})\n\n${message}`;

    await notify({
      userIds: recipients,
      type: NOTIFICATION_TYPES.ADMIN_MESSAGE,
      title: `Message du public : ${subject}`,
      content,
      from: name,
    });

    // E-mail aux adresses de l'administration (silencieux si non configuré).
    const admins = await prisma.user.findMany({
      where: { status: "ENABLE", profile: { code: { in: ["PRF0-TEST", "PRF-SUPERADMIN"] } } },
      select: { email: true },
    });
    const to = admins.map((a) => a.email).filter(Boolean);
    if (to.length) {
      await sendMail({
        to,
        subject: `[CompareTIC] ${subject}`,
        text: content,
        html: `<p><b>${escapeHtml(name)}</b> &lt;${escapeHtml(email)}&gt; a écrit :</p><p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`,
      }).catch(() => null);
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    return serverError(res, error, "Formulaire de contact");
  }
}
