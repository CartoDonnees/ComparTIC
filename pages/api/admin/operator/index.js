import { guardRoute } from "@/services/rbac/guardRoute";
import { PERMISSIONS } from "@/services/rbac/permissions";
import prisma from "@/services/config/auth/prisma";
import { FKTND_H } from "@/services/tools/constants";
import { validateOperator } from "@/services/tools/operatorValidation";
import { writeAudit, AUDIT_ACTIONS } from "@/services/workflow/audit";

/**
 * Opérateurs  - liste et création.
 *
 *   GET  /api/admin/operator         liste (avec nombre d'offres et de points focaux)
 *   POST /api/admin/operator         création { code?, name, type, color, status?, description?, imagePath? }
 *
 * Corrige l'ancienne route : `type` et `color`, obligatoires en base, n'étaient
 * pas enregistrés (toute création échouait) ; le message de doublon citait une
 * variable inexistante ; aucune trace n'était conservée.
 */

const newCode = () => `OP-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const operators = await prisma.operator.findMany({
        orderBy: { name: req.query.order === "desc" ? "desc" : "asc" },
        include: { _count: { select: { offers: true, focalPoints: true } } },
      });
      return res.status(200).json(operators);
    } catch (error) {
      console.error("OPERATORS LIST :", error?.message);
      return res.status(500).json({ error: "La liste des opérateurs n'a pas pu être chargée." });
    }
  }

  if (req.method === "POST") {
    if (req.body?.verskth != FKTND_H) {
      return res.status(405).json({ message: "Requête non autorisée" });
    }
    const check = validateOperator(req.body);
    if (!check.ok) {
      return res.status(400).json({ error: Object.values(check.errors)[0], errors: check.errors });
    }
    const code = String(req.body.code || "").trim().toUpperCase() || newCode();
    if (!/^[A-Z0-9_-]{3,40}$/.test(code)) {
      return res.status(400).json({ error: "Code invalide.", errors: { code: "Code invalide." } });
    }

    try {
      const duplicate = await prisma.operator.findFirst({
        where: { OR: [{ code }, { name: { equals: check.data.name, mode: "insensitive" } }] },
        select: { code: true, name: true },
      });
      if (duplicate) {
        const field = duplicate.code === code ? "code" : "name";
        const message = field === "code" ? "Ce code est déjà utilisé par un autre opérateur." : `L'opérateur « ${duplicate.name} » existe déjà.`;
        return res.status(409).json({ error: message, errors: { [field]: message } });
      }

      const operator = await prisma.$transaction(async (tx) => {
        const created = await tx.operator.create({ data: { code, ...check.data } });
        await writeAudit(tx, {
          action: AUDIT_ACTIONS.OPERATOR_CREATE,
          entityType: "OPERATOR",
          entityId: created.id,
          actor: req.actor,
          toStatus: created.status,
          metadata: { code: created.code, name: created.name, type: created.type },
        });
        return created;
      });
      return res.status(201).json(operator);
    } catch (error) {
      console.error("OPERATOR CREATE :", error?.message);
      return res.status(500).json({ error: "L'opérateur n'a pas pu être créé." });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}

// Autorisation vérifiée côté serveur (session + permission).
export default guardRoute(handler, { methods: { POST: PERMISSIONS.OPERATOR_MANAGE } });
