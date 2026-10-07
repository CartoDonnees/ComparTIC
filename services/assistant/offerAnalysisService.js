import prisma from "@/services/config/auth/prisma";
import { OFFER_LIST_INCLUDE } from "@/services/offers/offerListInclude";
import { buildOfferText } from "@/services/tools/helper";
import { askRag } from "@/services/assistant/ragClient";
import { WorkflowError, WORKFLOW_ACTIONS, getAvailableActions, loadOfferContext } from "@/services/workflow/offerWorkflow";
import { PERMISSIONS, can } from "@/services/rbac/permissions";

/**
 * Analyse IA d'une offre, CONSERVÉE.
 *
 * La première analyse est enregistrée et devient la référence de l'offre :
 * les validateurs suivants la consultent sans qu'aucun calcul ne soit
 * relancé. Une nouvelle analyse n'a lieu que sur demande explicite ; elle
 * s'ajoute à l'historique sans effacer les précédentes.
 *
 * Le texte soumis au service d'analyse est construit ICI, à partir de l'offre
 * en base (jamais à partir d'un texte envoyé par le navigateur).
 */

const SELECT = {
  id: true,
  content: true,
  level: true,
  durationMs: true,
  createdAt: true,
  requestedBy: { select: { id: true, firstName: true, lastName: true } },
};

/** Contrôle le droit de voir l'offre (périmètre) et la renvoie. */
const visibleOffer = async (offerId, actor) => {
  const offer = await loadOfferContext(prisma, offerId);
  if (!offer) throw new WorkflowError(404, "NOT_FOUND", "Offre introuvable.");
  if (!getAvailableActions(offer, actor).includes(WORKFLOW_ACTIONS.VIEW)) {
    throw new WorkflowError(403, "OPERATOR_SCOPE", "Cette offre n'appartient pas à votre opérateur.");
  }
  return offer;
};

/** Texte de l'offre tel qu'il est soumis à l'analyse. */
export const offerAnalysisInput = async (offerId) => {
  const full = await prisma.offer.findUnique({ where: { id: Number(offerId) }, include: OFFER_LIST_INCLUDE });
  if (!full) throw new WorkflowError(404, "NOT_FOUND", "Offre introuvable.");
  try {
    return buildOfferText(full);
  } catch {
    return `Offre « ${full.title} » de l'opérateur ${full.operator?.name || ""}.`;
  }
};

/** Analyse de référence (la plus récente) et historique. */
export const getOfferAnalyses = async (offerId, actor) => {
  const offer = await visibleOffer(offerId, actor);
  const list = await prisma.offerAiAnalysis.findMany({ where: { offerId: offer.id }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: SELECT });
  const actions = getAvailableActions(offer, actor);
  const mustDecide = [WORKFLOW_ACTIONS.VALIDATE_TRANSMIT, WORKFLOW_ACTIONS.VALIDATE_FINAL, WORKFLOW_ACTIONS.REFUSE].some((a) => actions.includes(a));
  const canRun = can(actor.role, PERMISSIONS.AI_ANALYSIS_RUN);
  return {
    offerId: offer.id,
    latest: list[0] || null,
    history: list.slice(1),
    count: list.length,
    canRun,
    // Première analyse : lancée une seule fois, à l'ouverture par le
    // validateur dont la décision est attendue. Ensuite, plus jamais
    // d'analyse automatique : elle est lue, ou redemandée volontairement.
    autoRun: canRun && !list.length && mustDecide,
  };
};

/** Demande une analyse au service, puis l'enregistre. */
export const runOfferAnalysis = async (offerId, actor, { signal = null } = {}) => {
  const offer = await visibleOffer(offerId, actor);
  const input = await offerAnalysisInput(offer.id);
  const res = await askRag({ question: input, history: [{ role: "user", content: input }], signal });
  if (!res.ok) throw new WorkflowError(res.status || 502, res.aborted ? "ABORTED" : "ANALYSIS_UNAVAILABLE", res.error);
  const created = await prisma.offerAiAnalysis.create({
    data: {
      content: res.answer,
      input,
      level: offer.currentValidationLevel ?? null,
      durationMs: res.durationMs,
      offer: { connect: { id: offer.id } },
      requestedBy: { connect: { id: actor.id } },
    },
    select: SELECT,
  });
  return created;
};
