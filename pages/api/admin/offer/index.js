// pages/api/users/index.js
import prisma from "@/services/config/auth/prisma";
import {
  resolveCreationContext,
  finalizeCreatedOffer,
} from "@/services/workflow/offerCreation";
import { requireOfferSubmissionTicket } from "@/services/config/submission/offerSubmissionGuard";
import { buildPromotionData } from "@/services/tools/promotion";
import { FKTND_H } from "@/services/tools/constants";
import { generateRandomString } from "@/services/tools/helper";
import { serverError } from "@/services/config/apiError";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const {
      offerType,
      code,
      title,
      promoType,
      category,
      notifiDate,
      startDate,
      duration,
      billingType,
      target,
      documentPath,
      description,
      partner,
      submissionTicket,
      verskth,
    } = req.body;

    if (verskth != FKTND_H) {
      return res.status(405).json({ message: "Requête non autorisée" });
    }

    // SÉCURITÉ : auteur et opérateur viennent de la session (voir
    // services/workflow/offerCreation.js) ; `userId` et, pour un point focal,
    // `operatorId` du corps de la requête ne sont plus pris en compte.
    const ctx = await resolveCreationContext(req, res);
    if (!ctx) return;
    const { actor, operatorId, submit } = ctx;

    if (
      !code ||
      !title ||
      !category ||
      !notifiDate ||
      !startDate ||
      !billingType
    ) {
      res.status(400).json({ error: "Tous les champs sont requis. " + code });
      return;
    }

    // Validation par code : obligatoire pour un point focal d'opérateur,
    // sans objet pour l'administrateur. Le jeton est consommé maintenant, de
    // sorte qu'aucune offre ne puisse exister sans validation aboutie.
    // Un brouillon n'est pas une soumission : le code n'est exigé qu'au
    // moment où l'offre part effectivement en validation.
    const guard = submit
      ? await requireOfferSubmissionTicket({
          userId: actor.id,
          reference: code,
          ticket: submissionTicket,
          operatorId,
        })
      : { ok: true, required: false, link: async () => {}, release: async () => {} };
    if (!guard.ok) {
      return res
        .status(guard.status || 403)
        .json({ error: guard.error, reason: guard.reason });
    }

    // Une declaration promotionnelle incomplete est refusee AVANT toute
    // ecriture. Auparavant, l offre etait creee puis la promotion echouait (ou
    // n etait meme pas tentee) : il en restait une offre de base.
    const promotion = buildPromotionData({ offerType, promoType, duration });
    if (!promotion.ok) {
      await guard.release();
      return res.status(400).json({ error: promotion.error });
    }

    try {
      let doc = null;
      if (documentPath) {
        doc = await prisma.document.create({
          data: {
            code: "DOC-" + Date.now(),
            path: documentPath,
          },
        });
      }

      // Un seul jeu de donnees : les deux branches (avec ou sans document)
      // dupliquaient le meme objet, au risque de diverger.
      const data = {
        code: "OFF" + Date.now(),
        title: title,
        description: description,
        category: Number(category) === 1 ? "MOBILE" : "FIXE",
        notifiDate: new Date(notifiDate),
        desiredDate: new Date(startDate),
        billingType: Number(billingType) == 1 ? "PREPAID" : "POSTPAID",
        target: target,
        partner: partner ? partner : null,
        // BUGFIX: le statut n etait pas renseigne a la creation. Toute offre
        // declaree naissait avec Offer.status a NULL : absente des compteurs
        // du calendrier, et STATUS[null] y faisait planter le rendu.
        // Une offre declaree est en attente de validation.
        status: "PENDING",
        user: {
          connect: {
            id: actor.id,
          },
        },
        operator: {
          connect: {
            id: Number(operatorId),
          },
        },
        ...(doc ? { document: { connect: { id: doc.id } } } : {}),
        // La promotion est creee AVEC l offre : son echec annule desormais la
        // declaration entiere, au lieu de laisser une offre de base orpheline.
        ...(promotion.data
          ? { specialPromotion: { create: promotion.data } }
          : {}),
      };

      const offer = await prisma.offer.create({ data });

      // Trace : le code validé est rattaché a l offre qu il a autorisee.
      await guard.link(offer?.id);

      // Etat initial (soumise ou brouillon), journal d audit et notifications
      // du workflow : tout passe par le moteur, plus aucune notification n est
      // composee ici.
      await finalizeCreatedOffer(offer.id, actor, submit);

      res.status(201).json(offer);
    } catch (error) {
      // L offre n a pas ete enregistree : le code validé est rendu, sans quoi
      // le point focal devrait en demander un nouveau pour rien.
      await guard.release();
      serverError(res, error, "pages/api/admin/offer/index.js");
    } finally {
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
