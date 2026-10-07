import prisma from "@/services/config/auth/prisma";
import { FKTND_H } from "@/services/tools/constants";
import { requireActor } from "@/services/config/auth/session";
import { PERMISSIONS, canAssignRole } from "@/services/rbac/permissions";
import { PROFILE_CODE_TO_ROLE, ROLES } from "@/services/rbac/roles";
import { writeAudit, AUDIT_ACTIONS } from "@/services/workflow/audit";

/**
 * Gestion d'un compte utilisateur.
 *
 *   POST   /api/admin/user/:id   lecture
 *   PUT    /api/admin/user/:id   modification
 *   DELETE /api/admin/user/:id   suppression (compte sans aucune trace métier)
 *
 * Règles (appliquées ici, quel que soit l'écran appelant) :
 *  - identité et profil de l'appelant lus depuis la SESSION ;
 *  - gestion réservée au super administrateur et à l'administrateur ;
 *  - un administrateur ne peut ni désigner, ni modifier, ni supprimer un
 *    administrateur ou un super administrateur ;
 *  - personne ne modifie son propre profil ou son propre statut (on ne se
 *    retire pas ses droits, on ne s'en attribue pas) ni ne supprime son compte ;
 *  - un compte qui a produit des offres, des décisions ou des traces d'audit
 *    n'est jamais supprimé : il est désactivé ;
 *  - chaque création, modification et suppression est journalisée.
 */

const USER_STATUSES = ["PENDING", "ENABLE", "SUSPENDED", "DISABLE"];

const SAFE_USER_SELECT = {
  id: true,
  code: true,
  firstName: true,
  lastName: true,
  email: true,
  status: true,
  description: true,
  imagePath: true,
  profileId: true,
  createdAt: true,
  updatedAt: true,
  profile: true,
  focalPoint: { include: { operator: true } },
};

export default async function handler(req, res) {
  const userId = parseInt(req.query.id, 10);

  if (!["POST", "PUT", "DELETE"].includes(req.method)) {
    res.setHeader("Allow", ["POST", "PUT", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  if (req.body?.verskth != FKTND_H) {
    return res.status(405).json({ message: "Requête non autorisée" });
  }
  if (Number.isNaN(userId)) {
    return res.status(400).json({ error: "Identifiant invalide" });
  }

  const actor = await requireActor(req, res, PERMISSIONS.USER_MANAGE);
  if (!actor) return;

  const target = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      focalPoint: true,
      _count: {
        select: { offers: true, monitorings: true, validationDecisions: true, auditLogs: true },
      },
    },
  });
  if (!target) {
    return res.status(404).json({ error: "Cet utilisateur n'existe pas." });
  }
  const currentRole = PROFILE_CODE_TO_ROLE[target.profile?.code] || null;

  /* ---------------------------------------------------------------- lecture */
  if (req.method === "POST") {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: SAFE_USER_SELECT });
    return res.status(200).json(user);
  }

  /* ----------------------------------------------------------- modification */
  if (req.method === "PUT") {
    const {
      firstName,
      lastName,
      email,
      imagePath,
      profileId,
      operatorId,
      serialNumber,
      description,
      status,
    } = req.body;

    if (!email || !firstName || !profileId || !status) {
      return res.status(400).json({ error: "Tous les champs sont requis." });
    }
    if (!USER_STATUSES.includes(status)) {
      return res.status(400).json({ error: "Statut de compte invalide." });
    }

    const profile = await prisma.profile.findUnique({ where: { id: Number(profileId) } });
    if (!profile) {
      return res.status(400).json({ error: "Le profil sélectionné est introuvable." });
    }
    const targetRole = PROFILE_CODE_TO_ROLE[profile.code] || null;

    const assignable = canAssignRole(actor.role, targetRole, currentRole);
    if (!assignable.ok) {
      return res.status(403).json({ error: assignable.reason, code: "ROLE_ASSIGNMENT_FORBIDDEN" });
    }

    const isSelf = Number(actor.id) === userId;
    if (isSelf && (Number(profileId) !== target.profileId || status !== target.status)) {
      return res.status(403).json({
        error: "Vous ne pouvez pas modifier votre propre profil ni le statut de votre compte.",
        code: "SELF_ROLE_CHANGE",
      });
    }

    const isOperatorProfile = targetRole === ROLES.FOCAL_POINT;
    if (isOperatorProfile && (!operatorId || !String(serialNumber || "").trim())) {
      return res.status(400).json({
        error: "Un compte point focal requiert un opérateur et un identifiant (matricule).",
      });
    }

    try {
      const updatedUser = await prisma.$transaction(async (tx) => {
        const updated = await tx.user.update({
          where: { id: userId },
          data: {
            firstName,
            lastName,
            email,
            status,
            description,
            imagePath,
            profile: { connect: { id: Number(profileId) } },
          },
          select: SAFE_USER_SELECT,
        });

        if (isOperatorProfile) {
          await tx.focalPoint.upsert({
            where: { userId },
            update: {
              serialNumber: String(serialNumber),
              operator: { connect: { id: Number(operatorId) } },
            },
            create: {
              code: "FOC-" + Date.now(),
              serialNumber: String(serialNumber),
              status: "ENABLE",
              user: { connect: { id: userId } },
              operator: { connect: { id: Number(operatorId) } },
            },
          });
        }

        await writeAudit(tx, {
          action: AUDIT_ACTIONS.USER_UPDATE,
          entityType: "USER",
          entityId: userId,
          actor,
          fromStatus: target.status,
          toStatus: status,
          metadata: {
            fromRole: currentRole,
            toRole: targetRole,
            fromOperatorId: target.focalPoint?.operatorId ?? null,
            toOperatorId: isOperatorProfile ? Number(operatorId) : null,
          },
        });
        return updated;
      });

      return res.status(200).json(updatedUser);
    } catch (error) {
      if (error?.code === "P2002") {
        return res.status(400).json({ error: "Cette adresse e-mail est déjà utilisée par un autre compte." });
      }
      console.error("USER UPDATE ====>", error?.message);
      return res.status(500).json({ error: "La modification du compte a échoué." });
    }
  }

  /* ------------------------------------------------------------ suppression */
  if (Number(actor.id) === userId) {
    return res.status(403).json({ error: "Vous ne pouvez pas supprimer votre propre compte.", code: "SELF_DELETE" });
  }
  const deletable = canAssignRole(actor.role, currentRole, currentRole);
  if (!deletable.ok) {
    return res.status(403).json({ error: deletable.reason, code: "ROLE_ASSIGNMENT_FORBIDDEN" });
  }

  // Un compte qui a laissé une trace métier (offres, monitorings, décisions,
  // actions journalisées) ne se supprime pas : l'historique doit rester lisible.
  const c = target._count;
  if (c.offers > 0 || c.monitorings > 0 || c.validationDecisions > 0 || c.auditLogs > 0) {
    return res.status(409).json({
      error:
        "Cet utilisateur est rattaché à des offres, des décisions ou des actions tracées : " +
        "il ne peut pas être supprimé. Désactivez son compte.",
      code: "USER_HAS_TRACE",
    });
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Trace écrite AVANT la suppression (l'acteur reste identifié ; la ligne
      // survit à la suppression grâce à `onDelete: SetNull`).
      await writeAudit(tx, {
        action: AUDIT_ACTIONS.USER_DELETE,
        entityType: "USER",
        entityId: userId,
        actor,
        fromStatus: target.status,
        metadata: { email: target.email, role: currentRole },
      });
      await tx.focalPoint.deleteMany({ where: { userId } });
      await tx.restorePassword.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    });
    return res.status(204).end();
  } catch (error) {
    if (error?.code === "P2003") {
      return res.status(409).json({
        error: "Cet utilisateur est référencé ailleurs dans la plateforme et ne peut pas être supprimé.",
      });
    }
    console.error("USER DELETE ====>", error?.message);
    return res.status(500).json({ error: "La suppression du compte a échoué." });
  }
}
