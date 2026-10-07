// pages/api/users/index.js
import prisma from "@/services/config/auth/prisma";
import { FKTND_H } from "@/services/tools/constants";
import { generateRandomString } from "@/services/tools/helper";
import { requireEditableOffer } from "@/services/workflow/offerGuards";
import { serverError } from "@/services/config/apiError";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { offerId, formulas, verskth } = req.body;
    if (verskth != FKTND_H) {
      return res.status(405).json({ message: "Requête non autorisée" });
    }

    // Session, droits, opérateur et absence de décision (moteur de workflow).
    if (!(await requireEditableOffer(req, res, offerId))) return;

    if (!formulas) {
      res.status(400).json({ error: "Pas de formule !. " });
      return;
    }

    try {
      const services = await prisma.service.findMany();

      for (const formula of formulas) {
        const form = await prisma.offerFormula.create({
          data: {
            code: "FORM-" + Date.now(),
            title: formula?.title,
            offer: {
              connect: { id: Number(offerId) },
            },
            validity: Number(formula?.settlement?.validity),
          },
        });

        if (formula?.advantages) {
          for (const advan of formula?.advantages) {
            await prisma.formulaAdvantage.create({
              data: {
                code: "ADV-" + Date.now(),
                title: advan.name,
                description: advan?.description,
                formula: {
                  connect: { id: Number(form.id) },
                },
              },
            });
          }
        }

        await createDetailService(form?.id, formula, services);

        if (formula?.children) {
          await creatFromulaChild(formula, offerId, services);
        }
      }

      res.status(201).json({ error: false });
    } catch (error) {
      serverError(res, error, "pages/api/admin/offer/saveFormula.js");
    } finally {
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

const createDetailService = async (formId, form, servs) => {
  if (form.type == "price") {
    await prisma.offerPrice.create({
      data: {
        code: "PRI-" + Date.now(),
        value: Number(form?.settlement?.price),
        formula: {
          connect: { id: Number(formId) },
        },
      },
    });

    await Promise.all(
      servs.map((s) => {
        let _on = "ALL_NET";
        if (form?.settlement?.services?.["comType" + s?.title] == "onNet") {
          _on = "ON_NET";
        } else if (
          form?.settlement?.services?.["comType" + s?.title] == "offNet"
        ) {
          _on = "OFF_NET";
        }
        if (form.settlement?.services?.[s?.title] === true) {
          return prisma.offerServiceDetail.create({
            data: {
              code: "OFF-SD-" + Date.now() + generateRandomString(8),
              quantity: Number(
                form?.settlement?.services?.["quantity" + s?.title],
              ),
              billingSteps: form?.settlement?.services?.["bStep" + s?.title]
                ? Number(form?.settlement?.services?.["bStep" + s?.title])
                : null,
              service: {
                connect: { id: Number(s?.id) },
              },
              formula: {
                connect: { id: Number(formId) },
              },
              comtype: _on,
            },
          });
        }
      }),
    );
  } else if (form.type == "bill") {
    await Promise.all(
      servs?.map(async (s) => {
        if (form?.settlement?.service == s.title) {
          // Le détail doit exister (id connu) avant d'y rattacher le tarif appliqué.
          const servD = await prisma.offerServiceDetail.create({
            data: {
              code: "OFF-SD-" + Date.now(),
              quantity: Number(form?.settlement?.quantity),
              billingSteps: form?.settlement?.billingStep
                ? Number(form?.settlement?.billingStep)
                : null,
              service: {
                connect: { id: Number(s?.id) },
              },
              formula: {
                connect: { id: Number(formId) },
              },
            },
          });

          if (form?.settlement?.rateApplied) {
            await prisma.offerRate.create({
              data: {
                code: "RAT-" + Date.now(),
                value: Number(form?.settlement?.rateApplied),
                serviceDetail: {
                  connect: { id: Number(servD.id) },
                },
              },
            });
          }

          return servD;
        }
      }),
    );
  }
};

const creatFromulaChild = async (form, offerId, services) => {
  const children = form?.children;

  if (Array.isArray(children) && children.length > 0) {
    for (const child of children) {
      const f = await prisma.offerFormula.create({
        data: {
          code: "FORM-" + Date.now() + generateRandomString(8),
          title: child.title,
          validity: Number(child?.settlement?.validity),
          offer: {
            connect: { id: Number(offerId) },
          },
          parent: {
            connect: { id: Number(form?.id) },
          },
        },
      });

      createDetailService(f?.id, child, services);

      if (child?.children) {
        creatFromulaChild(child, offerId, services);
      }
    }
  }
};
