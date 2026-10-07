import prisma from "@/services/config/auth/prisma";
import { FKTND_H } from "@/services/tools/constants";
import { notify, NOTIFICATION_TYPES } from "@/services/config/notifications";

/**
 * Confirmation d'une adresse e-mail (activation du compte).
 *
 * Corrections apportées :
 *
 *  1. RÉPONSES MANQUANTES   deux branches (jeton invalide, statut inattendu ou
 *     utilisateur introuvable) ne renvoyaient RIEN : la requête restait
 *     suspendue jusqu'au délai d'expiration, sans message pour l'utilisateur.
 *
 *  2. NOTIFICATION INVALIDE   la création utilisait `user: { connect }` alors
 *     que la relation du modèle est `to` (plusieurs destinataires), et le champ
 *     `status` y était écrit `satus`. Prisma levait donc une erreur APRÈS
 *     l'activation : le compte était bien activé, mais l'utilisateur recevait
 *     une 500. On passe par la couche de notification partagée, qui n'échoue
 *     jamais.
 *
 *  3. CODES INCOHÉRENTS   un compte déjà actif renvoyait `400` avec
 *     `success: true`. C'est désormais un `200` explicite.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { verskth, email, token } = req.body || {};

  if (verskth != FKTND_H) {
    return res.status(405).json({ message: "Requête non autorisée" });
  }
  if (!email || !token) {
    return res
      .status(400)
      .json({ success: false, error: "Lien de confirmation incomplet." });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: String(email).trim().toLowerCase() },
      select: { id: true, email: true, status: true, confirmToken: true, firstName: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Aucun compte ne correspond à cette adresse e-mail.",
      });
    }

    if (user.status === "ENABLE") {
      return res.status(200).json({
        success: true,
        alreadyConfirmed: true,
        message: "Ce compte est déjà activé. Vous pouvez vous connecter.",
      });
    }

    if (!user.confirmToken || user.confirmToken !== token) {
      return res.status(400).json({
        success: false,
        error:
          "Ce lien de confirmation n'est plus valide. Demandez un nouvel envoi.",
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { status: "ENABLE", confirmToken: null },
    });

    // Non bloquant : une notification perdue ne doit pas faire échouer
    // l'activation, qui est déjà enregistrée.
    await notify({
      userIds: [user.id],
      type: NOTIFICATION_TYPES.ACCOUNT_CONFIRMED,
      title: "Compte activé",
      content: `Bonjour ${user.firstName || ""}, votre compte est activé. Vous pouvez désormais vous connecter.`,
      link: "/admin-auth",
    });

    return res
      .status(200)
      .json({ success: true, message: "Votre compte est activé." });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, error: "Erreur lors de la confirmation du compte." });
  }
}
