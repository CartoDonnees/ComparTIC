import { requireActor } from "@/services/config/auth/session";
import { PERMISSIONS, can } from "@/services/rbac/permissions";
import { DOCUMENT_KINDS, createDocument, listDocuments, sendKnowledgeError } from "@/services/artciAssistant/documentStore";
import { ACCEPTED_EXTENSIONS, MAX_DOCUMENT_BYTES } from "@/services/artciAssistant/textExtraction";

/**
 * Base documentaire de l'Assistant IA ARTCI.
 *
 *   GET  /api/artci-assistant/documents   liste (KNOWLEDGE_READ)
 *   POST /api/artci-assistant/documents   ajout (KNOWLEDGE_MANAGE)
 *        { title, kind, reference?, issuedAt?, description?, inForce?, text? | fileName + fileBase64 }
 */
export const config = { api: { bodyParser: { sizeLimit: "18mb" } } };

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    if (req.method === "GET") {
      const actor = await requireActor(req, res, PERMISSIONS.KNOWLEDGE_READ);
      if (!actor) return undefined;
      return res.status(200).json({
        items: await listDocuments(),
        kinds: DOCUMENT_KINDS,
        canManage: can(actor.role, PERMISSIONS.KNOWLEDGE_MANAGE),
        upload: { extensions: ACCEPTED_EXTENSIONS, maxBytes: MAX_DOCUMENT_BYTES },
      });
    }
    if (req.method === "POST") {
      const actor = await requireActor(req, res, PERMISSIONS.KNOWLEDGE_MANAGE);
      if (!actor) return undefined;
      return res.status(201).json(await createDocument(req.body || {}, actor));
    }
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Méthode non autorisée." });
  } catch (error) {
    return sendKnowledgeError(res, error, "documents");
  }
}
