// pages/api/users/index.js
import prisma from "@/services/config/auth/prisma";
import { serverError } from "@/services/config/apiError";

export default async function handler(req, res) {
  if (req.method === "POST") {
    // const { verskth } = req.body;
    // if (verskth != FKTND_H) {
    //   return res.status(405).json({ message: "Requête non autorisée" });
    // }
    try {
      const stats = await Promise.all([
        prisma.offer.count({
          where:{
            code: {
              not: "OF-000000000000000",
            },
          }
        }), //0LL OFFERS

        prisma.offer.count({
          //1 ALL BASE OFFERS
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
          //2 ALL PROMO OFFERS
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
          //3 ALL DONE BASE OFFERS
          where: {
            code: {
              not: "OF-000000000000000",
            },
            status: "DONE",
          },
        }),

        prisma.offer.count({
          //4 ALL PENDING BASE OFFERS
          where: {
            code: {
              not: "OF-000000000000000",
            },
            status: "PENDING",
          },
        }),

        prisma.offer.count({
          //5 ALL VALIDATE
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
          //6 ALL VALIDATE
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
          //7 ALL MOBILE
          where: {
            code: {
              not: "OF-000000000000000",
            },
            category: "MOBILE",
          },
        }),

        prisma.offer.count({
          //8 ALL FIXE
          where: {
            code: {
              not: "OF-000000000000000",
            },
            category: "FIXE",
          },
        }),
        prisma.offer.count({
          //9 ALL Traité
          where: {
            code: {
              not: "OF-000000000000000",
            },
            validation: {
              isNot: null,
            },
          },
        }),

        ///////////////NATIONAL////////////////
        prisma.offer.count({
          //3 ALL NATIONAL OFFERS
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
          //4 ALL BASE NATIONAL OFFERS
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
          //5
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

        /////////////INTERNATIONAL//////////////////
        prisma.offer.count({
          //6 ALL INTERNATIONAL OFFERS
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
          //7 ALL BASE INTERNATIONAL OFFERS
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
          //8 ALL PROMO INTERNATIONAL OFFERS
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

        /////////////ROAMING//////////////////
        prisma.offer.count({
          //9 ALL ROAMING OFFERS
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
          //10 ALL BASE ROAMING OFFERS
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
          //11 ALL PROMO ROAMING OFFERS
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

        // //ZONES - TYPE BASE
        // prisma.area.count({
        //   //6
        //   where: {
        //     title: "NATIONAL",
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
      serverError(res, error, "pages/api/client/statistics/generalStatistics.js");
    } finally {
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
