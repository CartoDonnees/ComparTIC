
import prisma from "@/services/config/auth/prisma";
import { FKTND_H } from "@/services/tools/constants";
import { serverError } from "@/services/config/apiError";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }
    const { verskth } = req.body;
    if (verskth != FKTND_H) {
        return res.status(405).json({ message: 'Requête non autorisée' });
    }

    const { email, code } = req.body; // Récupérer les infos utilisateur

    try {
        // Configuration de Nodemailer
        const user = await prisma.user.findUnique({
            where: { email }
        });
        if (user) {
            try {
                const userRestrore = await prisma.restorePassword.findFirst({
                    where: { userId: user?.id }
                });
                console.error("RRRRRRRRRRRRRRRRRR =====>:", userRestrore);

                if (userRestrore) {
                    if (userRestrore?.token == code) {
                        res.status(200).json({ success: true, message: "Email confirmé !" });
                    }
                    else {
                        res.status(500).json({ success: false, error: "Erreur confirmation de l'émail" });
                    }
                }
            } catch (error) {
                console.error("Erreur confirmation update =====>:", error?.message);
                serverError(res, error, "pages/api/auth/confirmCode.js");
            }
        }

    } catch (error) {
        console.error("Erreur confirmation:", error);
        serverError(res, error, "pages/api/auth/confirmCode.js");
    }
}
