

// pages/api/users/index.js
import prisma from "@/services/config/auth/prisma";
import { FKTND_H } from "@/services/tools/constants";
import { generateRandomString } from "@/services/tools/helper";
import { requireEditableOffer } from "@/services/workflow/offerGuards";
import { serverError } from "@/services/config/apiError";
export const runtime = 'nodejs';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { offerId, accessModes, verskth } = req.body;

        if (verskth != FKTND_H) {
            return res.status(405).json({ message: 'Requête non autorisée' });
        }

        if (!offerId) {
            res.status(400).json({ error: "L'ID de l'offre est obligatoire." });
            return;
        }
        // Session, droits, opérateur et absence de décision (moteur de workflow).
        if (!(await requireEditableOffer(req, res, offerId))) return;
        if (!Array.isArray(accessModes)) {
            return res.status(400).json({ error: "Les modes d'accès sont attendus sous forme de liste." });
        }

        try {
            await Promise.all(
                accessModes.map((a) => {
                    return prisma.accessMode.create({
                        data: {
                            code: 'ACM-' + Date.now() + Math.floor(Math.random() * 10000) + 1,
                            content: a.content,
                            offer: { connect: { id: Number(offerId) } },
                        }
                    })
                })
            )

            res.status(201).json({ error: false });
        } catch (error) {
            serverError(res, error, "pages/api/admin/offer/saveAccessMode.js");
        }
    }
    else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
