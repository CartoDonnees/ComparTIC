import { requireActor } from "@/services/config/auth/session";
import { blockedByRateLimit } from "@/services/config/auth/rateLimit";
import { PERMISSIONS } from "@/services/rbac/permissions";
import { deleteLetter, generateLetter, getLetterWorkspace, saveLetter, sendLetter } from "@/services/letters/letterService";
import { sendError } from "@/services/workflow/apiErrors";

/**
 * Courrier au soumissionnaire d'une offre validée.
 *
 *   GET    /api/workflow/offers/:id/letter                 → brouillons, destinataire, champs dynamiques
 *   POST   /api/workflow/offers/:id/letter { action: "generate", withAi }   → modèle (non enregistré)
 *   POST   /api/workflow/offers/:id/letter { action: "send", id?, subject, html, to }
 *   PUT    /api/workflow/offers/:id/letter { id?, subject, html }           → brouillon enregistré
 *   DELETE /api/workflow/offers/:id/letter?letterId=                        → brouillon supprimé
 *
 * Permission LETTER_MANAGE (administration et validateurs) ; le service
 * vérifie en plus que l'offre est validée et visible par l'utilisateur.
 */
export const config = { api: { bodyParser: { sizeLimit: "512kb" } } };

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const actor = await requireActor(req, res, PERMISSIONS.LETTER_MANAGE);
  if (!actor) return undefined;
  const id = Number(req.query.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Identifiant d'offre invalide." });

  try {
    if (req.method === "GET") return res.status(200).json(await getLetterWorkspace(id, actor));
    if (req.method === "PUT") return res.status(200).json(await saveLetter(id, actor, req.body || {}));
    if (req.method === "DELETE") return res.status(200).json(await deleteLetter(id, actor, req.query.letterId));
    if (req.method === "POST") {
      const action = req.body?.action;
      if (action === "generate") {
        // La synthèse sollicite le service d'analyse : plafonnée par utilisateur.
        if (blockedByRateLimit(req, res, { preset: "assistant", key: String(actor.id) })) return undefined;
        const controller = new AbortController();
        req.on?.("close", () => {
          if (!res.writableEnded) controller.abort();
        });
        return res.status(200).json(await generateLetter(id, actor, { withAi: req.body?.withAi !== false, signal: controller.signal }));
      }
      if (action === "send") return res.status(200).json(await sendLetter(id, actor, req.body || {}));
      return res.status(400).json({ error: "Action inconnue." });
    }
    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return res.status(405).json({ error: "Méthode non autorisée." });
  } catch (error) {
    return sendError(res, error);
  }
}
