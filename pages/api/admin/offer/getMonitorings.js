import { guardRoute } from "@/services/rbac/guardRoute";
import { PERMISSIONS } from "@/services/rbac/permissions";
// pages/api/users/index.js
import prisma from "@/services/config/auth/prisma";
import { FKTND_H } from "@/services/tools/constants";
import { serverError } from "@/services/config/apiError";
import { OFFER_LIST_INCLUDE } from "@/services/offers/offerListInclude";
import { SENTINEL_OFFER_CODE } from "@/services/workflow/offerWorkflow";

/**
 * Offres concernées par un monitoring.
 *
 * Depuis le workflow de validation, un monitoring ne crée plus de ligne
 * `Monitoring` : il crée une NOUVELLE VERSION de l'offre (`sourceOfferId`,
 * `version`), soumise au circuit, pendant que la version validée est
 * conservée. L'onglet ne lisait que l'ancienne table : aucune version issue
 * d'un monitoring n'y apparaissait.
 *
 * La route renvoie donc :
 *  - les versions issues d'un monitoring (`monitoringKind: "VERSION"`), avec la
 *    même forme que la liste des offres et leur version d'origine ;
 *  - les monitorings antérieurs au workflow (`monitoringKind: "LEGACY"`),
 *    conservés en consultation seule.
 */

async function handler(req, res) {
  if (req.method === "POST") {
    const { verskth } = req.body;
    if (verskth != FKTND_H) {
      return res.status(405).json({ message: "Requête non autorisée" });
    }
    try {
      const { order, operatorId } = req.body;
      const orderBy = order === "asc" ? "asc" : "desc";

      // SÉCURITÉ : un opérateur ne doit recevoir que les monitorings de ses
      // propres offres. Sans ce filtre, la route renvoyait TOUS les
      // monitorings de TOUS les opérateurs (le tri n'était fait que côté
      // navigateur). Sans operatorId (= admin/superviseur), on renvoie tout.
      const where = operatorId ? { offer: { operatorId: Number(operatorId) } } : {};

      const versions = await prisma.offer.findMany({
        where: {
          sourceOfferId: { not: null },
          code: { not: SENTINEL_OFFER_CODE },
          ...(operatorId ? { operatorId: Number(operatorId) } : {}),
        },
        orderBy: { updatedAt: orderBy },
        take: 2000,
        include: {
          ...OFFER_LIST_INCLUDE,
          sourceOffer: { select: { id: true, code: true, title: true, version: true, workflowStatus: true } },
        },
      });

      const monitorings = await prisma.monitoring.findMany({
        where,
        orderBy: { updatedAt: orderBy },
        include: {
          owner: {
            include: {
              focalPoint: {
                include: {
                    operator:true
                },
              },
            },
          },
          area: {
            select: {
              id: true,
              title: true,
            },
          },
          document: {
            select: {
              id: true,
              path: true,
            },
          },
          profiles: true,
          accessModes: {
            select: {
              id: true,
              content: true,
            },
          },
          monitoringFormula: {
            include: {
              price: {
                select: {
                  id: true,
                  value: true,
                },
              },
              serviceDetail: {
                select: {
                  id: true,
                  quantity: true,
                  billingSteps: true,
                  comtype: true,
                  service: {
                    select: {
                      id: true,
                      code: true,
                      title: true,
                    },
                  }
                },
              },
              advantages: true,
            },
          },
          validation: true,
          specialPromotion: true,
        },
      });
      res.setHeader("Cache-Control", "no-store");
      res.status(200).json([
        ...versions.map((o) => ({ ...o, monitoringKind: "VERSION" })),
        ...monitorings.map((m) => ({ ...m, monitoringKind: "LEGACY" })),
      ]);
    } catch (error) {
      serverError(res, error, "pages/api/admin/offer/getMonitorings.js");
    } finally {
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// Autorisation vérifiée côté serveur (session + permission, périmètre opérateur).
export default guardRoute(handler, { methods: { POST: PERMISSIONS.OFFER_READ }, focalPoint: "operator" });
