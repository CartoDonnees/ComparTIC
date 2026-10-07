import { guardRoute } from "@/services/rbac/guardRoute";
import { PERMISSIONS } from "@/services/rbac/permissions";
// pages/api/users/index.js
import prisma from "@/services/config/auth/prisma";
import { FKTND_H } from "@/services/tools/constants";
import { serverError } from "@/services/config/apiError";

async function handler(req, res) {
  if (req.method === "POST") {
    const { verskth } = req.body;
    if (verskth != FKTND_H) {
      return res.status(405).json({ message: "Requête non autorisée" });
    }
    try {
      const { order, operatorId } = req.body;
      const orderBy = order === "asc" ? "asc" : "desc";

      // SECURITE: sans operatorId la route renvoyait toutes les offres de tous
      // les operateurs, y compris a un compte operateur. On restreint a son
      // perimetre, en conservant l offre repere « Offre Inconnu » qui sert
      // d option « aucune offre parente ».
      const where = operatorId
        ? {
            OR: [
              { operatorId: Number(operatorId) },
              { code: "OF-000000000000000" },
            ],
          }
        : {};

      const ofers = await prisma.offer.findMany({
        where,
        orderBy: { updatedAt: orderBy },
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
          validation:{
            include:{
              comments:true,
            }
          }
        },
      });
      res.status(200).json(ofers);
    } catch (error) {
      serverError(res, error, "pages/api/admin/offer/getOffersWu.js");
    } finally {
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// Autorisation vérifiée côté serveur (session + permission, périmètre opérateur).
export default guardRoute(handler, { methods: { POST: PERMISSIONS.OFFER_READ }, focalPoint: "operator" });
