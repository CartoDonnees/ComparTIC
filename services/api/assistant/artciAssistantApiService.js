/**
 * Assistant IA ARTCI    appels côté navigateur (même origine, session par cookie).
 * Chaque fonction renvoie `{ ok: true, data }` ou `{ ok: false, status, code, error, details }`.
 */
const request = async (method, url, body, signal) => {
  try {
    const res = await fetch(url, {
      method,
      credentials: "same-origin",
      cache: "no-store",
      signal,
      headers: { "Content-Type": "application/json" },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, status: res.status, code: data?.code, details: data?.details, error: data?.error || "La demande n'a pas abouti." };
    return { ok: true, data };
  } catch (error) {
    if (error?.name === "AbortError") return { ok: false, aborted: true, status: 0, code: "ABORTED", error: "Demande interrompue." };
    return { ok: false, status: 0, code: "NETWORK", error: "Serveur injoignable. Vérifiez votre connexion." };
  }
};

const BASE = "/api/artci-assistant";

/* Conversation */
export const askArtci = (question, conversationId, signal) => request("POST", `${BASE}/chat`, { question, conversationId }, signal);
export const listArtciConversations = () => request("GET", `${BASE}/conversations`);
export const getArtciConversation = (id) => request("GET", `${BASE}/conversations/${id}`);
export const renameArtciConversation = (id, title) => request("PUT", `${BASE}/conversations/${id}`, { title });
export const deleteArtciConversation = (id) => request("DELETE", `${BASE}/conversations/${id}`);

/* Base documentaire */
export const listKnowledgeDocuments = () => request("GET", `${BASE}/documents`);
export const getKnowledgeDocument = (id) => request("GET", `${BASE}/documents/${id}`);
export const createKnowledgeDocument = (payload) => request("POST", `${BASE}/documents`, payload);
export const updateKnowledgeDocument = (id, payload) => request("PUT", `${BASE}/documents/${id}`, payload);
export const deleteKnowledgeDocument = (id) => request("DELETE", `${BASE}/documents/${id}`);
export const searchKnowledge = (q) => request("GET", `${BASE}/search?q=${encodeURIComponent(q)}`);
