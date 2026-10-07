import prisma from "@/services/config/auth/prisma";
import { isPublishedOffer } from "@/services/workflow/publication";
import { ROLES, validatorLevelOf, isAdministration, roleOf } from "@/services/rbac/roles";
import { can, PERMISSIONS } from "@/services/rbac/permissions";
import { writeAudit, AUDIT_ACTIONS } from "@/services/workflow/audit";

/**
 * MOTEUR DE WORKFLOW DES OFFRES   seule source des transitions.
 *
 * Toute action métier sur une offre passe par ce module :
 *  1. `getAvailableActions` calcule ce que l'acteur peut faire MAINTENANT sur
 *     CETTE offre (rôle, statut, niveau attendu, opérateur, décisions) ;
 *  2. chaque transition revérifie ces conditions côté serveur (`assertAction`)
 *       l'interface n'affiche que les actions possibles, mais un appel direct
 *     à l'API est soumis exactement aux mêmes règles ;
 *  3. la transition s'exécute dans UNE transaction : nouvel état, décision,
 *     journal d'audit et projections de compatibilité ;
 *  4. elle renvoie des ÉVÉNEMENTS, que l'appelant confie au module de
 *     notifications APRÈS la réussite de la transaction.
 *
 * Machine à états : voir docs/WORKFLOW_OFFRES.md, section 3.3.
 */

export const WORKFLOW_STATUS = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  IN_VALIDATION: "IN_VALIDATION",
  VALIDATED: "VALIDATED",
  REFUSED: "REFUSED",
  DEACTIVATED: "DEACTIVATED",
};

export const WORKFLOW_ACTIONS = {
  VIEW: "VIEW",
  HISTORY: "HISTORY",
  EDIT: "EDIT",
  SUBMIT: "SUBMIT",
  VALIDATE_TRANSMIT: "VALIDATE_TRANSMIT",
  VALIDATE_FINAL: "VALIDATE_FINAL",
  REFUSE: "REFUSE",
  MONITOR: "MONITOR",
  DEACTIVATE: "DEACTIVATE",
  REACTIVATE: "REACTIVATE",
  DELETE: "DELETE",
  // Courrier au soumissionnaire (offre validée) : services/letters/letterService.js
  LETTER: "LETTER",
};

export const WORKFLOW_EVENTS = {
  SUBMITTED: "SUBMITTED",
  TRANSMITTED: "TRANSMITTED",
  VALIDATED_FINAL: "VALIDATED_FINAL",
  REFUSED: "REFUSED",
  MONITORING: "MONITORING",
  DEACTIVATED: "DEACTIVATED",
  REACTIVATED: "REACTIVATED",
};

/** Offre repère « Offre Inconnu » : référence technique, jamais soumise. */
export const SENTINEL_OFFER_CODE = "OF-000000000000000";

const S = WORKFLOW_STATUS;
const A = WORKFLOW_ACTIONS;

/** Erreur métier portant son statut HTTP et un code stable. */
export class WorkflowError extends Error {
  constructor(status, code, message, details = undefined) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/** États d'une offre qui ouvrent le courrier au soumissionnaire. */
export const LETTER_STATUSES = ["VALIDATED", "REFUSED", "DEACTIVATED"];

/** Dernier niveau de validation : 3 pour une promotion, 4 pour une offre de base. */
export const finalLevelOf = (offer) => (offer?.specialPromotion ? 3 : 4);

/** Projections lues par l'existant (comparateur, statistiques, calendrier…). */
const VALIDATION_PROJECTION = {
  DRAFT: null,
  SUBMITTED: "PENDING",
  IN_VALIDATION: "PENDING",
  VALIDATED: "ALLOW",
  REFUSED: "DINIED",
  DEACTIVATED: "SUSPENDED",
};

/** Champs nécessaires aux décisions du moteur. */
export const OFFER_CONTEXT_SELECT = {
  id: true,
  code: true,
  title: true,
  operatorId: true,
  userId: true,
  workflowStatus: true,
  currentValidationLevel: true,
  version: true,
  sourceOfferId: true,
  parentId: true,
  submittedAt: true,
  validatedAt: true,
  refusedAt: true,
  deactivatedAt: true,
  deactivationReason: true,
  specialPromotion: { select: { id: true, type: true } },
  validation: { select: { id: true, status: true } },
  operator: { select: { id: true, name: true } },
  _count: {
    select: { decisions: true, versions: true, children: true, monitorings: true },
  },
  // Versions suivantes : nécessaires à la règle de publication au comparateur.
  versions: { select: { id: true, workflowStatus: true, validatedAt: true } },
};

export const loadOfferContext = (db, offerId) =>
  db.offer.findUnique({ where: { id: Number(offerId) }, select: OFFER_CONTEXT_SELECT });

/**
 * Une décision a-t-elle déjà été enregistrée ? Couvre le nouveau workflow
 * (lignes ValidationDecision) ET l'ancien système (validation statuée), pour
 * que les offres reprises restent protégées.
 */
export const hasDecisionTrace = (offer) =>
  (offer?._count?.decisions || 0) > 0 ||
  (!!offer?.validation && offer.validation.status !== "PENDING");

/** L'acteur peut-il statuer au niveau donné ? Aucun niveau ne peut être sauté. */
export const canActAtLevel = (actor, level) =>
  !!level && (isAdministration(actor?.role) || validatorLevelOf(actor?.role) === Number(level));

/**
 * Validation définitive sans transmission avant le dernier niveau : réservée
 * aux offres promotionnelles.
 */
export const canValidateWithoutTransmission = (offer) => !!offer?.specialPromotion;

/** Un point focal n'agit que sur son opérateur. */
export const isInOperatorScope = (actor, offer) =>
  actor?.role !== ROLES.FOCAL_POINT ||
  (!!actor.operatorId && Number(actor.operatorId) === Number(offer?.operatorId));

/**
 * Une offre désactivée peut-elle être réactivée ? Jamais si une version plus
 * récente (monitoring) est encore vivante : deux versions de la même offre ne
 * doivent pas coexister dans le circuit ni au comparateur.
 */
export const hasLiveNewerVersion = (offer) =>
  (offer?.versions || []).some((v) => ![S.REFUSED, S.DEACTIVATED].includes(v.workflowStatus));

/**
 * Actions possibles, maintenant, pour cet acteur sur cette offre.
 * Utilisé à la fois pour l'affichage et pour le contrôle serveur.
 */
export const getAvailableActions = (offer, actor) => {
  const actions = [];
  if (!offer || !actor?.role) return actions;
  const role = actor.role;

  if (!can(role, PERMISSIONS.OFFER_READ) || !isInOperatorScope(actor, offer)) return actions;
  actions.push(A.VIEW, A.HISTORY);

  if (offer.code === SENTINEL_OFFER_CODE) return actions;

  const status = offer.workflowStatus;
  const decided = hasDecisionTrace(offer);
  const level = offer.currentValidationLevel;

  if (can(role, PERMISSIONS.OFFER_UPDATE) && [S.DRAFT, S.SUBMITTED].includes(status) && !decided) {
    actions.push(A.EDIT);
  }
  if (can(role, PERMISSIONS.OFFER_SUBMIT) && status === S.DRAFT) {
    actions.push(A.SUBMIT);
  }
  if (
    can(role, PERMISSIONS.OFFER_DECIDE) &&
    [S.SUBMITTED, S.IN_VALIDATION].includes(status) &&
    canActAtLevel(actor, level)
  ) {
    // Offre de base : transmission obligatoire jusqu'au Validateur 4.
    // Promotion : à chaque niveau, le validateur choisit entre transmettre au
    // niveau supérieur et valider définitivement sans transmettre ; le
    // Validateur 3 (dernier niveau) ne peut que valider définitivement.
    if (level < finalLevelOf(offer)) actions.push(A.VALIDATE_TRANSMIT);
    if (level >= finalLevelOf(offer) || canValidateWithoutTransmission(offer)) actions.push(A.VALIDATE_FINAL);
    actions.push(A.REFUSE);
  }
  if (can(role, PERMISSIONS.OFFER_MONITOR) && status === S.VALIDATED) {
    actions.push(A.MONITOR);
  }
  // Courrier au soumissionnaire : pour notifier une décision rendue (validation,
  // refus) ou une suspension (offre désactivée).
  if (can(role, PERMISSIONS.LETTER_MANAGE) && LETTER_STATUSES.includes(status)) {
    actions.push(A.LETTER);
  }
  if (
    can(role, PERMISSIONS.OFFER_DEACTIVATE) &&
    ([S.SUBMITTED, S.IN_VALIDATION, S.VALIDATED, S.REFUSED].includes(status) ||
      // Version remplacée par un monitoring mais toujours affichée au
      // comparateur (nouvelle version non encore validée) : l'administration
      // doit pouvoir la retirer.
      (status === S.DEACTIVATED && isPublishedOffer(offer)))
  ) {
    actions.push(A.DEACTIVATE);
  }
  if (can(role, PERMISSIONS.OFFER_REACTIVATE) && status === S.DEACTIVATED && !hasLiveNewerVersion(offer)) {
    actions.push(A.REACTIVATE);
  }
  if (
    can(role, PERMISSIONS.OFFER_DELETE) &&
    [S.DRAFT, S.SUBMITTED].includes(status) &&
    !decided &&
    (offer._count?.versions || 0) === 0 &&
    (offer._count?.children || 0) === 0 &&
    (offer._count?.monitorings || 0) === 0
  ) {
    actions.push(A.DELETE);
  }
  return actions;
};

/** Explique pourquoi une action est refusée (statut HTTP, code, message). */
const denial = (offer, actor, action) => {
  if (!isInOperatorScope(actor, offer)) {
    return new WorkflowError(403, "OPERATOR_SCOPE", "Cette offre n'appartient pas à votre opérateur.");
  }
  const permissionOf = {
    [A.EDIT]: PERMISSIONS.OFFER_UPDATE,
    [A.SUBMIT]: PERMISSIONS.OFFER_SUBMIT,
    [A.VALIDATE_TRANSMIT]: PERMISSIONS.OFFER_DECIDE,
    [A.VALIDATE_FINAL]: PERMISSIONS.OFFER_DECIDE,
    [A.REFUSE]: PERMISSIONS.OFFER_DECIDE,
    [A.MONITOR]: PERMISSIONS.OFFER_MONITOR,
    [A.DEACTIVATE]: PERMISSIONS.OFFER_DEACTIVATE,
    [A.REACTIVATE]: PERMISSIONS.OFFER_REACTIVATE,
    [A.DELETE]: PERMISSIONS.OFFER_DELETE,
  };
  if (permissionOf[action] && !can(actor.role, permissionOf[action])) {
    return new WorkflowError(403, "FORBIDDEN", "Votre profil ne permet pas cette action.");
  }
  if (offer.code === SENTINEL_OFFER_CODE) {
    return new WorkflowError(409, "SENTINEL", "L'offre repère « Offre Inconnu » ne peut pas être modifiée.");
  }
  const decided = hasDecisionTrace(offer);
  switch (action) {
    case A.EDIT:
      return decided
        ? new WorkflowError(409, "DECISION_EXISTS", "Une décision de validation a été enregistrée : l'offre ne peut plus être modifiée. Pour la faire évoluer, effectuez un monitoring.")
        : new WorkflowError(409, "INVALID_STATE", "Cette offre ne peut plus être modifiée dans son état actuel.");
    case A.SUBMIT:
      return new WorkflowError(409, "INVALID_STATE", "Seule une offre en brouillon peut être soumise.");
    case A.VALIDATE_TRANSMIT:
    case A.VALIDATE_FINAL:
    case A.REFUSE:
      if (![S.SUBMITTED, S.IN_VALIDATION].includes(offer.workflowStatus)) {
        return new WorkflowError(409, "INVALID_STATE", "Cette offre n'est pas en cours de validation.");
      }
      if (canActAtLevel(actor, offer.currentValidationLevel)) {
        if (action === A.VALIDATE_FINAL) {
          return new WorkflowError(409, "TRANSMISSION_REQUIRED", "Une offre de base doit être transmise jusqu'au Validateur 4, seul habilité à la valider définitivement.");
        }
        if (action === A.VALIDATE_TRANSMIT) {
          return new WorkflowError(409, "FINAL_LEVEL", "Dernier niveau de validation atteint : l'offre ne peut plus être transmise, elle doit être validée définitivement ou refusée.");
        }
      }
      return new WorkflowError(403, "WRONG_LEVEL", `L'offre attend une décision du niveau ${offer.currentValidationLevel}.`, {
        expectedLevel: offer.currentValidationLevel,
      });
    case A.MONITOR:
      return new WorkflowError(409, "INVALID_STATE", "Seule une offre validée peut faire l'objet d'un monitoring.");
    case A.DEACTIVATE:
      return new WorkflowError(409, "INVALID_STATE", "Cette offre ne peut pas être désactivée dans son état actuel.");
    case A.REACTIVATE:
      if (offer.workflowStatus !== S.DEACTIVATED) {
        return new WorkflowError(409, "INVALID_STATE", "Seule une offre désactivée peut être réactivée.");
      }
      return new WorkflowError(409, "NEWER_VERSION", "Cette version a été remplacée par une version plus récente toujours active : elle ne peut pas être réactivée.");
    case A.DELETE:
      if (decided) {
        return new WorkflowError(409, "DECISION_EXISTS", "Suppression interdite : une décision de validation existe. Désactivez l'offre pour la retirer tout en conservant sa traçabilité.");
      }
      if ((offer._count?.versions || 0) > 0 || (offer._count?.children || 0) > 0 || (offer._count?.monitorings || 0) > 0) {
        return new WorkflowError(409, "HAS_DEPENDENTS", "Suppression interdite : d'autres offres ou versions dépendent de celle-ci.");
      }
      return new WorkflowError(409, "INVALID_STATE", "Cette offre ne peut pas être supprimée dans son état actuel.");
    default:
      return new WorkflowError(403, "FORBIDDEN", "Action non autorisée.");
  }
};

/** Contrôle serveur d'une action ; lève une WorkflowError si elle est impossible. */
export const assertAction = (offer, actor, action) => {
  if (!offer) throw new WorkflowError(404, "NOT_FOUND", "Offre introuvable.");
  if (!getAvailableActions(offer, actor).includes(action)) throw denial(offer, actor, action);
};

/** Tient à jour `validation.status` et `offer.status` pour l'existant. */
const syncProjection = async (tx, offerId, status) => {
  const offerStatus = [S.DRAFT, S.SUBMITTED, S.IN_VALIDATION].includes(status) ? "PENDING" : "DONE";
  await tx.offer.update({ where: { id: offerId }, data: { status: offerStatus } });
  const validationStatus = VALIDATION_PROJECTION[status];
  if (!validationStatus) return;
  const existing = await tx.validation.findUnique({ where: { offerId }, select: { id: true } });
  if (existing) {
    await tx.validation.update({ where: { offerId }, data: { status: validationStatus } });
  } else {
    await tx.validation.create({
      data: {
        code: `VAL-${offerId}-${Date.now()}`,
        status: validationStatus,
        offer: { connect: { id: offerId } },
      },
    });
  }
};

/**
 * Transition protégée contre les décisions concurrentes : la mise à jour ne
 * s'applique que si l'offre est toujours dans l'état constaté. Deux validateurs
 * du même niveau ne peuvent donc pas statuer deux fois.
 */
const guardedTransition = async (tx, offer, data) => {
  const { count } = await tx.offer.updateMany({
    where: {
      id: offer.id,
      workflowStatus: offer.workflowStatus,
      currentValidationLevel: offer.currentValidationLevel,
    },
    data,
  });
  if (count !== 1) {
    throw new WorkflowError(409, "CONCURRENT_UPDATE", "L'offre a changé entre-temps. Rechargez la page avant de poursuivre.");
  }
};

const uniqueCode = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/* ========================================================================== */
/* Transitions                                                                */
/* ========================================================================== */

/**
 * À appeler après la création d'une offre par les routes existantes : fixe son
 * état initial (brouillon ou soumise), écrit le journal et renvoie les événements.
 */
export const initializeCreatedOffer = async (offerId, actor, { submit = true } = {}) => {
  const events = [];
  await prisma.$transaction(async (tx) => {
    const offer = await loadOfferContext(tx, offerId);
    if (!offer) throw new WorkflowError(404, "NOT_FOUND", "Offre introuvable.");
    const now = new Date();
    const status = submit ? S.SUBMITTED : S.DRAFT;
    await tx.offer.update({
      where: { id: offer.id },
      data: {
        workflowStatus: status,
        currentValidationLevel: submit ? 1 : null,
        submittedAt: submit ? now : null,
      },
    });
    await syncProjection(tx, offer.id, status);
    await writeAudit(tx, { action: AUDIT_ACTIONS.CREATE, actor, offerId: offer.id, toStatus: S.DRAFT });
    if (submit) {
      await writeAudit(tx, { action: AUDIT_ACTIONS.SUBMIT, actor, offerId: offer.id, fromStatus: S.DRAFT, toStatus: S.SUBMITTED, level: 1 });
      events.push({ type: WORKFLOW_EVENTS.SUBMITTED, offerId: offer.id, actor, toLevel: 1 });
    }
  });
  return { events };
};

/** Brouillon → soumise. */
export const submitOffer = async (offerId, actor) => {
  const events = [];
  const result = await prisma.$transaction(async (tx) => {
    const offer = await loadOfferContext(tx, offerId);
    assertAction(offer, actor, A.SUBMIT);
    await guardedTransition(tx, offer, {
      workflowStatus: S.SUBMITTED,
      currentValidationLevel: 1,
      submittedAt: new Date(),
    });
    await syncProjection(tx, offer.id, S.SUBMITTED);
    await writeAudit(tx, { action: AUDIT_ACTIONS.SUBMIT, actor, offerId: offer.id, fromStatus: offer.workflowStatus, toStatus: S.SUBMITTED, level: 1 });
    events.push({ type: WORKFLOW_EVENTS.SUBMITTED, offerId: offer.id, actor, toLevel: 1 });
    return loadOfferContext(tx, offer.id);
  });
  return { offer: result, events };
};

/**
 * Décision d'un validateur.
 *
 * @param decision     "VALIDATE" | "REFUSE"
 * @param comment      OBLIGATOIRE
 * @param confirmFinal OBLIGATOIRE (true) pour une validation définitive
 */
export const decideOffer = async (offerId, actor, { decision, comment, confirmFinal = false, validation = null } = {}) => {
  const text = String(comment ?? "").trim();
  if (!["VALIDATE", "REFUSE"].includes(decision)) {
    throw new WorkflowError(400, "INVALID_DECISION", "Décision inconnue : valider ou refuser.");
  }
  // Mode de validation : "TRANSMIT" (niveau supérieur) ou "FINAL" (validation
  // définitive). Sans précision : transmission tant qu'un niveau supérieur
  // existe, validation définitive au dernier niveau.
  if (validation !== null && validation !== undefined && !["TRANSMIT", "FINAL"].includes(validation)) {
    throw new WorkflowError(400, "INVALID_VALIDATION_MODE", "Mode de validation inconnu : transmettre ou valider définitivement.");
  }
  if (!text) {
    throw new WorkflowError(400, "COMMENT_REQUIRED", "Un commentaire est obligatoire pour toute décision de validation ou de refus.");
  }

  const events = [];
  const result = await prisma.$transaction(async (tx) => {
    const offer = await loadOfferContext(tx, offerId);
    if (!offer) throw new WorkflowError(404, "NOT_FOUND", "Offre introuvable.");
    const level = offer.currentValidationLevel;
    const finalLevel = finalLevelOf(offer);
    const now = new Date();

    if (decision === "REFUSE") {
      assertAction(offer, actor, A.REFUSE);
      await guardedTransition(tx, offer, {
        workflowStatus: S.REFUSED,
        currentValidationLevel: null,
        refusedAt: now,
      });
      await tx.validationDecision.create({
        data: { offerId: offer.id, level, decision: "REFUSED", comment: text, userId: actor.id, userRole: actor.role },
      });
      await syncProjection(tx, offer.id, S.REFUSED);
      await writeAudit(tx, { action: AUDIT_ACTIONS.REFUSE, actor, offerId: offer.id, fromStatus: offer.workflowStatus, toStatus: S.REFUSED, level, comment: text });
      events.push({ type: WORKFLOW_EVENTS.REFUSED, offerId: offer.id, actor, level, comment: text });
    } else if ((validation || (level < finalLevel ? "TRANSMIT" : "FINAL")) === "TRANSMIT") {
      // Validation intermédiaire : TRANSMISSION au niveau supérieur. L'offre
      // n'est PAS validée ; aucune notification de validation finale.
      assertAction(offer, actor, A.VALIDATE_TRANSMIT);
      await guardedTransition(tx, offer, {
        workflowStatus: S.IN_VALIDATION,
        currentValidationLevel: level + 1,
      });
      await tx.validationDecision.create({
        data: { offerId: offer.id, level, decision: "VALIDATED", transmitted: true, comment: text, userId: actor.id, userRole: actor.role },
      });
      await syncProjection(tx, offer.id, S.IN_VALIDATION);
      await writeAudit(tx, { action: AUDIT_ACTIONS.VALIDATE_TRANSMIT, actor, offerId: offer.id, fromStatus: offer.workflowStatus, toStatus: S.IN_VALIDATION, level, comment: text, metadata: { toLevel: level + 1 } });
      events.push({ type: WORKFLOW_EVENTS.TRANSMITTED, offerId: offer.id, actor, level, toLevel: level + 1, comment: text });
    } else {
      assertAction(offer, actor, A.VALIDATE_FINAL);
      if (confirmFinal !== true) {
        throw new WorkflowError(409, "CONFIRMATION_REQUIRED", "La validation définitive doit être explicitement confirmée.");
      }
      await guardedTransition(tx, offer, {
        workflowStatus: S.VALIDATED,
        currentValidationLevel: null,
        validatedAt: now,
      });
      await tx.validationDecision.create({
        data: { offerId: offer.id, level, decision: "VALIDATED", final: true, comment: text, userId: actor.id, userRole: actor.role },
      });
      await syncProjection(tx, offer.id, S.VALIDATED);
      // Promotion validée avant son dernier niveau : les niveaux supérieurs ne
      // sont pas requis ; la trace le précise.
      const withoutTransmission = level < finalLevel;
      await writeAudit(tx, {
        action: AUDIT_ACTIONS.VALIDATE_FINAL,
        actor,
        offerId: offer.id,
        fromStatus: offer.workflowStatus,
        toStatus: S.VALIDATED,
        level,
        comment: text,
        ...(withoutTransmission ? { metadata: { withoutTransmission: true, skippedLevels: Array.from({ length: finalLevel - level }, (_, i) => level + i + 1) } } : {}),
      });
      events.push({ type: WORKFLOW_EVENTS.VALIDATED_FINAL, offerId: offer.id, actor, level, comment: text });
    }
    return loadOfferContext(tx, offer.id);
  });
  return { offer: result, events };
};

/** Désactivation (manuelle). L'offre et toute sa traçabilité sont conservées. */
export const deactivateOffer = async (offerId, actor, { comment } = {}) => {
  // Motif obligatoire : la désactivation retire l'offre du comparateur et doit
  // rester compréhensible dans l'historique.
  const text = String(comment ?? "").trim();
  if (!text) {
    throw new WorkflowError(400, "COMMENT_REQUIRED", "Le motif de la désactivation est obligatoire.");
  }
  const events = [];
  const result = await prisma.$transaction(async (tx) => {
    const offer = await loadOfferContext(tx, offerId);
    assertAction(offer, actor, A.DEACTIVATE);
    // Retrait du comparateur d'une version remplacée par un monitoring : la
    // date de désactivation d'origine est conservée, seul le motif change.
    const withdrawal = offer.workflowStatus === S.DEACTIVATED;
    await guardedTransition(tx, offer, {
      workflowStatus: S.DEACTIVATED,
      currentValidationLevel: null,
      ...(withdrawal ? {} : { deactivatedAt: new Date() }),
      deactivationReason: "MANUAL",
      deactivatedById: actor.id,
    });
    await syncProjection(tx, offer.id, S.DEACTIVATED);
    await writeAudit(tx, {
      action: AUDIT_ACTIONS.DEACTIVATE,
      actor,
      offerId: offer.id,
      fromStatus: offer.workflowStatus,
      toStatus: S.DEACTIVATED,
      comment: text,
      metadata: withdrawal
        ? { reason: "MANUAL", previousReason: offer.deactivationReason, withdrawnFromComparator: true }
        : { reason: "MANUAL" },
    });
    events.push({ type: WORKFLOW_EVENTS.DEACTIVATED, offerId: offer.id, actor, comment: text });
    return loadOfferContext(tx, offer.id);
  });
  return { offer: result, events };
};

/**
 * Réactivation d'une offre désactivée (administration).
 *
 * L'offre retrouve l'état qu'elle avait AVANT sa désactivation : validée (elle
 * revient au comparateur), refusée, ou en cours de validation au niveau qui
 * l'attendait. Rien n'est effacé : la désactivation reste dans le journal, et
 * la réactivation y ajoute sa propre ligne (auteur, date, motif éventuel).
 */
export const reactivateOffer = async (offerId, actor, { comment } = {}) => {
  const text = String(comment ?? "").trim() || null;
  const events = [];
  const result = await prisma.$transaction(async (tx) => {
    const offer = await loadOfferContext(tx, offerId);
    assertAction(offer, actor, A.REACTIVATE);

    // État d'avant la désactivation : la dernière trace qui ne part pas déjà
    // de « désactivée » (un retrait du comparateur part de cet état).
    const previous = await tx.auditLog.findFirst({
      where: {
        offerId: offer.id,
        action: { in: [AUDIT_ACTIONS.DEACTIVATE, AUDIT_ACTIONS.MONITORING] },
        toStatus: S.DEACTIVATED,
        fromStatus: { not: S.DEACTIVATED },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: { fromStatus: true },
    });
    let restored = previous?.fromStatus;
    if (![S.SUBMITTED, S.IN_VALIDATION, S.VALIDATED, S.REFUSED].includes(restored)) {
      // Offre reprise de l'ancien système (aucune trace) : les dates font foi.
      restored = offer.validatedAt ? S.VALIDATED : offer.refusedAt ? S.REFUSED : S.SUBMITTED;
    }

    // Circuit à reprendre : niveau qui suit la dernière validation enregistrée.
    let level = null;
    if ([S.SUBMITTED, S.IN_VALIDATION].includes(restored)) {
      const last = await tx.validationDecision.findFirst({
        where: { offerId: offer.id, decision: "VALIDATED" },
        orderBy: { level: "desc" },
        select: { level: true },
      });
      level = Math.min((last?.level || 0) + 1, finalLevelOf(offer));
      restored = last ? S.IN_VALIDATION : S.SUBMITTED;
    }

    await guardedTransition(tx, offer, {
      workflowStatus: restored,
      currentValidationLevel: level,
      deactivatedAt: null,
      deactivationReason: null,
      deactivatedById: null,
    });
    await syncProjection(tx, offer.id, restored);
    await writeAudit(tx, {
      action: AUDIT_ACTIONS.REACTIVATE,
      actor,
      offerId: offer.id,
      fromStatus: S.DEACTIVATED,
      toStatus: restored,
      level,
      comment: text,
      metadata: { previousReason: offer.deactivationReason, deactivatedAt: offer.deactivatedAt },
    });
    events.push({ type: WORKFLOW_EVENTS.REACTIVATED, offerId: offer.id, actor, comment: text, toStatus: restored, toLevel: level });
    return loadOfferContext(tx, offer.id);
  });
  return { offer: result, events };
};

/**
 * Suppression physique   uniquement sans aucune décision, sans version ni offre
 * dépendante. La ligne d'audit « DELETE » survit à la suppression.
 */
export const deleteOffer = async (offerId, actor) => {
  await prisma.$transaction(async (tx) => {
    const offer = await loadOfferContext(tx, offerId);
    assertAction(offer, actor, A.DELETE);
    const id = offer.id;

    await writeAudit(tx, {
      action: AUDIT_ACTIONS.DELETE,
      actor,
      offerId: id,
      fromStatus: offer.workflowStatus,
      metadata: { code: offer.code, title: offer.title, operatorId: offer.operatorId },
    });

    const formulas = await tx.offerFormula.findMany({ where: { offerId: id }, select: { id: true } });
    const formulaIds = formulas.map((f) => f.id);
    if (formulaIds.length) {
      const details = await tx.offerServiceDetail.findMany({ where: { formulaId: { in: formulaIds } }, select: { id: true } });
      const detailIds = details.map((d) => d.id);
      if (detailIds.length) await tx.offerRate.deleteMany({ where: { serviceDetailId: { in: detailIds } } });
      await tx.offerServiceDetail.deleteMany({ where: { formulaId: { in: formulaIds } } });
      await tx.offerPrice.deleteMany({ where: { formulaId: { in: formulaIds } } });
      await tx.formulaAdvantage.deleteMany({ where: { formulaId: { in: formulaIds } } });
      await tx.offerControl.deleteMany({ where: { formulaId: { in: formulaIds } } });
      await tx.offerFormula.updateMany({ where: { offerId: id }, data: { parentId: null } });
      await tx.offerFormula.deleteMany({ where: { offerId: id } });
    }
    await tx.offerControl.deleteMany({ where: { offerId: id } });
    await tx.accessMode.deleteMany({ where: { offerId: id } });
    await tx.specialPromotion.deleteMany({ where: { offerId: id } });
    const validation = await tx.validation.findUnique({ where: { offerId: id }, select: { id: true } });
    if (validation) {
      await tx.comment.deleteMany({ where: { validationId: validation.id } });
      await tx.validation.delete({ where: { id: validation.id } });
    }
    await tx.review.deleteMany({ where: { offerId: id } });
    await tx.like.deleteMany({ where: { offerId: id } });
    await tx.offer.delete({ where: { id } });
  });
  return { deleted: true, events: [] };
};

/**
 * Monitoring : la version validée est conservée et désactivée ; une NOUVELLE
 * offre (nouvel identifiant) en reprend le contenu, référence la source et
 * repart dans le workflow. Tout est atomique.
 */
export const monitorOffer = async (offerId, actor, { comment } = {}) => {
  const text = String(comment ?? "").trim() || null;
  const events = [];

  const created = await prisma.$transaction(async (tx) => {
    const offer = await loadOfferContext(tx, offerId);
    assertAction(offer, actor, A.MONITOR);

    const full = await tx.offer.findUnique({
      where: { id: offer.id },
      include: {
        specialPromotion: true,
        accessModes: true,
        formulas: {
          include: {
            price: true,
            advantages: true,
            serviceDetail: { include: { offerRate: true } },
          },
        },
      },
    });

    const now = new Date();
    const version = (full.version || 1) + 1;
    const baseCode = full.code.replace(/-V\d+$/, "");

    // 1. Ancienne version : conservée, désactivée (motif MONITORING).
    await guardedTransition(tx, offer, {
      workflowStatus: S.DEACTIVATED,
      currentValidationLevel: null,
      deactivatedAt: now,
      deactivationReason: "MONITORING",
      deactivatedById: actor.id,
    });
    await syncProjection(tx, offer.id, S.DEACTIVATED);

    // 2. Nouvelle version.
    const next = await tx.offer.create({
      data: {
        code: `${baseCode}-V${version}`,
        title: full.title,
        notifiDate: full.notifiDate,
        desiredDate: full.desiredDate,
        billingType: full.billingType,
        category: full.category,
        target: full.target,
        link: full.link,
        partner: full.partner,
        description: full.description,
        status: "PENDING",
        workflowStatus: S.SUBMITTED,
        currentValidationLevel: 1,
        submittedAt: now,
        version,
        sourceOffer: { connect: { id: full.id } },
        user: { connect: { id: actor.id } },
        operator: { connect: { id: full.operatorId } },
        ...(full.areaId ? { area: { connect: { id: full.areaId } } } : {}),
        ...(full.documentId ? { document: { connect: { id: full.documentId } } } : {}),
        ...(full.parentId ? { parent: { connect: { id: full.parentId } } } : {}),
        ...(full.specialPromotion
          ? {
              specialPromotion: {
                create: {
                  code: uniqueCode("PROMO"),
                  type: full.specialPromotion.type,
                  duration: full.specialPromotion.duration,
                },
              },
            }
          : {}),
      },
    });

    // 3. Formules, sous-formules comprises (la hiérarchie est reconstituée).
    const idMap = new Map();
    const pending = [...full.formulas];
    let guard = pending.length + 1;
    while (pending.length && guard-- > 0) {
      for (let i = pending.length - 1; i >= 0; i -= 1) {
        const f = pending[i];
        if (f.parentId && !idMap.has(f.parentId)) continue;
        const nf = await tx.offerFormula.create({
          data: {
            code: uniqueCode("FRM"),
            title: f.title,
            validity: f.validity,
            offer: { connect: { id: next.id } },
            ...(f.parentId ? { parent: { connect: { id: idMap.get(f.parentId) } } } : {}),
            ...(f.price ? { price: { create: { code: uniqueCode("PRC"), value: f.price.value } } } : {}),
            advantages: {
              create: f.advantages.map((a) => ({ code: uniqueCode("ADV"), title: a.title, description: a.description })),
            },
          },
        });
        for (const d of f.serviceDetail) {
          await tx.offerServiceDetail.create({
            data: {
              code: uniqueCode("SRD"),
              quantity: d.quantity,
              billingSteps: d.billingSteps,
              comtype: d.comtype,
              formula: { connect: { id: nf.id } },
              service: { connect: { id: d.serviceId } },
              ...(d.offerRate ? { offerRate: { create: { code: uniqueCode("RAT"), value: d.offerRate.value } } } : {}),
            },
          });
        }
        idMap.set(f.id, nf.id);
        pending.splice(i, 1);
      }
    }
    if (pending.length) {
      throw new WorkflowError(500, "FORMULA_TREE", "La hiérarchie des formules de l'offre source est incohérente.");
    }

    // 4. Modes d'accès.
    for (const m of full.accessModes) {
      await tx.accessMode.create({ data: { code: uniqueCode("ACM"), content: m.content, offer: { connect: { id: next.id } } } });
    }

    await syncProjection(tx, next.id, S.SUBMITTED);

    // 5. Traçabilité des deux côtés du lien.
    await writeAudit(tx, { action: AUDIT_ACTIONS.MONITORING, actor, offerId: offer.id, fromStatus: S.VALIDATED, toStatus: S.DEACTIVATED, comment: text, metadata: { reason: "MONITORING", newOfferId: next.id, newVersion: version } });
    await writeAudit(tx, { action: AUDIT_ACTIONS.VERSION_CREATED, actor, offerId: next.id, toStatus: S.DRAFT, metadata: { sourceOfferId: offer.id, version } });
    await writeAudit(tx, { action: AUDIT_ACTIONS.SUBMIT, actor, offerId: next.id, fromStatus: S.DRAFT, toStatus: S.SUBMITTED, level: 1 });

    events.push({ type: WORKFLOW_EVENTS.MONITORING, offerId: next.id, sourceOfferId: offer.id, actor, toLevel: 1, comment: text });
    return next;
  });

  return { offer: await loadOfferContext(prisma, created.id), sourceOfferId: Number(offerId), events };
};

/** Trace d'une modification de contenu (après contrôle `EDIT` par l'appelant). */
export const recordOfferUpdate = (offer, actor, metadata = undefined, db = prisma) =>
  writeAudit(db, { action: AUDIT_ACTIONS.UPDATE, actor, offerId: offer.id, fromStatus: offer.workflowStatus, toStatus: offer.workflowStatus, metadata });

/* ========================================================================== */
/* Lecture : état du workflow pour l'interface                                */
/* ========================================================================== */

/**
 * État complet du workflow d'une offre, pour la fiche de validation : niveaux
 * attendus, décisions par niveau, actions disponibles, versions.
 */
export const getWorkflowState = async (offerId, actor) => {
  const offer = await loadOfferContext(prisma, offerId);
  if (!offer) throw new WorkflowError(404, "NOT_FOUND", "Offre introuvable.");
  if (!getAvailableActions(offer, actor).includes(A.VIEW)) {
    throw new WorkflowError(403, "OPERATOR_SCOPE", "Cette offre n'appartient pas à votre opérateur.");
  }

  const [decisions, audit, versions] = await Promise.all([
    prisma.validationDecision.findMany({
      where: { offerId: offer.id },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    }),
    prisma.auditLog.findMany({
      where: { offerId: offer.id },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      include: { actor: { select: { id: true, firstName: true, lastName: true, email: true } } },
    }),
    // Lignée complète : versions précédentes et suivantes.
    collectLineage(offer.id),
  ]);
  // Auteur de l'offre : repli lorsque l'historique ne contient pas les actions
  // antérieures à la validation (offres reprises de l'ancien système).
  const author = offer.userId
    ? await prisma.user.findUnique({
        where: { id: offer.userId },
        select: { id: true, firstName: true, lastName: true, email: true, profile: { select: { code: true } } },
      })
    : null;

  const finalLevel = finalLevelOf(offer);
  // Circuit en cours (soumise / en validation) ou clôturé (validée, refusée,
  // désactivée). Une fois le circuit clôturé, AUCUN niveau ne peut plus
  // apparaître « Décision attendue » ni « À venir », quel que soit le
  // validateur qui consulte.
  const inProgress = [S.SUBMITTED, S.IN_VALIDATION].includes(offer.workflowStatus);
  const circuitClosed = !inProgress && offer.workflowStatus !== S.DRAFT;
  const finalDecision =
    [...decisions].reverse().find((d) => d.final && d.decision === "VALIDATED") || null;
  const refusal = [...decisions].reverse().find((d) => d.decision === "REFUSED") || null;

  const levels = Array.from({ length: finalLevel }, (_, i) => {
    const n = i + 1;
    const decision = [...decisions].reverse().find((d) => d.level === n) || null;
    let state;
    if (decision) state = decision.decision === "REFUSED" ? "REFUSED" : "VALIDATED";
    else if (inProgress) state = offer.currentValidationLevel === n ? "CURRENT" : "UPCOMING";
    else if (!circuitClosed) state = "UPCOMING"; // brouillon : circuit pas encore démarré
    // Validée définitivement avant ce niveau (promotion) : niveau non requis.
    else if (finalDecision && finalDecision.level < n) state = "NOT_REQUIRED";
    // Refus : les niveaux suivants ne sont pas atteints.
    else if (refusal && refusal.level < n) state = "SKIPPED";
    // Validée (ou validée puis désactivée) sans décision par niveau : décision
    // antérieure au workflow (reprise de l'historique).
    else if (offer.validatedAt || offer.workflowStatus === S.VALIDATED) state = "NOT_RECORDED";
    else state = "SKIPPED";
    return { level: n, isFinal: n === finalLevel, state, decision };
  });

  return {
    offer,
    offerType: offer.specialPromotion ? "PROMOTION" : "BASE",
    finalLevel,
    levels,
    decisions,
    audit,
    versions,
    legacyDecision: decisions.length === 0 && offer.validation && offer.validation.status !== "PENDING"
      ? offer.validation.status
      : null,
    actions: getAvailableActions(offer, actor),
    // Clôture du circuit : décision finale (validation ou refus) et son auteur.
    circuitClosed,
    closure: circuitClosed
      ? {
          status: offer.workflowStatus,
          decision: offer.workflowStatus === S.REFUSED ? refusal : finalDecision,
          at: offer.validatedAt || offer.refusedAt || offer.deactivatedAt || null,
        }
      : null,
    // Dernière soumission (auteur, rôle, date) : première étape de la frise.
    // À défaut de trace SUBMIT (offre reprise de l'ancien système), la date
    // de soumission de l'offre fait foi : une offre validée n'est pas un brouillon.
    // Toutes les personnes ayant agi AVANT la validation (création,
    // modifications, soumission, nouvelle version), regroupées par personne.
    contributors: (() => {
      const LABELS = {
        [AUDIT_ACTIONS.CREATE]: "Création",
        [AUDIT_ACTIONS.VERSION_CREATED]: "Nouvelle version (monitoring)",
        [AUDIT_ACTIONS.UPDATE]: "Modification",
        [AUDIT_ACTIONS.SUBMIT]: "Soumission",
      };
      const byActor = new Map();
      for (const a of audit) {
        if (!LABELS[a.action] || !a.actor) continue;
        const cur = byActor.get(a.actor.id) || { user: a.actor, role: a.actorRole, actions: [], firstAt: a.createdAt, lastAt: a.createdAt };
        const existing = cur.actions.find((x) => x.action === a.action);
        if (existing) existing.count += 1;
        else cur.actions.push({ action: a.action, label: LABELS[a.action], count: 1 });
        cur.role = a.actorRole || cur.role;
        cur.lastAt = a.createdAt;
        byActor.set(a.actor.id, cur);
      }
      const list = [...byActor.values()].sort((x, y) => new Date(x.firstAt) - new Date(y.firstAt));
      if (!list.length && author) {
        list.push({
          user: { id: author.id, firstName: author.firstName, lastName: author.lastName, email: author.email },
          role: roleOf(author),
          actions: [{ action: "DECLARATION", label: "Déclaration de l'offre", count: 1 }],
          firstAt: offer.submittedAt || null,
          lastAt: offer.submittedAt || null,
          fromAuthor: true,
        });
      }
      return list;
    })(),
    submission: (() => {
      const last = [...audit].reverse().find((a) => a.action === AUDIT_ACTIONS.SUBMIT);
      if (last) return { actor: last.actor, actorRole: last.actorRole, createdAt: last.createdAt };
      if (offer.workflowStatus === S.DRAFT) return null;
      return { actor: null, actorRole: null, createdAt: offer.submittedAt || null, recorded: false };
    })(),
    // Affichée sur le comparateur public (règle de publication).
    published: isPublishedOffer(offer),
  };
};

const collectLineage = async (offerId) => {
  const select = { id: true, code: true, title: true, version: true, workflowStatus: true, sourceOfferId: true, createdAt: true };
  const chain = [];
  let current = await prisma.offer.findUnique({ where: { id: offerId }, select });
  // Remonte vers la version d'origine.
  const seen = new Set();
  while (current?.sourceOfferId && !seen.has(current.id)) {
    seen.add(current.id);
    current = await prisma.offer.findUnique({ where: { id: current.sourceOfferId }, select });
  }
  // Redescend version par version.
  while (current && !seen.has(`d${current.id}`)) {
    seen.add(`d${current.id}`);
    chain.push(current);
    current = await prisma.offer.findFirst({ where: { sourceOfferId: current.id }, select, orderBy: { id: "asc" } });
  }
  return chain;
};

export default {
  getAvailableActions,
  assertAction,
  initializeCreatedOffer,
  submitOffer,
  decideOffer,
  deactivateOffer,
  reactivateOffer,
  deleteOffer,
  monitorOffer,
  getWorkflowState,
};
