/**
 * Rendu Markdown sûr pour les réponses de l'assistant.
 *
 * Le texte est d'abord échappé (aucune balise venant du service d'analyse ne
 * peut être interprétée), puis les constructions courantes sont converties :
 * titres, listes à puces / numérotées, citations, blocs de code, tableaux,
 * séparateurs, gras, italique, code en ligne.
 */

const escapeHtml = (text) =>
  String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const inline = (text) =>
  text
    .replace(/`([^`\n]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*\n]+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_\n]+?)__/g, "<strong>$1</strong>")
    .replace(/(^|[\s(])\*([^*\s][^*\n]*?)\*(?=[\s.,;:!?)]|$)/g, "$1<em>$2</em>")
    .replace(/(^|[\s(])_([^_\s][^_\n]*?)_(?=[\s.,;:!?)]|$)/g, "$1<em>$2</em>");

const splitRow = (line) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());

export const renderMarkdown = (source) => {
  const lines = escapeHtml(source).replace(/\r\n?/g, "\n").split("\n");
  const out = [];
  let i = 0;

  const isBlockStart = (idx) =>
    /^\s*(#{1,6}\s|[-*+]\s|\d+[.)]\s|&gt;|```|(-{3,}|\*{3,})\s*$)/.test(lines[idx]) ||
    (/^\s*\|/.test(lines[idx]) && /^\s*\|?\s*:?-{2,}/.test(lines[idx + 1] || ""));

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i += 1;
      continue;
    }

    // Bloc de code
    if (/^\s*```/.test(line)) {
      const buf = [];
      i += 1;
      while (i < lines.length && !/^\s*```/.test(lines[i])) buf.push(lines[i++]);
      i += 1;
      out.push(`<pre><code>${buf.join("\n")}</code></pre>`);
      continue;
    }

    // Titre
    const heading = line.match(/^\s*(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = Math.min(heading[1].length + 2, 6);
      out.push(`<h${level}>${inline(heading[2].replace(/#+\s*$/, ""))}</h${level}>`);
      i += 1;
      continue;
    }

    // Séparateur
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      out.push("<hr>");
      i += 1;
      continue;
    }

    // Tableau
    if (/^\s*\|/.test(line) && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1] || "")) {
      const head = splitRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) rows.push(splitRow(lines[i++]));
      out.push(
        `<div class="md-table"><table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>${rows
          .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`)
          .join("")}</tbody></table></div>`,
      );
      continue;
    }

    // Citation
    if (/^\s*&gt;/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*&gt;/.test(lines[i])) buf.push(lines[i++].replace(/^\s*&gt;\s?/, ""));
      out.push(`<blockquote>${inline(buf.join("<br>"))}</blockquote>`);
      continue;
    }

    // Listes (les lignes de continuation indentées restent dans l'élément)
    const listMatch = line.match(/^\s*([-*+]|\d+[.)])\s+/);
    if (listMatch) {
      const ordered = /\d/.test(listMatch[1]);
      const pattern = ordered ? /^\s*\d+[.)]\s+(.*)$/ : /^\s*[-*+]\s+(.*)$/;
      const items = [];
      while (i < lines.length) {
        const m = lines[i].match(pattern);
        if (m) {
          items.push(m[1]);
          i += 1;
        } else if (items.length && /^\s{2,}\S/.test(lines[i]) && !isBlockStart(i)) {
          items[items.length - 1] += `<br>${lines[i].trim()}`;
          i += 1;
        } else if (items.length && /^\s{2,}([-*+]|\d+[.)])\s+/.test(lines[i])) {
          // sous-élément : rendu en ligne sous l'élément courant
          items[items.length - 1] += `<br>• ${lines[i].replace(/^\s*([-*+]|\d+[.)])\s+/, "")}`;
          i += 1;
        } else if (!lines[i].trim() && pattern.test(lines[i + 1] || "")) {
          i += 1;
        } else break;
      }
      const tag = ordered ? "ol" : "ul";
      const start = ordered ? parseInt(listMatch[1], 10) : 1;
      out.push(
        `<${tag}${ordered && start > 1 ? ` start="${start}"` : ""}>${items.map((it) => `<li>${inline(it)}</li>`).join("")}</${tag}>`,
      );
      continue;
    }

    // Paragraphe
    const buf = [];
    while (i < lines.length && lines[i].trim() && !isBlockStart(i)) buf.push(lines[i++]);
    if (!buf.length) buf.push(lines[i++]);
    out.push(`<p>${inline(buf.join("<br>"))}</p>`);
  }

  return out.join("");
};

/** Texte brut (copie, titre de conversation). */
export const stripMarkdown = (source) =>
  String(source ?? "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`|]/g, "")
    .replace(/\s+/g, " ")
    .trim();

export default renderMarkdown;
