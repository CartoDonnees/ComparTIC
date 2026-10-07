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

            const countries = await prisma.country.findMany({
                orderBy: { name: orderBy },
                // Compteurs utilisés par les statistiques de la page de gestion.
                include: { _count: { select: { organizations: true, organisationCountries: true } } },
            });
            res.status(200).json(countries);

        } catch (error) {
            serverError(res, error, "pages/api/admin/country/getCountries.js");
        }
    }
    else {
        res.setHeader('Allow', [ 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
