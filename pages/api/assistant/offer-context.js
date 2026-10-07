import prisma from "@/services/config/auth/prisma";
import { requireActor } from "@/services/config/auth/session";
import { PERMISSIONS, can } from "@/services/rbac/permissions";
import { getOfferAnalyses, offerAnalysisInput } from "@/services/assistant/offerAnalysisService";
import { WORKFLOW_ACTIONS, WorkflowError, getAvailableActions, loadOfferContext } from "@/services/workflow/offerWorkflow";
import { sendError } from "@/services/workflow/apiErrors";

/**
 * Contexte d'une offre pour ouvrir une conversation ComparIA.
 *
 *   GET /api/assistant/offer-context?offerId=12
 *   → { offer: { id, code, title, operator, status }, input, analysis }
 *
 * `input` est la description de l'offre telle qu'elle est soumise à l'analyse ;
 * `analysis` est l'analyse IA déjà enregistrée (aucun calcul n'est lancé),
 * ou null si elle n'existe pas ou si le profil n'y a pas accès.
 *
 * Remplace le passage de ces textes dans l'adresse de la page, qui échouait
 * dès que l'analyse dépassait la longueur admise pour une URL.
 */
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Méthode non autorisée." });
  }
  const actor = await requireActor(req, res, PERMISSIONS.ASSISTANT_USE);
  if (!actor) return undefined;
  const id = Number(req.query.offerId);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Identifiant d'offre invalide." });

  try {
    const offer = await loadOfferContext(prisma, id);
    if (!offer) throw new WorkflowError(404, "NOT_FOUND", "Offre introuvable.");
    if (!getAvailableActions(offer, actor).includes(WORKFLOW_ACTIONS.VIEW)) {
      throw new WorkflowError(403, "OPERATOR_SCOPE", "Cette offre n'appartient pas à votre opérateur.");
    }
    const input = await offerAnalysisInput(id);
    // L'analyse est un document interne : réservée aux profils habilités.
    const analysis = can(actor.role, PERMISSIONS.AI_ANALYSIS_READ) ? (await getOfferAnalyses(id, actor)).latest : null;
    return res.status(200).json({
      offer: { id: offer.id, code: offer.code, title: offer.title, operator: offer.operator?.name || null, status: offer.workflowStatus },
      input,
      analysis,
    });
  } catch (error) {
    return sendError(res, error);
  }
}
