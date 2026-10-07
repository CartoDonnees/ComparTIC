import prisma from "@/services/config/auth/prisma";
import { FKTND_H } from "@/services/tools/constants";
import { requireActor } from "@/services/config/auth/session";
import { PERMISSIONS } from "@/services/rbac/permissions";
import { PROFILE_CODE_TO_ROLE } from "@/services/rbac/roles";

/**
 * Liste des utilisateurs   gestion des comptes (super administrateur et
 * administrateur). Le hachage des mots de passe n'est jamais renvoyé.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  if (req.body?.verskth != FKTND_H) {
    return res.status(405).json({ message: "Requête non autorisée" });
  }
  const actor = await requireActor(req, res, PERMISSIONS.USER_MANAGE);
  if (!actor) return;

  try {
    const orderBy = req.query.order === "asc" ? "asc" : "desc";
    // Pagination facultative (voir getOffers) : sans `page`, liste complète
    // mais plafonnée pour ne jamais saturer le navigateur.
    const page = Number(req.body?.page);
    const paginated = Number.isFinite(page) && page > 0;
    const size = paginated ? Math.min(200, Math.max(5, Number(req.body?.pageSize) || 25)) : 2000;

    const users = await prisma.user.findMany({
      orderBy: { updatedAt: orderBy },
      skip: paginated ? (page - 1) * size : 0,
      take: size,
      omit: { password: true },
      include: {
        profile: true,
        focalPoint: { include: { operator: true } },
      },
    });
    const rows = users.map((u) => ({ ...u, role: PROFILE_CODE_TO_ROLE[u.profile?.code] || null }));
    res.setHeader("Cache-Control", "no-store");
    if (paginated) {
      const total = await prisma.user.count();
      return res.status(200).json({
        items: rows,
        total,
        page,
        pageSize: size,
        pageCount: Math.max(1, Math.ceil(total / size)),
      });
    }
    return res.status(200).json(rows);
  } catch (error) {
    console.error("USERS ====>", error.message);
    return res.status(500).json({ error: "La liste des utilisateurs n'a pas pu être chargée." });
  }
}
