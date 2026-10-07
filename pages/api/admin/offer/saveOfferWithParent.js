

// pages/api/users/index.js
import { clientTypeConflict } from "@/services/tools/clientTypeRules";
import prisma from "@/services/config/auth/prisma";
import {
    resolveCreationContext,
    finalizeCreatedOffer,
} from "@/services/workflow/offerCreation";
import { requireOfferSubmissionTicket } from "@/services/config/submission/offerSubmissionGuard";
import { buildPromotionData } from "@/services/tools/promotion";
import { UNKNOWN_OFFER_CODE } from "@/services/tools/parentOffers";
import { generateRandomString } from "@/services/tools/helper";
import { FKTND_H } from "@/services/tools/constants";
import { serverError } from "@/services/config/apiError";

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const {
            parentOfferId,
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
            // `formulas` n est volontairement PAS repris : cette route ne les
            // enregistre pas (voir le controle des champs obligatoires ci-dessous).
            documentPath,
            description,
            partner,
            submissionTicket,
            verskth
        } = req.body;

        if (verskth != FKTND_H) {
            return res.status(405).json({ message: 'Requête non autorisée' });
        }

        // SECURITE : auteur et operateur viennent de la session ; `userId` et,
        // pour un point focal, `operatorId` du corps ne sont plus pris en compte.
        const ctx = await resolveCreationContext(req, res);
        if (!ctx) return;
        const { actor, operatorId, submit } = ctx;

        // BUGFIX: `formulas` figurait dans les champs obligatoires alors que
        // cette route ne s en sert PAS   les formules sont enregistrees juste
        // apres, par un appel distinct a `saveFormula`, exactement comme pour
        // une offre sans parente. La route rejetait donc sur un champ qu elle
        // ignore : des qu une offre parente etait choisie, l enregistrement
        // devenait impossible tant qu aucune formule n avait ete saisie, alors
        // que la meme offre SANS parente passait sans difficulte.
        if (!parentOfferId || !code || !title || !category || !notifiDate || !startDate || !billingType) {
            res.status(400).json({ error: 'Tous les champs sont requis. ' + code });
            return;
        }

        // Renseigne des que le jeton de soumission est consomme : le bloc
        // `catch` doit pouvoir le restituer si l enregistrement echoue.
        let guard = null;

        try {
            // Regle metier : seule une offre de BASE peut servir de parente, c est a
            // dire une offre ni promotionnelle ni elle-meme derivee. Le controle est
            // refait ici : la liste presentee a l ecran est filtree, mais rien
            // n empechait un appel direct de rattacher une offre a une promotion.
            const parentOffer = await prisma.offer.findUnique({
              where: { id: Number(parentOfferId) },
              select: { id: true, code: true, operatorId: true, parentId: true, billingType: true, specialPromotion: { select: { id: true } } },
            });
            if (!parentOffer) {
              return res.status(404).json({ error: "Offre parente introuvable." });
            }
            if (parentOffer.specialPromotion || parentOffer.parentId !== null) {
              return res.status(400).json({
                error:
                  "Seule une offre de base peut servir d offre parente : celle-ci est une offre promotionnelle ou derivee.",
              });
            }
            // BUGFIX: l offre repere « Offre Inconnu » appartient a l ARTCI et
            // sert d entree « offre parente inconnue » a TOUS les operateurs.
            // Le controle d appartenance la rejetait donc systematiquement :
            // choisir « Offre Inconnu » rendait l enregistrement impossible.
            const isUnknownParent = parentOffer.code === UNKNOWN_OFFER_CODE;
            if (
              !isUnknownParent &&
              operatorId &&
              Number(operatorId) !== parentOffer.operatorId
            ) {
              return res.status(403).json({
                error: "L offre parente appartient a un autre operateur.",
              });
            }

            // Type de client : meme regle qu a l import Excel (clientTypeRules).
            // « Offre Inconnu » n a pas de type opposable.
            if (!isUnknownParent) {
              const conflict = clientTypeConflict(Number(billingType) == 1 ? "PREPAID" : "POSTPAID", parentOffer.billingType, parentOffer.code);
              if (conflict) {
                return res.status(400).json({ error: conflict, code: "CLIENT_TYPE" });
              }
            }

            // Validation par code : obligatoire pour un point focal
            // d operateur, sans objet pour l administrateur. Le jeton est
            // consomme ici, apres les controles metier (un refus de regle ne
            // doit pas bruler le code) et avant toute ecriture : aucune offre
            // ne peut ainsi exister sans validation aboutie.
            guard = submit
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
            // Declaration promotionnelle : controlee avant toute ecriture (voir
            // services/tools/promotion.js). Le jeton vient d etre consomme, on
            // le restitue si la declaration est refusee ici.
            const promotion = buildPromotionData({ offerType, promoType, duration })
            if (!promotion.ok) {
                await guard.release()
                return res.status(400).json({ error: promotion.error })
            }

            let doc = null
            if (documentPath) {
                const ext = documentPath.split('.').pop();

                let _ext = ''
                if(ext == 'png' || ext == 'jpeg' || ext == 'jpg' ){

                }
                doc = await prisma.document.create({
                    data: {
                        code: 'DOC-' + Date.now(),
                        path: documentPath,
                    }
                })
            }
            const offer = await prisma.offer.create({
                data: {
                    code: code,
                    title: title,
                    description: description,
                    category: Number(category) === 1 ? 'MOBILE' : 'FIXE',
                    notifiDate: new Date(notifiDate),
                    desiredDate: new Date(startDate),
                    billingType: Number(billingType) == 1 ? 'PREPAID' : 'POSTPAID',
                    target: target,
                    partner:partner,
                    // BUGFIX: le statut n etait pas renseigne a la creation.
                    // Toute offre declaree naissait avec Offer.status a NULL :
                    // absente des compteurs du calendrier, et STATUS[null] y
                    // faisait planter le rendu. Une offre declaree est en
                    // attente de validation.
                    status: "PENDING",
                    parent: {
                        connect: {
                            id: Number(parentOfferId)
                        }
                    },
                    user: {
                        connect: {
                            id: actor.id,
                        }
                    },
                    operator: {
                        connect: {
                            id: Number(operatorId)
                        }
                    },
                    // BUGFIX: `documentId` etait passe en cle etrangere brute au
                    // milieu de relations exprimees par `connect`. Prisma refuse
                    // ce melange (« Unknown argument documentId ») : toute offre
                    // declaree AVEC une offre parente ET un document joint
                    // echouait. On passe donc par la relation, et seulement
                    // lorsqu un document existe.
                    ...(doc
                        ? {
                            document: {
                                connect: { id: doc.id }
                            }
                        }
                        : {}),
                    // BUGFIX: la promotion n etait creee que pour le type
                    // SPECIAL   FLASH, PERIOD et CUSTOMIZE donnaient donc une
                    // offre de BASE, en silence. Elle est desormais creee avec
                    // l offre : son echec annule la declaration entiere.
                    ...(promotion.data
                        ? { specialPromotion: { create: promotion.data } }
                        : {}),
                },
            });

            // Trace : le code validé est rattaché a l offre qu il a autorisee.
            await guard.link(offer?.id);

            // Etat initial, journal d audit et notifications : via le moteur.
            await finalizeCreatedOffer(offer.id, actor, submit);

      res.status(201).json(offer);
        } catch (error) {
            // L offre n a pas ete enregistree : le code validé est rendu.
            await guard?.release?.();
            serverError(res, error, "pages/api/admin/offer/saveOfferWithParent.js");
        }
    }
    else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
