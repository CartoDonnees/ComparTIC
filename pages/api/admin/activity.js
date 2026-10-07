import prisma from "@/services/config/auth/prisma";
import { requireActor } from "@/services/config/auth/session";
import { serverError } from "@/services/config/apiError";
import { PERMISSIONS } from "@/services/rbac/permissions";
import { ROLES, ROLE_LABELS } from "@/services/rbac/roles";
import { ACTIVITY_ACTIONS, ACTIVITY_DOMAINS, activityActionOf } from "@/services/audit/activityCatalog";
import { WORKFLOW_STATUS_STYLE } from "@/services/tools/workflowLabels";

/**
 * Journal d'activité de toute la plateforme    administration uniquement.
 *
 *   GET /api/admin/activity?page=&pageSize=&q=&domain=&action=&role=&actorId=&operatorId=&from=&to=
 *   GET /api/admin/activity?options=1        listes des filtres (auteurs, opérateurs)
 *   GET /api/admin/activity?format=csv&...   export des lignes filtrées
 *
 * Lecture seule : le journal d'audit n'expose aucune route de modification
 * ni de suppression. La permission AUDIT_READ (super administrateur et
 * administrateur) est vérifiée ici, indépendamment du menu et du middleware.
 */

const MAX_PAGE_SIZE = 100;
const MAX_EXPORT_ROWS = 10000;
const DAY = 24 * 60 * 60 * 1000;

const str = (v, max = 120) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const int = (v) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};
// Jour civil d'Abidjan (UTC+0, sans heure d'été) : minuit UTC.
const day = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(str(v)) ? new Date(`${v}T00:00:00.000Z`) : null);

const fullName = (u) => [u?.firstName, u?.lastName].filter(Boolean).join(" ") || u?.email || null;

/** Filtres communs ; `withScope` = domaine et action (exclus pour les compteurs par domaine). */
const buildWhere = (query, { withScope = true } = {}) => {
  const and = [];
  const domain = str(query.domain);
  const action = str(query.action);
  const role = str(query.role);
  const actorId = int(query.actorId);
  const operatorId = int(query.operatorId);
  const from = day(query.from);
  const to = day(query.to);
  const q = str(query.q, 100);

  if (withScope && ACTIVITY_DOMAINS[domain]) and.push({ entityType: domain });
  if (withScope && ACTIVITY_ACTIONS[action]) and.push({ action });
  if (ROLES[role]) and.push({ actorRole: role });
  if (actorId) and.push({ OR: [{ actorId }, { entityType: { in: ["USER", "SESSION"] }, entityId: actorId }] });
  if (operatorId) {
    and.push({
      OR: [
        { offer: { operatorId } },
        { entityType: "OPERATOR", entityId: operatorId },
        { actor: { focalPoint: { is: { operatorId } } } },
      ],
    });
  }
  if (from || to) and.push({ createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lt: new Date(to.getTime() + DAY) } : {}) } });
  if (q) {
    const contains = { contains: q, mode: "insensitive" };
    and.push({
      OR: [
        { offer: { code: contains } },
        { offer: { title: contains } },
        { actor: { firstName: contains } },
        { actor: { lastName: contains } },
        { actor: { email: contains } },
        { comment: contains },
        { metadata: { path: ["email"], string_contains: q.toLowerCase() } },
        { metadata: { path: ["name"], string_contains: q } },
        { metadata: { path: ["code"], string_contains: q } },
      ],
    });
  }
  return and.length ? { AND: and } : {};
};

const SELECT = {
  id: true,
  action: true,
  entityType: true,
  entityId: true,
  actorRole: true,
  fromStatus: true,
  toStatus: true,
  level: true,
  comment: true,
  metadata: true,
  createdAt: true,
  actor: { select: { id: true, firstName: true, lastName: true, email: true } },
  offer: { select: { id: true, code: true, title: true, operator: { select: { id: true, name: true } } } },
};

/** Cibles USER / OPERATOR / SESSION résolues en un aller-retour par type. */
const resolveTargets = async (rows) => {
  const userIds = new Set();
  const operatorIds = new Set();
  rows.forEach((r) => {
    if (!r.entityId) return;
    if (r.entityType === "USER" || r.entityType === "SESSION") userIds.add(r.entityId);
    if (r.entityType === "OPERATOR") operatorIds.add(r.entityId);
  });
  const [users, operators] = await Promise.all([
    userIds.size
      ? prisma.user.findMany({ where: { id: { in: [...userIds] } }, select: { id: true, firstName: true, lastName: true, email: true } })
      : [],
    operatorIds.size ? prisma.operator.findMany({ where: { id: { in: [...operatorIds] } }, select: { id: true, name: true, code: true } }) : [],
  ]);
  return { users: new Map(users.map((u) => [u.id, u])), operators: new Map(operators.map((o) => [o.id, o])) };
};

const shape = (r, targets) => {
  const meta = r.metadata && typeof r.metadata === "object" ? r.metadata : {};
  let target = null;
  if (r.offer) {
    target = { type: "OFFER", id: r.offer.id, label: r.offer.title, sub: r.offer.code, operator: r.offer.operator?.name || null, href: `/offer-workflow/${r.offer.id}` };
  } else if (r.entityType === "USER" || r.entityType === "SESSION") {
    const u = targets.users.get(r.entityId);
    const label = u ? fullName(u) : meta.email || (r.entityId ? `Compte #${r.entityId}` : null);
    target = label ? { type: "USER", id: r.entityId, label, sub: u?.email || meta.email || null, deleted: !u && !!r.entityId } : null;
  } else if (r.entityType === "OPERATOR") {
    const o = targets.operators.get(r.entityId);
    target = { type: "OPERATOR", id: r.entityId, label: o?.name || meta.name || `Opérateur #${r.entityId}`, sub: o?.code || meta.code || null, deleted: !o };
  } else if (r.entityType === "KNOWLEDGE") {
    target = { type: "KNOWLEDGE", id: r.entityId, label: meta.name || `Document #${r.entityId}`, sub: meta.reference || meta.kindLabel || null };
  } else if (r.entityType === "REFERENTIAL") {
    target = { type: "REFERENTIAL", id: r.entityId, label: meta.name || `Élément #${r.entityId}`, sub: meta.kindLabel || null };
  } else if (r.entityType === "OFFER" && r.entityId) {
    // Offre supprimée : la trace survit (SetNull), les métadonnées gardent son nom.
    target = { type: "OFFER", id: null, label: meta.title || `Offre #${r.entityId}`, sub: meta.code || null, deleted: true };
  }
  return {
    id: r.id,
    createdAt: r.createdAt,
    action: r.action,
    domain: r.entityType,
    actor: r.actor ? { id: r.actor.id, name: fullName(r.actor), email: r.actor.email } : null,
    actorRole: r.actorRole,
    target,
    fromStatus: r.fromStatus,
    toStatus: r.toStatus,
    level: r.level,
    comment: r.comment,
    metadata: meta,
  };
};

const csvCell = (v) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const statusLabel = (s) => (s ? WORKFLOW_STATUS_STYLE[s]?.label || s : "");

const sendCsv = (res, items) => {
  const header = ["Date (Abidjan)", "Domaine", "Action", "Auteur", "E-mail de l'auteur", "Rôle", "Cible", "Référence", "Opérateur", "Statut avant", "Statut après", "Niveau", "Commentaire", "Adresse IP"];
  const fmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "medium", timeZone: "Africa/Abidjan" });
  const lines = items.map((i) =>
    [
      fmt.format(new Date(i.createdAt)),
      ACTIVITY_DOMAINS[i.domain]?.label || i.domain,
      activityActionOf(i.action).label,
      i.actor?.name || (i.domain === "SESSION" ? "" : "Système"),
      i.actor?.email || "",
      ROLE_LABELS[i.actorRole] || i.actorRole || "",
      i.target?.label || "",
      i.target?.sub || "",
      i.target?.operator || "",
      statusLabel(i.fromStatus),
      statusLabel(i.toStatus),
      i.level ?? "",
      i.comment || "",
      i.metadata?.ip || "",
    ]
      .map(csvCell)
      .join(";"),
  );
  const stamp = new Date().toISOString().slice(0, 10);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="journal_activite_${stamp}.csv"`);
  // BOM : accents corrects à l'ouverture dans Excel.
  return res.status(200).send(`﻿${[header.join(";"), ...lines].join("\r\n")}`);
};

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  const actor = await requireActor(req, res, PERMISSIONS.AUDIT_READ);
  if (!actor) return undefined;

  try {
    if (req.query.options) {
      const [actors, operators] = await Promise.all([
        prisma.user.findMany({
          where: { auditLogs: { some: {} } },
          select: { id: true, firstName: true, lastName: true, email: true },
          orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
          take: 1000,
        }),
        prisma.operator.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
      ]);
      return res.status(200).json({
        actors: actors.map((u) => ({ id: u.id, name: fullName(u), email: u.email })),
        operators,
      });
    }

    const where = buildWhere(req.query);

    if (req.query.format === "csv") {
      const rows = await prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, take: MAX_EXPORT_ROWS, select: SELECT });
      const targets = await resolveTargets(rows);
      return sendCsv(res, rows.map((r) => shape(r, targets)));
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(10, Number(req.query.pageSize) || 25));
    const base = buildWhere(req.query, { withScope: false });
    const and = (extra) => ({ AND: [base, extra] });
    const todayStart = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00.000Z");

    const [total, rows, byDomain, failedLogins, today, actorGroups] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * pageSize, take: pageSize, select: SELECT }),
      prisma.auditLog.groupBy({ by: ["entityType"], where: base, _count: { _all: true } }),
      prisma.auditLog.count({ where: and({ action: "LOGIN_FAILED" }) }),
      prisma.auditLog.count({ where: { AND: [where, { createdAt: { gte: todayStart } }] } }),
      prisma.auditLog.groupBy({ by: ["actorId"], where: { AND: [where, { actorId: { not: null } }] } }),
    ]);
    const targets = await resolveTargets(rows);

    return res.status(200).json({
      page,
      pageSize,
      total,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
      summary: {
        total,
        today,
        actors: actorGroups.length,
        failedLogins,
        byDomain: Object.fromEntries(byDomain.map((g) => [g.entityType, g._count._all])),
        all: byDomain.reduce((n, g) => n + g._count._all, 0),
      },
      items: rows.map((r) => shape(r, targets)),
    });
  } catch (error) {
    return serverError(res, error, "Journal d'activité");
  }
}
