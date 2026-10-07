import { guardRoute } from "@/services/rbac/guardRoute";
import { PERMISSIONS } from "@/services/rbac/permissions";
// pages/api/users/index.js
import prisma from "@/services/config/auth/prisma";
import { FKTND_H } from "@/services/tools/constants";
import { serverError } from "@/services/config/apiError";

async function handler(req, res) {
  if (req.method === "POST") {
    const { verskth, operatorId } = req.body;
    if (verskth != FKTND_H) {
      return res.status(405).json({ message: "Requête non autorisée" });
    }
    try {
      const { order } = req.body;
      const orderBy = order === "asc" ? "asc" : "desc";

      const ofers = await prisma.offer.findMany({
        orderBy: { updatedAt: orderBy },
        where: {
          code: {
            not: "OF-000000000000000",
          },
          operator: {
            id: Number(operatorId),
          },
        },
        include: {
          // Necessaire a la pre-selection du champ « offre parente ».
          parent: { select: { id: true, code: true, title: true } },
          operator: {
            select: {
              id: true,
              code: true,
              name: true,
              color: true,
              imagePath: true,
            },
          },
          area: {
            select: {
              id: true,
              title: true,
              // Organisations et pays retenus pour cette offre : indispensables
              // pour recocher l'étape 3 lors d'une modification.
              areaOrganizations: {
                select: {
                  id: true,
                  organization: { select: { id: true, code: true, name: true } },
                  organisationCountries: {
                    select: {
                      id: true,
                      country: { select: { id: true, code: true, name: true } },
                    },
                  },
                },
              },
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
          // validation: {
          //   comments:true
          // },
          specialPromotion: true,
          monitorings: true,
          validation: {
            include: {
              comments: true,
            },
          },
        },
      });
      res.status(200).json(ofers);
    } catch (error) {
      serverError(res, error, "pages/api/operator/offer/getOperatorOffers.js");
    } finally {
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// Autorisation vérifiée côté serveur (session + permission, périmètre opérateur).
export default guardRoute(handler, { methods: { POST: PERMISSIONS.OFFER_READ }, focalPoint: "operator" });
