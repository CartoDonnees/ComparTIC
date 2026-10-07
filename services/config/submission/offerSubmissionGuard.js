import prisma from "@/services/config/auth/prisma";
import { OPERATOR_PROFILE_CODE } from "@/services/config/auth/session";
import {
  consumeSubmissionTicket,
  releaseSubmissionTicket,
  linkSubmissionToOffer,
  PURPOSE_OFFER_SUBMISSION,
} from "@/services/config/submission/submissionCode";

/**
 * Barrière de soumission, partagée par les deux routes d'enregistrement d'offre
 * (avec ou sans offre parente).
 *
 * L'exigence de validation par code ne vaut que pour les points focaux
 * d'opérateur : l'administrateur, qui saisit une offre depuis son propre
 * espace, n'est pas concerné. La distinction est faite ICI, à partir du profil
 * réellement enregistré en base pour l'auteur de la déclaration   jamais à
 * partir d'un indicateur envoyé par le client, qu'il suffirait d'omettre.
 *
 * Le jeton est consommé AVANT la création de l'offre : c'est ce qui rend
 * impossible l'existence d'une offre non validée. En cas d'échec technique de
 * l'enregistrement, l'appelant restitue le jeton via `release()`.
 *
 * @returns {Promise<{ok:boolean, status?:number, error?:string, reason?:string,
 *                    required:boolean, user?:object, submissionCodeId?:number,
 *                    link:Function, release:Function}>}
 */
export const requireOfferSubmissionTicket = async ({
  userId,
  reference,
  ticket,
  operatorId = null,
}) => {
  const noop = { link: async () => {}, release: async () => {} };

  if (!userId) {
    return {
      ok: false,
      required: false,
      status: 400,
      error: "L'auteur de la déclaration est manquant.",
      ...noop,
    };
  }

  const author = await prisma.user.findUnique({
    where: { id: Number(userId) },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      profile: { select: { code: true } },
      focalPoint: { select: { operatorId: true } },
    },
  });

  if (!author) {
    return {
      ok: false,
      required: false,
      status: 404,
      error: "L'auteur de la déclaration est introuvable.",
      ...noop,
    };
  }

  // Administrateur / superviseur : aucune validation par code.
  if (author.profile?.code !== OPERATOR_PROFILE_CODE) {
    return { ok: true, required: false, user: author, ...noop };
  }

  // Un point focal ne soumet que pour SON opérateur. L'identifiant d'opérateur
  // arrivait du corps de la requête sans contrôle : une déclaration pouvait
  // ainsi être imputée à un concurrent, et les notifications partaient vers les
  // points focaux du mauvais opérateur. Le contrôle précède la consommation du
  // jeton : un refus ne doit pas brûler le code.
  if (
    operatorId &&
    author.focalPoint?.operatorId &&
    Number(operatorId) !== Number(author.focalPoint.operatorId)
  ) {
    return {
      ok: false,
      required: true,
      status: 403,
      reason: "OPERATOR_MISMATCH",
      error: "Vous ne pouvez déclarer une offre que pour votre propre opérateur.",
      user: author,
      ...noop,
    };
  }

  if (!ticket) {
    return {
      ok: false,
      required: true,
      status: 403,
      reason: "MISSING_TICKET",
      error:
        "La soumission doit être confirmée par le code de validation reçu par e-mail.",
      user: author,
      ...noop,
    };
  }

  const consumed = await consumeSubmissionTicket({
    ticket,
    userId: author.id,
    purpose: PURPOSE_OFFER_SUBMISSION,
    reference: reference ? String(reference) : null,
  });

  if (!consumed.ok) {
    const messages = {
      INVALID_TICKET: "Validation introuvable. Recommencez la soumission.",
      TICKET_ALREADY_USED:
        "Cette validation a déjà servi à soumettre une offre. Demandez un nouveau code.",
      TICKET_EXPIRED:
        "La validation a expiré. Demandez un nouveau code pour soumettre l'offre.",
      TICKET_MISMATCH:
        "Cette validation ne correspond pas à l'offre soumise. Recommencez la soumission.",
      MISSING_TICKET:
        "La soumission doit être confirmée par le code de validation reçu par e-mail.",
    };
    return {
      ok: false,
      required: true,
      status: 403,
      reason: consumed.reason,
      error: messages[consumed.reason] || "Validation refusée.",
      user: author,
      ...noop,
    };
  }

  const submissionCodeId = consumed.record?.id;

  return {
    ok: true,
    required: true,
    user: author,
    submissionCodeId,
    /** Rattache le code consommé à l'offre créée. */
    link: async (offerId) => linkSubmissionToOffer(submissionCodeId, offerId),
    /** Restitue le jeton si l'enregistrement a échoué. */
    release: async () => releaseSubmissionTicket(submissionCodeId),
  };
};

export default requireOfferSubmissionTicket;
