import prisma from "@/services/config/auth/prisma";
import { FKTND_H, JWT_TOKEN } from "@/services/tools/constants";
import { verifyToken } from "@/services/config/auth/jwt";

/**
 * Notifications de l'utilisateur connecté.
 *
 * POST                          -> liste + nombre de non-lues
 * POST { action: "read", id }   -> marque une notification comme lue
 * POST { action: "readAll" }    -> marque toutes les notifications comme lues
 *
 * Le destinataire est toujours déduit du jeton signé : il est impossible de
 * lire ou de modifier les notifications d'un autre compte.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { verskth, action, id, limit } = req.body || {};

  if (verskth != FKTND_H) {
    return res.status(405).json({ error: "Requête non autorisée" });
  }

  const decoded = verifyToken(req.cookies?.[JWT_TOKEN]);
  if (!decoded?.userId) {
    return res.status(401).json({ error: "Session expirée." });
  }
  const userId = Number(decoded.userId);

  try {
    if (action === "read") {
      if (!id) {
        return res.status(400).json({ error: "Identifiant requis." });
      }
      // `updateMany` avec la condition de destinataire : une notification
      // appartenant à quelqu'un d'autre ne correspond simplement à rien.
      const result = await prisma.notification.updateMany({
        where: { id: Number(id), to: { some: { id: userId } } },
        data: { read: true },
      });
      return res.status(200).json({ success: true, updated: result.count });
    }

    if (action === "readAll") {
      const result = await prisma.notification.updateMany({
        where: { to: { some: { id: userId } }, read: false },
        data: { read: true },
      });
      return res.status(200).json({ success: true, updated: result.count });
    }

    const take = Math.min(Number(limit) || 20, 100);

    const [items, unread] = await Promise.all([
      prisma.notification.findMany({
        where: { to: { some: { id: userId } } },
        orderBy: { createdAt: "desc" },
        take,
        select: {
          id: true,
          code: true,
          from: true,
          type: true,
          title: true,
          content: true,
          link: true,
          read: true,
          createdAt: true,
        },
      }),
      prisma.notification.count({
        where: { to: { some: { id: userId } }, read: false },
      }),
    ]);

    return res.status(200).json({ items, unread });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Erreur lors de la lecture des notifications." });
  }
}
