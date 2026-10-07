import path from "path";
import fs from "fs";

/**
 * Stockage des fichiers uploadés.
 *
 * Le dossier `uploads/` se trouve à la RACINE du projet (et non dans `public/`)
 * afin que son contenu ne soit jamais exposé en statique : toute lecture et
 * toute écriture passent obligatoirement par les routes API `/api/files/...`.
 *
 * Arborescence :
 *   uploads/
 *     images/     -> logos opérateurs, avatars utilisateurs...
 *     documents/  -> pièces jointes des offres (PDF...)
 *     files/      -> autres fichiers
 */

// Types de stockage autorisés -> sous-dossier
export const STORAGE_KINDS = {
  images: "images",
  documents: "documents",
  files: "files",
};

/** Racine absolue du stockage. */
export const uploadsRoot = () => path.join(process.cwd(), "uploads");

/**
 * Répertoire absolu d'un type de stockage, créé si absent.
 * @param {"images"|"documents"|"files"} kind
 */
export const ensureDir = (kind) => {
  const sub = STORAGE_KINDS[kind];
  if (!sub) throw new Error(`Type de stockage invalide: ${kind}`);
  const dir = path.join(uploadsRoot(), sub);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};

/**
 * Résout un nom de fichier en chemin absolu SÛR.
 * Empêche toute traversée de répertoire (`../`, chemins absolus...).
 * @returns {string|null} chemin absolu, ou null si le nom est invalide/hors zone
 */
export const safeFilePath = (kind, name) => {
  const sub = STORAGE_KINDS[kind];
  if (!sub || !name || typeof name !== "string") return null;

  // On ne garde que le nom de base : neutralise "../", "/etc/passwd", etc.
  const base = path.basename(name);
  if (!base || base === "." || base === "..") return null;

  const dir = path.join(uploadsRoot(), sub);
  const full = path.join(dir, base);

  // Ceinture et bretelles : le résultat doit rester dans le dossier cible
  if (!full.startsWith(dir + path.sep)) return null;
  return full;
};

/** Type MIME déduit de l'extension. */
export const mimeOf = (filename) => {
  const ext = path.extname(filename || "").toLowerCase();
  const map = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".bmp": "image/bmp",
    ".ico": "image/x-icon",
    ".pdf": "application/pdf",
    ".csv": "text/csv",
    ".txt": "text/plain",
    ".json": "application/json",
    ".geojson": "application/geo+json",
    ".kml": "application/vnd.google-earth.kml+xml",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".xls": "application/vnd.ms-excel",
    ".doc": "application/msword",
    ".docx":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
  return map[ext] || "application/octet-stream";
};

/** Génère un nom de fichier unique en conservant l'extension d'origine. */
export const uniqueName = (originalName = "", fallbackExt = "") => {
  const ext = path.extname(originalName) || fallbackExt;
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
};
