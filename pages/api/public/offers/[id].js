import prisma from "@/services/config/auth/prisma";
import { serverError } from "@/services/config/apiError";
import { publishedOfferWhere } from "@/services/workflow/publication";
import { DETAIL_SELECT, toOfferDetail } from "@/services/public/publicOffers";
import { answerPreflight } from "@/services/config/preflight";

/**
 * Détail public d'une offre.
 *
 *   GET /api/public/offers/:id
 *
 * Une offre non publiée renvoie 404 : la fiche ne doit pas être accessible
 * avant sa validation définitive, même en connaissant son identifiant.
 */
export default async function handler(req, res) {
  if (answerPreflight(req, res)) return;
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  const id = Number(req.query.id);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: "Identifiant d'offre invalide." });
  }

  try {
    const offer = await prisma.offer.findFirst({
      where: { AND: [{ id }, publishedOfferWhere()] },
      select: DETAIL_SELECT,
    });

    if (!offer) {
      return res.status(404).json({ error: "Offre introuvable ou non publiée.", code: "NOT_FOUND" });
    }

    res.setHeader("Cache-Control", "public, max-age=120");
    return res.status(200).json(toOfferDetail(offer));
  } catch (error) {
    return serverError(res, error, "API publique : détail d'offre");
  }
}
