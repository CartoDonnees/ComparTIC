import { requireActor } from "@/services/config/auth/session";
import { blockedByRateLimit } from "@/services/config/auth/rateLimit";
import { PERMISSIONS } from "@/services/rbac/permissions";
import { MAX_QUESTION, askRag, isRagConfigured, sanitizeHistory } from "@/services/assistant/ragClient";
import { retrieveOffersForQuestion } from "@/services/assistant/offerRetrieval";

/**
 * Assistant ComparIA - relais vers le service d'analyse.
 *
 *   POST /api/assistant/chat  { question, history: [{ role, content }], offerId? }
 *   → 200 { answer, durationMs, offers: { used, sources, criteria, total, scope } }
 *
 * Le relais passe par le serveur de l'application : session contrôlée, délai
 * maximal, messages d'erreur compréhensibles, adresse du service non exposée.
 *
 * Base des offres : quand la question porte sur des offres (ou que la
 * conversation est ouverte depuis une offre, `offerId`), les offres concernées
 * sont recherchées côté serveur AVEC LES DROITS DE L'UTILISATEUR, puis jointes
 * à la question (voir services/assistant/offerRetrieval.js). La réponse
 * indique les offres consultées.
 */

export const config = { api: { bodyParser: { sizeLimit: "256kb" } } };

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  // Espace de gestion uniquement (le compte client est refusé).
  const actor = await requireActor(req, res, PERMISSIONS.ASSISTANT_USE);
  if (!actor) return undefined;

  // Appel externe coûteux (plusieurs secondes de calcul) : plafonné par
  // utilisateur pour éviter de saturer le service d'analyse.
  if (blockedByRateLimit(req, res, { preset: "assistant", key: String(actor.id) })) return undefined;

  const question = String(req.body?.question ?? "").trim();
  if (!question) return res.status(400).json({ error: "La question est vide." });
  if (question.length > MAX_QUESTION) {
    return res.status(413).json({ error: `La question dépasse ${MAX_QUESTION} caractères.` });
  }
  if (!isRagConfigured()) {
    return res.status(503).json({ error: "Le service d'analyse n'est pas configuré (ASSISTANT_API_URL)." });
  }

  // Données de la base des offres utiles à la question (périmètre de l'utilisateur).
  let offers = { used: false, context: "", sources: [], criteria: [], total: 0, scope: "" };
  try {
    offers = await retrieveOffersForQuestion(question, actor, { offerId: req.body?.offerId });
  } catch (error) {
    // La recherche ne doit jamais empêcher l'assistant de répondre.
    console.error("Assistant : recherche d'offres impossible :", error?.message);
  }
  const enriched = offers.used ? `${offers.context}\n\nQuestion : ${question}`.slice(0, MAX_QUESTION + 8000) : question;

  const history = sanitizeHistory(req.body?.history, question);
  // La dernière intervention de l'utilisateur porte les données jointes.
  if (offers.used && history.length) history[history.length - 1] = { role: "user", content: enriched };

  const controller = new AbortController();
  // Requête annulée par l'utilisateur (bouton « Arrêter ») : on abandonne aussi.
  req.on?.("close", () => {
    if (!res.writableEnded) controller.abort();
  });

  const result = await askRag({ question: enriched, history, signal: controller.signal });
  const meta = { used: offers.used, sources: offers.sources, criteria: offers.criteria, total: offers.total, scope: offers.scope };
  if (!result.ok) {
    if (result.aborted) return undefined;
    // Les offres trouvées restent utiles même si le service ne répond pas.
    return res.status(result.status || 502).json({ error: result.error, offers: meta });
  }
  return res.status(200).json({ answer: result.answer, durationMs: result.durationMs, offers: meta });
}
