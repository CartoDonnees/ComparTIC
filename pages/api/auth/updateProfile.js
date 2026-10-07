import prisma from "@/services/config/auth/prisma";
import { FKTND_H, JWT_TOKEN } from "@/services/tools/constants";
import { isValidEmail } from "@/services/config/auth/userValidation";
import { verifyToken } from "@/services/config/auth/jwt";

/**
 * Mise à jour par l'utilisateur de ses propres informations de profil.
 *
 * La route existante `PUT /api/client/user/[id]` accepte l'identifiant dans
 * l'URL sans vérifier que l'appelant est bien cette personne : n'importe quel
 * compte pouvait modifier la fiche d'un autre. Ici l'identité provient
 * exclusivement du jeton signé déposé en cookie httpOnly.
 *
 * Le profil, l'opérateur de rattachement et le matricule ne sont PAS
 * modifiables : ils relèvent de l'administrateur.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { verskth, firstName, lastName, email, phone, description, imagePath } =
    req.body || {};

  if (verskth != FKTND_H) {
    return res.status(405).json({ error: "Requête non autorisée" });
  }

  const decoded = verifyToken(req.cookies?.[JWT_TOKEN]);
  if (!decoded?.userId) {
    return res.status(401).json({ error: "Session expirée. Reconnectez-vous." });
  }

  if (!firstName || !String(firstName).trim()) {
    return res.status(400).json({ error: "Le prénom est requis." });
  }
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: "Adresse e-mail non valide." });
  }

  const cleanEmail = String(email).trim().toLowerCase();

  try {
    // L'e-mail sert d'identifiant de connexion : on refuse un doublon avant
    // d'atteindre la contrainte d'unicité, dont le message est illisible.
    const taken = await prisma.user.findFirst({
      where: { email: cleanEmail, NOT: { id: Number(decoded.userId) } },
      select: { id: true },
    });
    if (taken) {
      return res
        .status(409)
        .json({ error: "Cette adresse e-mail est déjà utilisée." });
    }

    const updated = await prisma.user.update({
      where: { id: Number(decoded.userId) },
      data: {
        firstName: String(firstName).trim(),
        lastName: lastName ? String(lastName).trim() : null,
        email: cleanEmail,
        phone: phone ? String(phone).trim() : null,
        description: description ?? null,
        // Photo inchangée si le formulaire n'en envoie pas de nouvelle.
        ...(imagePath ? { imagePath } : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        imagePath: true,
        description: true,
      },
    });

    return res.status(200).json({ success: true, user: updated });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Erreur lors de la mise à jour du profil." });
  }
}
