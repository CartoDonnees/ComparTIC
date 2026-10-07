/**
 * Journal d'audit.
 *
 * Écriture UNIQUEMENT : aucune fonction de modification ni de suppression n'est
 * exposée, et aucune route d'API ne permet de toucher une ligne existante.
 *
 * Toujours appelé avec le client de transaction (`tx`) de l'opération métier :
 * le changement d'état et sa trace réussissent ou échouent ensemble.
 */

export const AUDIT_ACTIONS = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  SUBMIT: "SUBMIT",
  VALIDATE_TRANSMIT: "VALIDATE_TRANSMIT",
  VALIDATE_FINAL: "VALIDATE_FINAL",
  REFUSE: "REFUSE",
  MONITORING: "MONITORING",
  VERSION_CREATED: "VERSION_CREATED",
  DEACTIVATE: "DEACTIVATE",
  REACTIVATE: "REACTIVATE",
  // Courrier au soumissionnaire : modèle généré, courrier envoyé.
  LETTER_GENERATED: "LETTER_GENERATED",
  LETTER_SENT: "LETTER_SENT",
  LETTER_SEND_FAILED: "LETTER_SEND_FAILED",
  DELETE: "DELETE",
  NOTIFY: "NOTIFY",
  USER_CREATE: "USER_CREATE",
  USER_UPDATE: "USER_UPDATE",
  USER_DELETE: "USER_DELETE",
  OPERATOR_CREATE: "OPERATOR_CREATE",
  OPERATOR_UPDATE: "OPERATOR_UPDATE",
  OPERATOR_DELETE: "OPERATOR_DELETE",
  // Référentiels (entityType REFERENTIAL) : services/referential/referentialService.js
  REFERENTIAL_CREATE: "REFERENTIAL_CREATE",
  REFERENTIAL_UPDATE: "REFERENTIAL_UPDATE",
  REFERENTIAL_DELETE: "REFERENTIAL_DELETE",
  // Base documentaire de l'Assistant IA ARTCI (entityType KNOWLEDGE).
  KNOWLEDGE_CREATE: "KNOWLEDGE_CREATE",
  KNOWLEDGE_UPDATE: "KNOWLEDGE_UPDATE",
  KNOWLEDGE_DELETE: "KNOWLEDGE_DELETE",
  LEGACY_IMPORT: "LEGACY_IMPORT",
  // Alerte quotidienne de délai réglementaire (tâche planifiée).
  DEADLINE_ALERT: "DEADLINE_ALERT",
  // Sessions (entityType SESSION) : services/audit/sessionAudit.js
  LOGIN: "LOGIN",
  LOGIN_FAILED: "LOGIN_FAILED",
  LOGIN_REFUSED: "LOGIN_REFUSED",
  LOGOUT: "LOGOUT",
};

/**
 * @param db   client Prisma ou client de transaction
 * @param entry { action, actor, offerId, entityType, entityId, fromStatus,
 *                toStatus, level, comment, metadata }
 */
export const writeAudit = (db, entry) =>
  db.auditLog.create({
    data: {
      action: entry.action,
      entityType: entry.entityType || "OFFER",
      entityId: entry.entityId ?? entry.offerId ?? null,
      offerId: entry.offerId ?? null,
      actorId: entry.actor?.id ?? null,
      actorRole: entry.actor?.role ?? null,
      fromStatus: entry.fromStatus ?? null,
      toStatus: entry.toStatus ?? null,
      level: entry.level ?? null,
      comment: entry.comment ?? null,
      metadata: entry.metadata ?? undefined,
    },
  });

export default writeAudit;
