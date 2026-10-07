import prisma from "@/services/config/auth/prisma";
import { FKTND_H } from "@/services/tools/constants";
import { readSession, isAdminUser } from "@/services/config/auth/session";
import { notify, NOTIFICATION_TYPES } from "@/services/config/notifications";

/**
 * Gestion des notifications   RÉSERVÉE À L'ADMINISTRATEUR.
 *
 * L'accès est contrôlé ICI, à partir de la session signée (cookie httpOnly) et
 * du profil relu en base : masquer l'entrée du menu ou protéger la page ne
 * suffirait pas, un appel direct à cette route resterait possible. Le
 * superviseur, qui partage pourtant le menu d'administration, est refusé.
 *
 * POST { action: "list",    page, pageSize, filters }  -> liste paginée + indicateurs
 * POST { action: "options" }                           -> destinataires possibles
 * POST { action: "setRead", ids, read }                -> marque lu / non lu
 * POST { action: "delete",  ids }                      -> supprime
 * POST { action: "send",    title, content, link, audience } -> envoie un message
 */

const MAX_IDS = 500;
const TITLE_MAX = 150;
const CONTENT_MAX = 2000;

/** Identifiants entiers, dédoublonnés, bornés. */
const cleanIds = (ids) =>
  [...new Set((Array.isArray(ids) ? ids : []).map(Number).filter(Number.isInteger))].slice(
    0,
    MAX_IDS,
  );

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

/** « non lue » : `read` vaut false, ou n'a jamais été renseigné. */
const UNREAD = { OR: [{ read: false }, { read: null }] };

const buildWhere = (filters = {}) => {
  const and = [];
  const { search, type, read, profile, from, to } = filters || {};

  if (type && type !== "ALL") and.push({ type: String(type) });
  if (read === "READ") and.push({ read: true });
  if (read === "UNREAD") and.push(UNREAD);
  if (profile && profile !== "ALL") {
    and.push({ to: { some: { profile: { code: String(profile) } } } });
  }

  const range = {};
  if (from) {
    const d = new Date(from);
    if (!Number.isNaN(d.getTime())) range.gte = d;
  }
  if (to) {
    const d = new Date(to);
    if (!Number.isNaN(d.getTime())) {
      d.setHours(23, 59, 59, 999); // borne haute inclusive
      range.lte = d;
    }
  }
  if (Object.keys(range).length) and.push({ createdAt: range });

  const needle = String(search || "").trim();
  if (needle) {
    const c = { contains: needle, mode: "insensitive" };
    and.push({
      OR: [
        { title: c },
        { content: c },
        { to: { some: { OR: [{ email: c }, { firstName: c }, { lastName: c }] } } },
      ],
    });
  }

  return and.length ? { AND: and } : {};
};

const RECIPIENT_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  profile: { select: { code: true, name: true } },
  focalPoint: { select: { operator: { select: { name: true } } } },
};

/** Utilisateurs ACTIFS visés par une audience. */
const resolveAudience = async (audience = {}) => {
  const base = { status: "ENABLE" };
  switch (audience?.kind) {
    case "ALL":
      return prisma.user.findMany({ where: base, select: { id: true } });
    case "PROFILE":
      if (!audience.profileCode) return [];
      return prisma.user.findMany({
        where: { ...base, profile: { code: String(audience.profileCode) } },
        select: { id: true },
      });
    case "OPERATOR":
      if (!audience.operatorId) return [];
      return prisma.user.findMany({
        where: { ...base, focalPoint: { operatorId: Number(audience.operatorId) } },
        select: { id: true },
      });
    case "USERS": {
      const ids = cleanIds(audience.userIds);
      if (!ids.length) return [];
      return prisma.user.findMany({
        where: { ...base, id: { in: ids } },
        select: { id: true },
      });
    }
    default:
      return [];
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const body = req.body || {};
  if (body.verskth != FKTND_H) {
    return res.status(405).json({ error: "Requête non autorisée" });
  }

  const { user: admin, unavailable } = await readSession(req);
  if (unavailable) {
    return res.status(503).json({ error: "Service momentanément indisponible. Réessayez dans quelques instants.", code: "SERVICE_UNAVAILABLE" });
  }
  if (!admin) {
    return res.status(401).json({ error: "Session expirée. Reconnectez-vous." });
  }
  if (!isAdminUser(admin)) {
    return res
      .status(403)
      .json({ error: "La gestion des notifications est réservée à l'administrateur." });
  }

  const action = body.action || "list";

  try {
    /* ------------------------------------------------------------------ */
    if (action === "list") {
      const pageSize = Math.min(Math.max(Number(body.pageSize) || 20, 5), 100);
      const where = buildWhere(body.filters);
      const total = await prisma.notification.count({ where });
      const pages = Math.max(Math.ceil(total / pageSize), 1);
      const page = Math.min(Math.max(Number(body.page) || 1, 1), pages);

      const [rows, all, unread, today, byTypeRaw] = await Promise.all([
        prisma.notification.findMany({
          where,
          // L'identifiant départage les notifications de même date : un envoi
          // groupé les crée toutes dans une seule transaction, avec la même
          // `createdAt`. Sans ce second critère, l'ordre entre elles n'est pas
          // garanti et une notification pouvait figurer sur deux pages   ou sur
          // aucune.
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true,
            code: true,
            from: true,
            type: true,
            title: true,
            content: true,
            link: true,
            read: true,
            createdAt: true,
            to: { select: RECIPIENT_SELECT },
          },
        }),
        prisma.notification.count(),
        prisma.notification.count({ where: UNREAD }),
        prisma.notification.count({ where: { createdAt: { gte: startOfToday() } } }),
        prisma.notification.groupBy({ by: ["type"], _count: { type: true } }),
      ]);

      const byType = Object.fromEntries(
        byTypeRaw.map((r) => [r.type || "UNKNOWN", r._count.type]),
      );

      return res.status(200).json({
        items: rows.map((n) => ({
          ...n,
          read: n.read === true,
          recipients: n.to.map((u) => ({
            id: u.id,
            name: [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email,
            email: u.email,
            profileCode: u.profile?.code ?? null,
            profileName: u.profile?.name ?? null,
            operatorName: u.focalPoint?.operator?.name ?? null,
          })),
          to: undefined,
        })),
        total,
        page,
        pageSize,
        pages,
        stats: { total: all, unread, today, byType },
      });
    }

    /* ------------------------------------------------------------------ */
    if (action === "options") {
      const [users, operators, profiles] = await Promise.all([
        prisma.user.findMany({
          where: { status: "ENABLE" },
          orderBy: [{ firstName: "asc" }],
          select: RECIPIENT_SELECT,
        }),
        prisma.operator.findMany({
          orderBy: { name: "asc" },
          select: { id: true, name: true, _count: { select: { focalPoints: true } } },
        }),
        prisma.profile.findMany({
          orderBy: { code: "asc" },
          select: { code: true, name: true, _count: { select: { users: true } } },
        }),
      ]);
      return res.status(200).json({
        users: users.map((u) => ({
          id: u.id,
          label: [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email,
          email: u.email,
          profileCode: u.profile?.code ?? null,
          profileName: u.profile?.name ?? null,
          operatorName: u.focalPoint?.operator?.name ?? null,
        })),
        operators: operators.map((o) => ({
          id: o.id,
          name: o.name,
          focalPoints: o._count.focalPoints,
        })),
        profiles: profiles.map((p) => ({
          code: p.code,
          name: p.name,
          users: p._count.users,
        })),
      });
    }

    /* ------------------------------------------------------------------ */
    if (action === "setRead") {
      const ids = cleanIds(body.ids);
      if (!ids.length) return res.status(400).json({ error: "Aucune notification désignée." });
      const result = await prisma.notification.updateMany({
        where: { id: { in: ids } },
        data: { read: body.read !== false },
      });
      return res.status(200).json({ success: true, updated: result.count });
    }

    /* ------------------------------------------------------------------ */
    if (action === "delete") {
      const ids = cleanIds(body.ids);
      if (!ids.length) return res.status(400).json({ error: "Aucune notification désignée." });
      // Les liens destinataires (table de jointure implicite) suivent la
      // suppression : aucune ligne orpheline ne subsiste.
      const result = await prisma.notification.deleteMany({ where: { id: { in: ids } } });
      return res.status(200).json({ success: true, deleted: result.count });
    }

    /* ------------------------------------------------------------------ */
    if (action === "send") {
      const title = String(body.title || "").trim();
      const content = String(body.content || "").trim();
      const link = String(body.link || "").trim();

      if (!title) return res.status(400).json({ error: "L'objet du message est obligatoire." });
      if (title.length > TITLE_MAX) {
        return res.status(400).json({ error: `L'objet ne doit pas dépasser ${TITLE_MAX} caractères.` });
      }
      if (!content) return res.status(400).json({ error: "Le message est obligatoire." });
      if (content.length > CONTENT_MAX) {
        return res.status(400).json({ error: `Le message ne doit pas dépasser ${CONTENT_MAX} caractères.` });
      }
      // Lien INTERNE uniquement : une notification officielle de l'ARTCI ne
      // doit pas pouvoir renvoyer vers un site extérieur.
      if (link && !/^\/(?!\/)[\w\-/?=&.#%]*$/.test(link)) {
        return res.status(400).json({
          error: "Le lien doit être une adresse interne de la plateforme, commençant par « / ».",
        });
      }

      const recipients = await resolveAudience(body.audience);
      if (!recipients.length) {
        return res.status(400).json({ error: "Aucun utilisateur actif ne correspond à ces destinataires." });
      }

      const author = [admin.firstName, admin.lastName].filter(Boolean).join(" ");
      const result = await notify({
        userIds: recipients.map((r) => r.id),
        type: NOTIFICATION_TYPES.ADMIN_MESSAGE,
        title,
        content,
        link: link || null,
        from: author ? `ARTCI   ${author}` : "ARTCI",
      });

      if (result.error) {
        return res.status(500).json({ error: "Le message n'a pas pu être enregistré." });
      }
      return res.status(200).json({ success: true, created: result.created });
    }

    return res.status(400).json({ error: "Action inconnue." });
  } catch (error) {
    console.error("Gestion des notifications :", error?.message);
    return res.status(500).json({ error: "Erreur lors du traitement des notifications." });
  }
}
