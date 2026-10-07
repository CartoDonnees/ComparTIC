import prisma from "@/services/config/auth/prisma";
import { chunkText } from "@/services/artciAssistant/chunking";
import { extractText, normalizeText } from "@/services/artciAssistant/textExtraction";
import { writeAudit, AUDIT_ACTIONS } from "@/services/workflow/audit";
import { DOCUMENT_KINDS } from "@/services/artciAssistant/documentKinds";
import { sendSchemaOutdated } from "@/services/config/schemaError";

/**
 * Base documentaire de l'Assistant IA ARTCI    textes de référence.
 *
 * Elle s'alimente progressivement : un document est déposé (fichier ou texte
 * collé), son texte est extrait puis découpé en passages interrogeables.
 * Seuls les documents « en vigueur » sont interrogés par l'assistant ; un
 * texte abrogé se marque « plus en vigueur » plutôt que de se supprimer.
 */

export { DOCUMENT_KINDS };

export class KnowledgeError extends Error {
  constructor(status, code, message, details = undefined) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const clean = (v, max) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const uniqueCode = () => `DOC-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

const LIST_SELECT = {
  id: true,
  code: true,
  title: true,
  kind: true,
  reference: true,
  issuedAt: true,
  inForce: true,
  sourceName: true,
  description: true,
  charCount: true,
  createdAt: true,
  updatedAt: true,
  createdBy: { select: { id: true, firstName: true, lastName: true } },
  _count: { select: { chunks: true } },
};

const metadata = (body, { partial = false } = {}) => {
  const data = {};
  if (!partial || body.title !== undefined) {
    data.title = clean(body.title, 200);
    if (data.title.length < 3) throw new KnowledgeError(400, "TITLE_REQUIRED", "Le titre du document est obligatoire (3 caractères au moins).", { field: "title" });
  }
  if (!partial || body.kind !== undefined) {
    data.kind = DOCUMENT_KINDS[body.kind] ? body.kind : null;
    if (!data.kind) throw new KnowledgeError(400, "KIND_REQUIRED", "La nature du document est obligatoire.", { field: "kind" });
  }
  if (!partial || body.reference !== undefined) data.reference = clean(body.reference, 120) || null;
  if (!partial || body.description !== undefined) data.description = String(body.description ?? "").trim().slice(0, 2000) || null;
  if (!partial || body.issuedAt !== undefined) {
    if (body.issuedAt) {
      const d = new Date(`${String(body.issuedAt).slice(0, 10)}T00:00:00.000Z`);
      if (Number.isNaN(d.getTime()) || d.getTime() > Date.now() + 86400000) {
        throw new KnowledgeError(400, "DATE", "La date du texte n'est pas valide.", { field: "issuedAt" });
      }
      data.issuedAt = d;
    } else data.issuedAt = null;
  }
  if (body.inForce !== undefined) data.inForce = body.inForce !== false && body.inForce !== "false";
  return data;
};

export const listDocuments = () => prisma.knowledgeDocument.findMany({ orderBy: [{ inForce: "desc" }, { issuedAt: "desc" }, { createdAt: "desc" }], select: LIST_SELECT });

export const getDocument = async (id) => {
  const doc = await prisma.knowledgeDocument.findUnique({
    where: { id: Number(id) },
    select: { ...LIST_SELECT, chunks: { orderBy: { position: "asc" }, select: { id: true, position: true, heading: true, content: true } } },
  });
  if (!doc) throw new KnowledgeError(404, "NOT_FOUND", "Document introuvable.");
  return doc;
};

/**
 * Ajoute un document. Le texte vient d'un fichier (`fileName` + `fileBase64`)
 * ou d'un texte collé (`text`).
 */
export const createDocument = async (body, actor) => {
  const data = metadata(body);
  const duplicate = await prisma.knowledgeDocument.findFirst({
    where: { title: { equals: data.title, mode: "insensitive" }, ...(data.reference ? { reference: { equals: data.reference, mode: "insensitive" } } : {}) },
    select: { title: true },
  });
  if (duplicate) throw new KnowledgeError(409, "DUPLICATE", `Le document « ${duplicate.title} » figure déjà dans la base documentaire.`, { field: "title" });

  let text;
  let sourceName = null;
  if (body.fileBase64) {
    sourceName = clean(body.fileName, 160);
    try {
      text = await extractText(sourceName, Buffer.from(String(body.fileBase64), "base64"));
    } catch (error) {
      throw new KnowledgeError(error.status || 422, error.code || "EXTRACTION", error.message, { field: "file" });
    }
  } else {
    text = normalizeText(body.text);
    if (text.replace(/\s/g, "").length < 80) {
      throw new KnowledgeError(400, "TEXT_REQUIRED", "Déposez un fichier ou collez le texte du document (80 caractères au moins).", { field: "text" });
    }
  }
  const chunks = chunkText(text);
  if (!chunks.length) throw new KnowledgeError(422, "NO_TEXT", "Aucun passage exploitable n'a été trouvé dans ce document.", { field: "file" });

  return prisma.$transaction(
    async (tx) => {
      const doc = await tx.knowledgeDocument.create({
        data: { code: uniqueCode(), ...data, inForce: data.inForce ?? true, sourceName, charCount: text.length, createdBy: { connect: { id: actor.id } } },
        select: { id: true },
      });
      await tx.knowledgeChunk.createMany({ data: chunks.map((c) => ({ ...c, documentId: doc.id })) });
      await writeAudit(tx, {
        action: AUDIT_ACTIONS.KNOWLEDGE_CREATE,
        actor,
        entityType: "KNOWLEDGE",
        entityId: doc.id,
        metadata: { name: data.title, kindLabel: DOCUMENT_KINDS[data.kind], reference: data.reference, passages: chunks.length, source: sourceName || "texte collé" },
      });
      return tx.knowledgeDocument.findUnique({ where: { id: doc.id }, select: LIST_SELECT });
    },
    { timeout: 30000 },
  );
};

/** Modifie les informations d'un document ou son statut « en vigueur ». */
export const updateDocument = async (id, body, actor) => {
  const current = await prisma.knowledgeDocument.findUnique({ where: { id: Number(id) }, select: { id: true, title: true, inForce: true } });
  if (!current) throw new KnowledgeError(404, "NOT_FOUND", "Document introuvable.");
  const data = metadata(body, { partial: true });
  return prisma.$transaction(async (tx) => {
    const doc = await tx.knowledgeDocument.update({ where: { id: current.id }, data, select: LIST_SELECT });
    await writeAudit(tx, {
      action: AUDIT_ACTIONS.KNOWLEDGE_UPDATE,
      actor,
      entityType: "KNOWLEDGE",
      entityId: doc.id,
      metadata: { name: doc.title, changed: Object.keys(data), ...(data.inForce !== undefined && data.inForce !== current.inForce ? { inForce: data.inForce } : {}) },
    });
    return doc;
  });
};

export const deleteDocument = async (id, actor) => {
  const current = await prisma.knowledgeDocument.findUnique({ where: { id: Number(id) }, select: { id: true, title: true, reference: true, _count: { select: { chunks: true } } } });
  if (!current) throw new KnowledgeError(404, "NOT_FOUND", "Document introuvable.");
  await prisma.$transaction(async (tx) => {
    await tx.knowledgeDocument.delete({ where: { id: current.id } });
    await writeAudit(tx, {
      action: AUDIT_ACTIONS.KNOWLEDGE_DELETE,
      actor,
      entityType: "KNOWLEDGE",
      entityId: current.id,
      metadata: { name: current.title, reference: current.reference, passages: current._count.chunks },
    });
  });
  return { deleted: true };
};

export const sendKnowledgeError = (res, error, context) => {
  if (error instanceof KnowledgeError) return res.status(error.status).json({ error: error.message, code: error.code, details: error.details });
  if (sendSchemaOutdated(res, error, `[assistant ARTCI] ${context}`)) return undefined;
  console.error(`[assistant ARTCI] ${context} :`, error);
  return res.status(500).json({ error: "Une erreur technique est survenue. Réessayez dans quelques instants.", code: "SERVER_ERROR" });
};
