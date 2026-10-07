import { SERVER_ADRESS, JWT_TOKEN } from "@/services/tools/constants";

/**
 * Assistant ComparIA.
 *
 * Les questions passent par le relais `/api/assistant/chat` (session
 * contrôlée côté serveur) : l'appel direct du navigateur vers le service
 * d'analyse n'aboutissait que depuis `http://localhost:3001` (CORS) et
 * renvoyait `undefined` en cas d'échec.
 */

const authHeaders = () => {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem(JWT_TOKEN) : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
};

/**
 * Pose une question à l'assistant.
 * @returns {Promise<{error:false,data:string,durationMs:number}|{error:true,message:string,aborted?:boolean,status?:number}>}
 */
export const askAssistant = async ({ question, history = [], signal, offerId = null } = {}) => {
  try {
    const res = await fetch("/api/assistant/chat", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ question, history, ...(offerId ? { offerId } : {}) }),
      signal,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return {
        error: true,
        status: res.status,
        message: data?.error || "L'assistant n'a pas pu répondre.",
        offers: data?.offers || null,
      };
    }
    // `offers` : offres de la base consultées pour répondre (périmètre de l'utilisateur).
    return { error: false, data: data.answer, durationMs: data.durationMs, offers: data.offers || null };
  } catch (error) {
    if (error?.name === "AbortError") return { error: true, aborted: true, message: "Réponse interrompue." };
    return { error: true, status: 0, message: "Serveur injoignable. Vérifiez votre connexion." };
  }
};

/** Compatibilité : analyse initiale d'une offre (texte). */
export const getInitOfferAnalysis = async (content) =>
  askAssistant({ question: content, history: [{ role: "user", content }] });

/** Compatibilité : `{ question, history }`. */
export const getOfferAnalysis = async (body) => askAssistant({ question: body?.question, history: body?.history });

export const sendEmail = async (action, doc) => {
  console.log("ACCCCCCCCTTTTTTIIIOOOOONN  ====>", action);
  console.log("BBBBBBBBBBBBBBBBB =====>", doc)
  try {
    const res = await fetch(SERVER_ADRESS + "sendEmail/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: action, 
        documents: doc,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return {
        error: false,
        data: data.response,
      };
    } else {
      const data = await res.json();
      return {
        error: true,
        message: data.error,
      };
    }
  } catch (error) {
    /* erreur ignorée volontairement */
    console.log("SEND EMAIL ERROR ===>", error?.message )
  }
};

/**
 * Contexte d'une offre pour ouvrir une conversation : description de l'offre
 * et analyse IA déjà enregistrée (aucun calcul n'est lancé).
 * @returns {Promise<{error:false, offer, input, analysis}|{error:true, message, status}>}
 */
export const getAssistantOfferContext = async (offerId) => {
  try {
    const res = await fetch(`/api/assistant/offer-context?offerId=${encodeURIComponent(offerId)}`, {
      credentials: "same-origin",
      cache: "no-store",
      headers: authHeaders(),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return { error: true, status: res.status, message: data?.error || "Le contexte de l'offre n'a pas pu être chargé." };
    return { error: false, ...data };
  } catch {
    return { error: true, status: 0, message: "Serveur injoignable. Vérifiez votre connexion." };
  }
};
