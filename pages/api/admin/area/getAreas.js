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
            const { order } = req.query;
            const orderBy = order === 'desc' ? 'desc' : 'asc';

            const areas = await prisma.area.findMany({
                orderBy: { title: orderBy },
                include:{
                    offers:true,
                    // Compteurs utilisés par les statistiques de la page de gestion.
                    _count: { select: { offers: true, areaOrganizations: true, monitorings: true } },
                }
            });
            res.status(200).json(areas);

        } catch (error) {
            serverError(res, error, "pages/api/admin/area/getAreas.js");
        }
    }
    else {
        res.setHeader('Allow', [ 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
