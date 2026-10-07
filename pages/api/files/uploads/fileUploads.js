import { createUploadHandler } from "@/services/config/uploadHandler";

/**
 * Upload de fichier générique -> `uploads/files` (racine du projet).
 * POST /api/files/uploads/fileUploads
 */
// Next.js analyse statiquement cet export : il doit rester un litteral.
// (Un identifiant importe passe en dev mais casse `next build` :
//  "Unknown identifier \"uploadApiConfig\" at \"config\"".)
export const config = { api: { bodyParser: false } };

export default createUploadHandler({ kind: "files", maxFileSizeMb: 50 });
