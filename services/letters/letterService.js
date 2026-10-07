import { readFile } from "fs/promises";
import path from "path";
import prisma from "@/services/config/auth/prisma";
import { sendMail } from "@/services/config/mailer";
import { askRag, isRagConfigured } from "@/services/assistant/ragClient";
import { LETTER_LOGO, MAX_LETTER_CHARS, letterEmailHtml, letterToText, sanitizeLetterHtml } from "@/services/letters/letterHtml";
import { composeLetter, dateLong, decisionLine, dynamicFields, fallbackSynthesis, fullName, letterKindOf } from "@/services/letters/letterTemplate";
import { parseRecipients, recipientsError } from "@/services/letters/recipients";
import { checkRecipientDomain } from "@/services/letters/recipientDomain";
import { PERMISSIONS, can } from "@/services/rbac/permissions";
import { WorkflowError, WORKFLOW_ACTIONS, getAvailableActions, loadOfferContext } from "@/services/workflow/offerWorkflow";
import { writeAudit, AUDIT_ACTIONS } from "@/services/workflow/audit";

/**
 * Courrier adressé au soumissionnaire d'une offre validée, refusée ou
 * suspendue (désactivée) : le modèle suit l'état de l'offre.
 *
 * Le modèle est composé à partir de ce que la plateforme sait de l'offre :
 * ses caractéristiques, la décision finale, les commentaires des validateurs
 * et l'analyse IA enregistrée. La « synthèse de l'examen » est rédigée par le
 * service d'analyse quand il répond ; à défaut, elle est composée ici à
 * partir des mêmes éléments    le modèle est donc toujours disponible.
 *
 * Le courrier généré n'est qu'un point de départ : il s'édite, s'enregistre
 * (brouillon), s'imprime et peut être envoyé par e-mail. Le HTML est nettoyé
 * côté serveur avant toute écriture ou envoi.
 */

/** Offre visible par l'acteur et ouverte au courrier (validée, refusée ou suspendue). */
const letterOffer = async (offerId, actor) => {
  const offer = await loadOfferContext(prisma, offerId);
  if (!offer) throw new WorkflowError(404, "NOT_FOUND", "Offre introuvable.");
  const actions = getAvailableActions(offer, actor);
  if (!actions.includes(WORKFLOW_ACTIONS.VIEW)) throw new WorkflowError(403, "OPERATOR_SCOPE", "Cette offre n'appartient pas à votre opérateur.");
  if (!actions.includes(WORKFLOW_ACTIONS.LETTER)) {
    throw new WorkflowError(409, "INVALID_STATE", "Le courrier au soumissionnaire n'est proposé que pour une offre validée, refusée ou suspendue.");
  }
  return offer;
};

/** Tout ce que la plateforme sait de l'offre et qui sert au courrier. */
const loadLetterData = async (offerId) => {
  const [offer, decisions, submission, analysis, deactivation, transitions] = await Promise.all([
    prisma.offer.findUnique({
      where: { id: offerId },
      select: {
        id: true,
        code: true,
        title: true,
        category: true,
        billingType: true,
        notifiDate: true,
        desiredDate: true,
        validatedAt: true,
        submittedAt: true,
        workflowStatus: true,
        refusedAt: true,
        deactivatedAt: true,
        deactivationReason: true,
        operator: { select: { name: true } },
        user: { select: { firstName: true, lastName: true, email: true } },
        specialPromotion: { select: { type: true, duration: true } },
        area: { select: { title: true } },
        formulas: {
          orderBy: { id: "asc" },
          select: {
            title: true,
            validity: true,
            price: { select: { value: true } },
            serviceDetail: { select: { quantity: true, service: { select: { title: true } }, offerRate: { select: { value: true } } } },
          },
        },
      },
    }),
    prisma.validationDecision.findMany({ where: { offerId }, orderBy: [{ createdAt: "asc" }, { id: "asc" }], select: { level: true, decision: true, final: true, comment: true, createdAt: true } }),
    prisma.auditLog.findFirst({
      where: { offerId, action: "SUBMIT" },
      orderBy: [{ createdAt: "desc" }],
      select: { createdAt: true, actor: { select: { firstName: true, lastName: true, email: true } } },
    }),
    prisma.offerAiAnalysis.findFirst({ where: { offerId }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { content: true, createdAt: true } }),
    // Dernière désactivation : son commentaire est le motif de la suspension.
    prisma.auditLog.findFirst({ where: { offerId, action: "DEACTIVATE" }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { comment: true, createdAt: true } }),
    // Changements d'état, du plus récent au plus ancien (date d'entrée dans l'état actuel).
    prisma.auditLog.findMany({ where: { offerId, toStatus: { not: null } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 30, select: { fromStatus: true, toStatus: true, createdAt: true } }),
  ]);
  // Soumissionnaire : l'auteur de la dernière soumission, à défaut l'auteur de l'offre.
  const submitter = submission?.actor || offer.user || null;
  const kind = letterKindOf(offer);
  // Refus : la décision de refus la plus récente porte le motif.
  const refusal = [...decisions].reverse().find((d) => d.decision === "REFUSED") || null;
  // Depuis quand l'offre est dans son état actuel : un courrier plus ancien
  // notifiait une autre décision (offre validée puis suspendue, par exemple).
  const entered = transitions.find((t) => t.toStatus === offer.workflowStatus && t.fromStatus !== t.toStatus);
  const stateSince = entered?.createdAt || { VALIDATED: offer.validatedAt, REFUSED: offer.refusedAt, SUSPENDED: offer.deactivatedAt }[kind] || null;
  return {
    offer,
    kind,
    decisions,
    submitter,
    analysis,
    refusal,
    refusedAt: offer.refusedAt || refusal?.createdAt || null,
    suspension: { at: offer.deactivatedAt || deactivation?.createdAt || null, reason: offer.deactivationReason || null, comment: deactivation?.comment || null },
    stateSince,
    submittedAt: submission?.createdAt || offer.submittedAt,
  };
};

const aiSynthesis = async (data, signal) => {
  if (!isRagConfigured()) return null;
  const { offer, kind, decisions, analysis } = data;
  const comments = decisions.map((d) => `- Niveau ${d.level} (${d.decision === "REFUSED" ? "refus" : d.final ? "validation définitive" : "validation"}) : ${String(d.comment || "").slice(0, 600)}`).join("\n");
  const purpose = kind === "SUSPENDED" ? "le rappel de la situation d'une offre suspendue" : kind === "REFUSED" ? "la synthèse de l'examen d'une offre refusée" : "la synthèse de l'examen d'une offre";
  const question =
    `Rédige ${purpose} pour un courrier officiel de l'ARTCI adressé à l'opérateur ${offer.operator?.name || ""}. ` +
    "Écris 4 à 6 phrases, en français, sur un ton administratif et neutre, sans titre, sans liste, sans formule de politesse. " +
    "Appuie-toi UNIQUEMENT sur les éléments ci-dessous ; n'invente aucun fait, aucune référence réglementaire, aucune date.\n\n" +
    `Offre : « ${offer.title} » (${offer.code}), ${decisionLine(data)}.\n\n` +
    `Commentaires des validateurs :\n${comments || "- aucun commentaire enregistré"}\n\n` +
    `Analyse de conformité (assistant IA) :\n${analysis ? String(analysis.content).slice(0, 3500) : "aucune analyse enregistrée"}`;
  const res = await askRag({ question, history: [{ role: "user", content: question }], signal, timeoutMs: 60000 });
  if (!res.ok) return null;
  // Le service répond en Markdown : le courrier attend un paragraphe simple.
  return res.answer.replace(/^#+\s.*$/gm, "").replace(/[*_`>#]/g, "").replace(/\s+/g, " ").trim().slice(0, 1800) || null;
};

const LETTER_SELECT = { id: true, subject: true, html: true, status: true, sentAt: true, sentTo: true, createdAt: true, updatedAt: true, author: { select: { id: true, firstName: true, lastName: true } } };

/** Brouillons et envois enregistrés, destinataire et champs dynamiques. */
export const getLetterWorkspace = async (offerId, actor) => {
  const offer = await letterOffer(offerId, actor);
  const data = await loadLetterData(offer.id);
  const letters = await prisma.offerLetter.findMany({ where: { offerId: offer.id }, orderBy: [{ updatedAt: "desc" }], select: LETTER_SELECT });
  return {
    offer: { id: offer.id, code: offer.code, title: offer.title, operator: offer.operator?.name || null },
    // Nature du courrier et date d'entrée de l'offre dans son état actuel : un
    // courrier enregistré avant cette date notifiait une autre décision.
    kind: data.kind,
    stateSince: data.stateSince,
    recipient: { name: fullName(data.submitter) || null, email: data.submitter?.email || null },
    letters,
    fields: dynamicFields(data, actor),
    hasAnalysis: !!data.analysis,
    canSend: can(actor.role, PERMISSIONS.LETTER_MANAGE),
  };
};

/** Compose un modèle (non enregistré). `withAi` : synthèse rédigée par le service d'analyse. */
export const generateLetter = async (offerId, actor, { withAi = true, signal = null } = {}) => {
  const offer = await letterOffer(offerId, actor);
  const data = await loadLetterData(offer.id);
  const ai = withAi ? await aiSynthesis(data, signal) : null;
  const letter = composeLetter(data, actor, ai || fallbackSynthesis(data));
  await writeAudit(prisma, { action: AUDIT_ACTIONS.LETTER_GENERATED, actor, offerId: offer.id, metadata: { kind: data.kind, synthesis: ai ? "IA" : "composée", analysis: !!data.analysis, comments: data.decisions.length } });
  return { ...letter, kind: data.kind, synthesis: ai ? "AI" : "COMPOSED", aiRequested: !!withAi };
};

const letterInput = (body) => {
  const subject = String(body?.subject ?? "").replace(/\s+/g, " ").trim().slice(0, 200);
  if (!subject) throw new WorkflowError(400, "SUBJECT_REQUIRED", "L'objet du courrier est obligatoire.");
  const html = sanitizeLetterHtml(body?.html);
  if (!letterToText(html)) throw new WorkflowError(400, "CONTENT_REQUIRED", "Le courrier est vide.");
  if (html.length >= MAX_LETTER_CHARS) throw new WorkflowError(413, "TOO_LONG", "Le courrier est trop long.");
  return { subject, html };
};

// Verrou consultatif PostgreSQL (classe arbitraire, propre aux courriers).
const LETTER_LOCK_CLASS = 4711;

/**
 * Enregistre un brouillon (création ou mise à jour). Un courrier envoyé ne se
 * modifie plus.
 *
 * Un brouillon n'est jamais créé deux fois :
 *  - avec `id`, le brouillon existant est mis à jour ; si rien n'a changé, il
 *    est rendu tel quel, sans écriture (`unchanged: true`) ;
 *  - sans `id`, un brouillon identique du même auteur (même objet, même texte)
 *    est rendu au lieu d'en créer un second : une requête rejouée, un double
 *    clic ou une réponse perdue ne laissent donc pas de doublon ;
 *  - les enregistrements d'une même offre passent un par un (verrou tenu le
 *    temps de la transaction), y compris pour deux requêtes simultanées.
 */
export const saveLetter = async (offerId, actor, body) => {
  const offer = await letterOffer(offerId, actor);
  const data = letterInput(body);
  const id = Number(body?.id) || null;
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${LETTER_LOCK_CLASS}::int, ${offer.id}::int)`;
    if (id) {
      const existing = await tx.offerLetter.findFirst({ where: { id, offerId: offer.id }, select: LETTER_SELECT });
      if (!existing) throw new WorkflowError(404, "NOT_FOUND", "Courrier introuvable.");
      if (existing.status === "SENT") throw new WorkflowError(409, "ALREADY_SENT", "Ce courrier a déjà été envoyé : enregistrez-en une copie pour le modifier.");
      if (existing.subject === data.subject && existing.html === data.html) return { ...existing, unchanged: true };
      return tx.offerLetter.update({ where: { id }, data, select: LETTER_SELECT });
    }
    const same = await tx.offerLetter.findFirst({
      where: { offerId: offer.id, authorId: actor.id, status: "DRAFT", subject: data.subject, html: data.html },
      orderBy: [{ updatedAt: "desc" }],
      select: LETTER_SELECT,
    });
    if (same) return { ...same, unchanged: true };
    return tx.offerLetter.create({ data: { ...data, offer: { connect: { id: offer.id } }, author: { connect: { id: actor.id } } }, select: LETTER_SELECT });
  });
};

/** Logo joint à l'e-mail (affiché dans l'en-tête par son `cid`). Absent : en-tête sans logo. */
const logoAttachment = async () => {
  try {
    const content = await readFile(path.join(process.cwd(), LETTER_LOGO.file));
    return { filename: "artci.png", content, cid: LETTER_LOGO.cid, contentType: "image/png", contentDisposition: "inline" };
  } catch {
    return null;
  }
};

// Envois en cours (par courrier) : un second clic ne fait pas partir un second e-mail.
const sendingLetters = new Set();

/** Message destiné à l'utilisateur selon la nature de l'échec d'envoi. */
const SEND_FAILURES = {
  RECIPIENT_REJECTED: [422, "Le serveur de messagerie a refusé l'adresse du destinataire : elle n'existe pas ou n'accepte pas de courrier. Vérifiez l'adresse puis réessayez."],
  NO_RECIPIENT: [400, "Indiquez l'adresse e-mail du destinataire."],
  NOT_CONFIGURED: [503, "La messagerie de la plateforme n'est pas configurée : l'e-mail n'a pas pu partir. Prévenez l'administrateur technique, ou utilisez votre propre messagerie."],
  AUTH: [502, "La messagerie de la plateforme a refusé de s'identifier : l'e-mail n'a pas pu partir. Prévenez l'administrateur technique, ou utilisez votre propre messagerie."],
  UNREACHABLE: [502, "Le serveur de messagerie est injoignable : l'e-mail n'a pas pu partir. Réessayez dans quelques instants, ou utilisez votre propre messagerie."],
  UNKNOWN: [502, "L'e-mail n'a pas pu être envoyé. Réessayez dans quelques instants, ou utilisez votre propre messagerie."],
};

const DRAFT_KEPT = " Le courrier reste enregistré en brouillon.";

/**
 * Envoie le courrier par e-mail (messagerie de la plateforme) et le fige.
 *
 * Le courrier n'est marqué « envoyé » qu'après l'accord du serveur de
 * messagerie. Tout échec (adresse mal formée, domaine inexistant, adresse
 * refusée, messagerie en panne) le laisse en brouillon : la réponse d'erreur
 * porte ce brouillon (`details.letter`) pour que l'éditeur continue sur le même.
 *
 * Limite à connaître : une boîte inexistante sur un domaine valide est le plus
 * souvent acceptée par le serveur d'envoi, puis signalée plus tard par un avis
 * de non-remise dans la boîte d'expédition. La plateforme ne peut pas le voir.
 */
export const sendLetter = async (offerId, actor, body) => {
  const offer = await letterOffer(offerId, actor);
  const problem = recipientsError(body?.to);
  if (problem) throw new WorkflowError(400, "RECIPIENT", problem);
  const recipients = parseRecipients(body?.to).valid;

  // Le contenu envoyé est celui qui vient d'être enregistré, jamais un texte de passage.
  const saved = await saveLetter(offer.id, actor, body);
  const { unchanged, ...draft } = saved;
  if (sendingLetters.has(draft.id)) throw new WorkflowError(409, "SEND_IN_PROGRESS", "Ce courrier est déjà en cours d'envoi.", { letter: draft });
  sendingLetters.add(draft.id);

  const failed = async (status, code, message, extra = {}) => {
    await writeAudit(prisma, { action: AUDIT_ACTIONS.LETTER_SEND_FAILED, actor, offerId: offer.id, metadata: { letterId: draft.id, email: recipients.join(", "), title: draft.subject, reason: code, ...extra } });
    return new WorkflowError(status, code, `${message}${DRAFT_KEPT}`, { letter: draft, ...extra });
  };

  try {
    const checks = await Promise.all(recipients.map((email) => checkRecipientDomain(email)));
    // Domaines que le DNS n'a pas permis de vérifier à temps : l'envoi n'est pas
    // bloqué, mais l'agent en est averti.
    const unverified = [...new Set(checks.filter((check) => check.ok && check.cause).map((check) => check.domain))];
    if (unverified.length) console.warn(`Courrier : domaine(s) non vérifié(s) faute de réponse du DNS : ${unverified.join(", ")}.`);
    const unknown = [...new Set(checks.filter((check) => !check.ok).map((check) => check.domain))];
    if (unknown.length) {
      throw await failed(
        422,
        "RECIPIENT_DOMAIN",
        unknown.length === 1
          ? `Le domaine « ${unknown[0]} » n'existe pas ou ne reçoit pas d'e-mails : l'adresse du destinataire est sans doute mal écrite. Corrigez-la puis réessayez.`
          : `Ces domaines n'existent pas ou ne reçoivent pas d'e-mails : ${unknown.join(", ")}. Corrigez les adresses puis réessayez.`,
        { domains: unknown },
      );
    }

    const logo = await logoAttachment();
    const result = await sendMail({
      to: recipients,
      subject: draft.subject,
      html: letterEmailHtml(draft.html, logo ? `cid:${LETTER_LOGO.cid}` : null),
      text: letterToText(draft.html),
      attachments: logo ? [logo] : undefined,
    });
    if (!result.sent && !result.dryRun) {
      console.error("Courrier non envoyé :", result.code, result.reason);
      const [status, message] = SEND_FAILURES[result.code] || SEND_FAILURES.UNKNOWN;
      throw await failed(status, result.code === "RECIPIENT_REJECTED" ? "RECIPIENT_REJECTED" : "MAIL_FAILED", message, { cause: result.code || "UNKNOWN", rejected: result.rejected || [] });
    }

    // Envoi partiel : seules les adresses acceptées par le serveur sont retenues.
    const rejected = (result.rejected || []).map((email) => email.toLowerCase());
    const delivered = recipients.filter((email) => !rejected.includes(email));
    const sentTo = (delivered.length ? delivered : recipients).join(", ");
    const letter = await prisma.offerLetter.update({ where: { id: draft.id }, data: { status: "SENT", sentAt: new Date(), sentTo }, select: LETTER_SELECT });
    await writeAudit(prisma, { action: AUDIT_ACTIONS.LETTER_SENT, actor, offerId: offer.id, metadata: { letterId: letter.id, email: sentTo, title: draft.subject, dryRun: !!result.dryRun, ...(rejected.length ? { rejected } : {}), ...(unverified.length ? { unverified } : {}) } });
    return { letter, dryRun: !!result.dryRun, rejected, unverified };
  } finally {
    sendingLetters.delete(draft.id);
  }
};

export const deleteLetter = async (offerId, actor, letterId) => {
  const offer = await letterOffer(offerId, actor);
  const existing = await prisma.offerLetter.findFirst({ where: { id: Number(letterId), offerId: offer.id }, select: { id: true, status: true } });
  if (!existing) throw new WorkflowError(404, "NOT_FOUND", "Courrier introuvable.");
  if (existing.status === "SENT") throw new WorkflowError(409, "ALREADY_SENT", "Un courrier envoyé est conservé : il ne peut pas être supprimé.");
  await prisma.offerLetter.delete({ where: { id: existing.id } });
  return { deleted: true };
};
