import { guardRoute } from "@/services/rbac/guardRoute";
import { PERMISSIONS } from "@/services/rbac/permissions";
import prisma from "@/services/config/auth/prisma";
import { aggregateOfferStats } from "@/services/tools/statistics";
import { serverError } from "@/services/config/apiError";

/** Offre repère « Offre Inconnu » : elle n'est pas une offre déclarée. */
const SENTINEL_CODE = "OF-000000000000000";

/**
 * Statistiques détaillées sur les offres   point d'API de la page
 * `/admin-statistics`.
 *
 * ROUTE DISTINCTE de `generalStatistics` : le tableau de bord conserve sans
 * changement son endpoint historique (soixante `count` et son tableau
 * positionnel). Ici, un seul parcours : les offres sont lues une fois, allégées
 * aux champs utiles, puis agrégées en mémoire avec la règle de statut commune
 * à l'application (la décision de l'ARTCI prime sur l'avancement du dossier).
 *
 * Corps accepté (tous facultatifs) :
 *   { operatorIds, from, to, category, billingType, months }
 */
async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { operatorIds, from, to, category, billingType, months, dateField: rawDateField } = req.body || {};
  // Date de référence : création (défaut, page /admin-statistics) ou date de
  // notification (tableau de bord, dont les autres compteurs l'utilisent).
  const dateField = rawDateField === "notifiDate" ? "notifiDate" : "createdAt";

  try {
    const where = { code: { not: SENTINEL_CODE } };

    if (Array.isArray(operatorIds) && operatorIds.length > 0) {
      where.operatorId = { in: operatorIds.map(Number).filter(Number.isFinite) };
    }

    if (category === "MOBILE" || Number(category) === 1) where.category = "MOBILE";
    else if (category === "FIXE" || Number(category) === 2) where.category = "FIXE";

    if (billingType === "PREPAID" || Number(billingType) === 1) {
      where.billingType = "PREPAID";
    } else if (billingType === "POSTPAID" || Number(billingType) === 2) {
      where.billingType = "POSTPAID";
    } else if (billingType === "HYBRID" || Number(billingType) === 3) {
      where.billingType = "HYBRID";
    }

    const range = {};
    if (from) {
      const d = new Date(from);
      if (!Number.isNaN(d.getTime())) range.gte = d;
    }
    if (to) {
      const d = new Date(to);
      // Borne haute inclusive : sans cela, les offres du jour choisi seraient
      // exclues (comparaison à minuit).
      if (!Number.isNaN(d.getTime())) {
        d.setHours(23, 59, 59, 999);
        range.lte = d;
      }
    }
    if (Object.keys(range).length > 0) where[dateField] = range;

    const offers = await prisma.offer.findMany({
      where,
      select: {
        id: true,
        status: true,
        category: true,
        billingType: true,
        createdAt: true,
        notifiDate: true,
        area: { select: { title: true } },
        specialPromotion: { select: { id: true } },
        validation: { select: { status: true, updatedAt: true } },
        operator: {
          select: { id: true, code: true, name: true, color: true, imagePath: true },
        },
        _count: { select: { monitorings: true } },
      },
    });

    return res.status(200).json(
      aggregateOfferStats(offers, {
        months: Number.isFinite(Number(months)) ? Math.min(Math.max(Number(months), 1), 120) : 12,
        // La courbe se termine au mois de la borne haute de la période.
        reference: range.lte || new Date(),
        dateField,
        from: range.gte || null,
        to: range.lte || null,
      }),
    );
  } catch (error) {
    return serverError(res, error, "pages/api/admin/statistics/generalStatisticsDetailed.js");
  }
}

// Autorisation vérifiée côté serveur (session + permission, périmètre opérateur).
export default guardRoute(handler, { methods: { POST: PERMISSIONS.STATISTICS_READ, GET: PERMISSIONS.STATISTICS_READ }, focalPoint: "deny" });
