import fs from "fs";
import { safeFilePath, mimeOf } from "@/services/config/storage";

/**
 * Lecture d'une image stockée dans `uploads/images` (racine du projet).
 *
 * GET /api/files/downloads/images?name=<fichier>
 *
 * Le dossier `uploads/` n'étant pas servi en statique, cette route est le seul
 * point d'accès aux images. Le nom est neutralisé (pas de traversée de
 * répertoire) et le type MIME est déduit de l'extension réelle.
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: `Méthode ${req.method} non autorisée` });
  }

  const { name } = req.query;
  const filePath = safeFilePath("images", name);

  if (!filePath) {
    return res.status(400).json({ message: "Nom de fichier invalide" });
  }

  try {
    const buffer = fs.readFileSync(filePath);
    res.setHeader("Content-Type", mimeOf(filePath));
    res.setHeader("Content-Length", buffer.length);
    // Les noms de fichiers sont horodatés/uniques -> cache long sans risque
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return res.status(200).send(buffer);
  } catch (error) {
    return res.status(404).json({ message: "Image introuvable" });
  }
}
