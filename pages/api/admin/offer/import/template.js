import prisma from "@/services/config/auth/prisma";
import { requireActor } from "@/services/config/auth/session";
import { PERMISSIONS } from "@/services/rbac/permissions";
import { ROLES } from "@/services/rbac/roles";
import { serverError } from "@/services/config/apiError";
import { buildOfferImportTemplate } from "@/services/import/offerImportTemplate";
import { TEMPLATE_FILENAME } from "@/services/import/offerImportSchema";

/**
 * GET /api/admin/offer/import/template  - modèle Excel officiel d'import.
 *
 * Généré à chaque demande depuis la définition unique des colonnes et la base
 * (opérateurs, organisations, pays) : il correspond toujours à la version
 * supportée. Un point focal ne voit que son opérateur dans la liste.
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Méthode non autorisée." });
  }
  const actor = await requireActor(req, res, PERMISSIONS.OFFER_CREATE);
  if (!actor) return;

  try {
    const focal = actor.role === ROLES.FOCAL_POINT;
    const [operators, organizations] = await Promise.all([
      prisma.operator.findMany({
        where: focal ? { id: Number(actor.operatorId) || -1 } : { NOT: { code: "OPE-000" } },
        select: { name: true, type: true },
        orderBy: { name: "asc" },
      }),
      prisma.organization.findMany({
        select: { name: true, countries: { select: { name: true }, orderBy: { name: "asc" } } },
        orderBy: { name: "asc" },
      }),
    ]);
    const buffer = await buildOfferImportTemplate({
      operators,
      organizations,
      operatorScope: focal ? operators[0]?.name || null : null,
    });
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${TEMPLATE_FILENAME}"`);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(buffer);
  } catch (error) {
    return serverError(res, error, "Import des offres : modèle");
  }
}
