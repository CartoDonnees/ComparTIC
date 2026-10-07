import { requireActor } from "@/services/config/auth/session";
import { PERMISSIONS } from "@/services/rbac/permissions";
import { ROLES } from "@/services/rbac/roles";
import { initializeCreatedOffer } from "@/services/workflow/offerWorkflow";
import { dispatchWorkflowEvents } from "@/services/workflow/workflowNotifications";

/**
 * Contexte commun aux routes de création d'offre.
 *
 * - l'auteur est l'utilisateur de la SESSION (le `userId` du corps est ignoré) ;
 * - un point focal ne crée que pour SON opérateur : l'opérateur envoyé est
 *   comparé au sien, et c'est le sien qui est retenu ;
 * - `submit` (par défaut vrai) décide de l'état initial : soumise ou brouillon.
 *
 * Envoie elle-même la réponse d'erreur et renvoie alors `null`.
 */
export const resolveCreationContext = async (req, res) => {
  const actor = await requireActor(req, res, PERMISSIONS.OFFER_CREATE);
  if (!actor) return null;

  const body = req.body || {};
  let operatorId = Number(body.operatorId);

  if (actor.role === ROLES.FOCAL_POINT) {
    if (!actor.operatorId) {
      res.status(403).json({ error: "Votre compte n'est rattaché à aucun opérateur.", code: "NO_OPERATOR" });
      return null;
    }
    if (body.operatorId && Number(body.operatorId) !== Number(actor.operatorId)) {
      res.status(403).json({
        error: "Vous ne pouvez déclarer une offre que pour votre propre opérateur.",
        code: "OPERATOR_SCOPE",
      });
      return null;
    }
    operatorId = Number(actor.operatorId);
  }

  if (!Number.isInteger(operatorId)) {
    res.status(400).json({ error: "L'opérateur de l'offre est obligatoire.", code: "OPERATOR_REQUIRED" });
    return null;
  }

  return { actor, operatorId, submit: body.submit !== false };
};

/** Fixe l'état initial (via le moteur) puis notifie, après réussite. */
export const finalizeCreatedOffer = async (offerId, actor, submit = true) => {
  const { events } = await initializeCreatedOffer(offerId, actor, { submit });
  await dispatchWorkflowEvents(events);
};
