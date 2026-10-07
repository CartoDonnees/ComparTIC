import { SERVER_ADRESS } from "@/services/tools/constants";

/**
 * Appel du service d'analyse (moteur de génération de ComparIA).
 *
 * Point d'entrée UNIQUE vers le service externe : l'assistant ComparIA,
 * l'analyse d'une offre, la synthèse d'un courrier et l'Assistant IA ARTCI
 * passent tous par ici. Le service reçoit `{ question, history }` et renvoie
 * `{ response }`.
 *
 * Adresse : variable d'environnement ASSISTANT_API_URL (à défaut la constante
 * SERVER_ADRESS existante). Ne lève jamais : renvoie
 * `{ ok: true, answer, durationMs }` ou `{ ok: false, status, error, aborted? }`.
 */

const BASE_URL = (process.env.ASSISTANT_API_URL || SERVER_ADRESS || "").replace(/\/?$/, "/");
export const RAG_TIMEOUT_MS = 120000;
export const MAX_QUESTION = 12000;
export const MAX_HISTORY = 16;

export const isRagConfigured = () => !!BASE_URL && BASE_URL !== "/";

/** Historique borné et nettoyé : seuls les rôles connus et du texte. */
export const sanitizeHistory = (history, question) => {
  const list = (Array.isArray(history) ? history : [])
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_QUESTION) }));
  if (question && (!list.length || list[list.length - 1].role !== "user")) list.push({ role: "user", content: question });
  return list;
};

export const askRag = async ({ question, history = [], signal = null, timeoutMs = RAG_TIMEOUT_MS } = {}) => {
  if (!isRagConfigured()) {
    return { ok: false, status: 503, error: "Le service d'analyse n'est pas configuré (ASSISTANT_API_URL)." };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  signal?.addEventListener?.("abort", onAbort);

  const started = Date.now();
  try {
    const upstream = await fetch(`${BASE_URL}offerAnalysis/ragGenerator`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, history }),
      signal: controller.signal,
    });
    const data = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      console.error("Service d'analyse : réponse", upstream.status, data?.error || data?.detail);
      return { ok: false, status: 502, error: "Le service d'analyse a renvoyé une erreur. Réessayez dans un instant." };
    }
    const answer = typeof data?.response === "string" ? data.response.trim() : "";
    if (!answer) return { ok: false, status: 502, error: "Le service d'analyse n'a renvoyé aucune réponse." };
    return { ok: true, answer, durationMs: Date.now() - started };
  } catch (error) {
    if (error?.name === "AbortError") {
      if (signal?.aborted) return { ok: false, aborted: true, status: 499, error: "Demande interrompue." };
      return { ok: false, status: 504, error: "Le service d'analyse met trop de temps à répondre. Reformulez ou réessayez." };
    }
    console.error("Service d'analyse injoignable :", error?.message);
    return { ok: false, status: 502, error: "Le service d'analyse est injoignable pour le moment." };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener?.("abort", onAbort);
  }
};

export default askRag;
