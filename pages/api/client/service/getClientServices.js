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

            const services = await prisma.service.findMany({
                orderBy: { updatedAt: orderBy },
            });
            res.status(200).json(services);

        } catch (error) {
            serverError(res, error, "pages/api/client/service/getClientServices.js");
        }
    }
    else {
        res.setHeader('Allow', [ 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
