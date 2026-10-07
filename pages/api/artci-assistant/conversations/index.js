import { requireActor } from "@/services/config/auth/session";
import { PERMISSIONS } from "@/services/rbac/permissions";
import { listConversations } from "@/services/artciAssistant/conversationStore";
import { sendKnowledgeError } from "@/services/artciAssistant/documentStore";

/** GET /api/artci-assistant/conversations → conversations de l'utilisateur connecté. */
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Méthode non autorisée." });
  }
  const actor = await requireActor(req, res, PERMISSIONS.KNOWLEDGE_READ);
  if (!actor) return undefined;
  try {
    return res.status(200).json({ items: await listConversations(actor.id) });
  } catch (error) {
    return sendKnowledgeError(res, error, "conversations");
  }
}
