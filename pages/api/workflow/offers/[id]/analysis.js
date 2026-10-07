import { requireActor } from "@/services/config/auth/session";
import { blockedByRateLimit } from "@/services/config/auth/rateLimit";
import { PERMISSIONS } from "@/services/rbac/permissions";
import { getOfferAnalyses, runOfferAnalysis } from "@/services/assistant/offerAnalysisService";
import { sendError } from "@/services/workflow/apiErrors";

/**
 * Analyse IA d'une offre.
 *
 *   GET  /api/workflow/offers/:id/analysis  → { latest, history, count }   (aucun calcul)
 *   POST /api/workflow/offers/:id/analysis  → nouvelle analyse, enregistrée
 *
 * Lecture : ARTCI (administration, superviseur, validateurs). Demande d'une
 * analyse : administration et validateurs. Jamais les opérateurs : l'analyse
 * est un document de travail interne.
 */
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const id = Number(req.query.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Identifiant d'offre invalide." });

  try {
    if (req.method === "GET") {
      const actor = await requireActor(req, res, PERMISSIONS.AI_ANALYSIS_READ);
      if (!actor) return undefined;
      return res.status(200).json(await getOfferAnalyses(id, actor));
    }
    if (req.method === "POST") {
      const actor = await requireActor(req, res, PERMISSIONS.AI_ANALYSIS_RUN);
      if (!actor) return undefined;
      // Appel coûteux : plafonné par utilisateur.
      if (blockedByRateLimit(req, res, { preset: "assistant", key: String(actor.id) })) return undefined;
      const controller = new AbortController();
      req.on?.("close", () => {
        if (!res.writableEnded) controller.abort();
      });
      const analysis = await runOfferAnalysis(id, actor, { signal: controller.signal });
      return res.status(201).json({ analysis, ...(await getOfferAnalyses(id, actor)) });
    }
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Méthode non autorisée." });
  } catch (error) {
    if (error?.code === "ABORTED" && (res.writableEnded || req.destroyed)) return undefined;
    return sendError(res, error);
  }
}
