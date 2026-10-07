import prisma from "@/services/config/auth/prisma";
import { serverError } from "@/services/config/apiError";
import { buildOfferWhere, CARD_SELECT, ORDER_BY, toOfferCard } from "@/services/public/publicOffers";
import { answerPreflight } from "@/services/config/preflight";

/**
 * Liste publique des offres  - application mobile et usages tiers.
 *
 *   GET /api/public/offers?search=&category=MOBILE|FIXE&billing=PREPAID,POSTPAID
 *                         &operators=1,2&promo=true|false&sort=recent|title|operator
 *                         &page=1&pageSize=20
 *
 * Réponse : { items, page, pageSize, total, pageCount }
 *
 * Route publique, en lecture seule : elle ne renvoie que des offres VALIDÉES
 * (même règle que le comparateur) et aucune donnée nominative.
 */

const MAX_PAGE_SIZE = 50;

export default async function handler(req, res) {
  if (answerPreflight(req, res)) return;
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(5, Number(req.query.pageSize) || 20));
  const orderBy = ORDER_BY[req.query.sort] || ORDER_BY.recent;

  try {
    const where = buildOfferWhere({
      search: req.query.search,
      category: req.query.category,
      billing: req.query.billing,
      operatorIds: req.query.operators,
      promo: req.query.promo,
    });

    const [total, offers] = await Promise.all([
      prisma.offer.count({ where }),
      prisma.offer.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: CARD_SELECT,
      }),
    ]);

    // Liste publique qui change à chaque validation : cache court côté client.
    res.setHeader("Cache-Control", "public, max-age=60");
    return res.status(200).json({
      items: offers.map(toOfferCard),
      page,
      pageSize,
      total,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (error) {
    return serverError(res, error, "API publique : offres");
  }
}
