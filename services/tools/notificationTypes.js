/**
 * Présentation des types de notification : libellé, pictogramme, tonalité.
 *
 * Source unique pour l'en-tête (panneau des notifications) et la page
 * d'administration des notifications : un type ajouté ici apparaît partout
 * avec le même pictogramme, au lieu d'une cloche générique d'un côté et d'un
 * libellé brut de l'autre.
 *
 * Module sans dépendance serveur : il est importé côté navigateur.
 */

export const NOTIFICATION_TYPE_STYLE = {
  OFFER_DECLARED: { label: "Offre déclarée", icon: "bi-file-earmark-plus", tone: "info" },
  OFFER_SUBMITTED: { label: "Offre soumise", icon: "bi-send-check", tone: "info" },
  OFFER_UPDATED: { label: "Offre modifiée", icon: "bi-pencil-square", tone: "info" },
  OFFER_VALIDATED: { label: "Offre validée", icon: "bi-check-circle", tone: "success" },
  OFFER_REFUSED: { label: "Offre refusée", icon: "bi-x-circle", tone: "danger" },
  OFFER_SUSPENDED: { label: "Offre suspendue", icon: "bi-pause-circle", tone: "warning" },
  OFFER_PENDING: { label: "Offre remise en attente", icon: "bi-hourglass-split", tone: "warning" },
  MONITORING_DECLARED: { label: "Monitoring déposé", icon: "bi-activity", tone: "info" },
  ACCOUNT_CREATED: { label: "Compte créé", icon: "bi-person-check", tone: "success" },
  ACCOUNT_CONFIRMED: { label: "Compte activé", icon: "bi-patch-check", tone: "success" },
  ADMIN_MESSAGE: { label: "Message de l'administration", icon: "bi-megaphone", tone: "primary" },
  OFFER_TRANSMITTED: { label: "Offre transmise pour validation", icon: "bi-arrow-up-circle", tone: "info" },
  OFFER_MONITORING: { label: "Monitoring d'offre", icon: "bi-arrow-repeat", tone: "info" },
  OFFER_DEACTIVATED: { label: "Offre désactivée", icon: "bi-slash-circle", tone: "warning" },
  OFFER_REACTIVATED: { label: "Offre réactivée", icon: "bi-arrow-counterclockwise", tone: "success" },
  OFFER_DEADLINE: { label: "Délai réglementaire", icon: "bi-alarm", tone: "danger" },
};

export const DEFAULT_TYPE_STYLE = { label: "Notification", icon: "bi-bell", tone: "info" };

/** Présentation sûre d'un type, connu ou non. */
export const notificationStyleOf = (type) =>
  NOTIFICATION_TYPE_STYLE[type] || DEFAULT_TYPE_STYLE;

export default NOTIFICATION_TYPE_STYLE;
