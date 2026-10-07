import fs from "fs";
import path from "path";
import { safeFilePath, mimeOf } from "@/services/config/storage";
import { readSession } from "@/services/config/auth/session";

/**
 * Lecture d'un document stocké dans `uploads/documents` (ou `uploads/files`).
 *
 * GET /api/files/downloads/documents?name=<fichier>[&kind=documents|files][&download=1]
 *
 * - `kind`     : sous-dossier (par défaut `documents`)
 * - `download` : force le téléchargement (Content-Disposition: attachment)
 */
/** Types affichables sans risque dans le navigateur ; le reste est téléchargé. */
const SAFE_INLINE = new Set(["application/pdf", "text/plain", "image/png", "image/jpeg"]);

export default async function handler(req, res) {
  // HEAD est accepté : il permet au client de vérifier l'existence d'un
  // document (afficher un message clair) sans le télécharger.
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", ["GET", "HEAD"]);
    return res.status(405).json({ message: `Méthode ${req.method} non autorisée` });
  }

  // Les pièces jointes des offres (y compris non publiées) ne sont pas
  // publiques : elles étaient lisibles par quiconque connaissait le nom du
  // fichier. Lecture réservée aux comptes connectés.
  const { user, unavailable } = await readSession(req);
  if (unavailable) {
    return res.status(503).json({ error: "Service momentanément indisponible. Réessayez dans quelques instants.", code: "SERVICE_UNAVAILABLE" });
  }
  if (!user) {
    return res.status(401).json({ message: "Session expirée. Reconnectez-vous." });
  }

  const { name, kind = "documents", download } = req.query;
  const storageKind = kind === "files" ? "files" : "documents";
  const filePath = safeFilePath(storageKind, name);

  if (!filePath) {
    return res.status(400).json({ message: "Nom de fichier invalide" });
  }

  try {
    const stat = fs.statSync(filePath);
    res.setHeader("Content-Type", mimeOf(filePath));
    res.setHeader("Content-Length", stat.size);
    // Document lié à une offre : jamais mis en cache par un intermédiaire.
    res.setHeader("Cache-Control", "private, max-age=600");
    res.setHeader(
      "Content-Disposition",
      `${download || !SAFE_INLINE.has(mimeOf(filePath)) ? "attachment" : "inline"}; filename="${path.basename(filePath)}"`,
    );

    // HEAD : on répond uniquement les en-têtes (pas de corps)
    if (req.method === "HEAD") return res.status(200).end();

    return res.status(200).send(fs.readFileSync(filePath));
  } catch (error) {
    return res.status(404).json({ message: "Document introuvable" });
  }
}
