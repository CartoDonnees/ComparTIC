import fs from "fs";
import formidable from "formidable";
import { ensureDir, uniqueName } from "./storage";
import { readSession } from "@/services/config/auth/session";

/**
 * Fabrique de handlers d'upload pour les routes `/api/files/uploads/*`.
 *
 * Tous les fichiers sont écrits dans `uploads/<kind>` À LA RACINE du projet
 * (jamais dans `public/`), et ne sont ensuite lisibles que via les routes
 * `/api/files/downloads/...`.
 *
 * AUDIT : ces routes étaient ouvertes à tous et acceptaient n'importe quel
 * type de fichier (jusqu'à 50 Mo). N'importe qui pouvait saturer le disque,
 * et un SVG ou un HTML déposé était ensuite servi « inline » depuis le
 * domaine de la plateforme (script exécuté dans la session des utilisateurs).
 * Désormais : session obligatoire, extension ET type MIME contrôlés, fichier
 * refusé supprimé immédiatement.
 *
 * Réponse : { success, fileName, filename, message }
 * (`fileName` et `filename` sont tous deux renvoyés pour rester compatible
 *  avec l'ensemble des appelants existants.)
 */

const ALLOWED = {
  images: {
    ext: [".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"],
    mime: ["image/png", "image/jpeg", "image/webp", "image/gif", "image/bmp"],
    label: "image (PNG, JPEG, WEBP, GIF)",
  },
  documents: {
    ext: [".pdf", ".xlsx", ".xls", ".doc", ".docx", ".csv", ".txt", ".kml", ".geojson", ".json"],
    mime: [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/csv",
      "text/plain",
      "application/vnd.google-earth.kml+xml",
      "application/geo+json",
      "application/json",
      "application/octet-stream",
    ],
    label: "document (PDF, Word, Excel, CSV)",
  },
};
ALLOWED.files = ALLOWED.documents;

const extensionOf = (name = "") => {
  const dot = String(name).lastIndexOf(".");
  return dot > -1 ? String(name).slice(dot).toLowerCase() : "";
};

export const createUploadHandler = ({ kind, maxFileSizeMb = 20 } = {}) => {
  const rules = ALLOWED[kind] || ALLOWED.documents;

  return async function handler(req, res) {
    if (req.method !== "POST") {
      res.setHeader("Allow", ["POST"]);
      return res
        .status(405)
        .json({ success: false, message: `Méthode ${req.method} non autorisée` });
    }

    // Téléversement réservé aux comptes connectés (opérateurs compris).
    const { user, unavailable } = await readSession(req);
    if (unavailable) {
      return res
        .status(503)
        .json({ success: false, message: "Service momentanément indisponible. Réessayez dans quelques instants." });
    }
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Session expirée. Reconnectez-vous." });
    }

    try {
      const uploadDir = ensureDir(kind); // crée le dossier si nécessaire

      const form = formidable({
        multiples: false,
        uploadDir,
        keepExtensions: true,
        maxFileSize: maxFileSizeMb * 1024 * 1024,
        // Nom unique et sans caractères douteux
        filename: (name, ext, part) =>
          uniqueName(part?.originalFilename || name || "", ext || ""),
      });

      form.parse(req, (err, fields, files) => {
        if (err) {
          const tooBig = String(err?.code || "").includes("maxFileSize") || err?.httpCode === 413;
          return res.status(tooBig ? 413 : 500).json({
            success: false,
            message: tooBig
              ? `Fichier trop volumineux (maximum ${maxFileSizeMb} Mo).`
              : "Erreur lors du téléversement",
          });
        }

        // Premier fichier trouvé, quel que soit le nom du champ
        const first = Object.values(files || {})[0];
        const file = Array.isArray(first) ? first[0] : first;

        if (!file) {
          return res
            .status(400)
            .json({ success: false, message: "Aucun fichier reçu" });
        }

        const ext = extensionOf(file.originalFilename || file.newFilename);
        const mime = String(file.mimetype || "").toLowerCase();
        if (!rules.ext.includes(ext) || (mime && !rules.mime.includes(mime))) {
          // Le fichier refusé ne doit pas rester sur le disque.
          try {
            fs.unlinkSync(file.filepath);
          } catch {
            /* déjà supprimé */
          }
          return res.status(415).json({
            success: false,
            message: `Type de fichier non autorisé. Attendu : ${rules.label}.`,
          });
        }

        const fileName = file.newFilename;
        return res.status(200).json({
          success: true,
          message: "Fichier téléversé avec succès",
          fileName,
          filename: fileName,
        });
      });
    } catch (error) {
      console.error("Téléversement :", error?.message);
      return res
        .status(500)
        .json({ success: false, message: "Erreur lors du téléversement" });
    }
  };
};

/** Next.js : le parsing du corps est délégué à formidable. */
// NOTE: conserve pour reference, mais NE PAS reexporter tel quel depuis une
// route API : Next.js exige un litteral pour `export const config`.
export const uploadApiConfig = { api: { bodyParser: false } };
