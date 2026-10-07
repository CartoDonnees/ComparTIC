import { requireActor } from "@/services/config/auth/session";
import { PERMISSIONS } from "@/services/rbac/permissions";
import { serverError } from "@/services/config/apiError";
import { analyzeWorkbook, publicAnalysis } from "@/services/import/offerImportService";
import { readUploadedWorkbook } from "@/services/import/offerImportRequest";
import { ROLES } from "@/services/rbac/roles";

/**
 * POST /api/admin/offer/import/analyze  - contrôle d'un fichier, sans rien
 * enregistrer : structure, formats, champs obligatoires, référentiels,
 * doublons (fichier et base), règles métier. Renvoie l'aperçu et la liste des
 * erreurs (feuille, ligne, colonne, valeur).
 *
 * `submission` indique à l'écran si l'import devra être confirmé par le code
 * reçu par e-mail (point focal) et sous quelle référence le demander.
 */
export const config = { api: { bodyParser: { sizeLimit: "8mb" } } };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Méthode non autorisée." });
  }
  const actor = await requireActor(req, res, PERMISSIONS.OFFER_CREATE);
  if (!actor) return;
  try {
    const upload = readUploadedWorkbook(req, res);
    if (!upload) return;
    const analysis = await analyzeWorkbook(upload.workbook, actor);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      ...publicAnalysis(analysis),
      submission: { codeRequired: actor.role === ROLES.FOCAL_POINT, reference: upload.reference },
    });
  } catch (error) {
    return serverError(res, error, "Import des offres : analyse");
  }
}
