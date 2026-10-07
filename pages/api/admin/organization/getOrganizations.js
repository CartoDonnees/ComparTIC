// pages/api/users/index.js
import prisma from "@/services/config/auth/prisma";
import { FKTND_H } from "@/services/tools/constants";
import { serverError } from "@/services/config/apiError";

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { verskth } = req.body;
        if (verskth != FKTND_H) {
            return res.status(405).json({ message: 'Requête non autorisée' });
        }
        try {
            const { order } = req.body;
            const orderBy = order === 'desc' ? 'desc' : 'asc';

            const organizations = await prisma.organization.findMany({
                orderBy: { name: orderBy },
                include:{
                    countries:true,
                    // Zone : utilisée par les statistiques de la page de gestion.
                    area: { select: { id: true, title: true } },
                }
            });
            res.status(200).json(organizations);

        } catch (error) {
            serverError(res, error, "pages/api/admin/organization/getOrganizations.js");
        }
    }
    else {
        res.setHeader('Allow', [ 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
