/**
 * Base documentaire    découpage d'un texte en passages.
 *
 * Un passage doit se suffire à lui-même pour être cité : on coupe de
 * préférence sur les articles et les titres (« Article 12 », « Chapitre II »,
 * « Section 3 », « Titre IV »), puis sur les paragraphes. Chaque passage
 * garde le dernier intitulé rencontré (`heading`), repris dans les citations.
 *
 * Fonction pure, sans dépendance.
 */

export const CHUNK_TARGET = 1100;
export const CHUNK_MAX = 1700;

const HEADING = /^\s*((?:article|art\.)\s+(?:premier|1er|\d+[\w.-]*)|(?:titre|chapitre|section|sous-section|partie|annexe)\s+[\w.-]+)\b[^\n]{0,120}$/i;

const isHeading = (line) => HEADING.test(line) && line.trim().length <= 140;

/** Coupe un bloc trop long sur les fins de phrase. */
const splitLong = (text) => {
  if (text.length <= CHUNK_MAX) return [text];
  const parts = [];
  let rest = text;
  while (rest.length > CHUNK_MAX) {
    const window = rest.slice(0, CHUNK_MAX);
    const cut = Math.max(window.lastIndexOf(". "), window.lastIndexOf(" ; "), window.lastIndexOf("\n"));
    const at = cut > CHUNK_TARGET / 2 ? cut + 1 : CHUNK_MAX;
    parts.push(rest.slice(0, at).trim());
    rest = rest.slice(at).trim();
  }
  if (rest) parts.push(rest);
  return parts;
};

export const chunkText = (text) => {
  const lines = String(text || "").split("\n");
  const chunks = [];
  let heading = null;
  let buffer = [];
  let size = 0;

  const flush = () => {
    const content = buffer.join("\n").trim();
    buffer = [];
    size = 0;
    if (!content) return;
    splitLong(content).forEach((part) => chunks.push({ heading, content: part }));
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (isHeading(line)) {
      // Nouvel article / titre : le passage en cours s'arrête là.
      flush();
      heading = line.replace(/\s+/g, " ").slice(0, 140);
      buffer.push(line);
      size += line.length;
      continue;
    }
    if (!line) {
      // Fin de paragraphe : on coupe si le passage est assez long.
      if (size >= CHUNK_TARGET) flush();
      else if (buffer.length) buffer.push("");
      continue;
    }
    buffer.push(line);
    size += line.length + 1;
    if (size >= CHUNK_MAX) flush();
  }
  flush();
  return chunks.map((c, i) => ({ position: i + 1, heading: c.heading, content: c.content }));
};

export default chunkText;
