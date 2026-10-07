import prisma from "@/services/config/auth/prisma";
import { FKTND_H } from "@/services/tools/constants";
import { requireEditableOffer } from "@/services/workflow/offerGuards";

/**
 * Ajoute des avantages à une formule d'une offre.
 *
 * POST /api/admin/offer/saveAdvantage  { offerId, formulaId, advantages: [{ title, description }] }
 *
 * BUGFIX : la route lisait une variable `title` jamais déclarée (ReferenceError
 * systématique) et rattachait l'avantage à une relation `offers` inexistante  
 * un avantage appartient à une FORMULE. Elle est désormais soumise aux mêmes
 * règles que la modification d'une offre.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { offerId, formulaId, advantages, verskth } = req.body || {};
  if (verskth != FKTND_H) {
    return res.status(405).json({ message: "Requête non autorisée" });
  }
  if (!Array.isArray(advantages) || advantages.length === 0 || !formulaId) {
    return res.status(400).json({ error: "La formule et au moins un avantage sont requis." });
  }

  const ctx = await requireEditableOffer(req, res, offerId);
  if (!ctx) return;

  try {
    const formula = await prisma.offerFormula.findUnique({
      where: { id: Number(formulaId) },
      select: { id: true, offerId: true },
    });
    // La formule doit appartenir à l'offre contrôlée ci-dessus.
    if (!formula || formula.offerId !== ctx.offer.id) {
      return res.status(404).json({ error: "Formule introuvable pour cette offre." });
    }

    await prisma.$transaction(
      advantages.map((advan, index) =>
        prisma.formulaAdvantage.create({
          data: {
            code: `ADV-${Date.now()}-${index}`,
            title: String(advan?.title ?? advan?.name ?? ""),
            description: advan?.description ?? null,
            formula: { connect: { id: formula.id } },
          },
        }),
      ),
    );
    return res.status(201).json({ error: false });
  } catch (error) {
    console.error("ADVANTAGE ====>", error?.message);
    return res.status(500).json({ error: "Les avantages n'ont pas pu être enregistrés." });
  }
}
