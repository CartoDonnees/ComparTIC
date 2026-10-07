import prisma from "@/services/config/auth/prisma";
import { notify, NOTIFICATION_TYPES } from "@/services/config/notifications";
import { sendMail } from "@/services/config/mailer";
import { ROLE_TO_PROFILE_CODE, ROLES, validatorRoleOfLevel } from "@/services/rbac/roles";
import { WORKFLOW_EVENTS } from "@/services/workflow/offerWorkflow";
import { writeAudit, AUDIT_ACTIONS } from "@/services/workflow/audit";

/**
 * Notifications du workflow   module UNIQUE.
 *
 * Les routes d'API ne composent aucune notification : elles transmettent les
 * événements renvoyés par le moteur, APRÈS la réussite de la transaction. Une
 * décision annulée ne peut donc jamais être notifiée.
 *
 * | Événement             | Destinataires                                              | E-mail          |
 * |-----------------------|------------------------------------------------------------|-----------------|
 * | SUBMITTED             | validateurs du niveau 1, administration, autres PF         | –               |
 * | TRANSMITTED (n→n+1)   | validateurs du niveau n+1                                  | –               |
 * | VALIDATED_FINAL       | PF de l'opérateur, validateurs ayant statué, administration| points focaux   |
 * | REFUSED               | PF de l'opérateur, validateurs ayant statué, administration| points focaux   |
 * | MONITORING            | validateurs du niveau 1, administration, PF de l'opérateur | –               |
 * | DEACTIVATED           | PF de l'opérateur, administration                          | –               |
 * | REACTIVATED           | PF de l'opérateur, administration (+ validateurs du niveau) | –               |
 *
 * L'auteur de l'action n'est jamais notifié de sa propre action.
 */

const activeIdsByRoles = async (roles) => {
  const codes = roles.map((r) => ROLE_TO_PROFILE_CODE[r]).filter(Boolean);
  if (!codes.length) return [];
  const users = await prisma.user.findMany({
    where: { status: "ENABLE", profile: { code: { in: codes } } },
    select: { id: true },
  });
  return users.map((u) => u.id);
};

const administrationIds = () => activeIdsByRoles([ROLES.SUPER_ADMIN, ROLES.ADMIN]);

const validatorIdsOfLevel = (level) => {
  const role = validatorRoleOfLevel(level);
  return role ? activeIdsByRoles([role]) : Promise.resolve([]);
};

const focalPoints = (operatorId) =>
  prisma.user.findMany({
    where: { status: "ENABLE", focalPoint: { operatorId: Number(operatorId) } },
    select: { id: true, email: true, firstName: true },
  });

const deciderIds = async (offerId) => {
  const rows = await prisma.validationDecision.findMany({
    where: { offerId: Number(offerId) },
    select: { userId: true },
  });
  return [...new Set(rows.map((r) => r.userId))];
};

const without = (ids, excludedId) =>
  [...new Set(ids)].filter((id) => Number(id) !== Number(excludedId));

const authorName = (actor) =>
  [actor?.firstName, actor?.lastName].filter(Boolean).join(" ") || "un utilisateur";

const LEVEL_LABEL = {
  1: "Validateur 1 (responsable / agent)",
  2: "Validateur 2 (chef de service)",
  3: "Validateur 3 (chef de département)",
  4: "Validateur 4 (directeur)",
};

const decisionEmail = ({ firstName, offer, validated, comment }) => ({
  subject: validated
    ? `Offre validée : ${offer.title} (${offer.code})`
    : `Offre refusée : ${offer.title} (${offer.code})`,
  text:
    `Bonjour ${firstName || ""},\n\n` +
    `L'offre « ${offer.title} » (${offer.code}) de ${offer.operator?.name || "votre opérateur"} ` +
    `${validated ? "a été validée définitivement" : "a été refusée"} par l'ARTCI.\n\n` +
    `Commentaire : ${comment}\n\n` +
    `Consultez le détail sur la plateforme ComparTIC.`,
  html: `
    <div style="font-family:Segoe UI,Arial,sans-serif;color:#1c2430;max-width:560px">
      <p>Bonjour ${firstName || ""},</p>
      <p>L'offre <b>« ${offer.title} »</b> (${offer.code}) de ${offer.operator?.name || "votre opérateur"}
         <b>${validated ? "a été validée définitivement" : "a été refusée"}</b> par l'ARTCI.</p>
      <p style="background:#f6f8fa;border:1px solid #e5eaef;border-radius:8px;padding:10px 12px">
        <b>Commentaire :</b> ${String(comment).replace(/</g, "&lt;")}
      </p>
      <p>Consultez le détail de la décision sur la plateforme ComparTIC.</p>
    </div>`,
});

/**
 * Diffuse les événements d'une transition réussie.
 * Ne lève jamais : une notification perdue ne doit pas annuler une décision.
 *
 * @returns {Promise<Array<{type:string, notified:number, emails:number}>>}
 */
export const dispatchWorkflowEvents = async (events = []) => {
  const report = [];
  for (const event of events) {
    try {
      report.push(await dispatchOne(event));
    } catch (error) {
      console.error("Notification de workflow non diffusée :", error?.message);
      report.push({ type: event?.type, notified: 0, emails: 0, error: error?.message });
    }
  }
  return report;
};

/** Titre d'une notification pour l'opérateur : sans vocabulaire du circuit. */
const operatorTitle = (title) =>
  ({ "Offre validée définitivement": "Offre validée", "Monitoring : nouvelle version soumise": "Nouvelle version déclarée" })[title] || title;

const dispatchOne = async (event) => {
  const offer = await prisma.offer.findUnique({
    where: { id: Number(event.offerId) },
    select: { id: true, code: true, title: true, operatorId: true, operator: { select: { name: true } } },
  });
  if (!offer) return { type: event.type, notified: 0, emails: 0 };

  const actorId = event.actor?.id;
  const link = `/offer-workflow/${offer.id}`;
  const label = `« ${offer.title} » (${offer.code})   ${offer.operator?.name || "opérateur"}`;
  let recipients = [];
  // Points focaux destinataires et texte qui leur est réservé : le circuit de
  // validation est interne à l'ARTCI, l'opérateur ne reçoit donc ni niveau, ni
  // nom de validateur (cf. `services/workflow/operatorView.js`).
  let operatorIds = [];
  let operatorContent = null;
  const actorIsOperator = event.actor?.role === "FOCAL_POINT";
  const byWhom = actorIsOperator ? ` par ${authorName(event.actor)}` : "";
  const UNDER_REVIEW = "Elle est en cours d'examen par l'ARTCI.";
  let type;
  let title;
  let content;
  let emails = 0;

  switch (event.type) {
    case WORKFLOW_EVENTS.SUBMITTED: {
      const [v1, admins, fps] = await Promise.all([
        validatorIdsOfLevel(1),
        administrationIds(),
        focalPoints(offer.operatorId),
      ]);
      recipients = without([...v1, ...admins, ...fps.map((u) => u.id)], actorId);
      type = NOTIFICATION_TYPES.OFFER_SUBMITTED;
      title = "Nouvelle offre soumise";
      content = `L'offre ${label} a été soumise par ${authorName(event.actor)}. Elle attend la décision du ${LEVEL_LABEL[1]}.`;
      operatorIds = fps.map((u) => u.id);
      operatorContent = `L'offre ${label} a été soumise${byWhom}. ${UNDER_REVIEW}`;
      break;
    }
    case WORKFLOW_EVENTS.TRANSMITTED: {
      recipients = without(await validatorIdsOfLevel(event.toLevel), actorId);
      type = NOTIFICATION_TYPES.OFFER_TRANSMITTED;
      title = `Offre à valider   niveau ${event.toLevel}`;
      content = `Le niveau ${event.level} a validé l'offre ${label} et l'a transmise au ${LEVEL_LABEL[event.toLevel]}. Votre décision est attendue.`;
      break;
    }
    case WORKFLOW_EVENTS.VALIDATED_FINAL:
    case WORKFLOW_EVENTS.REFUSED: {
      const validated = event.type === WORKFLOW_EVENTS.VALIDATED_FINAL;
      const [fps, deciders, admins] = await Promise.all([
        focalPoints(offer.operatorId),
        deciderIds(offer.id),
        administrationIds(),
      ]);
      recipients = without([...fps.map((u) => u.id), ...deciders, ...admins], actorId);
      type = validated ? NOTIFICATION_TYPES.OFFER_VALIDATED : NOTIFICATION_TYPES.OFFER_REFUSED;
      title = validated ? "Offre validée définitivement" : "Offre refusée";
      content = `L'offre ${label} ${validated ? "a été validée définitivement" : "a été refusée"} au niveau ${event.level} par ${authorName(event.actor)}. Commentaire : ${event.comment}`;
      operatorIds = fps.map((u) => u.id);
      operatorContent = `L'offre ${label} ${validated ? "a été validée" : "a été refusée"} par l'ARTCI.${event.comment ? ` ${validated ? "Commentaire" : "Motif"} : ${event.comment}` : ""}`;

      // E-mail au(x) point(s) focal(aux) : la décision les concerne directement.
      for (const fp of fps) {
        if (!fp.email || Number(fp.id) === Number(actorId)) continue;
        const mail = decisionEmail({ firstName: fp.firstName, offer, validated, comment: event.comment });
        const res = await sendMail({ to: fp.email, subject: mail.subject, html: mail.html, text: mail.text });
        if (res.sent || res.dryRun) emails += 1;
      }
      break;
    }
    case WORKFLOW_EVENTS.MONITORING: {
      const [v1, admins, fps] = await Promise.all([
        validatorIdsOfLevel(1),
        administrationIds(),
        focalPoints(offer.operatorId),
      ]);
      recipients = without([...v1, ...admins, ...fps.map((u) => u.id)], actorId);
      type = NOTIFICATION_TYPES.OFFER_MONITORING;
      title = "Monitoring : nouvelle version soumise";
      content = `Un monitoring a été effectué par ${authorName(event.actor)} : la nouvelle version ${label} attend la décision du ${LEVEL_LABEL[1]}. La version validée précédente reste affichée sur le comparateur jusqu'à la validation définitive de la nouvelle.`;
      operatorIds = fps.map((u) => u.id);
      operatorContent = `Une nouvelle version de l'offre a été déclarée${byWhom} : ${label}. ${UNDER_REVIEW} La version validée précédente reste affichée sur le comparateur jusqu'à la décision.`;
      break;
    }
    case WORKFLOW_EVENTS.DEACTIVATED: {
      const [fps, admins] = await Promise.all([focalPoints(offer.operatorId), administrationIds()]);
      recipients = without([...fps.map((u) => u.id), ...admins], actorId);
      type = NOTIFICATION_TYPES.OFFER_DEACTIVATED;
      title = "Offre désactivée";
      content = `L'offre ${label} a été désactivée par ${authorName(event.actor)}.${event.comment ? ` Motif : ${event.comment}` : ""}`;
      operatorIds = fps.map((u) => u.id);
      operatorContent = `L'offre ${label} a été désactivée${byWhom || " par l'ARTCI"}.${event.comment ? ` Motif : ${event.comment}` : ""}`;
      break;
    }
    case WORKFLOW_EVENTS.REACTIVATED: {
      const [fps, admins, validators] = await Promise.all([
        focalPoints(offer.operatorId),
        administrationIds(),
        // Circuit repris : le niveau attendu est prévenu.
        event.toLevel ? validatorIdsOfLevel(event.toLevel) : Promise.resolve([]),
      ]);
      recipients = without([...fps.map((u) => u.id), ...admins, ...validators], actorId);
      type = NOTIFICATION_TYPES.OFFER_REACTIVATED;
      title = "Offre réactivée";
      content = `L'offre ${label} a été réactivée par ${authorName(event.actor)}.${event.toLevel ? ` Elle attend la décision du ${LEVEL_LABEL[event.toLevel]}.` : ""}${event.comment ? ` Motif : ${event.comment}` : ""}`;
      operatorIds = fps.map((u) => u.id);
      operatorContent = `L'offre ${label} a été réactivée${byWhom || " par l'ARTCI"}.${event.toLevel ? ` ${UNDER_REVIEW}` : ""}${event.comment ? ` Motif : ${event.comment}` : ""}`;
      break;
    }
    default:
      return { type: event.type, notified: 0, emails: 0 };
  }

  // Deux envois : le texte complet pour l'ARTCI, le texte sans circuit pour l'opérateur.
  const toOperator = operatorContent ? recipients.filter((id) => operatorIds.map(Number).includes(Number(id))) : [];
  const toStaff = recipients.filter((id) => !toOperator.includes(id));
  const common = { type, title: operatorTitle(title), link, offerId: offer.id, from: "ARTCI   ComparTIC" };
  const [staff, operator] = await Promise.all([
    notify({ ...common, title, userIds: toStaff, content }),
    notify({ ...common, userIds: toOperator, content: operatorContent }),
  ]);
  const result = { created: (staff?.created || 0) + (operator?.created || 0) };

  // Traçabilité : la notification fait partie de l'historique de l'offre.
  await writeAudit(prisma, {
    action: AUDIT_ACTIONS.NOTIFY,
    actor: event.actor,
    offerId: offer.id,
    metadata: { event: event.type, notified: result.created, emails },
  });

  return { type: event.type, notified: result.created, emails };
};

export default dispatchWorkflowEvents;
