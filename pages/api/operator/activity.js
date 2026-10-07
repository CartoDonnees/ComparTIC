import prisma from "@/services/config/auth/prisma";
import { requireActor } from "@/services/config/auth/session";
import { serverError } from "@/services/config/apiError";
import { PERMISSIONS } from "@/services/rbac/permissions";
import { ROLES, isAdministration } from "@/services/rbac/roles";
import { OPERATOR_EVENT_ACTIONS, operatorEvent } from "@/services/workflow/operatorView";

/**
 * Journal d'activité des offres d'un opérateur.
 *
 *   GET /api/operator/activity?page=1&pageSize=25[&offerId=][&action=]
 *
 * Le point focal suit l'avancement de SES offres sans solliciter l'ARTCI :
 * dépôt, soumission, validations successives, refus, monitoring,
 * désactivation, alertes de délai. Le journal d'audit existait déjà mais
 * n'était lisible que par l'administration.
 *
 * Périmètre : les offres de l'opérateur de l'utilisateur, jamais d'autres.
 * L'administration et le superviseur peuvent consulter un opérateur donné
 * (`operatorId`) à des fins de support.
 *
 * Confidentialité : le circuit de validation est interne à l'ARTCI. Le point
 * focal ne reçoit que les étapes de la vie de l'offre (déclaration,
 * modification, soumission, décision, versions, désactivation), sans niveau
 * de validation ni identité de l'agent qui a statué
 * (`services/workflow/operatorView.js`). L'administration garde le journal complet.
 */

const MAX_PAGE_SIZE = 100;

/** Actions visibles par l'opérateur (les actions internes sont masquées). */
const VISIBLE_ACTIONS = [
  "CREATE",
  "UPDATE",
  "SUBMIT",
  "VALIDATE_TRANSMIT",
  "VALIDATE_FINAL",
  "REFUSE",
  "MONITORING",
  "VERSION_CREATED",
  "DEACTIVATE",
  "REACTIVATE",
  "DEADLINE_ALERT",
  "LEGACY_IMPORT",
];

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  const actor = await requireActor(req, res, PERMISSIONS.HISTORY_READ);
  if (!actor) return undefined;

  // Périmètre opérateur : imposé pour un point focal, choisi (ou non) par
  // l'administration et le superviseur.
  let operatorId = null;
  if (actor.role === ROLES.FOCAL_POINT) {
    operatorId = actor.operatorId ?? -1;
  } else if (isAdministration(actor.role) || actor.role === ROLES.SUPERVISOR) {
    operatorId = req.query.operatorId ? Number(req.query.operatorId) : null;
  } else {
    return res.status(403).json({ error: "Journal réservé aux points focaux et à l'ARTCI.", code: "FORBIDDEN" });
  }

  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(5, Number(req.query.pageSize) || 25));
  const forOperator = actor.role === ROLES.FOCAL_POINT;
  const visible = forOperator ? OPERATOR_EVENT_ACTIONS : VISIBLE_ACTIONS;
  const action = visible.includes(req.query.action) ? req.query.action : null;
  const offerId = req.query.offerId ? Number(req.query.offerId) : null;

  const where = {
    entityType: "OFFER",
    action: action ? action : { in: visible },
    offer: {
      ...(operatorId ? { operatorId } : {}),
      ...(offerId ? { id: offerId } : {}),
    },
  };

  try {
    const [total, entries] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          action: true,
          level: true,
          fromStatus: true,
          toStatus: true,
          comment: true,
          createdAt: true,
          actorRole: true,
          actor: { select: { firstName: true, lastName: true } },
          offer: {
            select: {
              id: true,
              code: true,
              title: true,
              workflowStatus: true,
              currentValidationLevel: true,
              specialPromotion: { select: { type: true } },
            },
          },
        },
      }),
    ]);

    return res.status(200).json({
      page,
      pageSize,
      total,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
      items: entries.map((e) => {
        const offer = e.offer
          ? {
              id: e.offer.id,
              code: e.offer.code,
              title: e.offer.title,
              workflowStatus: e.offer.workflowStatus,
              offerType: e.offer.specialPromotion ? "PROMOTION" : "BASE",
            }
          : null;
        // Point focal : étape réduite à ce qu'il peut lire (ni niveau, ni agent).
        if (forOperator) return { ...operatorEvent(e), createdAt: e.createdAt, offer };
        return {
          id: e.id,
          action: e.action,
          level: e.level,
          fromStatus: e.fromStatus,
          toStatus: e.toStatus,
          comment: e.comment,
          createdAt: e.createdAt,
          actorRole: e.actorRole,
          offer: offer ? { ...offer, currentValidationLevel: e.offer.currentValidationLevel } : null,
        };
      }),
    });
  } catch (error) {
    return serverError(res, error, "Journal d'activité");
  }
}
