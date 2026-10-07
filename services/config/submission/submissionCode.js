import crypto from "crypto";
import prisma from "@/services/config/auth/prisma";

/**
 * Codes de validation à usage unique exigés avant la soumission d'une offre.
 *
 * Principes retenus :
 *
 *  - le code est tiré avec le générateur cryptographique du système
 *    (`crypto.randomInt`) et non avec `Math.random()`, prévisible ;
 *  - seule son empreinte SHA-256 est enregistrée : la base ne permet donc pas
 *    de soumettre à la place du point focal ;
 *  - un seul code vivant à la fois par (utilisateur, objet)   demander un
 *    nouveau code périme immédiatement le précédent ;
 *  - le nombre de saisies est plafonné, et un code déjà validé ne peut plus
 *    être rejoué ;
 *  - la validation ne soumet rien : elle délivre un JETON à usage unique, et
 *    c'est la consommation de ce jeton, au moment de l'enregistrement, qui
 *    autorise la création de l'offre. Une offre ne peut donc pas exister sans
 *    validation réussie.
 */

/** Objet fonctionnel par défaut. */
export const PURPOSE_OFFER_SUBMISSION = "OFFER_SUBMISSION";

/** Durée de validité du code communiqué par e-mail. */
export const CODE_TTL_MINUTES = 10;
/** Nombre maximum de saisies pour un même code. */
export const MAX_ATTEMPTS = 5;
/** Délai minimal entre deux envois (anti-abus du bouton « Renvoyer »). */
export const RESEND_COOLDOWN_SECONDS = 60;
/** Durée de validité du jeton délivré après validation du code. */
export const TICKET_TTL_MINUTES = 15;
/** Longueur du code saisi par le point focal. */
export const CODE_LENGTH = 6;

const sha256 = (value) =>
  crypto.createHash("sha256").update(String(value)).digest("hex");

/** Code numérique tiré aléatoirement, sans biais, de longueur fixe. */
const generateNumericCode = (length = CODE_LENGTH) => {
  let out = "";
  for (let i = 0; i < length; i += 1) out += String(crypto.randomInt(0, 10));
  return out;
};

/** Comparaison à temps constant : ne renseigne pas sur le préfixe correct. */
const safeEquals = (a, b) => {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

/** Masque une adresse pour l'affichage : « yao***@gmail.com ». */
export const maskEmail = (email) => {
  const value = String(email || "");
  const at = value.indexOf("@");
  if (at <= 0) return value;
  const name = value.slice(0, at);
  const domain = value.slice(at);
  const visible = name.slice(0, Math.min(3, name.length));
  return `${visible}${"*".repeat(Math.max(name.length - visible.length, 1))}${domain}`;
};

/**
 * Génère un nouveau code et périme les précédents.
 *
 * @returns {Promise<{ok:boolean, reason?:string, retryAfterSeconds?:number, plainCode?:string, record?:object}>}
 */
export const createSubmissionCode = async ({
  userId,
  email,
  purpose = PURPOSE_OFFER_SUBMISSION,
  reference = null,
  label = null,
  ip = null,
}) => {
  const now = new Date();

  // Anti-abus : un renvoi trop rapproché est refusé, avec le délai restant.
  const last = await prisma.submissionCode.findFirst({
    where: { userId: Number(userId), purpose, reference, consumedAt: null },
    orderBy: { createdAt: "desc" },
    select: { sentAt: true },
  });
  if (last?.sentAt) {
    const elapsed = (now.getTime() - new Date(last.sentAt).getTime()) / 1000;
    if (elapsed < RESEND_COOLDOWN_SECONDS) {
      return {
        ok: false,
        reason: "COOLDOWN",
        retryAfterSeconds: Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed),
      };
    }
  }

  const plainCode = generateNumericCode();
  const expiresAt = new Date(now.getTime() + CODE_TTL_MINUTES * 60 * 1000);

  const record = await prisma.$transaction(async (tx) => {
    // Un seul code vivant à la fois : les codes encore valides pour le même
    // objet sont périmés, sinon un ancien code resterait acceptable après un
    // renvoi.
    await tx.submissionCode.updateMany({
      where: {
        userId: Number(userId),
        purpose,
        reference,
        consumedAt: null,
        expiresAt: { gt: now },
      },
      data: { expiresAt: now },
    });

    return tx.submissionCode.create({
      data: {
        code: `SUB-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
        purpose,
        codeHash: sha256(plainCode),
        reference,
        label,
        email,
        maxAttempts: MAX_ATTEMPTS,
        sentAt: now,
        expiresAt,
        ip,
        user: { connect: { id: Number(userId) } },
      },
    });
  });

  return { ok: true, plainCode, record };
};

/**
 * Vérifie un code saisi.
 *
 * Motifs de refus renvoyés : NO_CODE, EXPIRED, ALREADY_USED,
 * TOO_MANY_ATTEMPTS, INVALID.
 */
export const verifySubmissionCode = async ({
  userId,
  purpose = PURPOSE_OFFER_SUBMISSION,
  reference = null,
  input,
}) => {
  const now = new Date();
  const value = String(input || "").trim();

  if (!/^\d+$/.test(value) || value.length !== CODE_LENGTH) {
    return { ok: false, reason: "INVALID_FORMAT" };
  }

  const record = await prisma.submissionCode.findFirst({
    where: { userId: Number(userId), purpose, reference },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return { ok: false, reason: "NO_CODE" };

  // Un code déjà validé ne peut pas être rejoué, qu'il ait servi à enregistrer
  // l'offre ou non.
  if (record.validatedAt) return { ok: false, reason: "ALREADY_USED" };
  if (record.consumedAt) return { ok: false, reason: "ALREADY_USED" };

  if (record.attempts >= record.maxAttempts) {
    return { ok: false, reason: "TOO_MANY_ATTEMPTS" };
  }

  if (record.expiresAt <= now) return { ok: false, reason: "EXPIRED" };

  if (!safeEquals(sha256(value), record.codeHash)) {
    const updated = await prisma.submissionCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
      select: { attempts: true, maxAttempts: true },
    });
    const remaining = Math.max(updated.maxAttempts - updated.attempts, 0);
    if (remaining === 0) {
      // Plafond atteint : le code est immédiatement périmé, il faudra en
      // demander un nouveau.
      await prisma.submissionCode.update({
        where: { id: record.id },
        data: { expiresAt: new Date() },
      });
      return { ok: false, reason: "TOO_MANY_ATTEMPTS", remainingAttempts: 0 };
    }
    return { ok: false, reason: "INVALID", remainingAttempts: remaining };
  }

  const ticket = crypto.randomBytes(32).toString("hex");
  await prisma.submissionCode.update({
    where: { id: record.id },
    data: {
      validatedAt: now,
      attempts: { increment: 1 },
      ticket,
    },
  });

  return { ok: true, ticket, ticketExpiresAt: new Date(now.getTime() + TICKET_TTL_MINUTES * 60 * 1000) };
};

/**
 * Consomme le jeton délivré après validation : dernière barrière avant
 * l'enregistrement de l'offre.
 *
 * L'opération est un `updateMany` conditionnel   donc atomique côté base   ce
 * qui écarte le double clic : deux appels concurrents ne peuvent pas consommer
 * le même jeton, le second reçoit `count: 0`.
 *
 * @returns {Promise<{ok:boolean, reason?:string, record?:object}>}
 */
export const consumeSubmissionTicket = async ({
  ticket,
  userId,
  purpose = PURPOSE_OFFER_SUBMISSION,
  reference = null,
  offerId = null,
}) => {
  const value = String(ticket || "").trim();
  if (!value) return { ok: false, reason: "MISSING_TICKET" };

  const now = new Date();
  const oldest = new Date(now.getTime() - TICKET_TTL_MINUTES * 60 * 1000);

  const { count } = await prisma.submissionCode.updateMany({
    where: {
      ticket: value,
      userId: Number(userId),
      purpose,
      reference,
      consumedAt: null,
      validatedAt: { not: null, gte: oldest },
    },
    data: { consumedAt: now, offerId: offerId ? Number(offerId) : null },
  });

  if (count === 0) {
    // On distingue « jamais vu » de « déjà utilisé / périmé » pour que le
    // message rendu au point focal soit exploitable.
    const existing = await prisma.submissionCode.findFirst({
      where: { ticket: value },
      select: { consumedAt: true, validatedAt: true, userId: true, reference: true },
    });
    if (!existing) return { ok: false, reason: "INVALID_TICKET" };
    if (existing.consumedAt) return { ok: false, reason: "TICKET_ALREADY_USED" };
    if (existing.userId !== Number(userId) || existing.reference !== reference) {
      return { ok: false, reason: "TICKET_MISMATCH" };
    }
    return { ok: false, reason: "TICKET_EXPIRED" };
  }

  const record = await prisma.submissionCode.findFirst({
    where: { ticket: value },
    select: {
      id: true,
      userId: true,
      reference: true,
      label: true,
      validatedAt: true,
      consumedAt: true,
    },
  });

  return { ok: true, record };
};

/**
 * Rend un jeton consommé à nouveau utilisable.
 *
 * Le jeton est consommé AVANT l'enregistrement de l'offre : c'est le seul ordre
 * qui garantisse qu'aucune offre ne puisse naître d'un jeton rejoué. En
 * contrepartie, si l'enregistrement échoue pour une raison technique, le point
 * focal se retrouverait avec un code brûlé et une offre inexistante. On rend
 * donc le jeton dans ce cas précis   la fenêtre reste bornée par sa durée de
 * validité et reste liée au même utilisateur.
 */
export const releaseSubmissionTicket = async (submissionCodeId) => {
  if (!submissionCodeId) return;
  try {
    await prisma.submissionCode.update({
      where: { id: Number(submissionCodeId) },
      data: { consumedAt: null, offerId: null },
    });
  } catch (error) {
    console.error("Jeton non restitué :", error?.message);
  }
};

/** Rattache le code consommé à l'offre effectivement créée (traçabilité). */
export const linkSubmissionToOffer = async (submissionCodeId, offerId) => {
  if (!submissionCodeId || !offerId) return;
  try {
    await prisma.submissionCode.update({
      where: { id: Number(submissionCodeId) },
      data: { offerId: Number(offerId) },
    });
  } catch (error) {
    console.error("Trace de soumission non enregistrée :", error?.message);
  }
};

/**
 * Le jeton attaché à une offre déjà enregistrée, pour la piste d'audit
 * (qui a validé, quand).
 */
export const getSubmissionTrace = async (offerId) =>
  prisma.submissionCode.findFirst({
    where: { offerId: Number(offerId) },
    orderBy: { consumedAt: "desc" },
    select: {
      id: true,
      email: true,
      reference: true,
      label: true,
      sentAt: true,
      validatedAt: true,
      consumedAt: true,
      attempts: true,
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });

/** Corps de l'e-mail portant le code. */
export const submissionCodeEmail = ({ firstName, code, offerTitle, offerCode, minutes }) => ({
  subject: `Code de validation pour la soumission de l'offre ${offerCode || ""}`.trim(),
  text:
    `Bonjour ${firstName || ""},\n\n` +
    `Votre code de validation est : ${code}\n` +
    `Il est valable ${minutes} minutes et ne peut servir qu'une seule fois.\n\n` +
    `Offre concernée : ${offerTitle || ""} (${offerCode || ""})\n\n` +
    `Si vous n'êtes pas à l'origine de cette demande, ignorez ce message et prévenez l'ARTCI.`,
  html: `
    <div style="font-family:Segoe UI,Arial,sans-serif;color:#1c2430;max-width:520px">
      <p>Bonjour ${firstName || ""},</p>
      <p>Vous venez de demander la soumission de l'offre
         <b>${offerTitle || ""}</b>${offerCode ? ` (${offerCode})` : ""} sur la plateforme
         <b>CompareTIC</b> de l'ARTCI.</p>
      <p>Votre code de validation :</p>
      <p style="font-size:30px;font-weight:700;letter-spacing:8px;
                background:#f2f6f3;border:1px solid #d7e3da;border-radius:10px;
                padding:14px 18px;text-align:center;margin:18px 0">${code}</p>
      <p style="color:#5a6a78">
        Ce code est valable <b>${minutes} minutes</b> et ne peut être utilisé qu'une seule fois.
      </p>
      <p style="color:#5a6a78">
        Si vous n'êtes pas à l'origine de cette demande, ignorez ce message et
        prévenez l'ARTCI : votre offre ne sera pas soumise.
      </p>
    </div>`,
});
