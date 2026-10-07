import prisma from "@/services/config/auth/prisma";
import { askRag } from "@/services/assistant/ragClient";
import { searchPassages, significantTerms } from "@/services/artciAssistant/documentSearch";
import { buildPrompt, citedNumbers, selectPassages, toSources } from "@/services/artciAssistant/contextBuilder";
import { appendExchange, ownConversation, recentMessages, startConversation } from "@/services/artciAssistant/conversationStore";
import { KnowledgeError } from "@/services/artciAssistant/documentStore";

/**
 * Assistant IA ARTCI    moteur conversationnel.
 *
 * Déroulé d'une question :
 *   1. recherche des passages pertinents dans la base documentaire (locale) ;
 *   2. aucun passage → réponse « non disponible dans la base documentaire »,
 *      SANS solliciter le moteur de rédaction : rien ne peut être inventé ;
 *   3. sinon, rédaction par le moteur à partir des seuls passages, avec
 *      citation obligatoire des sources ;
 *   4. moteur indisponible → les passages sont renvoyés tels quels (mode
 *      extractif) : l'utilisateur garde l'accès aux textes.
 *
 * Le moteur de rédaction est aujourd'hui le service d'analyse de ComparIA
 * (`ragClient`) ; il se remplace ici sans toucher à la recherche, au contexte,
 * à l'historique ni à l'interface.
 *
 * Modes : GENERATED (rédigé, sources citées) · EXTRACTIVE (passages seuls) ·
 * NO_SOURCE (rien dans la base).
 */

export const MAX_QUESTION = 2000;

const noSourceAnswer = async (terms) => {
  const inForce = await prisma.knowledgeDocument.count({ where: { inForce: true } });
  if (!inForce) {
    return (
      "**La base documentaire ne contient encore aucun texte en vigueur.**\n\n" +
      "Je ne réponds qu'à partir des textes de référence qui y sont déposés (lois, décrets, décisions…). " +
      "Un administrateur peut les ajouter depuis l'onglet « Base documentaire »."
    );
  }
  return (
    "**Cette information n'est pas disponible dans la base documentaire.**\n\n" +
    `Aucun passage des ${inForce} texte(s) en vigueur ne correspond à votre question${terms.length ? ` (termes recherchés : ${terms.join(", ")})` : ""}. ` +
    "Je préfère ne pas répondre plutôt que de citer une disposition qui n'y figure pas.\n\n" +
    "Vous pouvez reformuler avec les termes du texte recherché, ou demander l'ajout du document concerné à la base documentaire."
  );
};

const extractiveAnswer = (passages, reason) =>
  `**Le moteur de rédaction est indisponible** (${reason}). Voici les passages de la base documentaire qui correspondent à votre question, sans reformulation :\n\n` +
  passages.map((p) => `**[${p.n}] ${p.title}${p.heading ? `    ${p.heading}` : ""}**\n\n> ${p.content.replace(/\n+/g, "\n> ")}`).join("\n\n");

/**
 * @param question        question de l'utilisateur
 * @param conversationId  conversation existante (sinon une nouvelle est créée)
 * @param actor           utilisateur connecté
 */
export const askArtciAssistant = async ({ question, conversationId = null, actor, signal = null }) => {
  const text = String(question ?? "").trim();
  if (!text) throw new KnowledgeError(400, "EMPTY", "La question est vide.");
  if (text.length > MAX_QUESTION) throw new KnowledgeError(413, "TOO_LONG", `La question dépasse ${MAX_QUESTION} caractères.`);

  const conversation = conversationId ? await ownConversation(conversationId, actor.id) : await startConversation(actor.id, text);
  const history = conversationId ? await recentMessages(conversation.id) : [];

  // Question de relance très courte (« et pour les promotions ? ») : la
  // recherche s'appuie aussi sur la question précédente.
  let searched = text;
  if (significantTerms(text).length < 3) {
    const previous = [...history].reverse().find((m) => m.role === "user");
    if (previous) searched = `${previous.content} ${text}`;
  }
  const found = await searchPassages(searched, { limit: 8 });
  const passages = selectPassages(found.passages);

  let answer;
  if (!passages.length) {
    answer = { mode: "NO_SOURCE", content: await noSourceAnswer(found.terms), sources: [] };
  } else {
    const prompt = buildPrompt(text, passages);
    const res = await askRag({
      question: prompt,
      history: [...history.slice(-6).map((m) => ({ role: m.role, content: m.content.slice(0, 2000) })), { role: "user", content: prompt }],
      signal,
    });
    if (res.aborted) throw new KnowledgeError(499, "ABORTED", "Demande interrompue.");
    if (res.ok) {
      const cited = citedNumbers(res.answer, passages.length);
      answer = { mode: "GENERATED", content: res.answer, sources: toSources(passages, cited), durationMs: res.durationMs, uncited: cited.size === 0 };
    } else {
      answer = { mode: "EXTRACTIVE", content: extractiveAnswer(passages, res.error.replace(/\.$/, "").toLowerCase()), sources: toSources(passages) };
    }
  }

  const message = await appendExchange(conversation.id, text, answer);
  return {
    conversation: { id: conversation.id, title: conversation.title },
    message: { ...message, durationMs: answer.durationMs || null, uncited: !!answer.uncited },
    search: { mode: found.mode, terms: found.terms, passages: passages.length },
  };
};

export default askArtciAssistant;
