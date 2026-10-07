import prisma from "@/services/config/auth/prisma";
import { Prisma } from "@prisma/client";

/**
 * Base documentaire    recherche des passages pertinents.
 *
 * Recherche plein texte de PostgreSQL en français (racinisation, mots vides),
 * sur les seuls documents EN VIGUEUR. La question est d'abord cherchée telle
 * quelle (tous les termes) ; si rien ne correspond, on élargit à « au moins
 * un des termes significatifs », en gardant le classement par pertinence.
 *
 * Aucun appel externe : la recherche est locale, rapide et sans coût.
 */

const STOP = new Set(
  "le la les un une des du de d l au aux et ou est sont a ont que qui quoi dont où en dans sur sous par pour avec sans ce cet cette ces se sa son ses leur leurs il elle ils elles on nous vous je tu y ne pas plus moins très quel quelle quels quelles comment pourquoi quand combien peut peuvent doit doivent faut être avoir faire fait selon entre vers chez si mais donc car ni comme aussi tout tous toute toutes".split(" "),
);

/** Termes significatifs de la question (pour la recherche élargie). */
export const significantTerms = (question) =>
  [...new Set(
    String(question || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 2 && !STOP.has(w)),
  )].slice(0, 14);

const SELECT = Prisma.sql`
  c.id AS "chunkId", c.position, c.heading, c.content,
  d.id AS "documentId", d.title, d.kind, d.reference, d."issuedAt"
`;

/**
 * `terms` sert à compter, pour chaque passage, combien de termes de la question
 * il contient : c'est ce qui écarte un passage qui ne partage qu'un mot
 * générique (« conditions », « offre ») avec une question hors sujet.
 */
const run = (tsquery, terms, minMatched, limit) => prisma.$queryRaw`
  SELECT * FROM (
    SELECT ${SELECT},
           ts_rank_cd(to_tsvector('french', c.content), ${tsquery}) AS rank,
           (SELECT count(*)::int FROM unnest(${terms}::text[]) AS t(term)
             WHERE to_tsvector('french', c.content) @@ plainto_tsquery('french', t.term)) AS matched,
           ts_headline('french', c.content, ${tsquery}, 'MaxFragments=2, MinWords=12, MaxWords=38, FragmentDelimiter=" … ", StartSel=«, StopSel=»') AS excerpt
    FROM "KnowledgeChunk" c
    JOIN "KnowledgeDocument" d ON d.id = c."documentId"
    WHERE d."inForce" = true AND to_tsvector('french', c.content) @@ ${tsquery}
  ) hits
  WHERE hits.matched >= ${minMatched}
  ORDER BY hits.matched DESC, hits.rank DESC, hits."issuedAt" DESC NULLS LAST, hits.position ASC
  LIMIT ${limit}
`;

/**
 * @returns {Promise<{ passages: Array, mode: "ALL_TERMS"|"ANY_TERM"|"NONE", terms: string[] }>}
 */
export const searchPassages = async (question, { limit = 6 } = {}) => {
  const q = String(question || "").trim().slice(0, 600);
  const terms = significantTerms(q);
  if (!q || !terms.length) return { passages: [], mode: "NONE", terms };
  const take = Math.min(12, Math.max(1, Number(limit) || 6));

  // 1. Tous les termes dans le même passage.
  let rows = await run(Prisma.sql`websearch_to_tsquery('french', ${terms.join(" ")})`, terms, 1, take);
  let mode = "ALL_TERMS";
  // 2. À défaut, une partie des termes    au moins deux, et la moitié d'entre
  //    eux : un seul mot en commun ne suffit pas à fonder une réponse.
  if (!rows.length && terms.length > 1) {
    const needed = Math.max(2, Math.ceil(terms.length / 2));
    rows = await run(Prisma.sql`to_tsquery('french', ${terms.join(" | ")})`, terms, needed, take);
    mode = "ANY_TERM";
  }
  return {
    mode: rows.length ? mode : "NONE",
    terms,
    passages: rows.map((r, i) => ({
      n: i + 1,
      chunkId: r.chunkId,
      documentId: r.documentId,
      title: r.title,
      kind: r.kind,
      reference: r.reference,
      issuedAt: r.issuedAt,
      heading: r.heading,
      position: r.position,
      content: r.content,
      excerpt: r.excerpt,
      rank: Number(r.rank),
      matched: Number(r.matched),
    })),
  };
};

export default searchPassages;
