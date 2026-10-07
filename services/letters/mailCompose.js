/**
 * Ouverture d'un courrier dans la messagerie de l'utilisateur.
 *
 * Trois voies, de la plus directe à la plus complète :
 *  - `mailto:`  : l'application de messagerie du poste (Outlook, Courrier,
 *                 Thunderbird...). Texte simple, longueur limitée.
 *  - webmail   : fenêtre de rédaction de Gmail ou d'Outlook en ligne.
 *  - `.eml`    : fichier « message non envoyé » qui s'ouvre en brouillon avec
 *                la mise en forme complète et le logo.
 *
 * Module pur (navigateur et Node) : aucune dépendance.
 */

/**
 * Longueur maximale d'un lien `mailto:`. Windows refuse de transmettre à la
 * messagerie une adresse de plus de 2 083 caractères : au-delà, le clic ne
 * fait rien, sans message. On reste en dessous, accents encodés compris.
 */
export const MAILTO_MAX = 1900;
/** Hors Windows, les messageries acceptent des liens bien plus longs. */
export const MAILTO_MAX_LONG = 6000;

/** Limite à appliquer selon le poste (chaîne `navigator.userAgent`). Dans le doute, la plus stricte. */
export const mailtoLimit = (userAgent) => (/Macintosh|Mac OS X|Linux|X11|CrOS|Android|iPhone|iPad/i.test(String(userAgent ?? "")) && !/Windows/i.test(String(userAgent ?? "")) ? MAILTO_MAX_LONG : MAILTO_MAX);
/** Longueur d'URL acceptée sans difficulté par les messageries en ligne. */
export const WEBMAIL_MAX = 6000;

const MORE_NOTE = "[... suite du courrier : collez ici le texte copié depuis CompareTIC]";

const enc = (value) => encodeURIComponent(String(value ?? ""));
// L'arobase n'a pas à être encodée dans une adresse ; certaines messageries la lisent mal sinon.
const addresses = (list) => (list || []).map((email) => enc(email).replace(/%40/gi, "@")).join(",");
const crlf = (text) => String(text ?? "").replace(/\r\n?|\n/g, "\r\n");

/** Coupe sans casser un caractère composé (paire de substitution). */
const safeSlice = (text, length) => {
  const code = text.charCodeAt(length - 1);
  return text.slice(0, code >= 0xd800 && code <= 0xdbff ? length - 1 : length);
};

/**
 * Plus long début de `body` tel que `prefix + corps encodé` tienne dans
 * `maxLength`. Le texte est coupé de préférence en fin de ligne ou de mot.
 */
const fitBody = (prefix, body, maxLength) => {
  const text = crlf(body);
  if (prefix.length + enc(text).length <= maxLength) return { text, truncated: false };
  const tail = `\r\n\r\n${MORE_NOTE}`;
  const budget = maxLength - prefix.length - enc(tail).length;
  let low = 0;
  let high = text.length;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (enc(safeSlice(text, mid)).length <= budget) low = mid;
    else high = mid - 1;
  }
  let cut = safeSlice(text, low);
  const lineBreak = cut.lastIndexOf("\r\n");
  const space = cut.lastIndexOf(" ");
  if (lineBreak > cut.length * 0.6) cut = cut.slice(0, lineBreak);
  else if (space > cut.length * 0.6) cut = cut.slice(0, space);
  return { text: `${cut.trimEnd()}${tail}`, truncated: true };
};

/**
 * Lien `mailto:` (RFC 6068) : destinataires, copie, objet et corps préremplis.
 * @returns {{ href: string, truncated: boolean }}
 */
export const buildMailto = ({ to = [], cc = [], subject = "", body = "", maxLength = MAILTO_MAX } = {}) => {
  const params = [];
  if (cc.length) params.push(`cc=${addresses(cc)}`);
  params.push(`subject=${enc(subject)}`);
  const prefix = `mailto:${addresses(to)}?${params.join("&")}&body=`;
  const { text, truncated } = fitBody(prefix, body, maxLength);
  return { href: `${prefix}${enc(text)}`, truncated };
};

export const WEBMAILS = [
  { key: "gmail", label: "Gmail", icon: "bi-google" },
  { key: "outlook", label: "Outlook en ligne", icon: "bi-microsoft" },
];

/**
 * Fenêtre de rédaction d'une messagerie en ligne, préremplie.
 * @returns {{ href: string, truncated: boolean } | null}
 */
export const buildWebmailUrl = (provider, { to = [], cc = [], subject = "", body = "", maxLength = WEBMAIL_MAX } = {}) => {
  let prefix;
  if (provider === "gmail") {
    prefix = `https://mail.google.com/mail/?view=cm&fs=1&to=${addresses(to)}${cc.length ? `&cc=${addresses(cc)}` : ""}&su=${enc(subject)}&body=`;
  } else if (provider === "outlook") {
    prefix = `https://outlook.office.com/mail/deeplink/compose?to=${addresses(to)}${cc.length ? `&cc=${addresses(cc)}` : ""}&subject=${enc(subject)}&body=`;
  } else {
    return null;
  }
  const { text, truncated } = fitBody(prefix, body, maxLength);
  return { href: `${prefix}${enc(text)}`, truncated };
};

/* ------------------------------------------------------------------ .eml */

const utf8Bytes = (text) => {
  if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(String(text ?? ""));
  return Uint8Array.from(Buffer.from(String(text ?? ""), "utf-8"));
};

const bytesToBase64 = (bytes) => {
  if (typeof Buffer !== "undefined") return Buffer.from(bytes).toString("base64");
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(binary);
};

const wrap76 = (base64) => base64.replace(/(.{76})/g, "$1\r\n").replace(/\r\n$/, "");
const base64Text = (text) => wrap76(bytesToBase64(utf8Bytes(text)));

/** En-tête contenant des caractères accentués (RFC 2047), découpé en mots de 45 octets. */
const encodedWord = (text) => {
  const value = String(text ?? "");
  if (/^[\x20-\x7e]*$/.test(value)) return value;
  const bytes = utf8Bytes(value);
  const words = [];
  let start = 0;
  while (start < bytes.length) {
    let end = Math.min(start + 45, bytes.length);
    // Ne pas couper au milieu d'un caractère UTF-8 (octets de suite : 10xxxxxx).
    while (end < bytes.length && (bytes[end] & 0xc0) === 0x80) end -= 1;
    words.push(`=?UTF-8?B?${bytesToBase64(bytes.subarray(start, end))}?=`);
    start = end;
  }
  return words.join("\r\n ");
};

/** Nom de fichier sans caractère gênant pour un système de fichiers. */
export const emlFileName = (subject) => {
  const base = String(subject ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base || "courrier"}.eml`;
};

/**
 * Message complet au format `.eml`, marqué « non envoyé » (`X-Unsent: 1`) :
 * Outlook et Thunderbird l'ouvrent en brouillon prêt à être envoyé, avec la
 * mise en forme et le logo. Les autres messageries l'affichent comme un
 * message reçu, à transférer.
 *
 * @param images  images intégrées : [{ cid, mime, base64 }]
 */
export const buildEml = ({ to = [], cc = [], subject = "", html = "", text = "", images = [] } = {}) => {
  const stamp = Date.now().toString(36);
  const alt = `=_alt_${stamp}`;
  const rel = `=_rel_${stamp}`;
  const headers = ["X-Unsent: 1", `To: ${to.join(", ")}`];
  if (cc.length) headers.push(`Cc: ${cc.join(", ")}`);
  headers.push(`Subject: ${encodedWord(subject)}`, "MIME-Version: 1.0");

  const alternative = [
    `Content-Type: multipart/alternative; boundary="${alt}"`,
    "",
    `--${alt}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    base64Text(crlf(text)),
    `--${alt}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    base64Text(`<!doctype html><html lang="fr"><head><meta charset="utf-8"></head><body>${html}</body></html>`),
    `--${alt}--`,
  ];

  if (!images.length) return [...headers, ...alternative, ""].join("\r\n");

  const related = [`Content-Type: multipart/related; type="multipart/alternative"; boundary="${rel}"`, "", `--${rel}`, ...alternative];
  images.forEach((image) => {
    related.push(
      `--${rel}`,
      `Content-Type: ${image.mime}`,
      "Content-Transfer-Encoding: base64",
      `Content-ID: <${image.cid}>`,
      `Content-Disposition: inline; filename="${image.cid}.${String(image.mime).split("/").pop()}"`,
      "",
      wrap76(image.base64),
    );
  });
  related.push(`--${rel}--`, "");
  return [...headers, ...related].join("\r\n");
};
