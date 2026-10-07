import { sendMail } from "@/services/config/mailer";
import prisma from "@/services/config/auth/prisma";
import { FKTND_H } from "@/services/tools/constants";
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

    const { email } = req.body; // Récupérer les infos utilisateur

    try {
        const user = await prisma.user.findUnique({
            where: { email }
        });
        if (user) {
            const generateRandomString = (length = 20) => {
                return [...Array(length)].map(() => Math.random().toString(36)[2]).join('');
            }
            const token = generateRandomString(8);

            try {
                const isToken = await prisma.restorePassword.findFirst({
                    where: { userId: user?.id }
                });

                if (isToken) {
                    await prisma.restorePassword.update({
                        where: { code: isToken?.code },
                        data: {
                            token: token,
                        }
                    })

                }
                else {
                    await prisma.restorePassword.create({
                        data: {
                            code: 'RST-' + Date.now().toString(),
                            token: token,
                            user: {
                                connect: { id: parseInt(user?.id) },
                            },
                        }
                    })
                }

                // BUGFIX: l'expéditeur pointait sur process.env.OUTLOOK_EMAIL,
                // variable disparue depuis le passage à Gmail (From "<undefined>"),
                // et l'en-tête annonçait "CARTODONNEES" au lieu de COMPARETIC.
                const mail = await sendMail({
                    to: email,
                    subject: "Réinitialisation de votre mot de passe",
                    html: `<h2>Ci-dessous le code de réinitialisation !</h2><h1><b>${token}</b></h1>`,
                });

                if (!mail.sent) {
                    return res
                        .status(502)
                        .json({ success: false, error: mail.reason });
                }

                res.status(200).json({ success: true, message: "Email envoyé !" });
            } catch (error) {
                console.error("Le mail n'existe pas:", error);
                serverError(res, error, "pages/api/auth/sendConfirmationEmail.js");
            }
        }
        else {
            // BUGFIX: cette branche journalisait et renvoyait `error`, variable
            // inexistante ici -> ReferenceError transformee en 500 opaque.
            console.warn("Réinitialisation demandée pour un e-mail inconnu.");
            res.status(400).json({
                success: false,
                error: "Aucun compte n'est associé à cette adresse e-mail.",
            });
        }
    } catch (error) {
        console.error("Erreur d'envoi d'email:", error);
        serverError(res, error, "pages/api/auth/sendConfirmationEmail.js");
    }
}
