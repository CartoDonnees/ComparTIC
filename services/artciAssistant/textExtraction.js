/**
 * Base documentaire    extraction du texte d'un fichier déposé.
 *
 * Formats : texte (.txt, .md), PDF (.pdf) et Word (.docx). Un PDF scanné
 * (images sans couche de texte) ne contient pas de texte exploitable : il est
 * refusé avec un message explicite plutôt qu'enregistré vide.
 */

export const MAX_DOCUMENT_BYTES = 12 * 1024 * 1024;
export const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".txt", ".md"];

export class ExtractionError extends Error {
  constructor(message, code = "EXTRACTION") {
    super(message);
    this.code = code;
    this.status = 422;
  }
}

/** Remet le texte au propre : fins de ligne, césures, espaces, lignes vides. */
export const normalizeText = (text) =>
  String(text ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/­/g, "")
    .replace(/[​﻿]/g, "")
    .replace(/(\p{L})-\n(\p{Ll})/gu, "$1$2") // mot coupé en fin de ligne
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

export const extractText = async (fileName, buffer) => {
  const name = String(fileName || "").toLowerCase();
  const ext = name.slice(name.lastIndexOf("."));
  if (!ACCEPTED_EXTENSIONS.includes(ext)) {
    throw new ExtractionError(`Format non pris en charge. Formats acceptés : ${ACCEPTED_EXTENSIONS.join(", ")}.`, "FORMAT");
  }
  if (!buffer?.length) throw new ExtractionError("Le fichier est vide.", "EMPTY");
  if (buffer.length > MAX_DOCUMENT_BYTES) {
    throw new ExtractionError(`Le fichier dépasse ${Math.round(MAX_DOCUMENT_BYTES / 1048576)} Mo.`, "TOO_LARGE");
  }

  let text = "";
  try {
    if (ext === ".pdf") {
      // Import direct du module : le point d'entrée du paquet exécute un essai
      // sur un fichier d'exemple quand il est chargé hors de CommonJS.
      const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
      text = (await pdfParse(buffer)).text;
    } else if (ext === ".docx") {
      const mammoth = await import("mammoth");
      text = (await (mammoth.default || mammoth).extractRawText({ buffer })).value;
    } else {
      text = buffer.toString("utf8");
    }
  } catch (error) {
    console.error("[base documentaire] extraction :", error?.message);
    throw new ExtractionError("Le fichier n'a pas pu être lu. Vérifiez qu'il n'est ni protégé ni endommagé.", "UNREADABLE");
  }

  const clean = normalizeText(text);
  if (clean.replace(/\s/g, "").length < 80) {
    throw new ExtractionError(
      ext === ".pdf"
        ? "Aucun texte n'a pu être extrait de ce PDF : il s'agit probablement d'un document scanné. Déposez une version texte (PDF natif, Word) ou collez le texte."
        : "Le document ne contient pas assez de texte pour être interrogé.",
      "NO_TEXT",
    );
  }
  return clean;
};
