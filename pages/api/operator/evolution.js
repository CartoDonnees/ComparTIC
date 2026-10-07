import prisma from "@/services/config/auth/prisma";
import { requireActor } from "@/services/config/auth/session";
import { serverError } from "@/services/config/apiError";
import { PERMISSIONS } from "@/services/rbac/permissions";
import { ROLES } from "@/services/rbac/roles";
import { OFFER_CONTEXT_SELECT } from "@/services/workflow/offerWorkflow";
import { SENTINEL_OFFER_CODE, isPublishedOffer } from "@/services/workflow/publication";
import { OPERATOR_EVENT_ACTIONS, operatorEvent } from "@/services/workflow/operatorView";
import { EVOLUTION_FILTERS, buildLineages, offerSummary, presentState, versionChanges } from "@/services/offers/offerEvolution";

/**
 * Évolution des offres d'un opérateur (« Suivi de mes offres »).
 *
 *   GET /api/operator/evolution?page=1&pageSize=8[&q=][&status=REVIEW|VALIDATED|REFUSED|DEACTIVATED|DRAFT]
 *
 * Chaque élément est une offre avec ses versions successives : l'état actuel
 * (le présent), les versions précédentes et ce qui a changé de l'une à
 * l'autre, et les étapes marquantes (déclaration, soumission, décision,
 * désactivation). C'est l'évolution de l'OFFRE, pas celle de sa validation :
 * aucun niveau, aucune décision intermédiaire, aucun nom de validateur.
 *
 * Réservé aux points focaux, sur les offres de leur opérateur uniquement.
 */

const MAX_PAGE_SIZE = 30;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  const actor = await requireActor(req, res, PERMISSIONS.HISTORY_READ);
  if (!actor) return undefined;
  if (actor.role !== ROLES.FOCAL_POINT) {
    return res.status(403).json({ error: "Le suivi des offres est réservé aux opérateurs.", code: "FORBIDDEN" });
  }
  if (!actor.operatorId) {
    return res.status(403).json({ error: "Votre compte n'est rattaché à aucun opérateur.", code: "NO_OPERATOR" });
  }

  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(3, Number(req.query.pageSize) || 8));
  const q = String(req.query.q ?? "").trim().toLowerCase().slice(0, 80);
  const family = EVOLUTION_FILTERS[req.query.status] ? req.query.status : null;

  try {
    const offers = await prisma.offer.findMany({
      where: { operatorId: Number(actor.operatorId), code: { not: SENTINEL_OFFER_CODE } },
      select: { ...OFFER_CONTEXT_SELECT, billingType: true, category: true, createdAt: true, updatedAt: true },
    });

    // Lignées : la première version de chaque groupe est la version actuelle.
    const lineages = buildLineages(offers)
      .filter((versions) => !q || versions.some((v) => `${v.title} ${v.code}`.toLowerCase().includes(q)))
      .sort((a, b) => Math.max(...b.map((v) => new Date(v.updatedAt).getTime())) - Math.max(...a.map((v) => new Date(v.updatedAt).getTime())));

    const counts = { ALL: lineages.length };
    Object.entries(EVOLUTION_FILTERS).forEach(([name, statuses]) => {
      counts[name] = lineages.filter((versions) => statuses.includes(versions[0].workflowStatus)).length;
    });

    const filtered = family ? lineages.filter((versions) => EVOLUTION_FILTERS[family].includes(versions[0].workflowStatus)) : lineages;
    const total = filtered.length;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const current = Math.min(page, pageCount);
    const shown = filtered.slice((current - 1) * pageSize, current * pageSize);
    const ids = shown.flat().map((v) => v.id);

    const [formulas, audit] = ids.length
      ? await Promise.all([
          prisma.offerFormula.findMany({
            where: { offerId: { in: ids } },
            orderBy: { id: "asc" },
            select: { offerId: true, title: true, validity: true, price: { select: { value: true } } },
          }),
          prisma.auditLog.findMany({
            where: { offerId: { in: ids }, action: { in: OPERATOR_EVENT_ACTIONS } },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            select: { id: true, offerId: true, action: true, comment: true, createdAt: true, actorRole: true, actor: { select: { firstName: true, lastName: true } } },
          }),
        ])
      : [[], []];

    const formulasOf = (offerId) => formulas.filter((f) => f.offerId === offerId);
    const items = shown.map((versions) => {
      const full = versions.map((v) => ({ ...v, formulas: formulasOf(v.id) }));
      return {
        id: full[0].id,
        versions: full.map((v, index) => {
          const published = isPublishedOffer(v);
          return {
            id: v.id,
            code: v.code,
            title: v.title,
            version: v.version || 1,
            current: index === 0,
            workflowStatus: v.workflowStatus,
            deactivationReason: v.deactivationReason,
            offerType: v.specialPromotion ? "PROMOTION" : "BASE",
            published,
            state: presentState(v, { published }),
            summary: offerSummary(v),
            createdAt: v.createdAt,
            // Ce que cette version a changé par rapport à la précédente.
            changes: versionChanges(full[index + 1], v),
            events: audit.filter((a) => a.offerId === v.id).map(operatorEvent).filter(Boolean),
          };
        }),
      };
    });

    return res.status(200).json({ page: current, pageSize, total, pageCount, counts, items });
  } catch (error) {
    return serverError(res, error, "Suivi des offres");
  }
}
