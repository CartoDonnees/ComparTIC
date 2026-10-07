import { guardRoute } from "@/services/rbac/guardRoute";
import { PERMISSIONS } from "@/services/rbac/permissions";
// pages/api/users/index.js
import prisma from "@/services/config/auth/prisma";
import { FKTND_H } from "@/services/tools/constants";
import { serverError } from "@/services/config/apiError";

async function handler(req, res) {
  if (req.method === "POST") {
    // const { verskth } = req.body;
    // if (verskth != FKTND_H) {
    //   return res.status(405).json({ message: "Requête non autorisée" });
    // }
    try {
      const stats = await Promise.all([
        prisma.offer.count({
          where: {
            code: {
              not: "OF-000000000000000",
            },
          },

        }), //0LL OFFERS

        prisma.offer.count({
          //1 ALL VALIDATE
          where: {
            code: {
              not: "OF-000000000000000",
            },
            validation: {
              status: "ALLOW",
            },
          },
        }),

        prisma.offer.count({
          //2 ALL DINIED
          where: {
            code: {
              not: "OF-000000000000000",
            },
            validation: {
              status: "DINIED",
            },
          },
        }),

        prisma.offer.count({
          //3 ALL PENDING
          where: {
            code: {
              not: "OF-000000000000000",
            },
            status: "PENDING",
          },
        }),

        prisma.offer.count({
          //4 ALL SUSPENDED
          where: {
            code: {
              not: "OF-000000000000000",
            },
            validation: {
              status: "SUSPENDED",
            },
          },
        }),

        ////////////
        ////////////
        ////////////
        ////////////
        ////////////
        ////////////

        prisma.offer.count({
          //5 ALL BASE OFFERS
          where: {
            code: {
              not: "OF-000000000000000",
            },
            specialPromotion: {
              is: null,
            },
          },
        }),
        prisma.offer.count({
          //6 ALL BASE OFFERS
          where: {
            code: {
              not: "OF-000000000000000",
            },
            specialPromotion: {
              is: null,
            },
            validation: {
              status: "ALLOW",
            },
          },
        }),
        prisma.offer.count({
          //7 ALL BASE DINIED
          where: {
            code: {
              not: "OF-000000000000000",
            },
            specialPromotion: {
              is: null,
            },
            validation: {
              status: "DINIED",
            },
          },
        }),
        prisma.offer.count({
          //8 ALL BASE PENDING
          where: {
            code: {
              not: "OF-000000000000000",
            },
            specialPromotion: {
              is: null,
            },
            status: "PENDING",
          },
        }),
        prisma.offer.count({
          //9 ALL BASE SUSPENDED
          where: {
            code: {
              not: "OF-000000000000000",
            },
            specialPromotion: {
              is: null,
            },
            validation: {
              status: "SUSPENDED",
            },
          },
        }),

        ////////////
        ////////////
        ////////////
        ////////////
        ////////////
        ////////////

        prisma.offer.count({
          //10 ALL PROMO SUSPENDED
          where: {
            code: {
              not: "OF-000000000000000",
            },
            specialPromotion: {
              isNot: null,
            },
          },
        }),
        prisma.offer.count({
          //11 ALL PROMO SUSPENDED
          where: {
            code: {
              not: "OF-000000000000000",
            },
            specialPromotion: {
              isNot: null,
            },
            validation: {
              status: "ALLOW",
            },
          },
        }),
        prisma.offer.count({
          //12 ALL BASE DINIED
          where: {
            code: {
              not: "OF-000000000000000",
            },
            specialPromotion: {
              isNot: null,
            },
            validation: {
              status: "DINIED",
            },
          },
        }),
        prisma.offer.count({
          //13 ALL BASE PENDING
          where: {
            code: {
              not: "OF-000000000000000",
            },
            specialPromotion: {
              isNot: null,
            },
            status: "PENDING",
          },
        }),
        prisma.offer.count({
          //14 ALL BASE SUSPENDED
          where: {
            code: {
              not: "OF-000000000000000",
            },
            specialPromotion: {
              isNot: null,
            },
            validation: {
              status: "SUSPENDED",
            },
          },
        }),

        ////////////
        ////////////
        ////////////NATIONAL
        ////////////
        ////////////
        ////////////

        prisma.offer.count({
          //15 ALL NATIONAL
          where: {
            code: {
              not: "OF-000000000000000",
            },
            area: {
              title: "NATIONAL",
            },
          },
        }),
        prisma.offer.count({
          //16 ALL NATIONAL ALLOW
          where: {
            code: {
              not: "OF-000000000000000",
            },
            area: {
              title: "NATIONAL",
            },
            validation: {
              status: "ALLOW",
            },
          },
        }),
        prisma.offer.count({
          //17 ALL NATIONAL DINIED
          where: {
            code: {
              not: "OF-000000000000000",
            },
            area: {
              title: "NATIONAL",
            },
            specialPromotion: {
              isNot: null,
            },
            validation: {
              status: "DINIED",
            },
          },
        }),
        prisma.offer.count({
          //18 ALL NATIONAL PENDING
          where: {
            code: {
              not: "OF-000000000000000",
            },
            area: {
              title: "NATIONAL",
            },
            status: "PENDING",
          },
        }),
        prisma.offer.count({
          //19 ALL NATIONAL SUSPENDED
          where: {
            code: {
              not: "OF-000000000000000",
            },
            area: {
              title: "NATIONAL",
            },
            validation: {
              status: "SUSPENDED",
            },
          },
        }),

        ////////////
        ////////////
        ////////////////
        ////////////
        ////////////
        ////////////

        prisma.offer.count({
          //20 ALL NATIONAL BASE
          where: {
            code: {
              not: "OF-000000000000000",
            },
            area: {
              title: "NATIONAL",
            },
            specialPromotion: {
              is: null,
            },
          },
        }),
        prisma.offer.count({
          //21 ALL NATIONAL BASE ALLOW
          where: {
            code: {
              not: "OF-000000000000000",
            },
            area: {
              title: "NATIONAL",
            },
            specialPromotion: {
              is: null,
            },
            validation: {
              status: "ALLOW",
            },
          },
        }),
        prisma.offer.count({
          //22 ALL NATIONAL BASE DINIED
          where: {
            code: {
              not: "OF-000000000000000",
            },
            area: {
              title: "NATIONAL",
            },
            specialPromotion: {
              is: null,
            },
            validation: {
              status: "DINIED",
            },
          },
        }),
        prisma.offer.count({
          //23 ALL NATIONAL BASE PENDING
          where: {
            code: {
              not: "OF-000000000000000",
            },
            area: {
              title: "NATIONAL",
            },
            specialPromotion: {
              is: null,
            },
            status: "PENDING",
          },
        }),
        prisma.offer.count({
          //24 ALL NATIONAL BASE SUSPENDED
          where: {
            code: {
              not: "OF-000000000000000",
            },
            area: {
              title: "NATIONAL",
            },
            specialPromotion: {
              is: null,
            },
            validation: {
              status: "SUSPENDED",
            },
          },
        }),

        ////////////
        ////////////
        ////////////
        ////////////
        ////////////
        ////////////

        prisma.offer.count({
          //25 ALL NATIONAL PROMO
          where: {
            code: {
              not: "OF-000000000000000",
            },
            area: {
              title: "NATIONAL",
            },
            specialPromotion: {
              isNot: null,
            },
          },
        }),
        prisma.offer.count({
          //26 ALL NATIONAL PROMO ALLOW
          where: {
            code: {
              not: "OF-000000000000000",
            },
            area: {
              title: "NATIONAL",
            },
            specialPromotion: {
              isNot: null,
            },
            validation: {
              status: "ALLOW",
            },
          },
        }),
        prisma.offer.count({
          //27 ALL NATIONAL PROMO DINIED
          where: {
            code: {
              not: "OF-000000000000000",
            },
            area: {
              title: "NATIONAL",
            },
            specialPromotion: {
              isNot: null,
            },
            validation: {
              status: "DINIED",
            },
          },
        }),
        prisma.offer.count({
          //28 ALL NATIONAL PROMO PENDING
          where: {
            code: {
              not: "OF-000000000000000",
            },
            area: {
              title: "NATIONAL",
            },
            specialPromotion: {
              isNot: null,
            },
            status: "PENDING",
          },
        }),
        prisma.offer.count({
          //29 ALL NATIONAL PROMO SUSPENDED
          where: {
            code: {
              not: "OF-000000000000000",
            },
            area: {
              title: "NATIONAL",
            },
            specialPromotion: {
              isNot: null,
            },
            validation: {
              status: "SUSPENDED",
            },
          },
        }),

        ////////////
        ////////////
        ////////////INTERNATIONAL
        ////////////
        ////////////
        ////////////

        prisma.offer.count({
          //30 ALL INTERNATIONAL
          where: {
            code: {
              not: "OF-000000000000000",
            },
            area: {
              title: "INTERNATIONAL",
            },
          },
        }),
        prisma.offer.count({
          //31 ALL INTERNATIONAL ALLOW
          where: {
            area: {
              title: "INTERNATIONAL",
            },
            validation: {
              status: "ALLOW",
            },
          },
        }),
        prisma.offer.count({
          //32 ALL INTERNATIONAL DINIED
          where: {
            code: {
              not: "OF-000000000000000",
            },
            area: {
              title: "INTERNATIONAL",
            },
            specialPromotion: {
              isNot: null,
            },
            validation: {
              status: "DINIED",
            },
          },
        }),
        prisma.offer.count({
          //33 ALL INTERNATIONAL PENDING
          where: {
            code: {
              not: "OF-000000000000000",
            },
            area: {
              title: "INTERNATIONAL",
            },
            status: "PENDING",
          },
        }),
        prisma.offer.count({
          //34 ALL INTERNATIONAL SUSPENDED
          where: {
            code: {
              not: "OF-000000000000000",
            },
            area: {
              title: "INTERNATIONAL",
            },
            validation: {
              status: "SUSPENDED",
            },
          },
        }),

        ////////////
        ////////////
        ////////////////
        ////////////
        ////////////
        ////////////

        prisma.offer.count({
          //35 ALL INTERNATIONAL BASE
          where: {
            code: {
              not: "OF-000000000000000",
            },
            area: {
              title: "INTERNATIONAL",
            },
            specialPromotion: {
              is: null,
            },
          },
        }),
        prisma.offer.count({
          //36 ALL INTERNATIONAL BASE ALLOW
          where: {
            code: {
              not: "OF-000000000000000",
            },
            area: {
              title: "INTERNATIONAL",
            },
            specialPromotion: {
              is: null,
            },
            validation: {
              status: "ALLOW",
            },
          },
        }),
        prisma.offer.count({
          //37 ALL INTERNATIONAL BASE DINIED
          where: {
            code: {
              not: "OF-000000000000000",
            },
            area: {
              title: "INTERNATIONAL",
            },
            specialPromotion: {
              is: null,
            },
            validation: {
              status: "DINIED",
            },
          },
        }),
        prisma.offer.count({
          //38 ALL INTERNATIONAL BASE PENDING
          where: {
            code: {
              not: "OF-000000000000000",
            },
            area: {
              title: "INTERNATIONAL",
            },
            specialPromotion: {
              is: null,
            },
            status: "PENDING",
          },
        }),
        prisma.offer.count({
          //39 ALL INTERNATIONAL BASE SUSPENDED
          where: {
            code: {
              not: "OF-000000000000000",
            },
            area: {
              title: "INTERNATIONAL",
            },
            specialPromotion: {
              is: null,
            },
            validation: {
              status: "SUSPENDED",
            },
          },
        }),

        ////////////
        ////////////
        ////////////
        ////////////
        ////////////
        ////////////

        prisma.offer.count({
          //40 ALL INTERNATIONAL PROMO
          where: {
            code: {
              not: "OF-000000000000000",
            },
            area: {
              title: "INTERNATIONAL",
            },
            specialPromotion: {
              isNot: null,
            },
          },
        }),
        prisma.offer.count({
          //41 ALL INTERNATIONAL PROMO ALLOW
          where: {
            code: {
              not: "OF-000000000000000",
            },
            area: {
              title: "INTERNATIONAL",
            },
            specialPromotion: {
              isNot: null,
            },
            validation: {
              status: "ALLOW",
            },
          },
        }),
        prisma.offer.count({
          //42 ALL INTERNATIONAL PROMO DINIED
          where: {
            code: {
              not: "OF-000000000000000",
            },
            area: {
              title: "INTERNATIONAL",
            },
            specialPromotion: {
              isNot: null,
            },
            validation: {
              status: "DINIED",
            },
          },
        }),
        prisma.offer.count({
          //43 ALL INTERNATIONAL PROMO PENDING
          where: {
            code: {
              not: "OF-000000000000000",
            },
            area: {
              title: "INTERNATIONAL",
            },
            specialPromotion: {
              isNot: null,
            },
            status: "PENDING",
          },
        }),
        prisma.offer.count({
          //44 ALL INTERNATIONAL PROMO SUSPENDED
          where: {
            code: {
              not: "OF-000000000000000",
            },
            area: {
              title: "INTERNATIONAL",
            },
            specialPromotion: {
              isNot: null,
            },
            validation: {
              status: "SUSPENDED",
            },
          },
        }),

        ////////////
        ////////////
        ////////////ROAMING
        ////////////
        ////////////
        ////////////

        prisma.offer.count({
          //45 ALL ROAMING
          where: {
            code: {
              not: "OF-000000000000000",
            },
            area: {
              title: "ROAMING",
            },
          },
        }),
        prisma.offer.count({
          //46 ALL ROAMING ALLOW
          where: {
            code: {
              not: "OF-000000000000000",
            },
            area: {
              title: "ROAMING",
            },
            validation: {
              status: "ALLOW",
            },
          },
        }),
        prisma.offer.count({
          //47 ALL ROAMING DINIED
          where: {
            code: {
              not: "OF-000000000000000",
            },
            area: {
              title: "ROAMING",
            },
            specialPromotion: {
              isNot: null,
            },
            validation: {
              status: "DINIED",
            },
          },
        }),
        prisma.offer.count({
          //48 ALL ROAMING PENDING
          where: {
            code: {
              not: "OF-000000000000000",
            },
            area: {
              title: "ROAMING",
            },
            status: "PENDING",
          },
        }),
        prisma.offer.count({
          //49 ALL ROAMING SUSPENDED
          where: {
            code: {
              not: "OF-000000000000000",
            },
            area: {
              title: "ROAMING",
            },
            validation: {
              status: "SUSPENDED",
            },
          },
        }),

        ////////////
        ////////////
        ////////////////
        ////////////
        ////////////
        ////////////

        prisma.offer.count({
          //50 ALL ROAMING BASE
          where: {
            code: {
              not: "OF-000000000000000",
            },
            area: {
              title: "ROAMING",
            },
            specialPromotion: {
              is: null,
            },
          },
        }),
        prisma.offer.count({
          //51 ALL ROAMING BASE ALLOW
          where: {
            code: {
              not: "OF-000000000000000",
            },
            area: {
              title: "ROAMING",
            },
            specialPromotion: {
              is: null,
            },
            validation: {
              status: "ALLOW",
            },
          },
        }),
        prisma.offer.count({
          //52 ALL ROAMING BASE DINIED
          where: {
            code: {
              not: "OF-000000000000000",
            },
            area: {
              title: "ROAMING",
            },
            specialPromotion: {
              is: null,
            },
            validation: {
              status: "DINIED",
            },
          },
        }),
        prisma.offer.count({
          //53 ALL ROAMING BASE PENDING
          where: {
            code: {
              not: "OF-000000000000000",
            },
            area: {
              title: "ROAMING",
            },
            specialPromotion: {
              is: null,
            },
            status: "PENDING",
          },
        }),
        prisma.offer.count({
          //54 ALL ROAMING BASE SUSPENDED
          where: {
            code: {
              not: "OF-000000000000000",
            },
            area: {
              title: "ROAMING",
            },
            specialPromotion: {
              is: null,
            },
            validation: {
              status: "SUSPENDED",
            },
          },
        }),

        ////////////
        ////////////
        ////////////
        ////////////
        ////////////
        ////////////

        prisma.offer.count({
          //55 ALL ROAMING PROMO
          where: {
            code: {
              not: "OF-000000000000000",
            },
            area: {
              title: "ROAMING",
            },
            specialPromotion: {
              isNot: null,
            },
          },
        }),
        prisma.offer.count({
          //56 ALL ROAMING PROMO ALLOW
          where: {
            code: {
              not: "OF-000000000000000",
            },
            area: {
              title: "ROAMING",
            },
            specialPromotion: {
              isNot: null,
            },
            validation: {
              status: "ALLOW",
            },
          },
        }),
        prisma.offer.count({
          //57 ALL ROAMING PROMO DINIED
          where: {
            code: {
              not: "OF-000000000000000",
            },
            area: {
              title: "ROAMING",
            },
            specialPromotion: {
              isNot: null,
            },
            validation: {
              status: "DINIED",
            },
          },
        }),
        prisma.offer.count({
          //58 ALL ROAMING PROMO PENDING
          where: {
            code: {
              not: "OF-000000000000000",
            },
            area: {
              title: "ROAMING",
            },
            specialPromotion: {
              isNot: null,
            },
            status: "PENDING",
          },
        }),
        prisma.offer.count({
          //59 ALL ROAMING PROMO SUSPENDED
          where: {
            code: {
              not: "OF-000000000000000",
            },
            area: {
              title: "ROAMING",
            },
            specialPromotion: {
              isNot: null,
            },
            validation: {
              status: "SUSPENDED",
            },
          },
        }),

        // //ZONES - TYPE BASE
        // prisma.area.count({
        //   //6
        //   where: {
        //     title: "INTERNATIONAL",
        //     specialPromotion: {
        //       is: null,
        //     },
        //   },
        // }),
        // prisma.area.count({//7
        //   where: {
        //     title: "INTERNATIONAL",
        //     specialPromotion: {
        //       is: null,
        //     },
        //   },
        // }),
        // prisma.area.count({//8
        //   where: {
        //     title: "ROAMING",
        //     specialPromotion: {
        //       is: null,
        //     },
        //   },
        // }),

        // //ZONES - TYPE PROMO
        // prisma.area.count({//9
        //   where: {
        //     title: "NATIONAL",
        //     specialPromotion: {
        //       isNot: null,
        //     },
        //   },
        // }),
        // prisma.area.count({//10
        //   where: {
        //     title: "INTERNATIONAL",
        //     specialPromotion: {
        //       isNot: null,
        //     },
        //   },
        // }),
        // prisma.area.count({//11
        //   where: {
        //     title: "ROAMING",
        //     specialPromotion: {
        //       isNot: null,
        //     },
        //   },
        // }),

        // prisma.offer.groupBy({
        //   by: ["status"],
        //   _count: { status: true },
        // }),
        // prisma.offer.count({
        //   where: {
        //     title: "national",
        //   },
        // }),

        // prisma.offer.groupBy({
        //   by: ["category"],
        //   _count: { category: true },
        // }),

        // prisma.offer.groupBy({
        //   by: ["billingType"],
        //   _count: { billingType: true },
        // }),

        // prisma.offer.groupBy({
        //   by: ["operatorId"],
        //   _count: {
        //     id: true,
        //   },
        // }),
      ]);

      res.status(200).json(stats);
    } catch (error) {
      serverError(res, error, "pages/api/admin/statistics/generalStatistics.js");
    } finally {
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// Autorisation vérifiée côté serveur (session + permission, périmètre opérateur).
export default guardRoute(handler, { methods: { POST: PERMISSIONS.STATISTICS_READ }, focalPoint: "deny" });
