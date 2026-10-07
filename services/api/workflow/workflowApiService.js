import { JWT_TOKEN } from "@/services/tools/constants";

/**
 * Appels du workflow de validation (navigateur).
 *
 * En MÊME ORIGINE, avec le cookie de session et le jeton en en-tête : le
 * serveur identifie l'utilisateur et recontrôle chaque action. Aucune identité
 * n'est envoyée dans le corps.
 *
 * Chaque fonction renvoie `{ ok: true, data }` ou `{ ok: false, status, code, error }`.
 */

const request = async (method, url, body, signal = undefined) => {
  let token = null;
  try {
    token = typeof window !== "undefined" ? localStorage.getItem(JWT_TOKEN) : null;
  } catch {
    token = null;
  }
  try {
    const res = await fetch(url, {
      method,
      credentials: "same-origin",
      // Jamais de réponse en cache : l'état d'une offre change à chaque décision.
      cache: "no-store",
      signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        code: data?.code,
        details: data?.details,
        error: data?.error || "La demande n'a pas abouti.",
      };
    }
    return { ok: true, data };
  } catch (error) {
    if (error?.name === "AbortError") return { ok: false, status: 0, code: "ABORTED", aborted: true, error: "Demande interrompue." };
    return { ok: false, status: 0, code: "NETWORK", error: "Serveur injoignable. Vérifiez votre connexion." };
  }
};

/** Fiche complète : offre, niveaux, décisions, historique, versions, actions. */
export const getOfferWorkflow = (offerId) => request("GET", `/api/workflow/offers/${offerId}`);

/** Actions possibles pour plusieurs offres (listes). */
export const getWorkflowActions = (ids) => request("POST", "/api/workflow/actions", { ids });

/** File de validation de l'utilisateur connecté. */
export const getValidationQueue = () => request("GET", "/api/workflow/queue");

/** Soumission d'un brouillon (point focal : jeton du code reçu par e-mail). */
export const submitOfferWorkflow = (offerId, submissionTicket = null) =>
  request("POST", `/api/workflow/offers/${offerId}/submit`, submissionTicket ? { submissionTicket } : {});

/**
 * Décision d'un validateur.
 * @param decision   "VALIDATE" | "REFUSE"
 * @param validation "TRANSMIT" (niveau supérieur) | "FINAL" (validation définitive)
 */
export const decideOfferWorkflow = (offerId, { decision, comment, confirmFinal = false, validation = null }) =>
  request("POST", `/api/workflow/offers/${offerId}/decide`, {
    decision,
    comment,
    confirmFinal,
    ...(validation ? { validation } : {}),
  });

export const deactivateOfferWorkflow = (offerId, comment) =>
  request("POST", `/api/workflow/offers/${offerId}/deactivate`, { comment });

/** Réactivation d'une offre désactivée (administration) ; motif facultatif. */
export const reactivateOfferWorkflow = (offerId, comment) =>
  request("POST", `/api/workflow/offers/${offerId}/reactivate`, { comment });

export const monitorOfferWorkflow = (offerId, comment) =>
  request("POST", `/api/workflow/offers/${offerId}/monitor`, { comment });

export const deleteOfferWorkflow = (offerId) => request("DELETE", `/api/workflow/offers/${offerId}`);

/** Analyse IA enregistrée d'une offre (référence + historique) : aucun calcul. */
export const getOfferAnalysis = (offerId, signal) => request("GET", `/api/workflow/offers/${offerId}/analysis`, undefined, signal);

/** Demande une (nouvelle) analyse IA ; elle est enregistrée et devient la référence. */
export const requestOfferAnalysis = (offerId, signal) => request("POST", `/api/workflow/offers/${offerId}/analysis`, {}, signal);

/* ---- Courrier au soumissionnaire (offre validée) -------------------------- */
export const getOfferLetterWorkspace = (offerId) => request("GET", `/api/workflow/offers/${offerId}/letter`);
export const generateOfferLetter = (offerId, withAi = true) => request("POST", `/api/workflow/offers/${offerId}/letter`, { action: "generate", withAi });
export const saveOfferLetter = (offerId, letter) => request("PUT", `/api/workflow/offers/${offerId}/letter`, letter);
export const sendOfferLetter = (offerId, letter) => request("POST", `/api/workflow/offers/${offerId}/letter`, { action: "send", ...letter });
export const deleteOfferLetter = (offerId, letterId) => request("DELETE", `/api/workflow/offers/${offerId}/letter?letterId=${letterId}`);
