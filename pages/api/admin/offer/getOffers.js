import { guardRoute } from "@/services/rbac/guardRoute";
import { PERMISSIONS } from "@/services/rbac/permissions";
// pages/api/users/index.js
import prisma from "@/services/config/auth/prisma";
import { FKTND_H } from "@/services/tools/constants";
import { serverError } from "@/services/config/apiError";
import { OFFER_LIST_INCLUDE } from "@/services/offers/offerListInclude";

/**
 * Pagination facultative, compatible avec l'existant.
 *
 * Sans `page`, la route renvoie le tableau complet comme auparavant, mais
 * PLAFONNÉ : une base contenant des dizaines de milliers d'offres aurait
 * saturé le navigateur (aucune limite n'existait). Avec `page`, elle renvoie
 * `{ items, total, page, pageSize, pageCount }`.
 */
const MAX_ROWS = 2000;
const MAX_PAGE_SIZE = 200;

async function handler(req, res) {
  if (req.method === "POST") {
    const { verskth } = req.body;
    if (verskth != FKTND_H) {
      return res.status(405).json({ message: "Requête non autorisée" });
    }
    try {
      const { order, page, pageSize } = req.body;
      const orderBy = order === "asc" ? "asc" : "desc";
      const paginated = Number.isFinite(Number(page)) && Number(page) > 0;
      const size = paginated
        ? Math.min(MAX_PAGE_SIZE, Math.max(5, Number(pageSize) || 25))
        : MAX_ROWS;
      const skip = paginated ? (Number(page) - 1) * size : 0;

      const ofers = await prisma.offer.findMany({
        orderBy: { updatedAt: orderBy },
        skip,
        take: size,
        where: {
          code: {
            not: "OF-000000000000000",
          },
        },
        include: OFFER_LIST_INCLUDE,
      });

      res.setHeader("Cache-Control", "no-store");
      if (paginated) {
        const total = await prisma.offer.count({ where: { code: { not: "OF-000000000000000" } } });
        return res.status(200).json({
          items: ofers,
          total,
          page: Number(page),
          pageSize: size,
          pageCount: Math.max(1, Math.ceil(total / size)),
        });
      }
      res.status(200).json(ofers);
    } catch (error) {
      serverError(res, error, "pages/api/admin/offer/getOffers.js");
    } finally {
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// Autorisation vérifiée côté serveur (session + permission, périmètre opérateur).
export default guardRoute(handler, { methods: { POST: PERMISSIONS.OFFER_READ }, focalPoint: "deny" });
