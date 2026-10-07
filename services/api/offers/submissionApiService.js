import { FKTND_H } from "@/services/tools/constants";

/**
 * Validation par code avant soumission d'une offre   appels côté navigateur.
 *
 * Ces deux appels passent par `fetch` en MÊME ORIGINE, et non par
 * `userAxiosInstance` : celui-ci vise une adresse absolue et n'emporte donc pas
 * le cookie de session. Or c'est précisément la session qui détermine à quelle
 * adresse le code est envoyé   une adresse transmise par le client n'offrirait
 * aucune garantie.
 */

const post = async (url, body) => {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Le cookie de session est indispensable : c'est lui qui identifie le
      // point focal côté serveur.
      credentials: "same-origin",
      body: JSON.stringify({ verskth: FKTND_H, ...body }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        reason: data?.reason,
        retryAfterSeconds: data?.retryAfterSeconds,
        remainingAttempts: data?.remainingAttempts,
        mustRenew: data?.mustRenew,
        error: data?.error || "La demande n'a pas abouti.",
      };
    }
    return { success: true, ...data };
  } catch (error) {
    return {
      success: false,
      error: "Serveur injoignable. Vérifiez votre connexion et réessayez.",
    };
  }
};

/** Demande l'envoi d'un code de validation à l'adresse du point focal. */
export const requestSubmissionCode = async ({ reference, label }) =>
  post("/api/offer/submission/requestCode", { reference, label });

/** Vérifie le code saisi et récupère le jeton de soumission. */
export const verifySubmissionCode = async ({ reference, code }) =>
  post("/api/offer/submission/verifyCode", { reference, code });
