import { createHash } from "node:crypto";
import { blockedByRateLimit } from "@/services/config/auth/rateLimit";
import { MAX_FILE_BYTES } from "@/services/import/offerImportSchema";
import { ImportFileError, readWorkbook } from "@/services/import/offerImportService";

/**
 * Lecture commune aux routes d'analyse et d'import : contrôle du débit, du
 * nom et de la taille du fichier, puis de sa structure (modèle attendu).
 * Envoie elle-même la réponse d'erreur et renvoie alors `null`.
 *
 * @returns {null | { workbook: object, reference: string }} `reference`
 *   identifie CE fichier (empreinte de son contenu) : c'est la référence du
 *   code de confirmation exigé d'un point focal avant la soumission.
 */
export const readUploadedWorkbook = (req, res) => {
  if (blockedByRateLimit(req, res, { preset: "offerImport" })) return null;
  const { fileName, fileBase64 } = req.body || {};
  if (!fileName || !/\.xlsx$/i.test(String(fileName))) {
    res.status(422).json({ error: "Format non pris en charge : chargez le modèle au format Excel (.xlsx).", code: "FORMAT" });
    return null;
  }
  if (typeof fileBase64 !== "string" || !fileBase64) {
    res.status(422).json({ error: "Aucun fichier reçu.", code: "EMPTY" });
    return null;
  }
  const buffer = Buffer.from(fileBase64, "base64");
  if (buffer.length > MAX_FILE_BYTES) {
    res.status(413).json({ error: `Le fichier dépasse ${Math.round(MAX_FILE_BYTES / 1048576)} Mo.`, code: "TOO_LARGE" });
    return null;
  }
  try {
    const reference = `IMPORT-${createHash("sha256").update(buffer).digest("hex").slice(0, 16).toUpperCase()}`;
    return { workbook: readWorkbook(buffer), reference };
  } catch (error) {
    if (error instanceof ImportFileError) {
      res.status(422).json({ error: error.message, code: error.code, details: error.details || [] });
      return null;
    }
    throw error;
  }
};

