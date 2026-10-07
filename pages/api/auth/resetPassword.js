
import prisma from "@/services/config/auth/prisma";
import { hashPassword } from "@/services/config/auth/hash";
import { isValidEmail, isValidPassword } from "@/services/config/auth/userValidation";
import { FKTND_H } from '@/services/tools/constants';
import { serverError } from "@/services/config/apiError";
import { blockedByRateLimit } from "@/services/config/auth/rateLimit";

export default async function handler(req, res) {
  if (blockedByRateLimit(req, res, { preset: "password", key: req.body?.email || "" })) return undefined;

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }
    const { verskth } = req.body;
    if (verskth != FKTND_H) {
        return res.status(405).json({ message: 'Requête non autorisée' });
    }

    const { email, password } = req.body; // Récupérer les infos utilisateur

    try {
        // Configuration de Nodemailer
        if (!isValidEmail(email)) {
            return res.status(405).json({ message: 'Email non valide !' });
        }
        const user = await prisma.user.findUnique({
            where: { email }
        });
        if (!isValidPassword(password)) {
            res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères, une lettre majuscule, un chiffre et un caractère spécial.' });
            return;
        }
        if (user) {
            try {
                const hashedPassword = await hashPassword(password);
                const userUpdate = await prisma.user.update({
                    where: { email: email },
                    data: {
                        password: hashedPassword,
                        status: 'ENABLE',
                        // L'utilisateur a choisi lui-même ce mot de passe :
                        // l'écran de changement obligatoire n'a plus lieu d'être.
                        passwordChangedAt: new Date()
                    }
                });
                res.status(200).json({ success: true, message: "Mot de passe rénitialisé avec succès !" });

            } catch (error) {
                console.error("Erreur lors de la rénitialisation du mot de passe", error?.message);
                serverError(res, error, "pages/api/auth/resetPassword.js");
            }
        }

    } catch (error) {
        console.error("Erreur de rénitialisation:", error);
        serverError(res, error, "pages/api/auth/resetPassword.js");
    }
}
