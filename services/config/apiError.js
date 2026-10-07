/**
 * Réponse d'erreur serveur.
 *
 * Les routes renvoyaient `error.message` au navigateur : messages de Prisma,
 * noms de colonnes, chemins de fichiers et parfois fragments de requête se
 * retrouvaient côté client. Le détail est désormais journalisé sur le serveur
 * uniquement ; l'appelant reçoit un message compréhensible et un code stable.
 */
export const serverError = (res, error, context = "API") => {
  console.error(`[${context}]`, error?.message || error);
  if (res.headersSent) return undefined;
  return res.status(500).json({
    error: "Une erreur interne est survenue. Réessayez ou contactez l'administrateur.",
    code: "INTERNAL",
  });
};

export default serverError;
