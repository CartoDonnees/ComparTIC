import prisma from "@/services/config/auth/prisma";
import { FKTND_H } from "@/services/tools/constants";
import { buildPromotionData } from "@/services/tools/promotion";
import { UNKNOWN_OFFER_CODE } from "@/services/tools/parentOffers";
import { requireActor } from "@/services/config/auth/session";
import { PERMISSIONS } from "@/services/rbac/permissions";
import {
  WORKFLOW_ACTIONS,
  loadOfferContext,
  assertAction,
  recordOfferUpdate,
} from "@/services/workflow/offerWorkflow";
import { sendError } from "@/services/workflow/apiErrors";

/**
 * Mise à jour d'une offre existante.
 *
 * POST /api/admin/offer/updateOffer
 *
 * Règles métier (appliquées ici, côté serveur, via le moteur de workflow) :
 *  - l'auteur est l'utilisateur de la SESSION (le `userId` du corps est ignoré) ;
 *  - profil autorisé à modifier (permission OFFER_UPDATE : le superviseur, en
 *    lecture seule, est refusé) ;
 *  - un point focal ne modifie que les offres de SON opérateur ;
 *  - une offre n'est modifiable que TANT QU'AUCUNE DÉCISION n'a été enregistrée
 *    (brouillon ou soumise, sans décision)   pour tous les profils. Ensuite,
 *    l'évolution passe par un monitoring (nouvelle version).
 *
 * Contrôle, écriture et journal d'audit sont faits dans une même transaction.
 */

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const {
    verskth,
    offerId,
    title,
    category,
    billingType,
    notifiDate,
    startDate,
    target,
    description,
    partner,
    link,
    documentPath,
    promoType,
    duration,
    offerType,
    // Rattachement à une offre parente. Trois cas distincts :
    //   absent  -> le rattachement actuel est conservé ;
    //   null    -> il est retiré ;
    //   un id   -> il est établi ou remplacé.
    parentOfferId,
  } = req.body || {};

  if (verskth != FKTND_H) {
    return res.status(405).json({ message: "Requête non autorisée" });
  }

  const actor = await requireActor(req, res, PERMISSIONS.OFFER_UPDATE);
  if (!actor) return;

  if (!offerId || !Number.isInteger(Number(offerId))) {
    return res.status(400).json({ error: "L'identifiant de l'offre est requis" });
  }

  try {
    // ---- 1-2. Offre concernée et droit de modification (moteur) ----------
    const offer = await loadOfferContext(prisma, Number(offerId));
    if (!offer) {
      return res.status(404).json({ error: "Cette offre n'existe pas" });
    }
    assertAction(offer, actor, WORKFLOW_ACTIONS.EDIT);

    // ---- 3. Construction du patch (seuls les champs fournis) --------------
    const data = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (target !== undefined) data.target = target;
    if (partner !== undefined) data.partner = partner || null;
    if (link !== undefined) data.link = link || null;

    if (category !== undefined && category !== null && category !== "") {
      // Accepte l'énuméré ("MOBILE") comme l'ancien codage numérique (1 / 2)
      data.category =
        category === "MOBILE" || Number(category) === 1 ? "MOBILE" : "FIXE";
    }
    if (billingType !== undefined && billingType !== null && billingType !== "") {
      if (billingType === "HYBRID" || Number(billingType) === 3) {
        data.billingType = "HYBRID";
      } else if (billingType === "PREPAID" || Number(billingType) === 1) {
        data.billingType = "PREPAID";
      } else {
        data.billingType = "POSTPAID";
      }
    }
    if (notifiDate) data.notifiDate = new Date(notifiDate);
    if (startDate) data.desiredDate = new Date(startDate);

    // ---- Offre parente : ajout, remplacement ou retrait -------------------
    //
    // Le champ existait à l'écran et présélectionnait bien la parente en cours,
    // mais le choix n'était transmis à AUCUNE route : il était purement et
    // simplement perdu à l'enregistrement. Les règles appliquées ici sont
    // celles de la déclaration (voir saveOfferWithParent), pour qu'une offre ne
    // puisse pas acquérir par modification un rattachement qu'elle n'aurait pas
    // pu obtenir à la création.
    if (parentOfferId !== undefined) {
      const wanted =
        parentOfferId === null || parentOfferId === "" ? null : Number(parentOfferId);

      if (wanted === null) {
        data.parent = { disconnect: true };
      } else if (!Number.isInteger(wanted)) {
        return res.status(400).json({ error: "Offre parente invalide." });
      } else if (wanted === Number(offerId)) {
        return res
          .status(400)
          .json({ error: "Une offre ne peut pas être sa propre offre parente." });
      } else {
        const parent = await prisma.offer.findUnique({
          where: { id: wanted },
          select: {
            id: true,
            code: true,
            operatorId: true,
            parentId: true,
            specialPromotion: { select: { id: true } },
          },
        });

        if (!parent) {
          return res.status(404).json({ error: "Offre parente introuvable." });
        }
        // Une offre déjà dérivée ou promotionnelle ne peut pas être parente :
        // cela vaut aussi pour les filles de l'offre modifiée, ce qui écarte
        // tout cycle.
        if (parent.specialPromotion || parent.parentId !== null) {
          return res.status(400).json({
            error:
              "Seule une offre de base peut servir d'offre parente : celle-ci est une offre promotionnelle ou dérivée.",
          });
        }
        // L'offre repère « Offre Inconnu » appartient à l'ARTCI et vaut pour
        // tous les opérateurs ; toute autre parente doit être du même opérateur.
        if (
          parent.code !== UNKNOWN_OFFER_CODE &&
          parent.operatorId !== offer.operatorId
        ) {
          return res
            .status(403)
            .json({ error: "L'offre parente appartient à un autre opérateur." });
        }
        // Une offre qui sert déjà de parente à d'autres offres peut elle-même
        // être rattachée : rien ne s'y oppose côté métier. Seule compte la
        // qualité de la parente choisie, contrôlée ci-dessus.
        data.parent = { connect: { id: parent.id } };
      }
    }

    // BUGFIX: le caractere promotionnel n etait reconnu que pour le type
    // SPECIAL. Modifier une offre FLASH, PERIODIQUE ou PERSONALISEE la faisait
    // basculer dans la branche « n est plus promotionnelle » ci-dessous, qui
    // SUPPRIMAIT sa promotion : l offre devenait une offre de base.
    // Le controle precede la mise a jour, pour ne rien ecrire si la
    // declaration promotionnelle est incomplete.
    const promotion = buildPromotionData({ offerType, promoType, duration });
    if (!promotion.ok) {
      return res.status(400).json({ error: promotion.error });
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Contrôle refait DANS la transaction : une décision prise entre-temps
      // rend l'offre non modifiable.
      assertAction(await loadOfferContext(tx, Number(offerId)), actor, WORKFLOW_ACTIONS.EDIT);

      // Nouveau document joint -> on le crée et on le rattache
      if (documentPath) {
        const doc = await tx.document.create({
          data: { code: "DOC-" + Date.now(), path: documentPath },
        });
        data.document = { connect: { id: doc.id } };
      }

      const saved = await tx.offer.update({
        where: { id: Number(offerId) },
        data,
      });

      // ---- 4. Promotion spéciale (créée / mise à jour / supprimée) --------
      const existingPromo = await tx.specialPromotion.findUnique({
        where: { offerId: Number(offerId) },
      });

      if (promotion.data) {
        if (existingPromo) {
          await tx.specialPromotion.update({
            where: { offerId: Number(offerId) },
            data: { type: promotion.data.type, duration: promotion.data.duration },
          });
        } else {
          await tx.specialPromotion.create({
            data: {
              ...promotion.data,
              offer: { connect: { id: Number(offerId) } },
            },
          });
        }
      } else if (existingPromo && offerType !== undefined) {
        // L'offre n'est plus promotionnelle
        await tx.specialPromotion.delete({
          where: { offerId: Number(offerId) },
        });
      }

      await recordOfferUpdate(offer, actor, {
        fields: Object.keys(data),
        promotion: promotion.data ? promotion.data.type : null,
      }, tx);
      return saved;
    });

    return res.status(200).json(updated);
  } catch (error) {
    return sendError(res, error, "updateOffer");
  }
}
