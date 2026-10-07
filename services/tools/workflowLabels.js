/**
 * Libellés et présentation du workflow de validation des offres.
 * Module sans dépendance serveur : importé côté navigateur.
 */

export const WORKFLOW_STATUS_STYLE = {
  DRAFT: { label: "Brouillon", icon: "bi-pencil", tone: "neutral" },
  SUBMITTED: { label: "Soumise", icon: "bi-send", tone: "info" },
  IN_VALIDATION: { label: "En cours de validation", icon: "bi-hourglass-split", tone: "warning" },
  VALIDATED: { label: "Validée", icon: "bi-check-circle-fill", tone: "success" },
  REFUSED: { label: "Refusée", icon: "bi-x-circle-fill", tone: "danger" },
  DEACTIVATED: { label: "Désactivée", icon: "bi-slash-circle", tone: "muted" },
};

export const LEVEL_TITLES = {
  1: "Validateur 1",
  2: "Validateur 2",
  3: "Validateur 3",
  4: "Validateur 4",
};

export const LEVEL_FUNCTIONS = {
  1: "Responsable / Agent",
  2: "Chef de service",
  3: "Chef de département",
  4: "Directeur",
};

export const AUDIT_ACTION_LABELS = {
  CREATE: { label: "Création de l'offre", icon: "bi-file-earmark-plus" },
  UPDATE: { label: "Modification du contenu", icon: "bi-pencil-square" },
  SUBMIT: { label: "Soumission pour validation", icon: "bi-send-check" },
  VALIDATE_TRANSMIT: { label: "Validation et transmission au niveau supérieur", icon: "bi-arrow-up-circle" },
  VALIDATE_FINAL: { label: "Validation définitive", icon: "bi-patch-check-fill" },
  REFUSE: { label: "Refus", icon: "bi-x-octagon" },
  MONITORING: { label: "Monitoring (ancienne version désactivée)", icon: "bi-arrow-repeat" },
  VERSION_CREATED: { label: "Nouvelle version créée", icon: "bi-layers" },
  DEACTIVATE: { label: "Désactivation", icon: "bi-slash-circle" },
  REACTIVATE: { label: "Réactivation", icon: "bi-arrow-counterclockwise" },
  LETTER_GENERATED: { label: "Modèle de courrier généré", icon: "bi-envelope-paper" },
  LETTER_SENT: { label: "Courrier envoyé au soumissionnaire", icon: "bi-send" },
  LETTER_SEND_FAILED: { label: "Envoi du courrier échoué", icon: "bi-envelope-x" },
  DELETE: { label: "Suppression", icon: "bi-trash" },
  NOTIFY: { label: "Notifications envoyées", icon: "bi-bell" },
  LEGACY_IMPORT: { label: "Reprise de l'historique antérieur", icon: "bi-archive" },
  DEADLINE_ALERT: { label: "Alerte de délai réglementaire", icon: "bi-alarm" },
};

export const ROLE_SHORT_LABELS = {
  SUPER_ADMIN: "Super administrateur",
  ADMIN: "Administrateur",
  SUPERVISOR: "Superviseur",
  VALIDATOR_1: "Validateur 1",
  VALIDATOR_2: "Validateur 2",
  VALIDATOR_3: "Validateur 3",
  VALIDATOR_4: "Validateur 4",
  FOCAL_POINT: "Point focal",
  CLIENT: "Client",
};

/** Texte exact exigé avant une validation définitive. */
export const FINAL_CONFIRMATION_TEXT =
  "Vous êtes sur le point de confirmer la validation définitive de cette offre. " +
  "Cette action sera enregistrée dans l'historique et déclenchera les notifications prévues. Confirmer ?";

export const workflowStatusOf = (status) =>
  WORKFLOW_STATUS_STYLE[status] || { label: status || " ", icon: "bi-question-circle", tone: "neutral" };

/** « Niveau 2 / 4 » pour une offre en cours, sinon null. */
export const levelProgressLabel = (offer, finalLevel) => {
  if (!offer?.currentValidationLevel) return null;
  if (!["SUBMITTED", "IN_VALIDATION"].includes(offer.workflowStatus)) return null;
  const last = finalLevel || (offer.specialPromotion ? 3 : 4);
  return `Niveau ${offer.currentValidationLevel} / ${last}`;
};

export const personName = (user) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Utilisateur supprimé";

export const formatDateTime = (value) => {
  if (!value) return " ";
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Africa/Abidjan",
    }).format(new Date(value));
  } catch {
    return String(value);
  }
};
