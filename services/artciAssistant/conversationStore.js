import prisma from "@/services/config/auth/prisma";
import { KnowledgeError } from "@/services/artciAssistant/documentStore";

/**
 * Assistant IA ARTCI    historique des conversations.
 *
 * Conservé côté serveur, par utilisateur : une conversation n'est lisible et
 * modifiable que par son auteur (contrôle fait ici, à chaque accès).
 */
export const ASSISTANT = "ARTCI";
const MAX_CONVERSATIONS = 200;

const titleFrom = (question) => {
  const t = String(question || "").replace(/\s+/g, " ").trim();
  return t.length > 70 ? `${t.slice(0, 67)}…` : t || "Nouvelle conversation";
};

export const listConversations = (userId) =>
  prisma.assistantConversation.findMany({
    where: { userId, assistant: ASSISTANT },
    orderBy: { updatedAt: "desc" },
    take: MAX_CONVERSATIONS,
    select: { id: true, title: true, createdAt: true, updatedAt: true, _count: { select: { messages: true } } },
  });

/** Conversation de l'utilisateur, ou erreur 404 (jamais celle d'un autre). */
export const ownConversation = async (id, userId) => {
  const conversation = await prisma.assistantConversation.findFirst({ where: { id: Number(id), userId, assistant: ASSISTANT }, select: { id: true, title: true } });
  if (!conversation) throw new KnowledgeError(404, "NOT_FOUND", "Conversation introuvable.");
  return conversation;
};

export const getConversation = async (id, userId) => {
  const conversation = await ownConversation(id, userId);
  const messages = await prisma.assistantMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { id: true, role: true, content: true, sources: true, mode: true, createdAt: true },
  });
  return { ...conversation, messages };
};

export const startConversation = (userId, question) =>
  prisma.assistantConversation.create({ data: { assistant: ASSISTANT, title: titleFrom(question), user: { connect: { id: userId } } }, select: { id: true, title: true } });

/** Derniers échanges, dans l'ordre, pour le contexte de la question suivante. */
export const recentMessages = async (conversationId, take = 8) =>
  (await prisma.assistantMessage.findMany({ where: { conversationId }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take, select: { role: true, content: true } })).reverse();

/** Enregistre la question et la réponse (ensemble) et rafraîchit la conversation. */
export const appendExchange = async (conversationId, question, answer) =>
  prisma.$transaction(async (tx) => {
    await tx.assistantMessage.create({ data: { conversationId, role: "user", content: question } });
    const message = await tx.assistantMessage.create({
      data: { conversationId, role: "assistant", content: answer.content, sources: answer.sources, mode: answer.mode },
      select: { id: true, role: true, content: true, sources: true, mode: true, createdAt: true },
    });
    await tx.assistantConversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
    return message;
  });

export const renameConversation = async (id, userId, title) => {
  const conversation = await ownConversation(id, userId);
  const clean = String(title || "").replace(/\s+/g, " ").trim().slice(0, 80);
  if (!clean) throw new KnowledgeError(400, "TITLE_REQUIRED", "Le titre de la conversation est vide.");
  return prisma.assistantConversation.update({ where: { id: conversation.id }, data: { title: clean }, select: { id: true, title: true } });
};

export const deleteConversation = async (id, userId) => {
  const conversation = await ownConversation(id, userId);
  await prisma.assistantConversation.delete({ where: { id: conversation.id } });
  return { deleted: true };
};
