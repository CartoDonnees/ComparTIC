import { requireActor } from "@/services/config/auth/session";
import { PERMISSIONS } from "@/services/rbac/permissions";
import { deleteConversation, getConversation, renameConversation } from "@/services/artciAssistant/conversationStore";
import { sendKnowledgeError } from "@/services/artciAssistant/documentStore";

/**
 *   GET    /api/artci-assistant/conversations/:id   messages et sources
 *   PUT    /api/artci-assistant/conversations/:id   { title }
 *   DELETE /api/artci-assistant/conversations/:id
 * Une conversation n'est accessible qu'à son auteur.
 */
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const actor = await requireActor(req, res, PERMISSIONS.KNOWLEDGE_READ);
  if (!actor) return undefined;
  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Identifiant invalide." });
  try {
    if (req.method === "GET") return res.status(200).json(await getConversation(id, actor.id));
    if (req.method === "PUT") return res.status(200).json(await renameConversation(id, actor.id, req.body?.title));
    if (req.method === "DELETE") return res.status(200).json(await deleteConversation(id, actor.id));
    res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
    return res.status(405).json({ error: "Méthode non autorisée." });
  } catch (error) {
    return sendKnowledgeError(res, error, "conversation");
  }
}
