import prisma from "@/services/config/auth/prisma";
import { readSession } from "@/services/config/auth/session";
import { serverError } from "@/services/config/apiError";
import { notify, NOTIFICATION_TYPES, getSupervisionUserIds } from "@/services/config/notifications";
import { sendMail } from "@/services/config/mailer";
import { AUDIT_ACTIONS } from "@/services/workflow/audit";
import { deadlineStatusOf, ALERT_THRESHOLD_DAYS } from "@/services/workflow/deadlines";
import { ROLE_TO_PROFILE_CODE, isAdministration } from "@/services/rbac/roles";

/**
 * Alertes de délai réglementaire  - tâche quotidienne.
 *
 *   POST /api/cron/deadline-alerts
 *   en-tête : x-cron-secret: <CRON_SECRET>      (ou session administrateur)
 *   corps facultatif : { thresholdDays, dryRun }
 *
 * Signale les offres encore dans le circuit dont le lancement souhaité
 * survient dans moins de 48 h (ou est déjà dépassé) : le validateur du niveau
 * attendu et l'administration reçoivent une notification et un e-mail.
 *
 * Idempotente : une offre ne déclenche qu'une alerte par 24 h (trace
 * `DEADLINE_ALERT` au journal d'audit). La tâche peut donc être planifiée
 * plusieurs fois par jour sans inonder les boîtes.
 *
 * Exemple de planification (cron système) :
 *   0 7 * * *  curl -s -X POST https://<hôte>/api/cron/deadline-alerts \
 *                -H "x-cron-secret: $CRON_SECRET"
 */

const DAY_MS = 86400000;

const authorize = async (req, res) => {
  const secret = process.env.CRON_SECRET;
  const provided = req.headers["x-cron-secret"];
  if (secret && provided && String(provided) === String(secret)) return { kind: "cron" };

  // À défaut de jeton, un administrateur peut la déclencher à la main.
  const { user: actor, unavailable } = await readSession(req);
  if (unavailable) {
    // Réponse envoyée ici ; `null` indique à l'appelant de s'arrêter.
    res.status(503).json({ error: "Service momentanément indisponible. Réessayez dans quelques instants.", code: "SERVICE_UNAVAILABLE" });
    return null;
  }
  if (actor && isAdministration(actor.role)) return { kind: "admin", actor };

  res.status(401).json({ error: "Tâche réservée à l'ordonnanceur ou à l'administration.", code: "UNAUTHENTICATED" });
  return null;
};

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  const caller = await authorize(req, res);
  if (!caller) return undefined;

  const thresholdDays = Number.isFinite(Number(req.body?.thresholdDays))
    ? Math.max(0, Math.min(30, Number(req.body.thresholdDays)))
    : ALERT_THRESHOLD_DAYS;
  const dryRun = req.body?.dryRun === true;

  try {
    const now = new Date();
    const horizon = new Date(now.getTime() + (thresholdDays + 1) * DAY_MS);

    // Offres encore en circuit dont le lancement approche ou est dépassé.
    const offers = await prisma.offer.findMany({
      where: {
        workflowStatus: { in: ["SUBMITTED", "IN_VALIDATION"] },
        desiredDate: { lte: horizon },
      },
      select: {
        id: true,
        code: true,
        title: true,
        desiredDate: true,
        notifiDate: true,
        workflowStatus: true,
        currentValidationLevel: true,
        operator: { select: { id: true, name: true } },
        specialPromotion: { select: { type: true, duration: true } },
      },
      orderBy: { desiredDate: "asc" },
      take: 500,
    });

    if (!offers.length) {
      return res.status(200).json({ checked: 0, alerted: 0, skipped: 0, details: [] });
    }

    // Alertes déjà émises dans les 24 h : évite les doublons.
    const since = new Date(now.getTime() - DAY_MS);
    const already = await prisma.auditLog.findMany({
      where: {
        action: AUDIT_ACTIONS.DEADLINE_ALERT,
        createdAt: { gte: since },
        offerId: { in: offers.map((o) => o.id) },
      },
      select: { offerId: true },
    });
    const alreadySent = new Set(already.map((a) => a.offerId));

    const supervision = await getSupervisionUserIds();
    const details = [];
    let alerted = 0;
    let skipped = 0;

    for (const offer of offers) {
      const status = deadlineStatusOf(offer, now);
      if (status.daysToLaunch === null || status.daysToLaunch > thresholdDays) {
        skipped += 1;
        continue;
      }
      if (alreadySent.has(offer.id)) {
        skipped += 1;
        details.push({ offer: offer.code, level: status.level, sent: false, reason: "déjà alerté (24 h)" });
        continue;
      }

      // Destinataires : validateurs du niveau attendu + administration.
      const profileCode = ROLE_TO_PROFILE_CODE[`VALIDATOR_${offer.currentValidationLevel}`];
      const validators = profileCode
        ? await prisma.user.findMany({
            where: { status: "ENABLE", profile: { code: profileCode } },
            select: { id: true, email: true, firstName: true },
          })
        : [];
      const recipients = [...new Set([...validators.map((v) => v.id), ...supervision])];

      const title = status.launchPassed
        ? `Délai dépassé : ${offer.title}`
        : `Décision attendue sous ${Math.max(status.daysToLaunch, 0)} jour(s) : ${offer.title}`;
      const content =
        `L'offre ${offer.code} (${offer.operator?.name || "opérateur inconnu"}), ${status.kindLabel}, ` +
        `doit être lancée le ${new Date(offer.desiredDate).toLocaleDateString("fr-FR")}. ` +
        `${status.label}. Elle attend encore la décision du validateur de niveau ${offer.currentValidationLevel ?? "?"}. ` +
        `Préavis déposé par l'opérateur : ${status.noticeGivenDays ?? "?"} jour(s) pour ${status.requiredNoticeDays} exigé(s)` +
        `${status.noticeCompliant === false ? " (préavis insuffisant)" : ""}.`;

      if (dryRun) {
        details.push({ offer: offer.code, level: status.level, recipients: recipients.length, sent: false, reason: "simulation" });
        continue;
      }

      await notify({
        userIds: recipients,
        type: NOTIFICATION_TYPES.OFFER_DEADLINE,
        title,
        content,
        link: `/admin-validation?examiner=${offer.id}`,
        offerId: offer.id,
      });

      // E-mail aux validateurs concernés (l'échec n'interrompt pas la tâche).
      for (const v of validators) {
        if (!v.email) continue;
        await sendMail({
          to: v.email,
          subject: title,
          text: content,
          html: `<p>Bonjour ${v.firstName || ""},</p><p>${content}</p>`,
        }).catch(() => null);
      }

      await prisma.auditLog.create({
        data: {
          action: AUDIT_ACTIONS.DEADLINE_ALERT,
          entityType: "OFFER",
          entityId: offer.id,
          offerId: offer.id,
          actorId: caller.actor?.id ?? null,
          actorRole: caller.actor?.role ?? "SYSTEM",
          level: offer.currentValidationLevel ?? null,
          comment: title,
          metadata: {
            daysToLaunch: status.daysToLaunch,
            requiredNoticeDays: status.requiredNoticeDays,
            noticeGivenDays: status.noticeGivenDays,
            recipients: recipients.length,
          },
        },
      });

      alerted += 1;
      details.push({ offer: offer.code, level: status.level, recipients: recipients.length, sent: true });
    }

    return res.status(200).json({ checked: offers.length, alerted, skipped, thresholdDays, dryRun, details });
  } catch (error) {
    return serverError(res, error, "Alertes de délai");
  }
}
