import crypto from "crypto";
import prisma from "@/services/config/auth/prisma";
import { serverError } from "@/services/config/apiError";
import { sendMail } from "@/services/config/mailer";
import { appBaseUrl } from "@/services/config/appUrl";
import { blockedByRateLimit } from "@/services/config/auth/rateLimit";

/**
 * Lettre d'information publique.
 *
 *   POST /api/client/newsletter { email, source? }   -> inscription
 *   GET  /api/client/newsletter?token=…              -> désinscription
 *
 * L'appel à l'action existait sur le site sans aucun traitement : les adresses
 * saisies n'étaient enregistrées nulle part. Une inscription est désormais
 * conservée avec un jeton de désinscription, et un message de confirmation
 * contenant le lien de retrait est envoyé (si la messagerie est configurée).
 *
 * Réponse volontairement identique que l'adresse soit déjà inscrite ou non :
 * la page ne révèle pas qui figure dans la liste.
 */

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  /* ------------------------------------------------ Désinscription */
  if (req.method === "GET") {
    const token = String(req.query?.token || "");
    if (!token) return res.status(400).json({ error: "Lien de désinscription incomplet." });
    try {
      const existing = await prisma.newsletterSubscription.findUnique({ where: { token } });
      if (existing?.active) {
        await prisma.newsletterSubscription.update({
          where: { token },
          data: { active: false, unsubscribedAt: new Date() },
        });
      }
      return res.status(200).json({ ok: true, message: "Vous ne recevrez plus la lettre d'information." });
    } catch (error) {
      return serverError(res, error, "Newsletter (désinscription)");
    }
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST", "GET"]);
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  /* ------------------------------------------------ Inscription */
  const email = String(req.body?.email || "").trim().toLowerCase().slice(0, 160);
  const source = String(req.body?.source || "").trim().slice(0, 120) || null;

  if (!isEmail(email)) {
    return res.status(400).json({ error: "Adresse e-mail invalide." });
  }
  if (blockedByRateLimit(req, res, { preset: "password", key: email })) return undefined;

  try {
    const token = crypto.randomBytes(24).toString("hex");
    const record = await prisma.newsletterSubscription.upsert({
      where: { email },
      update: { active: true, unsubscribedAt: null, source },
      create: { email, token, source },
    });

    const link = `${appBaseUrl(req)}/api/client/newsletter?token=${record.token}`;
    await sendMail({
      to: email,
      subject: "CompareTIC  - inscription à la lettre d'information",
      text: `Votre inscription à la lettre d'information de CompareTIC est enregistrée.\n\nPour ne plus la recevoir : ${link}`,
      html: `<p>Votre inscription à la lettre d'information de <b>CompareTIC</b> est enregistrée.</p><p><a href="${link}">Se désinscrire</a></p>`,
    }).catch(() => null);

    return res.status(200).json({ ok: true });
  } catch (error) {
    return serverError(res, error, "Newsletter (inscription)");
  }
}
