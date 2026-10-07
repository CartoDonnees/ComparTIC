import { requireActor } from "@/services/config/auth/session";
import { PERMISSIONS } from "@/services/rbac/permissions";
import { deleteDocument, getDocument, sendKnowledgeError, updateDocument } from "@/services/artciAssistant/documentStore";

/**
 *   GET    /api/artci-assistant/documents/:id   document et ses passages (KNOWLEDGE_READ)
 *   PUT    /api/artci-assistant/documents/:id   informations, statut « en vigueur » (KNOWLEDGE_MANAGE)
 *   DELETE /api/artci-assistant/documents/:id   retrait de la base (KNOWLEDGE_MANAGE)
 */
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Identifiant invalide." });
  try {
    if (req.method === "GET") {
      const actor = await requireActor(req, res, PERMISSIONS.KNOWLEDGE_READ);
      if (!actor) return undefined;
      return res.status(200).json(await getDocument(id));
    }
    const actor = await requireActor(req, res, PERMISSIONS.KNOWLEDGE_MANAGE);
    if (!actor) return undefined;
    if (req.method === "PUT") return res.status(200).json(await updateDocument(id, req.body || {}, actor));
    if (req.method === "DELETE") return res.status(200).json(await deleteDocument(id, actor));
    res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
    return res.status(405).json({ error: "Méthode non autorisée." });
  } catch (error) {
    return sendKnowledgeError(res, error, "document");
  }
}
