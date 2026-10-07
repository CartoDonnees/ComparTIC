/**
 * HTML d'un courrier : nettoyage et conversion en texte.
 *
 * Le courrier est rédigé dans un éditeur riche puis enregistré, imprimé ou
 * envoyé par e-mail : il est donc nettoyé CÔTÉ SERVEUR avant toute écriture
 * (liste blanche de balises, attributs réduits à la mise en forme). Module
 * sans dépendance : utilisable par l'API et par le navigateur.
 */

const ALLOWED = new Set([
  "p", "br", "b", "strong", "i", "em", "u", "s", "sub", "sup", "span", "div",
  "ul", "ol", "li", "h1", "h2", "h3", "h4", "blockquote",
  "table", "thead", "tbody", "tr", "th", "td", "a", "hr",
]);
const DROP_WITH_CONTENT = /<(script|style|iframe|object|embed|noscript|template|svg|math)\b[\s\S]*?<\/\1\s*>/gi;

const escapeAttr = (v) => String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/** Attributs conservés : alignement / retrait (classes Quill ou style), liens sûrs, fusion de cellules. */
const cleanAttributes = (tag, raw) => {
  const out = [];
  const attr = (name) => {
    const m = raw.match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
    return m ? (m[2] ?? m[3] ?? m[4] ?? "") : null;
  };
  const cls = attr("class");
  if (cls) {
    const kept = cls.split(/\s+/).filter((c) => /^(ql-(align|indent|size)-[a-z0-9]+|lt-[a-z0-9-]+)$/.test(c));
    if (kept.length) out.push(`class="${kept.join(" ")}"`);
  }
  const style = attr("style");
  if (style) {
    const align = style.match(/text-align\s*:\s*(left|right|center|justify)/i);
    if (align) out.push(`style="text-align: ${align[1].toLowerCase()}"`);
  }
  if (tag === "a") {
    const href = attr("href");
    if (href && /^(https?:|mailto:)/i.test(href.trim())) out.push(`href="${escapeAttr(href.trim())}" target="_blank" rel="noopener noreferrer"`);
  }
  if (tag === "td" || tag === "th") {
    ["colspan", "rowspan"].forEach((n) => {
      const v = attr(n);
      if (v && /^\d{1,2}$/.test(v)) out.push(`${n}="${v}"`);
    });
  }
  return out.length ? ` ${out.join(" ")}` : "";
};

export const MAX_LETTER_CHARS = 60000;

export const sanitizeLetterHtml = (html) => {
  const source = String(html ?? "").slice(0, MAX_LETTER_CHARS * 2);
  return source
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(DROP_WITH_CONTENT, "")
    .replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (match, name, rest) => {
      const tag = name.toLowerCase();
      if (!ALLOWED.has(tag)) return "";
      if (match.startsWith("</")) return `</${tag}>`;
      return `<${tag}${cleanAttributes(tag, rest)}>`;
    })
    .trim()
    .slice(0, MAX_LETTER_CHARS);
};

/** Version texte (e-mail en texte brut, copie, messagerie de l'utilisateur). */
export const letterToText = (html) =>
  String(html ?? "")
    .replace(/<(br|hr)\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|tr|blockquote)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<\/(td|th)>/gi, "\t")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

export const escapeHtml = (text) =>
  String(text ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/**
 * Les messageries ignorent les feuilles de style : l'alignement et le retrait
 * posés par l'éditeur (classes) sont traduits en styles en ligne.
 */
export const inlineLetterStyles = (html) =>
  String(html ?? "").replace(/<([a-z0-9]+)\s+class="([^"]*)"/gi, (match, tag, cls) => {
    const styles = [];
    const align = cls.match(/ql-align-(right|center|justify)/);
    if (align) styles.push(`text-align:${align[1]}`);
    const indent = cls.match(/ql-indent-(\d)/);
    if (indent) styles.push(`padding-left:${Number(indent[1]) * 3}em`);
    return styles.length ? `<${tag} style="${styles.join(";")}"` : `<${tag}`;
  });

/** Logo officiel de l'ARTCI (500 × 218 px), servi depuis `public/`. */
export const LETTER_LOGO = {
  path: "/images/logo/logo.png",
  file: "public/images/logo/logo.png",
  cid: "artci-logo",
  ratio: 500 / 218,
  alt: "ARTCI, Autorité de Régulation des Télécommunications/TIC de Côte d'Ivoire",
};

const LOGO_HEIGHT = 76;

/**
 * En-tête du courrier : le logo de l'ARTCI au-dessus d'un filet.
 *
 * `inline` : styles portés par les balises, pour un e-mail (les messageries
 * ignorent les feuilles de style). Largeur et hauteur sont écrites en
 * attributs pour que le logo garde ses proportions partout, y compris quand
 * la messagerie bloque les styles.
 */
export const letterheadHtml = (logoSrc, { inline = false } = {}) => {
  const width = Math.round(LOGO_HEIGHT * LETTER_LOGO.ratio);
  const img = `<img src="${escapeHtml(logoSrc)}" alt="${escapeHtml(LETTER_LOGO.alt)}" width="${width}" height="${LOGO_HEIGHT}"`;
  if (!inline) return `<div class="lt-letterhead">${img}></div>`;
  return (
    `<div style="margin:0 0 26px;padding:0 0 14px;border-bottom:2px solid #f57c00">` +
    `${img} style="display:block;border:0;outline:none;width:${width}px;height:${LOGO_HEIGHT}px"></div>`
  );
};

/** Corps HTML d'un e-mail : en-tête, puis le courrier avec ses styles en ligne. */
export const letterEmailHtml = (html, logoSrc = null) =>
  `<div style="font-family:Georgia,'Times New Roman',serif;color:#1c2430;max-width:680px;line-height:1.55">` +
  `${logoSrc ? letterheadHtml(logoSrc, { inline: true }) : ""}${inlineLetterStyles(html)}</div>`;
