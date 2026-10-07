import prisma from "@/services/config/auth/prisma";

/**
 * Lecture publique d'un opérateur (comparateur).
 *
 * Les méthodes PUT et DELETE de cette route ont été retirées : elles modifiaient
 * ou supprimaient sans aucun contrôle d'accès (et la suppression visait une
 * table inexistante). La gestion des opérateurs passe par /api/admin/operator.
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(req.method === "PUT" || req.method === "DELETE" ? 410 : 405).json({
      error: "La gestion des opérateurs passe par /api/admin/operator.",
      code: "ROUTE_RETIRED",
    });
  }
  const id = parseInt(req.query.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: "Identifiant invalide" });
  const operator = await prisma.operator.findUnique({ where: { id } });
  return res.status(200).json(operator);
}
