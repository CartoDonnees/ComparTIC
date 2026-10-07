import prisma from "@/services/config/auth/prisma";
import { FKTND_H } from "@/services/tools/constants";
import { requireEditableOffer } from "@/services/workflow/offerGuards";
import { serverError } from "@/services/config/apiError";

/**
 * Purge les éléments "enfants" d'une offre avant de les ré-enregistrer
 * (utilisé par la MODIFICATION d'une offre).
 *
 * POST /api/admin/offer/clearOfferDetails  { offerId, scope? }
 *
 * Sans cette purge, ré-appeler `saveFormula` / `saveAccessMode` lors d'une
 * modification DUPLIQUERAIT les formules et les modes d'accès.
 *
 * `scope` : "all" (défaut) | "formulas" | "accessModes"
 *
 * L'ordre de suppression respecte les clés étrangères :
 *   OfferRate -> OfferServiceDetail -> OfferPrice / FormulaAdvantage /
 *   OfferControl -> OfferFormula (enfants détachés au préalable).
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { verskth, offerId, scope = "all" } = req.body;

  if (verskth != FKTND_H) {
    return res.status(405).json({ message: "Requête non autorisée" });
  }
  if (!offerId) {
    return res.status(400).json({ error: "L'identifiant de l'offre est requis" });
  }
  // Purge = modification : mêmes règles (session, droits, opérateur, aucune décision).
  if (!(await requireEditableOffer(req, res, offerId))) return;

  const id = Number(offerId);

  try {
    await prisma.$transaction(async (tx) => {
      if (scope === "all" || scope === "formulas") {
        const formulas = await tx.offerFormula.findMany({
          where: { offerId: id },
          select: { id: true },
        });
        const formulaIds = formulas.map((f) => f.id);

        if (formulaIds.length > 0) {
          const details = await tx.offerServiceDetail.findMany({
            where: { formulaId: { in: formulaIds } },
            select: { id: true },
          });
          const detailIds = details.map((d) => d.id);

          if (detailIds.length > 0) {
            await tx.offerRate.deleteMany({
              where: { serviceDetailId: { in: detailIds } },
            });
          }
          await tx.offerServiceDetail.deleteMany({
            where: { formulaId: { in: formulaIds } },
          });
          await tx.offerPrice.deleteMany({
            where: { formulaId: { in: formulaIds } },
          });
          await tx.formulaAdvantage.deleteMany({
            where: { formulaId: { in: formulaIds } },
          });
          await tx.offerControl.deleteMany({
            where: { formulaId: { in: formulaIds } },
          });
          // Détache la hiérarchie interne avant suppression (self-relation)
          await tx.offerFormula.updateMany({
            where: { parentId: { in: formulaIds } },
            data: { parentId: null },
          });
          await tx.offerFormula.deleteMany({ where: { offerId: id } });
        }
      }

      if (scope === "all" || scope === "accessModes") {
        await tx.accessMode.deleteMany({ where: { offerId: id } });
      }
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    return serverError(res, error, "pages/api/admin/offer/clearOfferDetails.js");
  }
}
