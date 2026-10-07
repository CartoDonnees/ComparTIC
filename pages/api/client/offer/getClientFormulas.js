// pages/api/users/index.js
import prisma from "@/services/config/auth/prisma";
import { FKTND_H } from "@/services/tools/constants";
import { publishedOfferWhere } from "@/services/workflow/publication";
import { serverError } from "@/services/config/apiError";

export default async function handler(req, res) {
  // Liste publique qui change à chaque validation : jamais servie depuis un cache.
  res.setHeader("Cache-Control", "no-store, max-age=0");
  if (req.method === "POST") {
    const { verskth } = req.body;
    if (verskth != FKTND_H) {
      return res.status(405).json({ message: "Requête non autorisée" });
    }
    try {
      const { order } = req.body;
      const orderBy = order === "asc" ? "asc" : "desc";

      const ofers = await prisma.offerFormula.findMany({
        orderBy: { updatedAt: orderBy },
        // Offres publiées : validées définitivement (règle unique, voir
        // services/workflow/publication.js). L'ancien filtre sur la
        // projection `validation.status = ALLOW` retirait du comparateur une
        // offre validée dès le lancement de son monitoring, avant même que la
        // nouvelle version ne soit validée.
        where: {
          offer: publishedOfferWhere(),
        },
        include: {
          offer: {
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
                  areaOrganizations: {
                    select: {
                      id: true,
                      organization: {
                        select: {
                          id: true,
                          name: true,
                          countries: true,
                        },
                      },
                      // Pays RETENUS pour cette offre et cette organisation.
                      // Sans eux, le filtre « Pays » du comparateur ne pouvait
                      // rien comparer : seule la liste complète des pays de
                      // l organisation était disponible.
                      organisationCountries: {
                        select: {
                          id: true,
                          country: { select: { id: true, name: true, code: true } },
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
              specialPromotion: true,
            },
          },
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
      });
      res.status(200).json(ofers);
    } catch (error) {
      serverError(res, error, "pages/api/client/offer/getClientFormulas.js");
    } finally {
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
