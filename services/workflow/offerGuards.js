import prisma from "@/services/config/auth/prisma";
import { requireActor } from "@/services/config/auth/session";
import { PERMISSIONS } from "@/services/rbac/permissions";
import { ROLES } from "@/services/rbac/roles";
import {
  WORKFLOW_ACTIONS,
  loadOfferContext,
  assertAction,
  isInOperatorScope,
} from "@/services/workflow/offerWorkflow";
import { sendError } from "@/services/workflow/apiErrors";

/**
 * Barrière des sous-routes qui écrivent le CONTENU d'une offre (zone,
 * formules, modes d'accès, avantages, purge avant ré-enregistrement).
 *
 * Mêmes règles que la modification : session valide, permission OFFER_UPDATE,
 * opérateur du point focal, et aucune décision de validation enregistrée.
 * Appeler ces routes directement ne permet donc pas de contourner le workflow.
 *
 * Envoie elle-même la réponse d'erreur et renvoie alors `null`.
 *
 * @returns {Promise<{actor:object, offer:object}|null>}
 */
export const requireEditableOffer = async (req, res, offerId) => {
  const actor = await requireActor(req, res, PERMISSIONS.OFFER_UPDATE);
  if (!actor) return null;

  const id = Number(offerId);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "L'identifiant de l'offre est requis.", code: "OFFER_ID_REQUIRED" });
    return null;
  }
  try {
    const offer = await loadOfferContext(prisma, id);
    assertAction(offer, actor, WORKFLOW_ACTIONS.EDIT);
    return { actor, offer };
  } catch (error) {
    sendError(res, error, "requireEditableOffer");
    return null;
  }
};

/**
 * Barrière de lecture d'une offre précise : session, permission OFFER_READ et,
 * pour un point focal, appartenance à son opérateur.
 */
export const requireReadableOffer = async (req, res, offerId) => {
  const actor = await requireActor(req, res, PERMISSIONS.OFFER_READ);
  if (!actor) return null;
  const offer = await loadOfferContext(prisma, Number(offerId));
  if (!offer) {
    res.status(404).json({ error: "Offre introuvable.", code: "NOT_FOUND" });
    return null;
  }
  if (!isInOperatorScope(actor, offer)) {
    res.status(403).json({ error: "Cette offre n'appartient pas à votre opérateur.", code: "OPERATOR_SCOPE" });
    return null;
  }
  return { actor, offer };
};

/**
 * Filtre Prisma limitant une liste d'offres au périmètre de l'acteur :
 * son opérateur pour un point focal, tout pour les autres profils autorisés.
 */
export const offerScopeWhere = (actor) =>
  actor?.role === ROLES.FOCAL_POINT
    ? { operatorId: Number(actor.operatorId) || -1 }
    : {};
