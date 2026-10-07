import { guardRoute } from "@/services/rbac/guardRoute";
import { PERMISSIONS } from "@/services/rbac/permissions";
import prisma from "@/services/config/auth/prisma";
import { FKTND_H } from "@/services/tools/constants";
import { validateOperator } from "@/services/tools/operatorValidation";
import { writeAudit, AUDIT_ACTIONS } from "@/services/workflow/audit";

/**
 * Un opérateur  - lecture, modification, suppression.
 *
 *   GET    /api/admin/operator/:id
 *   PUT    /api/admin/operator/:id   { name, type, color, status, description, imagePath }
 *   DELETE /api/admin/operator/:id   (uniquement sans offre ni point focal ; sinon : désactiver)
 *
 * Le code d'un opérateur n'est pas modifiable : il sert de référence stable.
 */
async function handler(req, res) {
  const id = parseInt(req.query.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: "Identifiant invalide." });

  const current = await prisma.operator.findUnique({
    where: { id },
    include: { _count: { select: { offers: true, focalPoints: true } } },
  });
  if (!current) return res.status(404).json({ error: "Opérateur introuvable." });

  if (req.method === "GET") {
    return res.status(200).json(current);
  }

  if (req.method === "PUT") {
    if (req.body?.verskth != FKTND_H) {
      return res.status(405).json({ message: "Requête non autorisée" });
    }
    const check = validateOperator(req.body);
    if (!check.ok) {
      return res.status(400).json({ error: Object.values(check.errors)[0], errors: check.errors });
    }
    try {
      const duplicate = await prisma.operator.findFirst({
        where: { id: { not: id }, name: { equals: check.data.name, mode: "insensitive" } },
        select: { name: true },
      });
      if (duplicate) {
        const message = `L'opérateur « ${duplicate.name} » existe déjà.`;
        return res.status(409).json({ error: message, errors: { name: message } });
      }
      const updated = await prisma.$transaction(async (tx) => {
        const saved = await tx.operator.update({ where: { id }, data: check.data });
        const changed = Object.keys(check.data).filter((k) => String(check.data[k] ?? "") !== String(current[k] ?? ""));
        await writeAudit(tx, {
          action: AUDIT_ACTIONS.OPERATOR_UPDATE,
          entityType: "OPERATOR",
          entityId: id,
          actor: req.actor,
          fromStatus: current.status,
          toStatus: saved.status,
          metadata: { changed },
        });
        return saved;
      });
      return res.status(200).json(updated);
    } catch (error) {
      console.error("OPERATOR UPDATE :", error?.message);
      return res.status(500).json({ error: "La modification de l'opérateur a échoué." });
    }
  }

  if (req.method === "DELETE") {
    if (current._count.offers > 0 || current._count.focalPoints > 0) {
      return res.status(409).json({
        error: `« ${current.name} » porte ${current._count.offers} offre(s) et ${current._count.focalPoints} point(s) focal(aux) : il ne peut pas être supprimé. Passez son statut à « Désactivé ».`,
        code: "OPERATOR_IN_USE",
      });
    }
    try {
      await prisma.$transaction(async (tx) => {
        await writeAudit(tx, {
          action: AUDIT_ACTIONS.OPERATOR_DELETE,
          entityType: "OPERATOR",
          entityId: id,
          actor: req.actor,
          fromStatus: current.status,
          metadata: { code: current.code, name: current.name },
        });
        await tx.operator.delete({ where: { id } });
      });
      return res.status(204).end();
    } catch (error) {
      console.error("OPERATOR DELETE :", error?.message);
      return res.status(409).json({ error: "Cet opérateur est référencé ailleurs et ne peut pas être supprimé." });
    }
  }

  res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}

// Autorisation vérifiée côté serveur (session + permission).
export default guardRoute(handler, { methods: { PUT: PERMISSIONS.OPERATOR_MANAGE, DELETE: PERMISSIONS.OPERATOR_MANAGE } });
