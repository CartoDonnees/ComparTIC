// pages/api/users/index.js

import prisma from '@/services/config/auth/prisma';
import { FKTND_H } from '@/services/tools/constants';
import { serverError } from "@/services/config/apiError";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Méthode non autorisée' });
    }
    const { verskth } = req.body;
    if (verskth != FKTND_H) {
        return res.status(405).json({ message: 'Requête non autorisée' });
    }
    const { year } = req.body;
    try {
        const { order } = req.body;
        const orderBy = order === 'desc' ? 'desc' : 'asc';

        const operators = await prisma.operator.findMany({
            orderBy: { name: orderBy },
            // Compteurs utilisés par les statistiques de la page de gestion.
            include: { _count: { select: { offers: true, focalPoints: true } } },
        });
        res.status(200).json(operators);

    } catch (error) {
        serverError(res, error, "pages/api/admin/operator/getOperator.js");
    }
}
