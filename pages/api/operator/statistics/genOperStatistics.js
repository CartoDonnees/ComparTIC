import { guardRoute } from "@/services/rbac/guardRoute";
import { PERMISSIONS } from "@/services/rbac/permissions";
// pages/api/users/index.js
import prisma from "@/services/config/auth/prisma";
import { FKTND_H } from "@/services/tools/constants";
import { getDateMonthsBefore } from "@/services/tools/helper";
import { serverError } from "@/services/config/apiError";

async function handler(req, res) {
  if (req.method === "POST") {
    const { verskth, startDate, endDate, operatorIds, category, billingType } =
      req.body;

    ///////////////÷÷÷\\\\\\\\\\\\\
    ///////////////÷÷÷\\\\\\\\\\\\\
    ///////////////÷+÷\\\\\\\\\\\\\\

    if (verskth != FKTND_H) {
      return res.status(405).json({ message: "Requête non autorisée" });
    }

    try {
      let stats = null;
      let resultWeek = null;
      let weekBase = null;
      let weekPromo = null;
      let weekMobile = null;
      let weekFixe = null;

      const _start = startDate
        ? new Date(startDate)
        : getDateMonthsBefore(new Date(), 1230);
      const _end = endDate ? new Date(endDate) : new Date();
      const _billType =
        Number(billingType) == 1
          ? "PREPAID"
          : Number(billingType) == 2
            ? "POSTPAID"
            : "HYBRID";

      const _categ = Number(category) == 1 ? "MOBILE" : "FIXE";

      const operators = await prisma.operator.findMany({
        where: {
          id: {
            in: operatorIds,
          },
        },
      });

      if (Number(category) == -1 && Number(billingType) == -1) {
        weekBase = await prisma.$queryRaw`
        WITH weeks AS (
          SELECT generate_series(
            DATE_TRUNC('week', ${new Date(startDate)}::timestamp),
            DATE_TRUNC('week', ${new Date(endDate)}::timestamp),
            INTERVAL '1 week'
          ) AS week
        )
        SELECT 
          weeks.week,
          COUNT(o.*)::int AS count
        FROM weeks
        LEFT JOIN "Offer" o
          ON DATE_TRUNC('week', o."notifiDate") = weeks.week
          AND o."notifiDate" >= ${new Date(startDate)}
          AND o."notifiDate" < ${new Date(endDate)}
        AND o."operatorId" = ANY(${operatorIds})

        LEFT JOIN "SpecialPromotion" sp
        ON sp."offerId" = o."id"
        AND sp."id" IS NULL

        GROUP BY weeks.week
        ORDER BY weeks.week;
      `;

        weekPromo = await prisma.$queryRaw`
        WITH weeks AS (
          SELECT generate_series(
            DATE_TRUNC('week', ${new Date(startDate)}::timestamp),
            DATE_TRUNC('week', ${new Date(endDate)}::timestamp),
            INTERVAL '1 week'
          ) AS week
        )
        SELECT 
          weeks.week,
          COUNT(o.*)::int AS count
        FROM weeks
        LEFT JOIN "Offer" o
          ON DATE_TRUNC('week', o."notifiDate") = weeks.week
          AND o."notifiDate" >= ${new Date(startDate)}
          AND o."notifiDate" < ${new Date(endDate)}
        AND o."operatorId" = ANY(${operatorIds})

        LEFT JOIN "SpecialPromotion" sp
        ON sp."offerId" = o."id"
        AND sp."id" IS NOT NULL

        GROUP BY weeks.week
        ORDER BY weeks.week;
      `;

        weekMobile = await prisma.$queryRaw`
        WITH weeks AS (
          SELECT generate_series(
            DATE_TRUNC('week', ${new Date(startDate)}::timestamp),
            DATE_TRUNC('week', ${new Date(endDate)}::timestamp),
            INTERVAL '1 week'
          ) AS week
        )
        SELECT 
          weeks.week,
          COUNT(o.*)::int AS count
        FROM weeks
        LEFT JOIN "Offer" o
          ON DATE_TRUNC('week', o."notifiDate") = weeks.week
          AND o."notifiDate" >= ${new Date(startDate)}
          AND o."notifiDate" < ${new Date(endDate)}
        AND o."operatorId" = ANY(${operatorIds})
        AND o."category" = ${"MOBILE"}::"OfferCategory"

        GROUP BY weeks.week
        ORDER BY weeks.week;
      `;

        weekFixe = await prisma.$queryRaw`
        WITH weeks AS (
          SELECT generate_series(
            DATE_TRUNC('week', ${new Date(startDate)}::timestamp),
            DATE_TRUNC('week', ${new Date(endDate)}::timestamp),
            INTERVAL '1 week'
          ) AS week
        )
        SELECT 
          weeks.week,
          COUNT(o.*)::int AS count
        FROM weeks
        LEFT JOIN "Offer" o
          ON DATE_TRUNC('week', o."notifiDate") = weeks.week
          AND o."notifiDate" >= ${new Date(startDate)}
          AND o."notifiDate" < ${new Date(endDate)}
        AND o."operatorId" = ANY(${operatorIds})
        AND o."category" = ${"FIXE"}::"OfferCategory"

        GROUP BY weeks.week
        ORDER BY weeks.week;
      `;

        stats = await Promise.all([
          prisma.offer.count({
            where: {
              code: {
                not: "OF-000000000000000",
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
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
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
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
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),

          // //////////////////////////////////////
          // //////////////////////////////////////
          // //////////////////////////////////////

          prisma.offer.count({
            //3 ALL PENDING BASE OFFERS
            where: {
              code: {
                not: "OF-000000000000000",
              },
              status: "PENDING",
              specialPromotion: {
                is: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),
          prisma.offer.count({
            //4 ALL PENDING PROMO OFFERS
            where: {
              code: {
                not: "OF-000000000000000",
              },
              status: "PENDING",
              specialPromotion: {
                isNot: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),

          // //////////////////////////////////////
          // //////////////////////////////////////
          // //////////////////////////////////////

          prisma.offer.count({
            //5 ALL DONE BASE OFFERS
            where: {
              code: {
                not: "OF-000000000000000",
              },
              status: "DONE",
              specialPromotion: {
                is: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),
          prisma.offer.count({
            //6 ALL DONE PROMO OFFERS
            where: {
              code: {
                not: "OF-000000000000000",
              },
              status: "DONE",
              specialPromotion: {
                isNot: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),

          // //////////////////////////////////////
          // //////////////////////////////////////
          // //////////////////////////////////////

          prisma.offer.count({
            //7 ALL VALID BASE OFFERS
            where: {
              code: {
                not: "OF-000000000000000",
              },
              specialPromotion: {
                is: null,
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "ALLOW",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "ALLOW",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),
          prisma.offer.count({
            //8 ALL VALID PROMO OFFERS
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
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "ALLOW",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "ALLOW",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),

          // //////////////////////////////////////
          // //////////////////////////////////////
          // //////////////////////////////////////

          prisma.offer.count({
            //9 ALL INVALID BASE OFFERS
            where: {
              specialPromotion: {
                is: null,
              },
              validation: {
                status: "DINIED",
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "DINIED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "DINIED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),
          prisma.offer.count({
            //10 ALL INVALID PROMO OFFERS
            where: {
              specialPromotion: {
                isNot: null,
              },
              validation: {
                status: "DINIED",
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "DINIED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "DINIED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //11 ALL SUSPEND BASE OFFERS
            where: {
              specialPromotion: {
                is: null,
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "SUSPENDED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "SUSPENDED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),
          prisma.offer.count({
            //12 ALL SUSPEND PROMO OFFERS
            where: {
              specialPromotion: {
                isNot: null,
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "SUSPENDED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "SUSPENDED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////

          //////////////////////////////////////
          ///////////////////NATIONAL///////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //13 ALL NATIONAL PENDING BASE OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),

          prisma.offer.count({
            //14 ALL NATIONAL BASE OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              specialPromotion: {
                is: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),
          prisma.offer.count({
            //15 ALL NATIONAL PROMO OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              specialPromotion: {
                isNot: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),

          prisma.offer.count({
            //16 ALL NATIONAL PENDING BASE OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              status: "PENDING",

              specialPromotion: {
                is: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),
          prisma.offer.count({
            //17 ALL NATIONAL PENDING PROMO OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              status: "PENDING",
              specialPromotion: {
                isNot: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //18 ALL NATIONAL DONE BASE OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              status: "DONE",
              specialPromotion: {
                is: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),
          prisma.offer.count({
            //19 ALL NATIONAL DONE PROMO OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              status: "DONE",
              specialPromotion: {
                isNot: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //20 ALL NATIONAL VALID BASE OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              specialPromotion: {
                is: null,
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "ALLOW",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "ALLOW",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),
          prisma.offer.count({
            //21 ALL NATIONAL VALID PROMO OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              specialPromotion: {
                isNot: null,
              },
              validation: {
                status: "ALLOW",
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "ALLOW",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "ALLOW",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),

          // //////////////////////////////////////
          // //////////////////////////////////////
          // //////////////////////////////////////

          prisma.offer.count({
            //22 ALL NATIONAL INVALID BASE OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              specialPromotion: {
                is: null,
              },
              validation: {
                status: "DINIED",
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "DINIED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "DINIED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),
          prisma.offer.count({
            //23 ALL NATIONAL INVALID PROMO OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              specialPromotion: {
                isNot: null,
              },
              validation: {
                status: "DINIED",
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "DINIED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "DINIED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //24 ALL NATIONAL SUSPEND BASE OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              specialPromotion: {
                is: null,
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "SUSPENDED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "SUSPENDED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),
          prisma.offer.count({
            //25 ALL NATIONAL SUSPEND PROMO OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              specialPromotion: {
                isNot: null,
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "SUSPENDED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "SUSPENDED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////

          //////////////////////////////////////
          ///////////////////INTERNATIONAL///////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //26 ALL INTERNATIONAL PENDING BASE OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),

          prisma.offer.count({
            //27 ALL INTERNATIONAL BASE OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              specialPromotion: {
                is: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),
          prisma.offer.count({
            //28 ALL INTERNATIONAL PROMO OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              specialPromotion: {
                isNot: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),

          prisma.offer.count({
            //29 ALL INTERNATIONAL PENDING BASE OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              status: "PENDING",

              specialPromotion: {
                is: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),
          prisma.offer.count({
            //30 ALL INTERNATIONAL PENDING PROMO OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              status: "PENDING",
              specialPromotion: {
                isNot: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //31 ALL INTERNATIONAL DONE BASE OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              status: "DONE",
              specialPromotion: {
                is: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),
          prisma.offer.count({
            //32 ALL INTERNATIONAL DONE PROMO OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              status: "DONE",
              specialPromotion: {
                isNot: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //33 ALL INTERNATIONAL VALID BASE OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              specialPromotion: {
                is: null,
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "ALLOW",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "ALLOW",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),
          prisma.offer.count({
            //34 ALL INTERNATIONAL VALID PROMO OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              specialPromotion: {
                isNot: null,
              },
              validation: {
                status: "ALLOW",
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "ALLOW",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "ALLOW",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),

          // //////////////////////////////////////
          // //////////////////////////////////////
          // //////////////////////////////////////

          prisma.offer.count({
            //35 ALL INTERNATIONAL INVALID BASE OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              specialPromotion: {
                is: null,
              },
              validation: {
                status: "DINIED",
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "DINIED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "DINIED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),
          prisma.offer.count({
            //36 ALL INTERNATIONAL INVALID PROMO OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              specialPromotion: {
                isNot: null,
              },
              validation: {
                status: "DINIED",
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "DINIED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "DINIED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //37 ALL INTERNATIONAL SUSPEND BASE OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              specialPromotion: {
                is: null,
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "SUSPENDED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "SUSPENDED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),
          prisma.offer.count({
            //38 ALL INTERNATIONAL SUSPEND PROMO OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              specialPromotion: {
                isNot: null,
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "SUSPENDED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "SUSPENDED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////

          //////////////////////////////////////
          ///////////////////ROAMING///////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //39 ALL ROAMING PENDING BASE OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),

          prisma.offer.count({
            //40 ALL ROAMING BASE OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              specialPromotion: {
                is: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),
          prisma.offer.count({
            //41 ALL ROAMING PROMO OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              specialPromotion: {
                isNot: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),

          prisma.offer.count({
            //42 ALL ROAMING PENDING BASE OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              status: "PENDING",

              specialPromotion: {
                is: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),
          prisma.offer.count({
            //43 ALL ROAMING PENDING PROMO OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              status: "PENDING",
              specialPromotion: {
                isNot: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //44 ALL ROAMING DONE BASE OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              status: "DONE",
              specialPromotion: {
                is: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),
          prisma.offer.count({
            //45 ALL ROAMING DONE PROMO OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              status: "DONE",
              specialPromotion: {
                isNot: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //46 ALL ROAMING VALID BASE OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              specialPromotion: {
                is: null,
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "ALLOW",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "ALLOW",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),
          prisma.offer.count({
            //47 ALL ROAMING VALID PROMO OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              specialPromotion: {
                isNot: null,
              },
              validation: {
                status: "ALLOW",
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "ALLOW",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "ALLOW",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),

          // //////////////////////////////////////
          // //////////////////////////////////////
          // //////////////////////////////////////

          prisma.offer.count({
            //48 ALL ROAMING INVALID BASE OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              specialPromotion: {
                is: null,
              },
              validation: {
                status: "DINIED",
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "DINIED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "DINIED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),
          prisma.offer.count({
            //49 ALL ROAMING INVALID PROMO OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              specialPromotion: {
                isNot: null,
              },
              validation: {
                status: "DINIED",
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "DINIED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "DINIED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //50 ALL ROAMING SUSPEND BASE OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              specialPromotion: {
                is: null,
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "SUSPENDED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "SUSPENDED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),
          prisma.offer.count({
            //51 ALL ROAMING SUSPEND PROMO OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              specialPromotion: {
                isNot: null,
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "SUSPENDED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "SUSPENDED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //52 ALL ALLOW OFFERS
            where: {
              OR: [
                {
                  validation: {
                    status: "ALLOW",
                  },
                },
                {
                  monitorings: {
                    some: {
                      validation: {
                        status: "ALLOW",
                      },
                    },
                  },
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),
          prisma.offer.count({
            //53 ALL DENIED OFFERS
            where: {
              OR: [
                {
                  validation: {
                    status: "DINIED",
                  },
                },
                {
                  monitorings: {
                    some: {
                      validation: {
                        status: "DINIED",
                      },
                    },
                  },
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),
          prisma.offer.count({
            //54 ALL SUSPENDED OFFERS
            where: {
              OR: [
                {
                  validation: {
                    status: "SUSPENDED",
                  },
                },
                {
                  monitorings: {
                    some: {
                      validation: {
                        status: "SUSPENDED",
                      },
                    },
                  },
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),
          prisma.offer.count({
            //55 ALL PENDING OFFERS
            where: {
              status: "PENDING",
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),
          prisma.offer.count({
            //56 ALL DONE OFFERS
            where: {
              status: "DONE",
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),

          /////////////NATIONAL//////////////

          prisma.offer.count({
            //57 ALL NATIONAL ALLOW OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              OR: [
                {
                  validation: {
                    status: "ALLOW",
                  },
                },
                {
                  monitorings: {
                    some: {
                      validation: {
                        status: "ALLOW",
                      },
                    },
                  },
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),
          prisma.offer.count({
            //58 ALL NATIONAL DENIED OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              OR: [
                {
                  validation: {
                    status: "DINIED",
                  },
                },
                {
                  monitorings: {
                    some: {
                      validation: {
                        status: "DINIED",
                      },
                    },
                  },
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),
          prisma.offer.count({
            //59 ALL NATIONAL SUSPENDED OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              OR: [
                {
                  validation: {
                    status: "SUSPENDED",
                  },
                },
                {
                  monitorings: {
                    some: {
                      validation: {
                        status: "SUSPENDED",
                      },
                    },
                  },
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),
          prisma.offer.count({
            //60 ALL NATIONAL PENDING OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              status: "PENDING",
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),
          prisma.offer.count({
            //61 ALL NATIONAL DONE OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              status: "DONE",
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),

          /////////////INTERNATIONAL//////////////

          prisma.offer.count({
            //63 ALL INTERNATIONAL ALLOW OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              OR: [
                {
                  validation: {
                    status: "ALLOW",
                  },
                },
                {
                  monitorings: {
                    some: {
                      validation: {
                        status: "ALLOW",
                      },
                    },
                  },
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),
          prisma.offer.count({
            //64 ALL INTERNATIONAL DENIED OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              OR: [
                {
                  validation: {
                    status: "DINIED",
                  },
                },
                {
                  monitorings: {
                    some: {
                      validation: {
                        status: "DINIED",
                      },
                    },
                  },
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),
          prisma.offer.count({
            //65 ALL INTERNATIONAL SUSPENDED OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              OR: [
                {
                  validation: {
                    status: "SUSPENDED",
                  },
                },
                {
                  monitorings: {
                    some: {
                      validation: {
                        status: "SUSPENDED",
                      },
                    },
                  },
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),
          prisma.offer.count({
            //66 ALL INTERNATIONAL PENDING OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              status: "PENDING",
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),
          prisma.offer.count({
            //67 ALL INTERNATIONAL DONE OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              status: "DONE",
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),

          /////////////ROAMING//////////////

          prisma.offer.count({
            //68 ALL ROAMING ALLOW OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              OR: [
                {
                  validation: {
                    status: "ALLOW",
                  },
                },
                {
                  monitorings: {
                    some: {
                      validation: {
                        status: "ALLOW",
                      },
                    },
                  },
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),
          prisma.offer.count({
            //69 ALL ROAMING DENIED OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              OR: [
                {
                  validation: {
                    status: "DINIED",
                  },
                },
                {
                  monitorings: {
                    some: {
                      validation: {
                        status: "DINIED",
                      },
                    },
                  },
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),
          prisma.offer.count({
            //70 ALL ROAMING SUSPENDED OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              OR: [
                {
                  validation: {
                    status: "SUSPENDED",
                  },
                },
                {
                  monitorings: {
                    some: {
                      validation: {
                        status: "SUSPENDED",
                      },
                    },
                  },
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),
          prisma.offer.count({
            //71 ALL ROAMING PENDING OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              status: "PENDING",
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),
          prisma.offer.count({
            //72 ALL ROAMING DONE OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              status: "DONE",
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
            },
          }),

          prisma.offer.count({
            where: {
              category: "MOBILE",
            },
          }),
          prisma.offer.count({
            where: {
              category: "FIXE",
            },
          }),
        ]);
      } else if (Number(category) == -1 && Number(billingType) != -1) {
        weekBase = await prisma.$queryRaw`
              WITH weeks AS (
                SELECT generate_series(
                  DATE_TRUNC('week', ${new Date(startDate)}::timestamp),
                  DATE_TRUNC('week', ${new Date(endDate)}::timestamp),
                  INTERVAL '1 week'
                ) AS week
              )
              SELECT 
                weeks.week,
                COUNT(o.*)::int AS count
              FROM weeks
              LEFT JOIN "Offer" o
                ON DATE_TRUNC('week', o."notifiDate") = weeks.week
                AND o."notifiDate" >= ${new Date(startDate)}
                AND o."notifiDate" < ${new Date(endDate)}
              AND o."operatorId" = ANY(${operatorIds})
         AND o."billingType" = ${_billType} :: "BillingType"
      
              LEFT JOIN "SpecialPromotion" sp
              ON sp."offerId" = o."id"
              AND sp."id" IS NULL
      
              GROUP BY weeks.week
              ORDER BY weeks.week;
            `;

        weekPromo = await prisma.$queryRaw`
              WITH weeks AS (
                SELECT generate_series(
                  DATE_TRUNC('week', ${new Date(startDate)}::timestamp),
                  DATE_TRUNC('week', ${new Date(endDate)}::timestamp),
                  INTERVAL '1 week'
                ) AS week
              )
              SELECT 
                weeks.week,
                COUNT(o.*)::int AS count
              FROM weeks
              LEFT JOIN "Offer" o
                ON DATE_TRUNC('week', o."notifiDate") = weeks.week
                AND o."notifiDate" >= ${new Date(startDate)}
                AND o."notifiDate" < ${new Date(endDate)}
              AND o."operatorId" = ANY(${operatorIds})
         AND o."billingType" = ${_billType} :: "BillingType"
      
              LEFT JOIN "SpecialPromotion" sp
              ON sp."offerId" = o."id"
              AND sp."id" IS NOT NULL
      
              GROUP BY weeks.week
              ORDER BY weeks.week;
            `;

        weekMobile = await prisma.$queryRaw`
              WITH weeks AS (
                SELECT generate_series(
                  DATE_TRUNC('week', ${new Date(startDate)}::timestamp),
                  DATE_TRUNC('week', ${new Date(endDate)}::timestamp),
                  INTERVAL '1 week'
                ) AS week
              )
              SELECT 
                weeks.week,
                COUNT(o.*)::int AS count
              FROM weeks
              LEFT JOIN "Offer" o
                ON DATE_TRUNC('week', o."notifiDate") = weeks.week
                AND o."notifiDate" >= ${new Date(startDate)}
                AND o."notifiDate" < ${new Date(endDate)}
              AND o."operatorId" = ANY(${operatorIds})
              AND o."category" = ${"MOBILE"}::"OfferCategory"
         AND o."billingType" = ${_billType} :: "BillingType"
      
              GROUP BY weeks.week
              ORDER BY weeks.week;
            `;

        weekFixe = await prisma.$queryRaw`
              WITH weeks AS (
                SELECT generate_series(
                  DATE_TRUNC('week', ${new Date(startDate)}::timestamp),
                  DATE_TRUNC('week', ${new Date(endDate)}::timestamp),
                  INTERVAL '1 week'
                ) AS week
              )
              SELECT 
                weeks.week,
                COUNT(o.*)::int AS count
              FROM weeks
              LEFT JOIN "Offer" o
                ON DATE_TRUNC('week', o."notifiDate") = weeks.week
                AND o."notifiDate" >= ${new Date(startDate)}
                AND o."notifiDate" < ${new Date(endDate)}
              AND o."operatorId" = ANY(${operatorIds})
              AND o."category" = ${"FIXE"}::"OfferCategory"
         AND o."billingType" = ${_billType} :: "BillingType"
      
              GROUP BY weeks.week
              ORDER BY weeks.week;
            `;

        stats = await Promise.all([
          prisma.offer.count({
            where: {
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }), //0LL OFFERS

          prisma.offer.count({
            //1 ALL BASE OFFERS
            where: {
              specialPromotion: {
                is: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),
          prisma.offer.count({
            //2 ALL PROMO OFFERS
            where: {
              specialPromotion: {
                isNot: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),

          // //////////////////////////////////////
          // //////////////////////////////////////
          // //////////////////////////////////////

          prisma.offer.count({
            //3 ALL PENDING BASE OFFERS
            where: {
              status: "PENDING",
              specialPromotion: {
                is: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),
          prisma.offer.count({
            //4 ALL PENDING PROMO OFFERS
            where: {
              status: "PENDING",
              specialPromotion: {
                isNot: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),

          // //////////////////////////////////////
          // //////////////////////////////////////
          // //////////////////////////////////////

          prisma.offer.count({
            //5 ALL DONE BASE OFFERS
            where: {
              status: "DONE",
              specialPromotion: {
                is: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),
          prisma.offer.count({
            //6 ALL DONE PROMO OFFERS
            where: {
              status: "DONE",
              specialPromotion: {
                isNot: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),

          // //////////////////////////////////////
          // //////////////////////////////////////
          // //////////////////////////////////////

          prisma.offer.count({
            //7 ALL VALID BASE OFFERS
            where: {
              specialPromotion: {
                is: null,
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "ALLOW",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "ALLOW",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),
          prisma.offer.count({
            //8 ALL VALID PROMO OFFERS
            where: {
              specialPromotion: {
                isNot: null,
              },
              validation: {
                status: "ALLOW",
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "ALLOW",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "ALLOW",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),

          // //////////////////////////////////////
          // //////////////////////////////////////
          // //////////////////////////////////////

          prisma.offer.count({
            //9 ALL INVALID BASE OFFERS
            where: {
              specialPromotion: {
                is: null,
              },
              validation: {
                status: "DINIED",
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "DINIED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "DINIED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),
          prisma.offer.count({
            //10 ALL INVALID PROMO OFFERS
            where: {
              specialPromotion: {
                isNot: null,
              },
              validation: {
                status: "DINIED",
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "DINIED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "DINIED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //11 ALL SUSPEND BASE OFFERS
            where: {
              specialPromotion: {
                is: null,
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "SUSPENDED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "SUSPENDED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),
          prisma.offer.count({
            //12 ALL SUSPEND PROMO OFFERS
            where: {
              specialPromotion: {
                isNot: null,
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "SUSPENDED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "SUSPENDED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////

          //////////////////////////////////////
          ///////////////////NATIONAL///////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //13 ALL NATIONAL PENDING BASE OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),

          prisma.offer.count({
            //14 ALL NATIONAL BASE OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              specialPromotion: {
                is: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),
          prisma.offer.count({
            //15 ALL NATIONAL PROMO OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              specialPromotion: {
                isNot: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),

          prisma.offer.count({
            //16 ALL NATIONAL PENDING BASE OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              status: "PENDING",

              specialPromotion: {
                is: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),
          prisma.offer.count({
            //17 ALL NATIONAL PENDING PROMO OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              status: "PENDING",
              specialPromotion: {
                isNot: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //18 ALL NATIONAL DONE BASE OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              status: "DONE",
              specialPromotion: {
                is: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),
          prisma.offer.count({
            //19 ALL NATIONAL DONE PROMO OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              status: "DONE",
              specialPromotion: {
                isNot: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //20 ALL NATIONAL VALID BASE OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              specialPromotion: {
                is: null,
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "ALLOW",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "ALLOW",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),
          prisma.offer.count({
            //21 ALL NATIONAL VALID PROMO OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              specialPromotion: {
                isNot: null,
              },
              validation: {
                status: "ALLOW",
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "ALLOW",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "ALLOW",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),

          // //////////////////////////////////////
          // //////////////////////////////////////
          // //////////////////////////////////////

          prisma.offer.count({
            //22 ALL NATIONAL INVALID BASE OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              specialPromotion: {
                is: null,
              },
              validation: {
                status: "DINIED",
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "DINIED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "DINIED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),
          prisma.offer.count({
            //23 ALL NATIONAL INVALID PROMO OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              specialPromotion: {
                isNot: null,
              },
              validation: {
                status: "DINIED",
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "DINIED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "DINIED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //24 ALL NATIONAL SUSPEND BASE OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              specialPromotion: {
                is: null,
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "SUSPENDED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "SUSPENDED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),
          prisma.offer.count({
            //25 ALL NATIONAL SUSPEND PROMO OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              specialPromotion: {
                isNot: null,
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "SUSPENDED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "SUSPENDED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////

          //////////////////////////////////////
          ///////////////////INTERNATIONAL///////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //26 ALL INTERNATIONAL PENDING BASE OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),

          prisma.offer.count({
            //27 ALL INTERNATIONAL BASE OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              specialPromotion: {
                is: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),
          prisma.offer.count({
            //28 ALL INTERNATIONAL PROMO OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              specialPromotion: {
                isNot: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),

          prisma.offer.count({
            //29 ALL INTERNATIONAL PENDING BASE OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              status: "PENDING",

              specialPromotion: {
                is: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),
          prisma.offer.count({
            //30 ALL INTERNATIONAL PENDING PROMO OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              status: "PENDING",
              specialPromotion: {
                isNot: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //31 ALL INTERNATIONAL DONE BASE OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              status: "DONE",
              specialPromotion: {
                is: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),
          prisma.offer.count({
            //32 ALL INTERNATIONAL DONE PROMO OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              status: "DONE",
              specialPromotion: {
                isNot: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //33 ALL INTERNATIONAL VALID BASE OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              specialPromotion: {
                is: null,
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "ALLOW",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "ALLOW",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),
          prisma.offer.count({
            //34 ALL INTERNATIONAL VALID PROMO OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              specialPromotion: {
                isNot: null,
              },
              validation: {
                status: "ALLOW",
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "ALLOW",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "ALLOW",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),

          // //////////////////////////////////////
          // //////////////////////////////////////
          // //////////////////////////////////////

          prisma.offer.count({
            //35 ALL INTERNATIONAL INVALID BASE OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              specialPromotion: {
                is: null,
              },
              validation: {
                status: "DINIED",
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "DINIED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "DINIED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),
          prisma.offer.count({
            //36 ALL INTERNATIONAL INVALID PROMO OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              specialPromotion: {
                isNot: null,
              },
              validation: {
                status: "DINIED",
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "DINIED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "DINIED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //37 ALL INTERNATIONAL SUSPEND BASE OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              specialPromotion: {
                is: null,
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "SUSPENDED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "SUSPENDED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),
          prisma.offer.count({
            //38 ALL INTERNATIONAL SUSPEND PROMO OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              specialPromotion: {
                isNot: null,
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "SUSPENDED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "SUSPENDED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////

          //////////////////////////////////////
          ///////////////////ROAMING///////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //39 ALL ROAMING PENDING BASE OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),

          prisma.offer.count({
            //40 ALL ROAMING BASE OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              specialPromotion: {
                is: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),
          prisma.offer.count({
            //41 ALL ROAMING PROMO OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              specialPromotion: {
                isNot: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),

          prisma.offer.count({
            //42 ALL ROAMING PENDING BASE OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              status: "PENDING",

              specialPromotion: {
                is: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),
          prisma.offer.count({
            //43 ALL ROAMING PENDING PROMO OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              status: "PENDING",
              specialPromotion: {
                isNot: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //44 ALL ROAMING DONE BASE OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              status: "DONE",
              specialPromotion: {
                is: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),
          prisma.offer.count({
            //45 ALL ROAMING DONE PROMO OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              status: "DONE",
              specialPromotion: {
                isNot: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //46 ALL ROAMING VALID BASE OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              specialPromotion: {
                is: null,
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "ALLOW",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "ALLOW",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),
          prisma.offer.count({
            //47 ALL ROAMING VALID PROMO OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              specialPromotion: {
                isNot: null,
              },
              validation: {
                status: "ALLOW",
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "ALLOW",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "ALLOW",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),

          // //////////////////////////////////////
          // //////////////////////////////////////
          // //////////////////////////////////////

          prisma.offer.count({
            //48 ALL ROAMING INVALID BASE OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              specialPromotion: {
                is: null,
              },
              validation: {
                status: "DINIED",
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "DINIED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "DINIED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),
          prisma.offer.count({
            //49 ALL ROAMING INVALID PROMO OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              specialPromotion: {
                isNot: null,
              },
              validation: {
                status: "DINIED",
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "DINIED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "DINIED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //50 ALL ROAMING SUSPEND BASE OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              specialPromotion: {
                is: null,
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "SUSPENDED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "SUSPENDED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),
          prisma.offer.count({
            //51 ALL ROAMING SUSPEND PROMO OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              specialPromotion: {
                isNot: null,
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "SUSPENDED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "SUSPENDED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //52 ALL ALLOW OFFERS
            where: {
              OR: [
                {
                  validation: {
                    status: "ALLOW",
                  },
                },
                {
                  monitorings: {
                    some: {
                      validation: {
                        status: "ALLOW",
                      },
                    },
                  },
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),

          prisma.offer.count({
            //53 ALL DENIED OFFERS
            where: {
              OR: [
                {
                  validation: {
                    status: "DINIED",
                  },
                },
                {
                  monitorings: {
                    some: {
                      validation: {
                        status: "DINIED",
                      },
                    },
                  },
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),

          prisma.offer.count({
            //54 ALL SUSPENDED OFFERS
            where: {
              OR: [
                {
                  validation: {
                    status: "SUSPENDED",
                  },
                },
                {
                  monitorings: {
                    some: {
                      validation: {
                        status: "SUSPENDED",
                      },
                    },
                  },
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),

          prisma.offer.count({
            //55 ALL PENDING OFFERS
            where: {
              status: "PENDING",
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),
          prisma.offer.count({
            //56 ALL DONE OFFERS
            where: {
              status: "DONE",
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),

          /////////////NATIONAL//////////////

          prisma.offer.count({
            //58 ALL NATIONAL ALLOW OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              OR: [
                {
                  validation: {
                    status: "ALLOW",
                  },
                },
                {
                  monitorings: {
                    some: {
                      validation: {
                        status: "ALLOW",
                      },
                    },
                  },
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),
          prisma.offer.count({
            //59 ALL NATIONAL DENIED OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              OR: [
                {
                  validation: {
                    status: "DINIED",
                  },
                },
                {
                  monitorings: {
                    some: {
                      validation: {
                        status: "DINIED",
                      },
                    },
                  },
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),
          prisma.offer.count({
            //60 ALL NATIONAL SUSPENDED OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              OR: [
                {
                  validation: {
                    status: "SUSPENDED",
                  },
                },
                {
                  monitorings: {
                    some: {
                      validation: {
                        status: "SUSPENDED",
                      },
                    },
                  },
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),
          prisma.offer.count({
            //61 ALL NATIONAL PENDING OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              status: "PENDING",
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),
          prisma.offer.count({
            //62 ALL NATIONAL DONE OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              status: "DONE",
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),

          /////////////INTERNATIONAL//////////////

          prisma.offer.count({
            //63 ALL INTERNATIONAL ALLOW OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              OR: [
                {
                  validation: {
                    status: "ALLOW",
                  },
                },
                {
                  monitorings: {
                    some: {
                      validation: {
                        status: "ALLOW",
                      },
                    },
                  },
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),
          prisma.offer.count({
            //64 ALL INTERNATIONAL DENIED OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              OR: [
                {
                  validation: {
                    status: "DINIED",
                  },
                },
                {
                  monitorings: {
                    some: {
                      validation: {
                        status: "DINIED",
                      },
                    },
                  },
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),
          prisma.offer.count({
            //65 ALL INTERNATIONAL SUSPENDED OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              OR: [
                {
                  validation: {
                    status: "SUSPENDED",
                  },
                },
                {
                  monitorings: {
                    some: {
                      validation: {
                        status: "SUSPENDED",
                      },
                    },
                  },
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),
          prisma.offer.count({
            //66 ALL INTERNATIONAL PENDING OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              status: "PENDING",
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),
          prisma.offer.count({
            //67 ALL INTERNATIONAL DONE OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              status: "DONE",
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),

          /////////////ROAMING//////////////

          prisma.offer.count({
            //68 ALL ROAMING ALLOW OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              OR: [
                {
                  validation: {
                    status: "ALLOW",
                  },
                },
                {
                  monitorings: {
                    some: {
                      validation: {
                        status: "ALLOW",
                      },
                    },
                  },
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),
          prisma.offer.count({
            //69 ALL ROAMING DENIED OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              OR: [
                {
                  validation: {
                    status: "DINIED",
                  },
                },
                {
                  monitorings: {
                    some: {
                      validation: {
                        status: "DINIED",
                      },
                    },
                  },
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),
          prisma.offer.count({
            //70 ALL ROAMING SUSPENDED OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              OR: [
                {
                  validation: {
                    status: "SUSPENDED",
                  },
                },
                {
                  monitorings: {
                    some: {
                      validation: {
                        status: "SUSPENDED",
                      },
                    },
                  },
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),
          prisma.offer.count({
            //71 ALL ROAMING PENDING OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              status: "PENDING",
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),
          prisma.offer.count({
            //72 ALL ROAMING DONE OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              status: "DONE",
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
            },
          }),
        ]);
      } else if (Number(billingType) == -1 && Number(category) != -1) {
        weekBase = await prisma.$queryRaw`
        WITH weeks AS (
          SELECT generate_series(
            DATE_TRUNC('week', ${new Date(startDate)}::timestamp),
            DATE_TRUNC('week', ${new Date(endDate)}::timestamp),
            INTERVAL '1 week'
          ) AS week
        )
        SELECT 
          weeks.week,
          COUNT(o.*)::int AS count
        FROM weeks
        LEFT JOIN "Offer" o
          ON DATE_TRUNC('week', o."notifiDate") = weeks.week
          AND o."notifiDate" >= ${new Date(startDate)}
          AND o."notifiDate" < ${new Date(endDate)}
        AND o."operatorId" = ANY(${operatorIds})
        AND o."category" = ${_categ}::"OfferCategory"

        LEFT JOIN "SpecialPromotion" sp
        ON sp."offerId" = o."id"
        AND sp."id" IS NULL

        GROUP BY weeks.week
        ORDER BY weeks.week;
      `;

        weekPromo = await prisma.$queryRaw`
        WITH weeks AS (
          SELECT generate_series(
            DATE_TRUNC('week', ${new Date(startDate)}::timestamp),
            DATE_TRUNC('week', ${new Date(endDate)}::timestamp),
            INTERVAL '1 week'
          ) AS week
        )
        SELECT 
          weeks.week,
          COUNT(o.*)::int AS count
        FROM weeks
        LEFT JOIN "Offer" o
          ON DATE_TRUNC('week', o."notifiDate") = weeks.week
          AND o."notifiDate" >= ${new Date(startDate)}
          AND o."notifiDate" < ${new Date(endDate)}
        AND o."operatorId" = ANY(${operatorIds})
        AND o."category" = ${_categ}::"OfferCategory"

        LEFT JOIN "SpecialPromotion" sp
        ON sp."offerId" = o."id"
        AND sp."id" IS NOT NULL

        GROUP BY weeks.week
        ORDER BY weeks.week;
      `;

        if (_categ == "MOBILE") {
          weekMobile = await prisma.$queryRaw`
        WITH weeks AS (
          SELECT generate_series(
            DATE_TRUNC('week', ${new Date(startDate)}::timestamp),
            DATE_TRUNC('week', ${new Date(endDate)}::timestamp),
            INTERVAL '1 week'
          ) AS week
        )
        SELECT 
          weeks.week,
          COUNT(o.*)::int AS count
        FROM weeks
        LEFT JOIN "Offer" o
          ON DATE_TRUNC('week', o."notifiDate") = weeks.week
          AND o."notifiDate" >= ${new Date(startDate)}
          AND o."notifiDate" < ${new Date(endDate)}
        AND o."operatorId" = ANY(${operatorIds})
        AND o."category" = ${"MOBILE"}::"OfferCategory"

        GROUP BY weeks.week
        ORDER BY weeks.week;
      `;
        }

        if (_categ == "FIXE") {
          weekFixe = await prisma.$queryRaw`
        WITH weeks AS (
          SELECT generate_series(
            DATE_TRUNC('week', ${new Date(startDate)}::timestamp),
            DATE_TRUNC('week', ${new Date(endDate)}::timestamp),
            INTERVAL '1 week'
          ) AS week
        )
        SELECT 
          weeks.week,
          COUNT(o.*)::int AS count
        FROM weeks
        LEFT JOIN "Offer" o
          ON DATE_TRUNC('week', o."notifiDate") = weeks.week
          AND o."notifiDate" >= ${new Date(startDate)}
          AND o."notifiDate" < ${new Date(endDate)}
        AND o."operatorId" = ANY(${operatorIds})
        AND o."category" = ${"FIXE"}::"OfferCategory"

        GROUP BY weeks.week
        ORDER BY weeks.week;
      `;
        }

        stats = await Promise.all([
          prisma.offer.count({
            where: {
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }), //0LL OFFERS

          prisma.offer.count({
            //1 ALL BASE OFFERS
            where: {
              specialPromotion: {
                is: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),
          prisma.offer.count({
            //2 ALL PROMO OFFERS
            where: {
              specialPromotion: {
                isNot: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),

          // //////////////////////////////////////
          // //////////////////////////////////////
          // //////////////////////////////////////

          prisma.offer.count({
            //3 ALL PENDING BASE OFFERS
            where: {
              status: "PENDING",
              specialPromotion: {
                is: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),
          prisma.offer.count({
            //4 ALL PENDING PROMO OFFERS
            where: {
              status: "PENDING",
              specialPromotion: {
                isNot: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),

          // //////////////////////////////////////
          // //////////////////////////////////////
          // //////////////////////////////////////

          prisma.offer.count({
            //5 ALL DONE BASE OFFERS
            where: {
              status: "DONE",
              specialPromotion: {
                is: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),
          prisma.offer.count({
            //6 ALL DONE PROMO OFFERS
            where: {
              status: "DONE",
              specialPromotion: {
                isNot: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),

          // //////////////////////////////////////
          // //////////////////////////////////////
          // //////////////////////////////////////

          prisma.offer.count({
            //7 ALL VALID BASE OFFERS
            where: {
              specialPromotion: {
                is: null,
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "ALLOW",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "ALLOW",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),
          prisma.offer.count({
            //8 ALL VALID PROMO OFFERS
            where: {
              specialPromotion: {
                isNot: null,
              },
              validation: {
                status: "ALLOW",
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "ALLOW",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "ALLOW",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),

          // //////////////////////////////////////
          // //////////////////////////////////////
          // //////////////////////////////////////

          prisma.offer.count({
            //9 ALL INVALID BASE OFFERS
            where: {
              specialPromotion: {
                is: null,
              },
              validation: {
                status: "DINIED",
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "DINIED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "DINIED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),
          prisma.offer.count({
            //10 ALL INVALID PROMO OFFERS
            where: {
              specialPromotion: {
                isNot: null,
              },
              validation: {
                status: "DINIED",
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "DINIED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "DINIED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //11 ALL SUSPEND BASE OFFERS
            where: {
              specialPromotion: {
                is: null,
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "SUSPENDED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "SUSPENDED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),
          prisma.offer.count({
            //12 ALL SUSPEND PROMO OFFERS
            where: {
              specialPromotion: {
                isNot: null,
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "SUSPENDED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "SUSPENDED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////

          //////////////////////////////////////
          ///////////////////NATIONAL///////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //13 ALL NATIONAL PENDING BASE OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),

          prisma.offer.count({
            //14 ALL NATIONAL BASE OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              specialPromotion: {
                is: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),
          prisma.offer.count({
            //15 ALL NATIONAL PROMO OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              specialPromotion: {
                isNot: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),

          prisma.offer.count({
            //16 ALL NATIONAL PENDING BASE OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              status: "PENDING",

              specialPromotion: {
                is: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),
          prisma.offer.count({
            //17 ALL NATIONAL PENDING PROMO OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              status: "PENDING",
              specialPromotion: {
                isNot: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //18 ALL NATIONAL DONE BASE OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              status: "DONE",
              specialPromotion: {
                is: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),
          prisma.offer.count({
            //19 ALL NATIONAL DONE PROMO OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              status: "DONE",
              specialPromotion: {
                isNot: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //20 ALL NATIONAL VALID BASE OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              specialPromotion: {
                is: null,
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "ALLOW",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "ALLOW",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),
          prisma.offer.count({
            //21 ALL NATIONAL VALID PROMO OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              specialPromotion: {
                isNot: null,
              },
              validation: {
                status: "ALLOW",
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "ALLOW",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "ALLOW",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),

          // //////////////////////////////////////
          // //////////////////////////////////////
          // //////////////////////////////////////

          prisma.offer.count({
            //22 ALL NATIONAL INVALID BASE OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              specialPromotion: {
                is: null,
              },
              validation: {
                status: "DINIED",
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "DINIED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "DINIED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),
          prisma.offer.count({
            //23 ALL NATIONAL INVALID PROMO OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              specialPromotion: {
                isNot: null,
              },
              validation: {
                status: "DINIED",
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "DINIED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "DINIED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //24 ALL NATIONAL SUSPEND BASE OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              specialPromotion: {
                is: null,
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "SUSPENDED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "SUSPENDED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),
          prisma.offer.count({
            //25 ALL NATIONAL SUSPEND PROMO OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              specialPromotion: {
                isNot: null,
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "SUSPENDED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "SUSPENDED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////

          //////////////////////////////////////
          ///////////////////INTERNATIONAL///////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //26 ALL INTERNATIONAL PENDING BASE OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),

          prisma.offer.count({
            //27 ALL INTERNATIONAL BASE OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              specialPromotion: {
                is: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),
          prisma.offer.count({
            //28 ALL INTERNATIONAL PROMO OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              specialPromotion: {
                isNot: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),

          prisma.offer.count({
            //29 ALL INTERNATIONAL PENDING BASE OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              status: "PENDING",

              specialPromotion: {
                is: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),
          prisma.offer.count({
            //30 ALL INTERNATIONAL PENDING PROMO OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              status: "PENDING",
              specialPromotion: {
                isNot: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //31 ALL INTERNATIONAL DONE BASE OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              status: "DONE",
              specialPromotion: {
                is: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),
          prisma.offer.count({
            //32 ALL INTERNATIONAL DONE PROMO OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              status: "DONE",
              specialPromotion: {
                isNot: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //33 ALL INTERNATIONAL VALID BASE OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              specialPromotion: {
                is: null,
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "ALLOW",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "ALLOW",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),
          prisma.offer.count({
            //34 ALL INTERNATIONAL VALID PROMO OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              specialPromotion: {
                isNot: null,
              },
              validation: {
                status: "ALLOW",
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "ALLOW",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "ALLOW",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),

          // //////////////////////////////////////
          // //////////////////////////////////////
          // //////////////////////////////////////

          prisma.offer.count({
            //35 ALL INTERNATIONAL INVALID BASE OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              specialPromotion: {
                is: null,
              },
              validation: {
                status: "DINIED",
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "DINIED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "DINIED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),
          prisma.offer.count({
            //36 ALL INTERNATIONAL INVALID PROMO OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              specialPromotion: {
                isNot: null,
              },
              validation: {
                status: "DINIED",
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "DINIED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "DINIED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //37 ALL INTERNATIONAL SUSPEND BASE OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              specialPromotion: {
                is: null,
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "SUSPENDED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "SUSPENDED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),
          prisma.offer.count({
            //38 ALL INTERNATIONAL SUSPEND PROMO OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              specialPromotion: {
                isNot: null,
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "SUSPENDED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "SUSPENDED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////

          //////////////////////////////////////
          ///////////////////ROAMING///////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //39 ALL ROAMING PENDING BASE OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),

          prisma.offer.count({
            //40 ALL ROAMING BASE OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              specialPromotion: {
                is: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),
          prisma.offer.count({
            //41 ALL ROAMING PROMO OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              specialPromotion: {
                isNot: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),

          prisma.offer.count({
            //42 ALL ROAMING PENDING BASE OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              status: "PENDING",

              specialPromotion: {
                is: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),
          prisma.offer.count({
            //43 ALL ROAMING PENDING PROMO OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              status: "PENDING",
              specialPromotion: {
                isNot: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //44 ALL ROAMING DONE BASE OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              status: "DONE",
              specialPromotion: {
                is: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),
          prisma.offer.count({
            //45 ALL ROAMING DONE PROMO OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              status: "DONE",
              specialPromotion: {
                isNot: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //46 ALL ROAMING VALID BASE OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              specialPromotion: {
                is: null,
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "ALLOW",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "ALLOW",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),
          prisma.offer.count({
            //47 ALL ROAMING VALID PROMO OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              specialPromotion: {
                isNot: null,
              },
              validation: {
                status: "ALLOW",
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "ALLOW",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "ALLOW",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),

          // //////////////////////////////////////
          // //////////////////////////////////////
          // //////////////////////////////////////

          prisma.offer.count({
            //48 ALL ROAMING INVALID BASE OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              specialPromotion: {
                is: null,
              },
              validation: {
                status: "DINIED",
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "DINIED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "DINIED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),
          prisma.offer.count({
            //49 ALL ROAMING INVALID PROMO OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              specialPromotion: {
                isNot: null,
              },
              validation: {
                status: "DINIED",
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "DINIED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "DINIED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //50 ALL ROAMING SUSPEND BASE OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              specialPromotion: {
                is: null,
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "SUSPENDED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "SUSPENDED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),
          prisma.offer.count({
            //51 ALL ROAMING SUSPEND PROMO OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              specialPromotion: {
                isNot: null,
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "SUSPENDED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "SUSPENDED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //52 ALL ALLOW OFFERS
            where: {
              OR: [
                {
                  validation: {
                    status: "ALLOW",
                  },
                },
                {
                  monitorings: {
                    some: {
                      validation: {
                        status: "ALLOW",
                      },
                    },
                  },
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),

          prisma.offer.count({
            //53 ALL DENIED OFFERS
            where: {
              OR: [
                {
                  validation: {
                    status: "DINIED",
                  },
                },
                {
                  monitorings: {
                    some: {
                      validation: {
                        status: "DINIED",
                      },
                    },
                  },
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),

          prisma.offer.count({
            //54 ALL SUSPENDED OFFERS
            where: {
              OR: [
                {
                  validation: {
                    status: "SUSPENDED",
                  },
                },
                {
                  monitorings: {
                    some: {
                      validation: {
                        status: "SUSPENDED",
                      },
                    },
                  },
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),

          prisma.offer.count({
            //55 ALL PENDING OFFERS
            where: {
              status: "PENDING",
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),
          prisma.offer.count({
            //56 ALL DONE OFFERS
            where: {
              status: "DONE",
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),

          /////////////NATIONAL//////////////

          prisma.offer.count({
            //58 ALL NATIONAL ALLOW OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              OR: [
                {
                  validation: {
                    status: "ALLOW",
                  },
                },
                {
                  monitorings: {
                    some: {
                      validation: {
                        status: "ALLOW",
                      },
                    },
                  },
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),
          prisma.offer.count({
            //59 ALL NATIONAL DENIED OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              OR: [
                {
                  validation: {
                    status: "DINIED",
                  },
                },
                {
                  monitorings: {
                    some: {
                      validation: {
                        status: "DINIED",
                      },
                    },
                  },
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),
          prisma.offer.count({
            //60 ALL NATIONAL SUSPENDED OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              OR: [
                {
                  validation: {
                    status: "SUSPENDED",
                  },
                },
                {
                  monitorings: {
                    some: {
                      validation: {
                        status: "SUSPENDED",
                      },
                    },
                  },
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),
          prisma.offer.count({
            //61 ALL NATIONAL PENDING OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              status: "PENDING",
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),
          prisma.offer.count({
            //62 ALL NATIONAL DONE OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              status: "DONE",
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              category: _categ,
            },
          }),

          /////////////INTERNATIONAL//////////////

          prisma.offer.count({
            //63 ALL INTERNATIONAL ALLOW OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              OR: [
                {
                  validation: {
                    status: "ALLOW",
                  },
                },
                {
                  monitorings: {
                    some: {
                      validation: {
                        status: "ALLOW",
                      },
                    },
                  },
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),
          prisma.offer.count({
            //64 ALL INTERNATIONAL DENIED OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              OR: [
                {
                  validation: {
                    status: "DINIED",
                  },
                },
                {
                  monitorings: {
                    some: {
                      validation: {
                        status: "DINIED",
                      },
                    },
                  },
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),
          prisma.offer.count({
            //65 ALL INTERNATIONAL SUSPENDED OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              OR: [
                {
                  validation: {
                    status: "SUSPENDED",
                  },
                },
                {
                  monitorings: {
                    some: {
                      validation: {
                        status: "SUSPENDED",
                      },
                    },
                  },
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),
          prisma.offer.count({
            //66 ALL INTERNATIONAL PENDING OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              status: "PENDING",
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),
          prisma.offer.count({
            //67 ALL INTERNATIONAL DONE OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              status: "DONE",
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),

          /////////////ROAMING//////////////

          prisma.offer.count({
            //68 ALL ROAMING ALLOW OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              OR: [
                {
                  validation: {
                    status: "ALLOW",
                  },
                },
                {
                  monitorings: {
                    some: {
                      validation: {
                        status: "ALLOW",
                      },
                    },
                  },
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),
          prisma.offer.count({
            //69 ALL ROAMING DENIED OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              OR: [
                {
                  validation: {
                    status: "DINIED",
                  },
                },
                {
                  monitorings: {
                    some: {
                      validation: {
                        status: "DINIED",
                      },
                    },
                  },
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),
          prisma.offer.count({
            //70 ALL ROAMING SUSPENDED OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              OR: [
                {
                  validation: {
                    status: "SUSPENDED",
                  },
                },
                {
                  monitorings: {
                    some: {
                      validation: {
                        status: "SUSPENDED",
                      },
                    },
                  },
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),
          prisma.offer.count({
            //71 ALL ROAMING PENDING OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              status: "PENDING",
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),
          prisma.offer.count({
            //72 ALL ROAMING DONE OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              status: "DONE",
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              
              category: _categ,
            },
          }),
        ]);
        
      } else {

        weekBase = await prisma.$queryRaw`
        WITH weeks AS (
          SELECT generate_series(
            DATE_TRUNC('week', ${new Date(startDate)}::timestamp),
            DATE_TRUNC('week', ${new Date(endDate)}::timestamp),
            INTERVAL '1 week'
          ) AS week
        )
        SELECT 
          weeks.week,
          COUNT(o.*)::int AS count
        FROM weeks
        LEFT JOIN "Offer" o
          ON DATE_TRUNC('week', o."notifiDate") = weeks.week
          AND o."notifiDate" >= ${new Date(startDate)}
          AND o."notifiDate" < ${new Date(endDate)}
        AND o."operatorId" = ANY(${operatorIds})
   AND o."billingType" = ${_billType} :: "BillingType"

        LEFT JOIN "SpecialPromotion" sp
        ON sp."offerId" = o."id"
        AND sp."id" IS NULL

        GROUP BY weeks.week
        ORDER BY weeks.week;
      `;

        weekPromo = await prisma.$queryRaw`
        WITH weeks AS (
          SELECT generate_series(
            DATE_TRUNC('week', ${new Date(startDate)}::timestamp),
            DATE_TRUNC('week', ${new Date(endDate)}::timestamp),
            INTERVAL '1 week'
          ) AS week
        )
        SELECT 
          weeks.week,
          COUNT(o.*)::int AS count
        FROM weeks
        LEFT JOIN "Offer" o
          ON DATE_TRUNC('week', o."notifiDate") = weeks.week
          AND o."notifiDate" >= ${new Date(startDate)}
          AND o."notifiDate" < ${new Date(endDate)}
        AND o."operatorId" = ANY(${operatorIds})
   AND o."billingType" = ${_billType} :: "BillingType"

        LEFT JOIN "SpecialPromotion" sp
        ON sp."offerId" = o."id"
        AND sp."id" IS NOT NULL

        GROUP BY weeks.week
        ORDER BY weeks.week;
      `;

        weekMobile = await prisma.$queryRaw`
        WITH weeks AS (
          SELECT generate_series(
            DATE_TRUNC('week', ${new Date(startDate)}::timestamp),
            DATE_TRUNC('week', ${new Date(endDate)}::timestamp),
            INTERVAL '1 week'
          ) AS week
        )
        SELECT 
          weeks.week,
          COUNT(o.*)::int AS count
        FROM weeks
        LEFT JOIN "Offer" o
          ON DATE_TRUNC('week', o."notifiDate") = weeks.week
          AND o."notifiDate" >= ${new Date(startDate)}
          AND o."notifiDate" < ${new Date(endDate)}
        AND o."operatorId" = ANY(${operatorIds})
        AND o."category" = ${"MOBILE"}::"OfferCategory"
   AND o."billingType" = ${_billType} :: "BillingType"

        GROUP BY weeks.week
        ORDER BY weeks.week;
      `;

        weekFixe = await prisma.$queryRaw`
        WITH weeks AS (
          SELECT generate_series(
            DATE_TRUNC('week', ${new Date(startDate)}::timestamp),
            DATE_TRUNC('week', ${new Date(endDate)}::timestamp),
            INTERVAL '1 week'
          ) AS week
        )
        SELECT 
          weeks.week,
          COUNT(o.*)::int AS count
        FROM weeks
        LEFT JOIN "Offer" o
          ON DATE_TRUNC('week', o."notifiDate") = weeks.week
          AND o."notifiDate" >= ${new Date(startDate)}
          AND o."notifiDate" < ${new Date(endDate)}
        AND o."operatorId" = ANY(${operatorIds})
        AND o."category" = ${"FIXE"}::"OfferCategory"
   AND o."billingType" = ${_billType} :: "BillingType"

        GROUP BY weeks.week
        ORDER BY weeks.week;
      `;

        stats = await Promise.all([
          prisma.offer.count({
            where: {
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }), //0LL OFFERS

          prisma.offer.count({
            //1 ALL BASE OFFERS
            where: {
              specialPromotion: {
                is: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),
          prisma.offer.count({
            //2 ALL PROMO OFFERS
            where: {
              specialPromotion: {
                isNot: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),

          // //////////////////////////////////////
          // //////////////////////////////////////
          // //////////////////////////////////////

          prisma.offer.count({
            //3 ALL PENDING BASE OFFERS
            where: {
              status: "PENDING",
              specialPromotion: {
                is: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),
          prisma.offer.count({
            //4 ALL PENDING PROMO OFFERS
            where: {
              status: "PENDING",
              specialPromotion: {
                isNot: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),

          // //////////////////////////////////////
          // //////////////////////////////////////
          // //////////////////////////////////////

          prisma.offer.count({
            //5 ALL DONE BASE OFFERS
            where: {
              status: "DONE",
              specialPromotion: {
                is: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),
          prisma.offer.count({
            //6 ALL DONE PROMO OFFERS
            where: {
              status: "DONE",
              specialPromotion: {
                isNot: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),

          // //////////////////////////////////////
          // //////////////////////////////////////
          // //////////////////////////////////////

          prisma.offer.count({
            //7 ALL VALID BASE OFFERS
            where: {
              specialPromotion: {
                is: null,
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "ALLOW",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "ALLOW",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),
          prisma.offer.count({
            //8 ALL VALID PROMO OFFERS
            where: {
              specialPromotion: {
                isNot: null,
              },
              validation: {
                status: "ALLOW",
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "ALLOW",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "ALLOW",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),

          // //////////////////////////////////////
          // //////////////////////////////////////
          // //////////////////////////////////////

          prisma.offer.count({
            //9 ALL INVALID BASE OFFERS
            where: {
              specialPromotion: {
                is: null,
              },
              validation: {
                status: "DINIED",
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "DINIED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "DINIED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),
          prisma.offer.count({
            //10 ALL INVALID PROMO OFFERS
            where: {
              specialPromotion: {
                isNot: null,
              },
              validation: {
                status: "DINIED",
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "DINIED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "DINIED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //11 ALL SUSPEND BASE OFFERS
            where: {
              specialPromotion: {
                is: null,
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "SUSPENDED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "SUSPENDED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),
          prisma.offer.count({
            //12 ALL SUSPEND PROMO OFFERS
            where: {
              specialPromotion: {
                isNot: null,
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "SUSPENDED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "SUSPENDED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////

          //////////////////////////////////////
          ///////////////////NATIONAL///////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //13 ALL NATIONAL PENDING BASE OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),

          prisma.offer.count({
            //14 ALL NATIONAL BASE OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              specialPromotion: {
                is: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),
          prisma.offer.count({
            //15 ALL NATIONAL PROMO OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              specialPromotion: {
                isNot: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),

          prisma.offer.count({
            //16 ALL NATIONAL PENDING BASE OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              status: "PENDING",

              specialPromotion: {
                is: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),
          prisma.offer.count({
            //17 ALL NATIONAL PENDING PROMO OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              status: "PENDING",
              specialPromotion: {
                isNot: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //18 ALL NATIONAL DONE BASE OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              status: "DONE",
              specialPromotion: {
                is: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),
          prisma.offer.count({
            //19 ALL NATIONAL DONE PROMO OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              status: "DONE",
              specialPromotion: {
                isNot: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //20 ALL NATIONAL VALID BASE OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              specialPromotion: {
                is: null,
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "ALLOW",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "ALLOW",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),
          prisma.offer.count({
            //21 ALL NATIONAL VALID PROMO OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              specialPromotion: {
                isNot: null,
              },
              validation: {
                status: "ALLOW",
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "ALLOW",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "ALLOW",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),

          // //////////////////////////////////////
          // //////////////////////////////////////
          // //////////////////////////////////////

          prisma.offer.count({
            //22 ALL NATIONAL INVALID BASE OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              specialPromotion: {
                is: null,
              },
              validation: {
                status: "DINIED",
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "DINIED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "DINIED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),
          prisma.offer.count({
            //23 ALL NATIONAL INVALID PROMO OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              specialPromotion: {
                isNot: null,
              },
              validation: {
                status: "DINIED",
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "DINIED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "DINIED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //24 ALL NATIONAL SUSPEND BASE OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              specialPromotion: {
                is: null,
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "SUSPENDED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "SUSPENDED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),
          prisma.offer.count({
            //25 ALL NATIONAL SUSPEND PROMO OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              specialPromotion: {
                isNot: null,
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "SUSPENDED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "SUSPENDED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////

          //////////////////////////////////////
          ///////////////////INTERNATIONAL///////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //26 ALL INTERNATIONAL PENDING BASE OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),

          prisma.offer.count({
            //27 ALL INTERNATIONAL BASE OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              specialPromotion: {
                is: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),
          prisma.offer.count({
            //28 ALL INTERNATIONAL PROMO OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              specialPromotion: {
                isNot: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),

          prisma.offer.count({
            //29 ALL INTERNATIONAL PENDING BASE OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              status: "PENDING",

              specialPromotion: {
                is: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),
          prisma.offer.count({
            //30 ALL INTERNATIONAL PENDING PROMO OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              status: "PENDING",
              specialPromotion: {
                isNot: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //31 ALL INTERNATIONAL DONE BASE OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              status: "DONE",
              specialPromotion: {
                is: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),
          prisma.offer.count({
            //32 ALL INTERNATIONAL DONE PROMO OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              status: "DONE",
              specialPromotion: {
                isNot: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //33 ALL INTERNATIONAL VALID BASE OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              specialPromotion: {
                is: null,
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "ALLOW",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "ALLOW",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),
          prisma.offer.count({
            //34 ALL INTERNATIONAL VALID PROMO OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              specialPromotion: {
                isNot: null,
              },
              validation: {
                status: "ALLOW",
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "ALLOW",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "ALLOW",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),

          // //////////////////////////////////////
          // //////////////////////////////////////
          // //////////////////////////////////////

          prisma.offer.count({
            //35 ALL INTERNATIONAL INVALID BASE OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              specialPromotion: {
                is: null,
              },
              validation: {
                status: "DINIED",
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "DINIED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "DINIED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),
          prisma.offer.count({
            //36 ALL INTERNATIONAL INVALID PROMO OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              specialPromotion: {
                isNot: null,
              },
              validation: {
                status: "DINIED",
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "DINIED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "DINIED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //37 ALL INTERNATIONAL SUSPEND BASE OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              specialPromotion: {
                is: null,
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "SUSPENDED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "SUSPENDED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),
          prisma.offer.count({
            //38 ALL INTERNATIONAL SUSPEND PROMO OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              specialPromotion: {
                isNot: null,
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "SUSPENDED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "SUSPENDED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////

          //////////////////////////////////////
          ///////////////////ROAMING///////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //39 ALL ROAMING PENDING BASE OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),

          prisma.offer.count({
            //40 ALL ROAMING BASE OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              specialPromotion: {
                is: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),
          prisma.offer.count({
            //41 ALL ROAMING PROMO OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              specialPromotion: {
                isNot: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),

          prisma.offer.count({
            //42 ALL ROAMING PENDING BASE OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              status: "PENDING",

              specialPromotion: {
                is: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),
          prisma.offer.count({
            //43 ALL ROAMING PENDING PROMO OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              status: "PENDING",
              specialPromotion: {
                isNot: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //44 ALL ROAMING DONE BASE OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              status: "DONE",
              specialPromotion: {
                is: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),
          prisma.offer.count({
            //45 ALL ROAMING DONE PROMO OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              status: "DONE",
              specialPromotion: {
                isNot: null,
              },
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //46 ALL ROAMING VALID BASE OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              specialPromotion: {
                is: null,
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "ALLOW",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "ALLOW",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),
          prisma.offer.count({
            //47 ALL ROAMING VALID PROMO OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              specialPromotion: {
                isNot: null,
              },
              validation: {
                status: "ALLOW",
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "ALLOW",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "ALLOW",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),

          // //////////////////////////////////////
          // //////////////////////////////////////
          // //////////////////////////////////////

          prisma.offer.count({
            //48 ALL ROAMING INVALID BASE OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              specialPromotion: {
                is: null,
              },
              validation: {
                status: "DINIED",
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "DINIED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "DINIED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),
          prisma.offer.count({
            //49 ALL ROAMING INVALID PROMO OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              specialPromotion: {
                isNot: null,
              },
              validation: {
                status: "DINIED",
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "DINIED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "DINIED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //50 ALL ROAMING SUSPEND BASE OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              specialPromotion: {
                is: null,
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "SUSPENDED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "SUSPENDED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),
          prisma.offer.count({
            //51 ALL ROAMING SUSPEND PROMO OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              specialPromotion: {
                isNot: null,
              },
              AND: [
                {
                  OR: [
                    {
                      validation: {
                        status: "SUSPENDED",
                      },
                    },
                    {
                      monitorings: {
                        some: {
                          validation: {
                            status: "SUSPENDED",
                          },
                        },
                      },
                    },
                  ],
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),

          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////
          //////////////////////////////////////

          prisma.offer.count({
            //52 ALL ALLOW OFFERS
            where: {
              OR: [
                {
                  validation: {
                    status: "ALLOW",
                  },
                },
                {
                  monitorings: {
                    some: {
                      validation: {
                        status: "ALLOW",
                      },
                    },
                  },
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),

          prisma.offer.count({
            //53 ALL DENIED OFFERS
            where: {
              OR: [
                {
                  validation: {
                    status: "DINIED",
                  },
                },
                {
                  monitorings: {
                    some: {
                      validation: {
                        status: "DINIED",
                      },
                    },
                  },
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),

          prisma.offer.count({
            //54 ALL SUSPENDED OFFERS
            where: {
              OR: [
                {
                  validation: {
                    status: "SUSPENDED",
                  },
                },
                {
                  monitorings: {
                    some: {
                      validation: {
                        status: "SUSPENDED",
                      },
                    },
                  },
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),

          prisma.offer.count({
            //55 ALL PENDING OFFERS
            where: {
              status: "PENDING",
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),
          prisma.offer.count({
            //56 ALL DONE OFFERS
            where: {
              status: "DONE",
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),

          /////////////NATIONAL//////////////

          prisma.offer.count({
            //58 ALL NATIONAL ALLOW OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              OR: [
                {
                  validation: {
                    status: "ALLOW",
                  },
                },
                {
                  monitorings: {
                    some: {
                      validation: {
                        status: "ALLOW",
                      },
                    },
                  },
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),
          prisma.offer.count({
            //59 ALL NATIONAL DENIED OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              OR: [
                {
                  validation: {
                    status: "DINIED",
                  },
                },
                {
                  monitorings: {
                    some: {
                      validation: {
                        status: "DINIED",
                      },
                    },
                  },
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),
          prisma.offer.count({
            //60 ALL NATIONAL SUSPENDED OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              OR: [
                {
                  validation: {
                    status: "SUSPENDED",
                  },
                },
                {
                  monitorings: {
                    some: {
                      validation: {
                        status: "SUSPENDED",
                      },
                    },
                  },
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),
          prisma.offer.count({
            //61 ALL NATIONAL PENDING OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              status: "PENDING",
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),
          prisma.offer.count({
            //62 ALL NATIONAL DONE OFFERS
            where: {
              area: {
                title: "NATIONAL",
              },
              status: "DONE",
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              category: _categ,
            },
          }),

          /////////////INTERNATIONAL//////////////

          prisma.offer.count({
            //63 ALL INTERNATIONAL ALLOW OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              OR: [
                {
                  validation: {
                    status: "ALLOW",
                  },
                },
                {
                  monitorings: {
                    some: {
                      validation: {
                        status: "ALLOW",
                      },
                    },
                  },
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),
          prisma.offer.count({
            //64 ALL INTERNATIONAL DENIED OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              OR: [
                {
                  validation: {
                    status: "DINIED",
                  },
                },
                {
                  monitorings: {
                    some: {
                      validation: {
                        status: "DINIED",
                      },
                    },
                  },
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),
          prisma.offer.count({
            //65 ALL INTERNATIONAL SUSPENDED OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              OR: [
                {
                  validation: {
                    status: "SUSPENDED",
                  },
                },
                {
                  monitorings: {
                    some: {
                      validation: {
                        status: "SUSPENDED",
                      },
                    },
                  },
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),
          prisma.offer.count({
            //66 ALL INTERNATIONAL PENDING OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              status: "PENDING",
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),
          prisma.offer.count({
            //67 ALL INTERNATIONAL DONE OFFERS
            where: {
              area: {
                title: "INTERNATIONAL",
              },
              status: "DONE",
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),

          /////////////ROAMING//////////////

          prisma.offer.count({
            //68 ALL ROAMING ALLOW OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              OR: [
                {
                  validation: {
                    status: "ALLOW",
                  },
                },
                {
                  monitorings: {
                    some: {
                      validation: {
                        status: "ALLOW",
                      },
                    },
                  },
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),
          prisma.offer.count({
            //69 ALL ROAMING DENIED OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              OR: [
                {
                  validation: {
                    status: "DINIED",
                  },
                },
                {
                  monitorings: {
                    some: {
                      validation: {
                        status: "DINIED",
                      },
                    },
                  },
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),
          prisma.offer.count({
            //70 ALL ROAMING SUSPENDED OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              OR: [
                {
                  validation: {
                    status: "SUSPENDED",
                  },
                },
                {
                  monitorings: {
                    some: {
                      validation: {
                        status: "SUSPENDED",
                      },
                    },
                  },
                },
              ],
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),
          prisma.offer.count({
            //71 ALL ROAMING PENDING OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              status: "PENDING",
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),
          prisma.offer.count({
            //72 ALL ROAMING DONE OFFERS
            where: {
              area: {
                title: "ROAMING",
              },
              status: "DONE",
              notifiDate: {
                gte: _start, // date début
                lte: _end, // date fin
              },
              
              operator: {
                id: Number(operatorIds)
              },
              billingType: _billType,
              category: _categ,
            },
          }),
        ]);
      }

      //Nombre d'offre par semaine

      const _offers = stats?.[57];

      let _operOffers = null;

      if (operators?.length > 0) {
        operators?.forEach((oper) => {
          _operOffers = { ..._operOffers };

          _operOffers["nb" + oper.name] = 0;
          _operOffers["nbMobile" + oper.name] = 0;
          _operOffers["nbFixe" + oper.name] = 0;
          _operOffers["nbBase" + oper.name] = 0;
          _operOffers["nbPromo" + oper.name] = 0;
          _operOffers["nbNat" + oper.name] = 0;
          _operOffers["nbInt" + oper.name] = 0;
          _operOffers["nbRoam" + oper.name] = 0;
        });
      }

      if (_offers?.length > 0) {
        _offers.forEach((offer) => {
          operators?.forEach((oper) => {
            if (offer?.operatorId == oper?.id) {
              _operOffers["nb" + oper.name] = _operOffers["nb" + oper.name] + 1;

              _operOffers["nbMobile" + oper.name] =
                _operOffers["nbMobile" + oper.name] + 1;
              _operOffers["nbFixe" + oper.name] =
                _operOffers["nbFixe" + oper.name] + 1;

              if (offer.specialPromotion == null) {
                _operOffers["nbBase" + oper.name] =
                  _operOffers["nbBase" + oper.name] + 1;
              }
              if (offer.specialPromotion != null) {
                _operOffers["nbPromo" + oper.name] =
                  _operOffers["nbPromo" + oper.name] + 1;
              }
              if (offer.area.title == "NATIONAL") {
                _operOffers["nbNat" + oper.name] =
                  _operOffers["nbNat" + oper.name] + 1;
              }
              if (offer.area.title == "INTERNATIONAL") {
                _operOffers["nbInt" + oper.name] =
                  _operOffers["nbInt" + oper.name] + 1;
              }
              if (offer.area.title == "ROAMING") {
                _operOffers["nbRoam" + oper.name] =
                  _operOffers["nbRoam" + oper.name] + 1;
              }
            }
          });
        });
      }

      const _stats = {
        nbOffers: stats?.[0],
        nbBase: stats?.[1],
        nbPromo: stats?.[2],

        perVar: stats?.[0],

        nbBasePending: stats?.[3],
        nbPromoPending: stats?.[4],

        nbBaseDone: stats?.[5],
        nbPromoDone: stats?.[6],

        nbBaseValid: stats?.[7],
        nbPromoValid: stats?.[8],

        nbBaseInvalid: stats?.[9],
        nbPromoInvalid: stats?.[10],

        nbBaseSuspended: stats?.[11],
        nbPromoSuspended: stats?.[12],

        //////////////////////////////////////
        /////////////////NATIONAL/////////////////////
        //////////////////////////////////////

        nbNatOffers: stats?.[13],

        nbNatBase: stats?.[14],
        nbNatPromo: stats?.[15],

        perNatVar: 0,

        nbNatBasePending: stats?.[16],
        nbNatPromoPending: stats?.[17],

        nbNatBaseDone: stats?.[18],
        nbNatPromoDone: stats?.[19],

        nbNatBaseValid: stats?.[20],
        nbNatPromoValid: stats?.[21],

        nbNatBaseInvalid: stats?.[22],
        nbNatPromoInvalid: stats?.[23],

        nbNatBaseSuspended: stats?.[24],
        nbNatPromoSuspended: stats?.[25],

        //////////////////////////////////////
        ////////////////INTERNATIONALE//////////////////////
        //////////////////////////////////////

        nbInterOffers: stats?.[26],

        nbInterBase: stats?.[27],
        nbInterPromo: stats?.[28],

        perNatVar: 0,

        nbInterBasePending: stats?.[29],
        nbInterPromoPending: stats?.[30],

        nbInterBaseDone: stats?.[31],
        nbInterPromoDone: stats?.[32],

        nbInterBaseValid: stats?.[33],
        nbInterPromoValid: stats?.[34],

        nbInterBaseInvalid: stats?.[35],
        nbInterPromoInvalid: stats?.[36],

        nbInterBaseSuspended: stats?.[37],
        nbInterPromoSuspended: stats?.[38],

        //////////////////////////////////////
        //////////////////////////////////////
        //////////////////////////////////////

        nbRoamOffers: stats?.[39],

        nbRoamBase: stats?.[40],
        nbRoamPromo: stats?.[41],

        perNatVar: 0,

        nbRoamBasePending: stats?.[42],
        nbRoamPromoPending: stats?.[43],

        nbRoamBaseDone: stats?.[44],
        nbRoamPromoDone: stats?.[45],

        nbRoamBaseValid: stats?.[46],
        nbRoamPromoValid: stats?.[47],

        nbRoamBaseInvalid: stats?.[48],
        nbRoamPromoInvalid: stats?.[49],

        nbRoamBaseSuspended: stats?.[50],
        nbRoamPromoSuspended: stats?.[51],

        //////////////////////////////////////
        //////////////////////////////////////
        //////////////////////////////////////

        nbValid: stats?.[52],
        nbInvalide: stats?.[53],
        nbSuspended: stats?.[54],
        nbPending: stats?.[55],
        nbDone: stats?.[56],

        nbNatValid: stats?.[58],
        nbNatInvalid: stats?.[58],
        nbNatPending: stats?.[59],
        nbNatSuspended: stats?.[60],
        nbNatDone: stats?.[61],

        nbInterNatValid: stats?.[62],
        nbInterNatInvalid: stats?.[63],
        nbInterNatPending: stats?.[64],
        nbInterNatSuspended: stats?.[65],
        nbInterNatDone: stats?.[66],

        nbIRoamValid: stats?.[67],
        nbRoamInvalid: stats?.[68],
        nbRoamPending: stats?.[69],
        nbRoamSuspended: stats?.[70],
        nbRoamDone: stats?.[71],

        //////////////////////////////////////
        //////////////////////////////////////
        //////////////////////////////////////

        operOffers: _operOffers,
        weekData: resultWeek,

        weekBase: weekBase,
        weekPromo: weekPromo,
        weekMobile: weekMobile,
        weekFixe: weekFixe,
      };

      res.status(200).json(_stats);
    } catch (error) {
      serverError(res, error, "pages/api/operator/statistics/genOperStatistics.js");
    } finally {
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// Autorisation vérifiée côté serveur (session + permission, périmètre opérateur).
export default guardRoute(handler, { methods: { POST: PERMISSIONS.STATISTICS_READ }, focalPoint: "operator" });
