import { requireActor } from "@/services/config/auth/session";
import { PERMISSIONS } from "@/services/rbac/permissions";
import { serverError } from "@/services/config/apiError";
import { analyzeWorkbook, commitAnalysis, publicAnalysis } from "@/services/import/offerImportService";
import { readUploadedWorkbook } from "@/services/import/offerImportRequest";
import { requireOfferSubmissionTicket } from "@/services/config/submission/offerSubmissionGuard";

/**
 * POST /api/admin/offer/import/commit  - import définitif.
 *
 * Le fichier est ré-analysé ici (l'aperçu du navigateur n'est pas cru). Si des
 * erreurs subsistent, l'import n'a lieu que sur confirmation explicite
 * (`onlyValid`) et ne concerne que les offres entièrement valides ; une offre
 * n'est jamais créée partiellement.
 *
 * Les offres importées sont SOUMISES immédiatement (à valider) : l'utilisateur
 * qui importe en est le soumissionnaire. La règle de soumission reste celle de
 * la saisie manuelle : un point focal confirme par le code reçu par e-mail
 * (`submissionTicket`), une seule fois pour tout le fichier ; l'administration
 * en est dispensée. Le jeton n'est consommé qu'une fois le fichier jugé
 * importable, et il est restitué si aucune offre n'a pu être créée.
 */
export const config = { api: { bodyParser: { sizeLimit: "8mb" } } };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Méthode non autorisée." });
  }
  const actor = await requireActor(req, res, PERMISSIONS.OFFER_CREATE);
  if (!actor) return;
  if (req.body?.confirm !== true) {
    return res.status(400).json({ error: "Confirmation de l'import requise.", code: "CONFIRM" });
  }
  try {
    const upload = readUploadedWorkbook(req, res);
    if (!upload) return;
    const analysis = await analyzeWorkbook(upload.workbook, actor);
    if (!analysis.summary.validOffers) {
      return res.status(422).json({ error: "Aucune offre valide à importer.", code: "NOTHING_VALID", analysis: publicAnalysis(analysis) });
    }
    if (analysis.summary.errors && req.body?.onlyValid !== true) {
      return res.status(409).json({
        error: "Le fichier contient encore des erreurs. Corrigez-les ou confirmez l'import des seules offres valides.",
        code: "HAS_ERRORS",
        analysis: publicAnalysis(analysis),
      });
    }

    // Barrière de soumission (code e-mail pour un point focal), liée à CE fichier.
    const guard = await requireOfferSubmissionTicket({
      userId: actor.id,
      reference: upload.reference,
      ticket: req.body?.submissionTicket,
      operatorId: actor.operatorId,
    });
    if (!guard.ok) {
      return res.status(guard.status || 403).json({ error: guard.error, code: "SUBMISSION_CODE", reason: guard.reason });
    }

    let report;
    try {
      report = await commitAnalysis(analysis, actor);
    } catch (error) {
      await guard.release();
      throw error;
    }
    const firstCreated = report.results.find((r) => r.status === "created");
    if (firstCreated) await guard.link(firstCreated.id);
    else await guard.release();

    return res.status(200).json({ ...report, warnings: analysis.summary.warnings });
  } catch (error) {
    return serverError(res, error, "Import des offres : import");
  }
}
