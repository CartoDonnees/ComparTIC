import { DOCUMENT_KINDS } from "@/services/artciAssistant/documentKinds";

/**
 * Assistant IA ARTCI    gestion du contexte.
 *
 * Compose ce qui est transmis au moteur de rédaction : les consignes, les
 * passages retenus (numérotés, avec leur source) et la question. Le budget de
 * caractères borne la taille du contexte ; les passages les mieux classés
 * sont gardés en priorité.
 *
 * Module sans dépendance serveur.
 */

export const CONTEXT_BUDGET = 9000;

const dateFr = (d) => (d ? new Date(d).toLocaleDateString("fr-FR") : null);

/** Libellé d'une source : « Décision n° 2024-1098 du 12/03/2024    Article 5 ». */
export const sourceLabel = (p) => {
  const head = [DOCUMENT_KINDS[p.kind] && !p.reference ? DOCUMENT_KINDS[p.kind] : null, p.reference || p.title].filter(Boolean).join(" ");
  const date = dateFr(p.issuedAt);
  return `${head}${date ? ` du ${date}` : ""}${p.heading ? `    ${p.heading}` : ""}`;
};

export const INSTRUCTIONS =
  "Tu es l'Assistant IA ARTCI, spécialisé dans la réglementation ivoirienne des télécommunications/TIC et le traitement des offres de services. " +
  "Réponds en français, UNIQUEMENT à partir des passages numérotés ci-dessous, extraits de la base documentaire de l'ARTCI.\n" +
  "Règles impératives :\n" +
  "- chaque élément tiré d'un texte est suivi du numéro du passage entre crochets, par exemple [2] ;\n" +
  "- n'invente aucune disposition, aucun numéro d'article, aucune date, aucun montant : si les passages ne le disent pas, écris que la base documentaire ne le précise pas ;\n" +
  "- structure la réponse en trois parties, avec exactement ces intertitres :\n" +
  "  « Ce que disent les textes » (les dispositions, avec leurs numéros de passage),\n" +
  "  « Interprétation » (ton analyse, présentée comme une interprétation et non comme une règle),\n" +
  "  « Ce que la base documentaire ne couvre pas » (ce qui manque pour répondre complètement ; « Rien à signaler » sinon).";

/** Passages retenus dans le budget, renumérotés à partir de 1. */
export const selectPassages = (passages, budget = CONTEXT_BUDGET) => {
  const kept = [];
  let used = 0;
  for (const p of passages) {
    const cost = p.content.length + 120;
    if (kept.length && used + cost > budget) break;
    kept.push({ ...p, n: kept.length + 1 });
    used += cost;
  }
  return kept;
};

export const buildPrompt = (question, passages) =>
  `${INSTRUCTIONS}\n\n[Passages de la base documentaire]\n` +
  passages.map((p) => `[${p.n}] ${sourceLabel(p)}\n« ${p.content} »`).join("\n\n") +
  `\n\nQuestion : ${question}`;

/** Sources présentées à l'utilisateur (extrait court, pas le passage entier). */
export const toSources = (passages, cited = null) =>
  passages.map((p) => ({
    n: p.n,
    chunkId: p.chunkId,
    documentId: p.documentId,
    title: p.title,
    kind: p.kind,
    reference: p.reference,
    issuedAt: p.issuedAt,
    heading: p.heading,
    label: sourceLabel(p),
    excerpt: String(p.excerpt || p.content).slice(0, 420),
    cited: cited ? cited.has(p.n) : true,
  }));

/** Numéros de passage cités dans une réponse : [1], [2, 3]… */
export const citedNumbers = (answer, max) => {
  const found = new Set();
  for (const m of String(answer || "").matchAll(/\[(\d+(?:\s*[,;-]\s*\d+)*)\]/g)) {
    m[1].split(/[,;-]/).forEach((x) => {
      const n = Number(x.trim());
      if (n >= 1 && n <= max) found.add(n);
    });
  }
  return found;
};
