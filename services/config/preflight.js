/**
 * Requête préalable CORS (`OPTIONS`) des routes publiques `/api/public/*`.
 *
 * Les en-têtes CORS sont posés par `next.config.mjs` uniquement lorsque
 * ALLOWED_ORIGIN est défini ; le navigateur exige en plus une réponse 2xx à
 * la requête préalable, sans quoi tout POST JSON ou tout appel portant un
 * en-tête `Authorization` est bloqué (version web de l'application mobile).
 * Les applications natives ne sont pas concernées par CORS.
 *
 * Retourne `true` si la requête a été traitée : le gestionnaire s'arrête là.
 */
export const answerPreflight = (req, res) => {
  if (req.method !== "OPTIONS") return false;
  res.setHeader("Access-Control-Max-Age", "600");
  res.status(204).end();
  return true;
};
