import { AUDIT_ACTION_LABELS } from "@/services/tools/workflowLabels";

/**
 * Catalogue des activités tracées (journal d'audit)    page /admin-activity.
 *
 * Chaque action enregistrée par `writeAudit` appartient à un domaine
 * (`AuditLog.entityType`). Les libellés des actions sur les offres sont ceux
 * de la fiche de circuit (`workflowLabels.js`) ; les autres sont définis ici.
 *
 * Module sans dépendance serveur : importé côté navigateur et par l'API.
 */

export const ACTIVITY_DOMAINS = {
  OFFER: { label: "Offres", icon: "bi-collection" },
  USER: { label: "Utilisateurs", icon: "bi-people" },
  OPERATOR: { label: "Opérateurs", icon: "bi-sd-card" },
  REFERENTIAL: { label: "Référentiels", icon: "bi-sliders" },
  KNOWLEDGE: { label: "Base documentaire", icon: "bi-journal-text" },
  SESSION: { label: "Connexions", icon: "bi-box-arrow-in-right" },
};

/** Tonalité d'affichage : neutral | info | success | warning | danger. */
const OFFER_TONES = {
  CREATE: "info",
  UPDATE: "neutral",
  SUBMIT: "info",
  VALIDATE_TRANSMIT: "info",
  VALIDATE_FINAL: "success",
  REFUSE: "danger",
  MONITORING: "warning",
  VERSION_CREATED: "info",
  DEACTIVATE: "warning",
  REACTIVATE: "success",
  LETTER_GENERATED: "neutral",
  LETTER_SENT: "info",
  LETTER_SEND_FAILED: "warning",
  DELETE: "danger",
  NOTIFY: "neutral",
  LEGACY_IMPORT: "neutral",
  DEADLINE_ALERT: "warning",
};

export const ACTIVITY_ACTIONS = {
  ...Object.fromEntries(
    Object.entries(AUDIT_ACTION_LABELS).map(([key, v]) => [key, { ...v, tone: OFFER_TONES[key] || "neutral", domain: "OFFER" }]),
  ),
  USER_CREATE: { label: "Création d'un compte", icon: "bi-person-plus", tone: "info", domain: "USER" },
  USER_UPDATE: { label: "Modification d'un compte", icon: "bi-person-gear", tone: "neutral", domain: "USER" },
  USER_DELETE: { label: "Suppression d'un compte", icon: "bi-person-x", tone: "danger", domain: "USER" },
  OPERATOR_CREATE: { label: "Création d'un opérateur", icon: "bi-building-add", tone: "info", domain: "OPERATOR" },
  OPERATOR_UPDATE: { label: "Modification d'un opérateur", icon: "bi-building-gear", tone: "neutral", domain: "OPERATOR" },
  OPERATOR_DELETE: { label: "Suppression d'un opérateur", icon: "bi-building-x", tone: "danger", domain: "OPERATOR" },
  REFERENTIAL_CREATE: { label: "Création dans un référentiel", icon: "bi-plus-square", tone: "info", domain: "REFERENTIAL" },
  REFERENTIAL_UPDATE: { label: "Modification d'un référentiel", icon: "bi-pencil-square", tone: "neutral", domain: "REFERENTIAL" },
  REFERENTIAL_DELETE: { label: "Suppression dans un référentiel", icon: "bi-dash-square", tone: "danger", domain: "REFERENTIAL" },
  KNOWLEDGE_CREATE: { label: "Document ajouté à la base documentaire", icon: "bi-journal-plus", tone: "info", domain: "KNOWLEDGE" },
  KNOWLEDGE_UPDATE: { label: "Document de référence modifié", icon: "bi-journal-check", tone: "neutral", domain: "KNOWLEDGE" },
  KNOWLEDGE_DELETE: { label: "Document retiré de la base documentaire", icon: "bi-journal-x", tone: "danger", domain: "KNOWLEDGE" },
  LOGIN: { label: "Connexion", icon: "bi-box-arrow-in-right", tone: "success", domain: "SESSION" },
  LOGIN_FAILED: { label: "Échec de connexion", icon: "bi-shield-exclamation", tone: "danger", domain: "SESSION" },
  LOGIN_REFUSED: { label: "Connexion refusée (compte inactif)", icon: "bi-shield-lock", tone: "warning", domain: "SESSION" },
  LOGOUT: { label: "Déconnexion", icon: "bi-box-arrow-right", tone: "neutral", domain: "SESSION" },
};

export const activityActionOf = (action) =>
  ACTIVITY_ACTIONS[action] || { label: action || "Action", icon: "bi-dot", tone: "neutral", domain: null };

/** Libellés des clés de `metadata` affichées dans le détail. */
export const METADATA_LABELS = {
  kindLabel: "Nature",
  reference: "Référence",
  passages: "Passages",
  source: "Source",
  inForce: "En vigueur",
  previousName: "Ancien nom",
  countries: "Pays rattachés",
  countriesAdded: "Pays ajoutés",
  countriesRemoved: "Pays retirés",
  kind: "Nature du courrier",
  synthesis: "Synthèse",
  letterId: "Courrier (id)",
  rejected: "Adresses refusées",
  unverified: "Domaines non vérifiés",
  domains: "Domaines inexistants",
  cause: "Cause technique",
  dryRun: "Envoi simulé",
  role: "Rôle",
  profileCode: "Code de profil",
  operatorId: "Opérateur (id)",
  code: "Code",
  name: "Nom",
  type: "Type",
  changed: "Champs modifiés",
  changes: "Modifications",
  email: "E-mail",
  emails: "Destinataires",
  event: "Événement",
  notified: "Notifications créées",
  reason: "Motif",
  sourceOfferId: "Offre d'origine (id)",
  version: "Version",
  withoutTransmission: "Sans transmission",
  skippedLevels: "Niveaux non sollicités",
  space: "Espace",
  ip: "Adresse IP",
  userAgent: "Navigateur",
  title: "Titre",
};

export const SESSION_SPACES = { admin: "Espace de gestion", client: "Site public" };

export const SESSION_REASONS = {
  UNKNOWN_ACCOUNT: "Compte inconnu",
  BAD_PASSWORD: "Mot de passe incorrect",
  PENDING: "Compte non activé",
  SUSPENDED: "Compte suspendu",
  DISABLE: "Compte désactivé",
};
