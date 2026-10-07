import { guardRoute } from "@/services/rbac/guardRoute";
import { PERMISSIONS } from "@/services/rbac/permissions";
// pages/api/users/index.js
import prisma from "@/services/config/auth/prisma";
import { FKTND_H } from "@/services/tools/constants";
import { canAssignRole } from "@/services/rbac/permissions";
import { PROFILE_CODE_TO_ROLE, ROLE_LABELS } from "@/services/rbac/roles";
import { serverError } from "@/services/config/apiError";

async function handler(req, res) {
    if (req.method === 'POST') {
        const { verskth } = req.body;
        if (verskth != FKTND_H) {
            return res.status(405).json({ message: 'Requête non autorisée' });
        }
        try {
            const { order } = req.query;
            const orderBy = order === 'desc' ? 'desc' : 'asc';

            const profiles = await prisma.profile.findMany({
                orderBy: { updatedAt: orderBy },
            });
            // Rôle, libellé et possibilité d'attribution par l'utilisateur
            // connecté (un administrateur ne désigne ni administrateur ni
            // super administrateur). L'API de création le recontrôle.
            res.status(200).json(profiles.map((prof) => {
                const role = PROFILE_CODE_TO_ROLE[prof.code] || null;
                return {
                    ...prof,
                    role,
                    label: ROLE_LABELS[role] || prof.name,
                    assignable: canAssignRole(req.actor?.role, role).ok,
                };
            }));

        } catch (error) {
            serverError(res, error, "pages/api/admin/profile/getProfile.js");
        }
    }
    else {
        res.setHeader('Allow', [ 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

// Autorisation vérifiée côté serveur (session + permission).
export default guardRoute(handler, { methods: { POST: PERMISSIONS.USER_MANAGE } });
