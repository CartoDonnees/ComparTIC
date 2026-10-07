import { createUploadHandler } from "@/services/config/uploadHandler";

/**
 * Upload d'image (avatars utilisateurs...) -> `uploads/images` (racine).
 * POST /api/files/uploads/uploadImage
 */
// Next.js analyse statiquement cet export : il doit rester un litteral.
// (Un identifiant importe passe en dev mais casse `next build` :
//  "Unknown identifier \"uploadApiConfig\" at \"config\"".)
export const config = { api: { bodyParser: false } };

export default createUploadHandler({ kind: "images", maxFileSizeMb: 20 });
