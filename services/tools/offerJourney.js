import {
  AUDIT_ACTION_LABELS,
  LEVEL_FUNCTIONS,
  LEVEL_TITLES,
  workflowStatusOf,
} from "@/services/tools/workflowLabels";
import { deadlineStatusOf } from "@/services/workflow/deadlines";

/**
 * Parcours d'une offre : passé, présent, à venir.
 *
 * Fonction pure, calculée à partir de l'état renvoyé par
 * `GET /api/workflow/offers/:id` (journal d'audit, décisions, niveaux,
 * versions). Rien n'est inventé : une étape à venir n'est annoncée que si le
 * circuit la rend certaine (niveaux restants, date de lancement déclarée).
 *
 * Module sans dépendance serveur : importé côté navigateur.
 */

const TONES = {
  CREATE: "info",
  UPDATE: "neutral",
  SUBMIT: "info",
  VALIDATE_TRANSMIT: "success",
  VALIDATE_FINAL: "success",
  REFUSE: "danger",
  MONITORING: "warning",
  VERSION_CREATED: "info",
  DEACTIVATE: "warning",
  REACTIVATE: "success",
  LETTER_SENT: "info",
  DELETE: "danger",
  LEGACY_IMPORT: "neutral",
  DEADLINE_ALERT: "warning",
};

// Les envois de notifications ne sont pas des étapes de la vie de l'offre.
const HIDDEN = new Set(["NOTIFY", "LETTER_GENERATED", "LETTER_SEND_FAILED"]);

const dayMs = 86400000;
const daysSince = (date) => (date ? Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / dayMs)) : null);

const levelLabel = (n, finalLevel) =>
  `${LEVEL_TITLES[n] || `Niveau ${n}`}${LEVEL_FUNCTIONS[n] ? `    ${LEVEL_FUNCTIONS[n]}` : ""}${n === finalLevel ? " (validation définitive)" : ""}`;

const DEACTIVATION_REASON = { MONITORING: "remplacée par un monitoring", MANUAL: "désactivation manuelle" };

export const buildOfferJourney = (state) => {
  if (!state?.offer) return { past: [], present: null, future: [] };
  const { offer, details = {}, audit = [], decisions = [], finalLevel, versions = [], actions = [] } = state;
  const status = offer.workflowStatus;
  const dated = { ...offer, ...details };
  const deadline = deadlineStatusOf(dated);

  /* ------------------------------------------------------------- passé */
  let past = audit
    .filter((a) => !HIDDEN.has(a.action))
    .map((a) => ({
      key: `a-${a.id}`,
      at: a.createdAt,
      action: a.action,
      title: AUDIT_ACTION_LABELS[a.action]?.label || a.action,
      icon: AUDIT_ACTION_LABELS[a.action]?.icon || "bi-dot",
      tone: TONES[a.action] || "neutral",
      actor: a.actor || null,
      actorRole: a.actorRole || null,
      level: a.level || null,
      fromStatus: a.fromStatus,
      toStatus: a.toStatus,
      comment: a.comment || null,
    }));

  // Offre reprise de l'ancien système : pas de journal, les dates font foi.
  if (!past.length) {
    const legacy = [
      [details.createdAt, "CREATE", "Déclaration de l'offre"],
      [offer.submittedAt, "SUBMIT", "Soumission pour validation"],
      [offer.validatedAt, "VALIDATE_FINAL", "Validation"],
      [offer.refusedAt, "REFUSE", "Refus"],
      [offer.deactivatedAt, "DEACTIVATE", "Désactivation"],
    ];
    past = legacy
      .filter(([at]) => at)
      .map(([at, action, title]) => ({
        key: `l-${action}`,
        at,
        action,
        title,
        icon: AUDIT_ACTION_LABELS[action]?.icon || "bi-dot",
        tone: TONES[action],
        actor: null,
        actorRole: null,
        level: null,
        comment: null,
        legacy: true,
      }))
      .sort((a, b) => new Date(a.at) - new Date(b.at));
  }

  /* ----------------------------------------------------------- présent */
  const s = workflowStatusOf(status);
  const lastDecision = decisions.length ? decisions[decisions.length - 1] : null;
  const lastComment = [...past].reverse().find((e) => e.comment) || null;
  const lastEvent = past.length ? past[past.length - 1] : null;
  const inProgress = ["SUBMITTED", "IN_VALIDATION"].includes(status);
  const level = offer.currentValidationLevel;
  const canDecide = actions.includes("VALIDATE_TRANSMIT") || actions.includes("VALIDATE_FINAL") || actions.includes("REFUSE");

  const present = {
    status,
    label: s.label,
    icon: s.icon,
    tone: s.tone === "muted" ? "neutral" : s.tone,
    level: inProgress ? level : null,
    headline: null,
    waiting: null,
    pending: [],
    lastComment: lastComment
      ? { text: lastComment.comment, actor: lastComment.actor, title: lastComment.title, at: lastComment.at }
      : null,
    published: !!state.published,
  };

  if (status === "DRAFT") {
    present.headline = "Brouillon : l'offre n'est pas encore soumise à l'ARTCI.";
    present.pending.push("Soumission par l'auteur de l'offre");
  } else if (inProgress) {
    present.headline = `Décision attendue du ${levelLabel(level, finalLevel)}.`;
    // Début de l'attente : dernière étape qui a remis l'offre entre les mains
    // du niveau courant (soumission, transmission, réactivation).
    const handover = [...past].reverse().find((e) => ["SUBMIT", "VALIDATE_TRANSMIT", "REACTIVATE"].includes(e.action));
    const since = handover?.at || lastDecision?.createdAt || offer.submittedAt || lastEvent?.at;
    const d = daysSince(since);
    present.waiting = d === null ? null : d === 0 ? "En attente depuis aujourd'hui" : `En attente depuis ${d} jour(s)`;
    present.pending.push(
      canDecide ? "Votre décision est attendue : valider ou refuser" : `Décision du ${LEVEL_TITLES[level] || `niveau ${level}`} : valider ou refuser`,
    );
  } else if (status === "VALIDATED") {
    present.headline = state.published
      ? "Offre validée définitivement, affichée au comparateur public."
      : "Offre validée définitivement.";
  } else if (status === "REFUSED") {
    present.headline = "Offre refusée : le circuit de validation est clos.";
  } else if (status === "DEACTIVATED") {
    present.headline = `Offre désactivée${DEACTIVATION_REASON[offer.deactivationReason] ? ` (${DEACTIVATION_REASON[offer.deactivationReason]})` : ""}.`;
    if (state.published) present.headline += " Elle reste affichée au comparateur jusqu'à la validation de la nouvelle version.";
  }

  /* ----------------------------------------------------------- à venir */
  const future = [];
  const push = (title, text = null, extra = {}) => future.push({ key: `f-${future.length}`, title, text, ...extra });
  const launch = dated.desiredDate ? new Date(dated.desiredDate) : null;
  const launchText = launch ? launch.toLocaleDateString("fr-FR", { dateStyle: "long" }) : null;
  const promo = details.specialPromotion || null;

  if (status === "DRAFT" || inProgress) {
    if (status === "DRAFT") push("Soumission pour validation", "Par l'auteur de l'offre ; un point focal confirme par le code reçu par e-mail.", { icon: "bi-send" });
    const from = status === "DRAFT" ? 1 : level + 1;
    for (let n = from; n <= finalLevel; n += 1) {
      push(levelLabel(n, finalLevel), n === finalLevel ? "Sa validation clôt le circuit." : "Validation puis transmission au niveau suivant.", { icon: "bi-person-check", level: n });
    }
    if (state.offerType === "PROMOTION" && inProgress && level < finalLevel) {
      future[future.length - 1].note = "Offre promotionnelle : une validation définitive est possible dès le niveau en cours.";
    }
    push("Publication au comparateur", "Dès la validation définitive.", { icon: "bi-globe2" });
    if (launchText) {
      push(`Lancement souhaité le ${launchText}`, deadline.label, {
        icon: "bi-rocket-takeoff",
        deadline: true,
        tone: deadline.level === "LATE" ? "danger" : deadline.level === "URGENT" ? "warning" : "neutral",
      });
    }
  } else if (status === "VALIDATED") {
    if (launch && launch.getTime() > Date.now()) push(`Lancement prévu le ${launchText}`, deadline.label, { icon: "bi-rocket-takeoff", deadline: true });
    if (promo?.duration && launch) {
      const end = new Date(launch.getTime() + Number(promo.duration) * dayMs);
      if (end.getTime() > Date.now()) {
        push(`Fin de la promotion le ${end.toLocaleDateString("fr-FR", { dateStyle: "long" })}`, `Durée déclarée : ${promo.duration} jour(s).`, { icon: "bi-calendar-x", deadline: true });
      }
    }
    push("Évolution par monitoring", "Toute modification passe par une nouvelle version, soumise au circuit.", { icon: "bi-arrow-repeat", optional: true });
  } else if (status === "DEACTIVATED") {
    const next = versions.find((v) => v.sourceOfferId === offer.id);
    if (next) {
      const ns = workflowStatusOf(next.workflowStatus);
      push(`Version suivante : ${next.code}`, `Statut : ${ns.label}.`, { icon: "bi-layers", href: `/offer-workflow/${next.id}` });
    }
    if (actions.includes("REACTIVATE")) push("Réactivation possible", "L'administration peut rétablir l'offre dans son état précédent.", { icon: "bi-arrow-counterclockwise", optional: true });
  }

  return { past, present, future, closed: status === "REFUSED" };
};

export default buildOfferJourney;
