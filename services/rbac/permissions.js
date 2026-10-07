import { ROLES, isValidatorRole, PRIVILEGED_ROLES } from "@/services/rbac/roles";

/**
 * Matrice des permissions   source unique.
 *
 * Une permission dit QUI peut tenter une famille d'actions. Les conditions qui
 * dépendent de l'offre elle-même (statut, niveau de validation attendu,
 * opérateur, historique des décisions) sont évaluées par le moteur de
 * workflow (`services/workflow/offerWorkflow.js`).
 *
 * Le superviseur ne figure dans AUCUNE permission d'écriture : il n'a que
 * lecture, export et impression.
 */

export const PERMISSIONS = {
  OFFER_READ: "offer.read",
  OFFER_CREATE: "offer.create",
  OFFER_UPDATE: "offer.update",
  OFFER_SUBMIT: "offer.submit",
  OFFER_DECIDE: "offer.decide", // valider / refuser
  OFFER_MONITOR: "offer.monitor",
  OFFER_DEACTIVATE: "offer.deactivate",
  OFFER_REACTIVATE: "offer.reactivate",
  OFFER_DELETE: "offer.delete",
  HISTORY_READ: "history.read",
  STATISTICS_READ: "statistics.read",
  EXPORT: "data.export",
  PRINT: "data.print",
  OPERATOR_MANAGE: "operator.manage",
  REFERENTIAL_MANAGE: "referential.manage", // zones, pays, organisations, services
  USER_MANAGE: "user.manage",
  NOTIFICATION_MANAGE: "notification.manage",
  AUDIT_READ: "audit.read", // journal d'activité de toute la plateforme
  // Assistant IA (document interne à l'ARTCI : jamais exposé aux opérateurs).
  AI_ANALYSIS_READ: "ai.analysis.read", // consulter l'analyse IA d'une offre
  AI_ANALYSIS_RUN: "ai.analysis.run", // demander une (nouvelle) analyse
  LETTER_MANAGE: "letter.manage", // courrier au soumissionnaire
  ASSISTANT_USE: "assistant.use", // interroger les assistants (ComparIA, Assistant IA ARTCI)
  KNOWLEDGE_READ: "knowledge.read", // consulter la base documentaire
  KNOWLEDGE_MANAGE: "knowledge.manage", // alimenter la base documentaire
};

const { SUPER_ADMIN, ADMIN, SUPERVISOR, FOCAL_POINT } = ROLES;
const VALIDATORS = [ROLES.VALIDATOR_1, ROLES.VALIDATOR_2, ROLES.VALIDATOR_3, ROLES.VALIDATOR_4];

const READERS = [SUPER_ADMIN, ADMIN, SUPERVISOR, ...VALIDATORS, FOCAL_POINT];
const AUTHORS = [SUPER_ADMIN, ADMIN, ...VALIDATORS, FOCAL_POINT];

const MATRIX = {
  [PERMISSIONS.OFFER_READ]: READERS,
  [PERMISSIONS.HISTORY_READ]: READERS,
  [PERMISSIONS.STATISTICS_READ]: READERS,
  [PERMISSIONS.EXPORT]: READERS,
  [PERMISSIONS.PRINT]: READERS,
  [PERMISSIONS.OFFER_CREATE]: AUTHORS,
  [PERMISSIONS.OFFER_UPDATE]: AUTHORS,
  [PERMISSIONS.OFFER_SUBMIT]: AUTHORS,
  [PERMISSIONS.OFFER_MONITOR]: AUTHORS,
  [PERMISSIONS.OFFER_DECIDE]: [SUPER_ADMIN, ADMIN, ...VALIDATORS],
  [PERMISSIONS.OFFER_DEACTIVATE]: [SUPER_ADMIN, ADMIN],
  [PERMISSIONS.OFFER_REACTIVATE]: [SUPER_ADMIN, ADMIN],
  [PERMISSIONS.OFFER_DELETE]: [SUPER_ADMIN, ADMIN],
  [PERMISSIONS.OPERATOR_MANAGE]: [SUPER_ADMIN, ADMIN],
  [PERMISSIONS.REFERENTIAL_MANAGE]: [SUPER_ADMIN, ADMIN],
  [PERMISSIONS.USER_MANAGE]: [SUPER_ADMIN, ADMIN],
  [PERMISSIONS.NOTIFICATION_MANAGE]: [SUPER_ADMIN, ADMIN],
  [PERMISSIONS.AUDIT_READ]: [SUPER_ADMIN, ADMIN],
  [PERMISSIONS.AI_ANALYSIS_READ]: [SUPER_ADMIN, ADMIN, SUPERVISOR, ...VALIDATORS],
  [PERMISSIONS.AI_ANALYSIS_RUN]: [SUPER_ADMIN, ADMIN, ...VALIDATORS],
  [PERMISSIONS.LETTER_MANAGE]: [SUPER_ADMIN, ADMIN, ...VALIDATORS],
  [PERMISSIONS.ASSISTANT_USE]: READERS,
  [PERMISSIONS.KNOWLEDGE_READ]: [SUPER_ADMIN, ADMIN, SUPERVISOR, ...VALIDATORS],
  [PERMISSIONS.KNOWLEDGE_MANAGE]: [SUPER_ADMIN, ADMIN],
};

/** Le rôle dispose-t-il de la permission ? */
export const can = (role, permission) =>
  !!role && (MATRIX[permission] || []).includes(role);

/** Permissions d'un rôle (pour l'interface). */
export const permissionsOf = (role) =>
  Object.keys(MATRIX).filter((p) => MATRIX[p].includes(role));

/** Un point focal voit et agit sur SON opérateur uniquement. */
export const isOperatorScoped = (role) => role === FOCAL_POINT;

/**
 * Attribution de rôle : l'administrateur ne peut ni créer, ni promouvoir, ni
 * modifier un administrateur ou un super administrateur.
 *
 * @param actorRole  rôle de l'auteur de l'action
 * @param targetRole rôle attribué (création / changement de profil)
 * @param currentRole rôle actuel de l'utilisateur modifié (modification)
 * @returns {{ok:boolean, reason?:string}}
 */
export const canAssignRole = (actorRole, targetRole, currentRole = null) => {
  if (!can(actorRole, PERMISSIONS.USER_MANAGE)) {
    return { ok: false, reason: "Vous n'êtes pas autorisé à gérer les utilisateurs." };
  }
  if (actorRole === SUPER_ADMIN) return { ok: true };
  if (PRIVILEGED_ROLES.includes(targetRole)) {
    return {
      ok: false,
      reason: "Seul un super administrateur peut créer ou désigner un administrateur ou un super administrateur.",
    };
  }
  if (currentRole && PRIVILEGED_ROLES.includes(currentRole)) {
    return {
      ok: false,
      reason: "Seul un super administrateur peut modifier un administrateur ou un super administrateur.",
    };
  }
  return { ok: true };
};

export { isValidatorRole };

export default PERMISSIONS;
