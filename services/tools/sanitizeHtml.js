/**
 * Nettoyage du texte riche saisi par les opérateurs (cible, description, modes
 * d'accès) avant affichage.
 *
 * Ces champs étaient injectés tels quels dans la page : un contenu contenant
 * un script ou un attribut `onerror` s'exécutait chez le validateur. Seules
 * les balises de mise en forme usuelles sont conservées, sans attribut (hors
 * liens http(s) et mailto, ouverts dans un nouvel onglet).
 */

const ALLOWED = new Set([
  "p", "br", "b", "strong", "i", "em", "u", "s", "sub", "sup", "span", "div",
  "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre", "code",
  "table", "thead", "tbody", "tr", "th", "td", "a", "hr",
]);
const DROP_WITH_CONTENT = new Set(["script", "style", "iframe", "object", "embed", "noscript", "template", "svg", "math"]);

const escape = (text) =>
  String(text ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const sanitizeHtml = (html) => {
  if (!html) return "";
  // Côté serveur : texte brut.
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return escape(String(html).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
  }
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const clean = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) return; // texte
      if (child.nodeType !== 1) {
        child.remove();
        return;
      }
      const tag = child.tagName.toLowerCase();
      if (DROP_WITH_CONTENT.has(tag)) {
        child.remove();
        return;
      }
      clean(child);
      if (!ALLOWED.has(tag)) {
        child.replaceWith(...child.childNodes);
        return;
      }
      const href = tag === "a" ? child.getAttribute("href") : null;
      [...child.attributes].forEach((attr) => child.removeAttribute(attr.name));
      if (href && /^(https?:|mailto:)/i.test(href.trim())) {
        child.setAttribute("href", href.trim());
        child.setAttribute("target", "_blank");
        child.setAttribute("rel", "noopener noreferrer");
      }
    });
  };
  const root = doc.body.firstChild;
  clean(root);
  return root.innerHTML;
};

/** Le champ contient-il du texte visible ? */
export const hasText = (html) => !!String(html ?? "").replace(/<[^>]*>|&nbsp;/g, "").trim();

export default sanitizeHtml;
