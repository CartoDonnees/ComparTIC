import { requireActor } from "@/services/config/auth/session";
import { PERMISSIONS } from "@/services/rbac/permissions";
import { searchPassages } from "@/services/artciAssistant/documentSearch";
import { toSources } from "@/services/artciAssistant/contextBuilder";
import { sendKnowledgeError } from "@/services/artciAssistant/documentStore";

/**
 * Recherche dans la base documentaire (sans rédaction).
 *   GET /api/artci-assistant/search?q=…   → { mode, terms, passages }
 */
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Méthode non autorisée." });
  }
  const actor = await requireActor(req, res, PERMISSIONS.KNOWLEDGE_READ);
  if (!actor) return undefined;
  try {
    const found = await searchPassages(req.query.q, { limit: 10 });
    return res.status(200).json({ mode: found.mode, terms: found.terms, passages: toSources(found.passages) });
  } catch (error) {
    return sendKnowledgeError(res, error, "recherche");
  }
}
