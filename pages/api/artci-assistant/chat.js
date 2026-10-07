import { requireActor } from "@/services/config/auth/session";
import { blockedByRateLimit } from "@/services/config/auth/rateLimit";
import { PERMISSIONS } from "@/services/rbac/permissions";
import { askArtciAssistant } from "@/services/artciAssistant/conversationEngine";
import { sendKnowledgeError } from "@/services/artciAssistant/documentStore";

/**
 * Assistant IA ARTCI    question.
 *   POST /api/artci-assistant/chat { question, conversationId? }
 *   → { conversation, message: { content, sources, mode }, search }
 */
export const config = { api: { bodyParser: { sizeLimit: "64kb" } } };

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Méthode non autorisée." });
  }
  const actor = await requireActor(req, res, PERMISSIONS.KNOWLEDGE_READ);
  if (!actor) return undefined;
  if (blockedByRateLimit(req, res, { preset: "assistant", key: `artci:${actor.id}` })) return undefined;

  const controller = new AbortController();
  req.on?.("close", () => {
    if (!res.writableEnded) controller.abort();
  });
  try {
    const result = await askArtciAssistant({ question: req.body?.question, conversationId: req.body?.conversationId || null, actor, signal: controller.signal });
    return res.status(200).json(result);
  } catch (error) {
    if (error?.code === "ABORTED" && (res.writableEnded || req.destroyed)) return undefined;
    return sendKnowledgeError(res, error, "question");
  }
}
