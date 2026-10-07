import prisma from "@/services/config/auth/prisma";
import { requireActor } from "@/services/config/auth/session";
import { PERMISSIONS } from "@/services/rbac/permissions";
import { ROLES, validatorLevelOf, isAdministration } from "@/services/rbac/roles";
import { finalLevelOf } from "@/services/workflow/offerWorkflow";

/**
 * GET /api/workflow/queue
 * File de validation : offres qui attendent une décision de l'utilisateur
 * connecté (son niveau pour un validateur, tout niveau pour l'administration),
 * et, en lecture, l'ensemble des offres en cours pour le superviseur.
 */
export default async function handler(req, res) {
  // État de workflow : jamais mis en cache (navigateur ou intermédiaire).
  res.setHeader("Cache-Control", "no-store, max-age=0");
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Méthode non autorisée." });
  }
  const actor = await requireActor(req, res, PERMISSIONS.OFFER_READ);
  if (!actor) return;

  const where = { workflowStatus: { in: ["SUBMITTED", "IN_VALIDATION"] } };
  const level = validatorLevelOf(actor.role);
  if (level) where.currentValidationLevel = level;
  else if (actor.role === ROLES.FOCAL_POINT) where.operatorId = actor.operatorId ?? -1;
  else if (!isAdministration(actor.role) && actor.role !== ROLES.SUPERVISOR) where.id = -1;

  const offers = await prisma.offer.findMany({
    where,
    orderBy: [{ submittedAt: "asc" }, { id: "asc" }],
    select: {
      id: true, code: true, title: true, category: true, billingType: true,
      workflowStatus: true, currentValidationLevel: true, submittedAt: true, version: true, sourceOfferId: true,
      operator: { select: { id: true, name: true, color: true, imagePath: true } },
      specialPromotion: { select: { id: true, type: true } },
      _count: { select: { decisions: true } },
    },
  });

  return res.status(200).json({
    role: actor.role,
    level,
    items: offers.map((o) => ({
      ...o,
      offerType: o.specialPromotion ? "PROMOTION" : "BASE",
      finalLevel: finalLevelOf(o),
      canDecide: isAdministration(actor.role) || (level !== null && level === o.currentValidationLevel),
    })),
  });
}
