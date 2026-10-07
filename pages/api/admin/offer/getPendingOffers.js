import { guardRoute } from "@/services/rbac/guardRoute";
import { PERMISSIONS } from "@/services/rbac/permissions";
// pages/api/users/index.js
import prisma from "@/services/config/auth/prisma";
import { FKTND_H } from "@/services/tools/constants";
import { validatorLevelOf } from "@/services/rbac/roles";
import { serverError } from "@/services/config/apiError";

async function handler(req, res) {
  if (req.method === "POST") {
    const { verskth } = req.body;
    if (verskth != FKTND_H) {
      return res.status(405).json({ message: "Requête non autorisée" });
    }
    try {
      const { order } = req.body;
      const orderBy = order === "asc" ? "asc" : "desc";

      const ofers = await prisma.offer.findMany({
        orderBy: { updatedAt: orderBy },
        // File de validation : offres SOUMISES ou EN COURS de validation (les
        // brouillons n'y figurent pas). Un validateur ne voit que les offres
        // qui attendent SON niveau ; l'administration et le superviseur voient
        // tout le circuit.
        where: {
          workflowStatus: { in: ["SUBMITTED", "IN_VALIDATION"] },
          ...(validatorLevelOf(req.actor?.role)
            ? { currentValidationLevel: validatorLevelOf(req.actor.role) }
            : {}),
        },
        include: {
          operator: {
            select: {
              id: true,
              name: true,
              color: true,
              imagePath: true,
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
          formulas: {
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
                  },
                  offerRate: {
                    select: {
                      id: true,
                      value: true,
                    },
                  },
                },
              },
              advantages: true,
            },
          },
          specialPromotion: true,
          // Offre de base d'une promotion, auteur de la saisie (écran d'examen).
          parent: { select: { id: true, code: true, title: true } },
          user: { select: { id: true, firstName: true, lastName: true } },
          monitorings: true,
          validation:{
            include:{
              comments:true,
            }
          }
        },
      });
      res.setHeader("Cache-Control", "no-store");
      res.status(200).json(ofers);
    } catch (error) {
      serverError(res, error, "pages/api/admin/offer/getPendingOffers.js");
    } finally {
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// Autorisation vérifiée côté serveur (session + permission, périmètre opérateur).
export default guardRoute(handler, { methods: { POST: PERMISSIONS.OFFER_READ }, focalPoint: "deny" });
