import prisma from "@/services/config/auth/prisma";
import { requireActor } from "@/services/config/auth/session";
import { PERMISSIONS } from "@/services/rbac/permissions";
import { getAvailableActions, OFFER_CONTEXT_SELECT, finalLevelOf } from "@/services/workflow/offerWorkflow";
import { isPublishedOffer } from "@/services/workflow/publication";
import { isOperatorAudience, stripValidationCircuit } from "@/services/workflow/operatorView";

/**
 * POST /api/workflow/actions  { ids: number[] }
 * Actions possibles de l'utilisateur connecté sur plusieurs offres (listes).
 * Les offres hors du périmètre d'un point focal ne sont pas renvoyées.
 */
export default async function handler(req, res) {
  // État de workflow : jamais mis en cache (navigateur ou intermédiaire).
  res.setHeader("Cache-Control", "no-store, max-age=0");
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Méthode non autorisée." });
  }
  const actor = await requireActor(req, res, PERMISSIONS.OFFER_READ);
  if (!actor) return;
  const ids = [...new Set((req.body?.ids || []).map(Number).filter(Number.isInteger))].slice(0, 1000);
  if (!ids.length) return res.status(200).json({ offers: {} });

  const offers = await prisma.offer.findMany({ where: { id: { in: ids } }, select: OFFER_CONTEXT_SELECT });
  const out = {};
  for (const o of offers) {
    const actions = getAvailableActions(o, actor);
    if (!actions.length) continue;
    out[o.id] = {
      actions,
      workflowStatus: o.workflowStatus,
      currentValidationLevel: o.currentValidationLevel,
      finalLevel: finalLevelOf(o),
      version: o.version,
      deactivationReason: o.deactivationReason,
      published: isPublishedOffer(o),
    };
  }
  // Opérateur : ni niveau attendu, ni longueur du circuit.
  return res.status(200).json({ role: actor.role, offers: isOperatorAudience(actor) ? stripValidationCircuit(out) : out });
}
