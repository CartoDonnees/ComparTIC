import { guardRoute } from "@/services/rbac/guardRoute";
import { PERMISSIONS } from "@/services/rbac/permissions";
// pages/api/users/index.js
import prisma from "@/services/config/auth/prisma";
import { FKTND_H } from "@/services/tools/constants";
import { serverError } from "@/services/config/apiError";

async function handler(req, res) {
    if (req.method === 'POST') {
        const { verskth } = req.body;
        if (verskth != FKTND_H) {
            return res.status(405).json({ message: 'Requête non autorisée' });
        }
        try {
            const { order } = req.body;
            const orderBy = order === 'asc' ? 'asc' : 'desc';

            const ofers = await prisma.offer.findMany({
                orderBy: { updatedAt: orderBy },
                where:{
                    code:'OF-000000000000000'
                },
            });
            res.status(200).json(ofers);

        } catch (error) {
            serverError(res, error, "pages/api/admin/offer/getUnknownOffer.js");
        }
    }
    else {
        res.setHeader('Allow', [ 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

// Autorisation vérifiée côté serveur (session + permission).
export default guardRoute(handler, { methods: { POST: PERMISSIONS.OFFER_READ } });
