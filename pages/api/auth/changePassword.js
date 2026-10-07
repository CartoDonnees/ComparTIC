import prisma from "@/services/config/auth/prisma";
import { FKTND_H, JWT_TOKEN } from "@/services/tools/constants";
import { hashPassword, verifyPassword } from "@/services/config/auth/hash";
import { isValidPassword } from "@/services/config/auth/userValidation";
import { verifyToken } from "@/services/config/auth/jwt";

/**
 * Changement de mot de passe par l'utilisateur connecté.
 *
 * Utilisée notamment par l'écran de changement OBLIGATOIRE présenté aux
 * opérateurs dont le compte utilise encore le mot de passe provisoire
 * (`passwordChangedAt` à NULL).
 *
 * L'identité n'est jamais lue dans le corps de la requête : elle provient du
 * jeton JWT signé, déposé en cookie httpOnly à la connexion. Un utilisateur ne
 * peut donc modifier que SON propre mot de passe.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { verskth, currentPassword, newPassword, confirmPassword } =
    req.body || {};

  if (verskth != FKTND_H) {
    return res.status(405).json({ error: "Requête non autorisée" });
  }

  // Identité issue du cookie signé, jamais du corps de la requête.
  const decoded = verifyToken(req.cookies?.[JWT_TOKEN]);
  if (!decoded?.userId) {
    return res.status(401).json({ error: "Session expirée. Reconnectez-vous." });
  }

  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ error: "Le mot de passe actuel et le nouveau sont requis." });
  }

  if (confirmPassword !== undefined && newPassword !== confirmPassword) {
    return res
      .status(400)
      .json({ error: "Les deux nouveaux mots de passe ne correspondent pas." });
  }

  if (!isValidPassword(newPassword)) {
    return res.status(400).json({
      error:
        "Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial (@ $ ! % * ? &).",
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(decoded.userId) },
      select: { id: true, password: true },
    });

    if (!user) {
      return res.status(404).json({ error: "Utilisateur introuvable." });
    }

    const isValid = await verifyPassword(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Mot de passe actuel incorrect." });
    }

    // Un mot de passe identique au provisoire ne remplit pas l'objectif.
    const isSame = await verifyPassword(newPassword, user.password);
    if (isSame) {
      return res.status(400).json({
        error: "Le nouveau mot de passe doit être différent de l'actuel.",
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: await hashPassword(newPassword),
        // Renseigner cette date lève l'obligation de changement.
        passwordChangedAt: new Date(),
      },
    });

    return res
      .status(200)
      .json({ success: true, message: "Mot de passe modifié avec succès." });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Erreur lors du changement de mot de passe." });
  }
}
