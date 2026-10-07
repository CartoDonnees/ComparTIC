import prisma from "@/services/config/auth/prisma";

/**
 * Notifications internes de la plateforme.
 *
 * Une notification est enregistrée PAR DESTINATAIRE (une ligne `Notification`
 * reliée à un seul utilisateur) plutôt qu'une ligne partagée entre plusieurs
 * destinataires : le champ `read` du modèle est unique, un envoi collectif
 * aurait été marqué « lu » pour tout le monde dès la première lecture.
 *
 * Aucune notification ne doit interrompre une opération métier : toutes les
 * fonctions capturent leurs erreurs et retournent un compte-rendu.
 */

/** Catégories utilisées par l'interface (pictogramme + couleur). */
export const NOTIFICATION_TYPES = {
  OFFER_DECLARED: "OFFER_DECLARED",
  OFFER_UPDATED: "OFFER_UPDATED",
  OFFER_VALIDATED: "OFFER_VALIDATED",
  OFFER_REFUSED: "OFFER_REFUSED",
  OFFER_SUSPENDED: "OFFER_SUSPENDED",
  OFFER_PENDING: "OFFER_PENDING",
  OFFER_SUBMITTED: "OFFER_SUBMITTED",
  MONITORING_DECLARED: "MONITORING_DECLARED",
  ACCOUNT_CREATED: "ACCOUNT_CREATED",
  ACCOUNT_CONFIRMED: "ACCOUNT_CONFIRMED",
  // Message rédigé et envoyé depuis la page d'administration des notifications.
  ADMIN_MESSAGE: "ADMIN_MESSAGE",
  // Workflow de validation à niveaux.
  OFFER_TRANSMITTED: "OFFER_TRANSMITTED",
  OFFER_MONITORING: "OFFER_MONITORING",
  OFFER_DEACTIVATED: "OFFER_DEACTIVATED",
  OFFER_REACTIVATED: "OFFER_REACTIVATED",
  // Délai réglementaire : lancement imminent alors que le circuit est ouvert.
  OFFER_DEADLINE: "OFFER_DEADLINE",
};

const ARTCI = "ARTCI   CompareTIC";

/** Identifiants des administrateurs et superviseurs actifs. */
export const getSupervisionUserIds = async () => {
  const users = await prisma.user.findMany({
    where: {
      status: "ENABLE",
      profile: { code: { in: ["PRF0-TEST", "PRF1-TEST"] } },
    },
    select: { id: true },
  });
  return users.map((u) => u.id);
};

/** Identifiants des points focaux actifs d'un opérateur. */
export const getOperatorUserIds = async (operatorId) => {
  if (!operatorId) return [];
  const users = await prisma.user.findMany({
    where: {
      status: "ENABLE",
      focalPoint: { operatorId: Number(operatorId) },
    },
    select: { id: true },
  });
  return users.map((u) => u.id);
};

/**
 * Enregistre une notification pour chaque destinataire.
 * @returns {Promise<{created:number, error?:string}>}
 */
export const notify = async ({
  userIds,
  type,
  title,
  content,
  link = null,
  from = ARTCI,
  // Offre concernée (workflow) : relie la notification à l'offre.
  offerId = null,
}) => {
  const recipients = [...new Set((userIds || []).filter(Boolean).map(Number))];
  if (recipients.length === 0) return { created: 0 };

  try {
    // `code` est unique : on combine horodatage, destinataire et aléa pour
    // éviter toute collision lors d'un envoi groupé dans la même milliseconde.
    const stamp = Date.now();
    await prisma.$transaction(
      recipients.map((userId, index) =>
        prisma.notification.create({
          data: {
            code: `NOT-${stamp}-${userId}-${index}`,
            from,
            type,
            title,
            content,
            link,
            read: false,
            status: "ENABLE",
            to: { connect: { id: userId } },
            ...(offerId ? { offer: { connect: { id: Number(offerId) } } } : {}),
          },
        }),
      ),
    );
    return { created: recipients.length };
  } catch (error) {
    // Journalisé mais jamais propagé : une notification perdue ne doit pas
    // faire échouer la déclaration ou la validation d'une offre.
    console.error("Notification non enregistrée :", error?.message);
    return { created: 0, error: error?.message };
  }
};

/* ==========================================================================
   Raccourcis métier
   ========================================================================== */

/** Une offre vient d'être déclarée : prévenir l'ARTCI. */
export const notifyOfferDeclared = async ({ offer, operatorName }) => {
  const userIds = await getSupervisionUserIds();
  return notify({
    userIds,
    type: NOTIFICATION_TYPES.OFFER_DECLARED,
    title: "Nouvelle offre déclarée",
    content: `${operatorName || "Un opérateur"} a déclaré l'offre « ${offer?.title} » (${offer?.code}). Elle attend une décision de validation.`,
    link: "/admin-validation",
  });
};

/**
 * Une offre vient d'être SOUMISE par un point focal, après validation du code
 * reçu par e-mail.
 *
 * Deux cercles de destinataires, avec des formulations distinctes :
 *  - l'ARTCI (administrateurs et superviseurs), qui doit statuer ;
 *  - les AUTRES points focaux du même opérateur, informés qu'un collègue a
 *    soumis en leur nom commun   l'auteur lui-même est exclu, il vient d'agir.
 *
 * Chaque message porte l'opérateur, l'intitulé et la référence de l'offre,
 * l'auteur de la soumission, ainsi que la date et l'heure.
 */
export const notifyOfferSubmitted = async ({
  offer,
  operatorId,
  operatorName,
  submitter,
  submittedAt = new Date(),
}) => {
  const stamp = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Africa/Abidjan",
  }).format(new Date(submittedAt));

  const author =
    [submitter?.firstName, submitter?.lastName].filter(Boolean).join(" ") ||
    submitter?.email ||
    "Un point focal";

  // Séparateurs en ligne plutôt que retours à la ligne : le panneau de
  // notifications tronque à trois lignes et n'interprète pas les sauts de
  // ligne   un texte multiligne s'y serait affiché aggloméré.
  const identity =
    `Opérateur : ${operatorName || "non précisé"} · ` +
    `Offre : « ${offer?.title} » (${offer?.code}) · ` +
    `Soumise par : ${author} · Le ${stamp}`;

  const supervisionIds = await getSupervisionUserIds();
  const supervision = await notify({
    userIds: supervisionIds,
    type: NOTIFICATION_TYPES.OFFER_SUBMITTED,
    title: "Nouvelle offre soumise",
    content: `Une nouvelle offre attend une décision de validation. ${identity}`,
    link: "/admin-validation",
  });

  // Les autres points focaux de l'opérateur, l'auteur excepté.
  const peerIds = (await getOperatorUserIds(operatorId ?? offer?.operatorId)).filter(
    (id) => Number(id) !== Number(submitter?.id),
  );
  const peers = await notify({
    userIds: peerIds,
    type: NOTIFICATION_TYPES.OFFER_SUBMITTED,
    title: "Offre soumise par un point focal",
    content: `Une offre vient d'être soumise à l'ARTCI pour votre opérateur. ${identity}`,
    link: "/operator-list-offer",
  });

  return {
    supervision: supervision.created,
    peers: peers.created,
  };
};

/** Un monitoring vient d'être déposé : prévenir l'ARTCI. */
export const notifyMonitoringDeclared = async ({ monitoring, operatorName }) => {
  const userIds = await getSupervisionUserIds();
  return notify({
    userIds,
    type: NOTIFICATION_TYPES.MONITORING_DECLARED,
    title: "Nouveau monitoring d'offre",
    content: `${operatorName || "Un opérateur"} a déposé un monitoring pour « ${monitoring?.title} » (${monitoring?.code}).`,
    link: "/admin-validation",
  });
};

/** Décision de validation : prévenir les points focaux de l'opérateur. */
export const notifyValidationDecision = async ({
  offer,
  status,
  observation,
}) => {
  const userIds = await getOperatorUserIds(offer?.operatorId);

  const map = {
    ALLOW: {
      type: NOTIFICATION_TYPES.OFFER_VALIDATED,
      title: "Offre validée",
      verb: "a été validée par l'ARTCI",
    },
    DINIED: {
      type: NOTIFICATION_TYPES.OFFER_REFUSED,
      title: "Offre refusée",
      verb: "a été refusée par l'ARTCI",
    },
    SUSPENDED: {
      type: NOTIFICATION_TYPES.OFFER_SUSPENDED,
      title: "Offre suspendue",
      verb: "a été suspendue par l'ARTCI",
    },
    PENDING: {
      type: NOTIFICATION_TYPES.OFFER_PENDING,
      title: "Offre remise en attente",
      verb: "a été remise en attente de validation",
    },
  };

  const info = map[status] || map.PENDING;

  return notify({
    userIds,
    type: info.type,
    title: info.title,
    content:
      `Votre offre « ${offer?.title} » (${offer?.code}) ${info.verb}.` +
      (observation ? ` Observation : ${observation}` : ""),
    link: "/operator-list-offer",
  });
};

/** Compte créé par l'administrateur : mot de bienvenue dans la plateforme. */
export const notifyAccountCreated = async ({ userId, firstName }) =>
  notify({
    userIds: [userId],
    type: NOTIFICATION_TYPES.ACCOUNT_CREATED,
    title: "Bienvenue sur CompareTIC",
    content: `Bonjour ${firstName || ""}, votre compte a été créé. Pensez à personnaliser votre mot de passe depuis « Mon profil ».`,
    link: "/operator-profile",
  });

export default notify;
