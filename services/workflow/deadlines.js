/**
 * Délais réglementaires de communication des offres (décision 2024-1098).
 *
 * L'offre doit parvenir à l'ARTCI un certain temps AVANT son lancement :
 *   - offre de base                       : 1 mois
 *   - promotion « flash »                 : 24 heures
 *   - promotion « périodique »            : 72 heures
 *   - promotion « spéciale »              : 7 jours
 *   - promotion « personnalisée » / CVM   : 7 jours
 *
 * Deux usages :
 *  - à l'examen, indiquer si le préavis déposé par l'opérateur est suffisant ;
 *  - chaque jour, alerter les validateurs sur les offres dont le lancement
 *    approche alors que le circuit n'est pas clos (risque métier n° 1).
 *
 * Module sans dépendance serveur : importable côté navigateur.
 */

export const DAY_MS = 86400000;

/** Préavis exigé, en jours, par type d'offre. */
export const NOTICE_DAYS = {
  BASE: 30,
  FLASH: 1,
  PERIOD: 3,
  SPECIAL: 7,
  CUSTOMIZE: 7,
};

export const OFFER_KIND_LABELS = {
  BASE: "offre de base",
  FLASH: "promotion flash",
  PERIOD: "promotion périodique",
  SPECIAL: "promotion spéciale",
  CUSTOMIZE: "promotion personnalisée",
};

/** Seuil (en jours avant lancement) à partir duquel une offre est signalée. */
export const ALERT_THRESHOLD_DAYS = 2;

const startOfDay = (value) => {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
};

const daysBetween = (from, to) => Math.round((startOfDay(to) - startOfDay(from)) / DAY_MS);

/** Type réglementaire d'une offre : BASE ou type de promotion. */
export const offerKindOf = (offer) => {
  const promo = offer?.specialPromotion;
  if (!promo) return "BASE";
  return NOTICE_DAYS[promo.type] ? promo.type : "SPECIAL";
};

/**
 * Situation d'une offre au regard des délais.
 *
 * @returns {{
 *   kind: string, kindLabel: string, requiredNoticeDays: number,
 *   noticeGivenDays: number|null, noticeCompliant: boolean|null,
 *   daysToLaunch: number|null, launchPassed: boolean,
 *   level: "NONE"|"SOON"|"URGENT"|"LATE", label: string
 * }}
 */
export const deadlineStatusOf = (offer, now = new Date()) => {
  const kind = offerKindOf(offer);
  const requiredNoticeDays = NOTICE_DAYS[kind];
  const noticeGivenDays =
    offer?.notifiDate && offer?.desiredDate ? daysBetween(offer.notifiDate, offer.desiredDate) : null;
  const daysToLaunch = offer?.desiredDate ? daysBetween(now, offer.desiredDate) : null;

  let level = "NONE";
  if (daysToLaunch !== null) {
    if (daysToLaunch < 0) level = "LATE";
    else if (daysToLaunch <= ALERT_THRESHOLD_DAYS) level = "URGENT";
    else if (daysToLaunch <= 7) level = "SOON";
  }

  const label =
    daysToLaunch === null
      ? "Date de lancement non renseignée"
      : daysToLaunch < 0
        ? `Lancement dépassé de ${-daysToLaunch} jour(s)`
        : daysToLaunch === 0
          ? "Lancement prévu aujourd'hui"
          : `Lancement dans ${daysToLaunch} jour(s)`;

  return {
    kind,
    kindLabel: OFFER_KIND_LABELS[kind] || kind,
    requiredNoticeDays,
    noticeGivenDays,
    noticeCompliant: noticeGivenDays === null ? null : noticeGivenDays >= requiredNoticeDays,
    daysToLaunch,
    launchPassed: daysToLaunch !== null && daysToLaunch < 0,
    level,
    label,
  };
};

/** Une offre encore en circuit doit-elle déclencher une alerte aujourd'hui ? */
export const needsDeadlineAlert = (offer, now = new Date()) => {
  const inCircuit = ["SUBMITTED", "IN_VALIDATION"].includes(offer?.workflowStatus);
  if (!inCircuit) return false;
  const { level } = deadlineStatusOf(offer, now);
  return level === "URGENT" || level === "LATE";
};

export default deadlineStatusOf;
