import prisma from "@/services/config/auth/prisma";
import { requireActor } from "@/services/config/auth/session";
import { PERMISSIONS } from "@/services/rbac/permissions";
import { ROLES } from "@/services/rbac/roles";
import { requireOfferSubmissionTicket } from "@/services/config/submission/offerSubmissionGuard";
import {
  WORKFLOW_ACTIONS,
  WorkflowError,
  loadOfferContext,
  assertAction,
  submitOffer,
  decideOffer,
  deactivateOffer,
  reactivateOffer,
  monitorOffer,
} from "@/services/workflow/offerWorkflow";
import { dispatchWorkflowEvents } from "@/services/workflow/workflowNotifications";
import { sendError } from "@/services/workflow/apiErrors";
import { isOperatorAudience, stripValidationCircuit } from "@/services/workflow/operatorView";

/**
 * POST /api/workflow/offers/:id/submit      { submissionTicket }   (point focal : jeton du code e-mail)
 * POST /api/workflow/offers/:id/decide      { decision: "VALIDATE"|"REFUSE", comment, confirmFinal, validation: "TRANSMIT"|"FINAL" }
 * POST /api/workflow/offers/:id/deactivate  { comment }
 * POST /api/workflow/offers/:id/reactivate  { comment }            (administration ; motif facultatif)
 * POST /api/workflow/offers/:id/monitor     { comment }
 *
 * L'identité vient de la session ; aucun identifiant d'utilisateur du corps de
 * la requête n'est lu. Les règles (rôle, niveau, opérateur, état, historique)
 * sont appliquées par le moteur. Les notifications partent APRÈS la réussite
 * de la transaction.
 */
const HANDLERS = {
  submit: { permission: PERMISSIONS.OFFER_SUBMIT, run: (id, actor, body) => submitWithTicket(id, actor, body) },
  decide: {
    permission: PERMISSIONS.OFFER_DECIDE,
    run: (id, actor, body) =>
      decideOffer(id, actor, {
        decision: body?.decision,
        comment: body?.comment,
        confirmFinal: body?.confirmFinal === true,
        // "TRANSMIT" | "FINAL"   validation sans transmission : promotions uniquement.
        validation: body?.validation ?? null,
      }),
  },
  deactivate: { permission: PERMISSIONS.OFFER_DEACTIVATE, run: (id, actor, body) => deactivateOffer(id, actor, { comment: body?.comment }) },
  reactivate: { permission: PERMISSIONS.OFFER_REACTIVATE, run: (id, actor, body) => reactivateOffer(id, actor, { comment: body?.comment }) },
  monitor: { permission: PERMISSIONS.OFFER_MONITOR, run: (id, actor, body) => monitorOffer(id, actor, { comment: body?.comment }) },
};

/**
 * Soumission d'un brouillon. Pour un point focal, la soumission exige TOUJOURS
 * le code reçu par e-mail (jeton délivré par /api/offer/submission/verifyCode,
 * lié à la référence de l'offre). Les règles métier sont vérifiées AVANT la
 * consommation du jeton   un refus ne brûle pas le code   et le jeton est
 * restitué si la transition échoue.
 */
const submitWithTicket = async (id, actor, body) => {
  if (actor.role !== ROLES.FOCAL_POINT) return submitOffer(id, actor);

  const offer = await loadOfferContext(prisma, id);
  assertAction(offer, actor, WORKFLOW_ACTIONS.SUBMIT);

  const guard = await requireOfferSubmissionTicket({
    userId: actor.id,
    reference: offer.code,
    ticket: body?.submissionTicket,
    operatorId: offer.operatorId,
  });
  if (!guard.ok) {
    throw new WorkflowError(guard.status || 403, guard.reason || "SUBMISSION_CODE_REQUIRED", guard.error);
  }
  try {
    const result = await submitOffer(id, actor);
    await guard.link(id);
    return result;
  } catch (error) {
    await guard.release();
    throw error;
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Méthode non autorisée." });
  }
  const spec = HANDLERS[req.query.action];
  if (!spec) return res.status(404).json({ error: "Action inconnue." });

  const actor = await requireActor(req, res, spec.permission);
  if (!actor) return;
  const id = Number(req.query.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Identifiant d'offre invalide." });

  try {
    const result = await spec.run(id, actor, req.body || {});
    const notifications = await dispatchWorkflowEvents(result.events);
    const { events, ...payload } = result;
    // Opérateur : jamais de niveau de validation dans la réponse.
    if (isOperatorAudience(actor)) return res.status(200).json(stripValidationCircuit(payload));
    return res.status(200).json({ ...payload, notifications });
  } catch (error) {
    return sendError(res, error);
  }
}
