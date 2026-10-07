import prisma from "@/services/config/auth/prisma";
import { requireActor } from "@/services/config/auth/session";
import { PERMISSIONS } from "@/services/rbac/permissions";
import { getWorkflowState, deleteOffer } from "@/services/workflow/offerWorkflow";
import { sendError } from "@/services/workflow/apiErrors";
import { isOperatorAudience, operatorWorkflowState } from "@/services/workflow/operatorView";

/**
 * GET    /api/workflow/offers/:id  -> état du workflow (niveaux, décisions, historique, actions possibles)
 * DELETE /api/workflow/offers/:id  -> suppression (uniquement sans aucune décision)
 */
export default async function handler(req, res) {
  // État de workflow : jamais mis en cache (navigateur ou intermédiaire).
  res.setHeader("Cache-Control", "no-store, max-age=0");
  const actor = await requireActor(req, res, PERMISSIONS.OFFER_READ);
  if (!actor) return;
  const id = Number(req.query.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Identifiant d'offre invalide." });

  try {
    if (req.method === "GET") {
      // L'état (et le contrôle de périmètre) d'abord : les détails d'affichage
      // ne sont lus que si l'utilisateur a le droit de voir l'offre.
      const state = await getWorkflowState(id, actor);
      const details = await prisma.offer.findUnique({
        where: { id },
        select: {
          category: true,
          billingType: true,
          target: true,
          description: true,
          notifiDate: true,
          desiredDate: true,
          createdAt: true,
          updatedAt: true,
          deactivatedAt: true,
          parent: { select: { id: true, code: true, title: true } },
          user: { select: { id: true, firstName: true, lastName: true } },
          specialPromotion: { select: { type: true, duration: true } },
        },
      });
      // Opérateur : le circuit de validation est interne à l'ARTCI. La réponse
      // ne contient ni niveaux, ni décisions par niveau, ni nom de validateur.
      return res.status(200).json({
        ...(isOperatorAudience(actor) ? operatorWorkflowState(state) : state),
        details,
        viewer: { id: actor.id, role: actor.role },
      });
    }
    if (req.method === "DELETE") {
      return res.status(200).json(await deleteOffer(id, actor));
    }
    res.setHeader("Allow", ["GET", "DELETE"]);
    return res.status(405).json({ error: "Méthode non autorisée." });
  } catch (error) {
    return sendError(res, error);
  }
}
