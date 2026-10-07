import { userAxiosInstance } from "@/services/config/axiosConfig";
import { FKTND_H } from "@/services/tools/constants";
import { deleteFile } from "@/services/tools/helper";
import axios from "axios";
import { getAuthUser } from "../auth/authApiService";

export const getAdminOffersWithUnknow = async (operatorId = null) => {
    try {
        const response = await userAxiosInstance.post('admin/offer/getOffersWu', {
            verskth: FKTND_H,
            // null = admin (toutes les offres) ; sinon perimetre de l operateur
            operatorId,
        }).then(res => res);

        
        if (response.data) {
            return response.data
        }
        else {
            return
        }

    } catch (error) {
    /* erreur ignorée volontairement */
  }
}

export const getAdminOffers = async () => {
    try {
        const response = await userAxiosInstance.post('admin/offer/getOffers', {
            verskth: FKTND_H,
        }).then(res => res);

        
        if (response.data) {
            return response.data
        }
        else {
            return
        }

    } catch (error) {
    /* erreur ignorée volontairement */
  }
}

export const getOperatorOffers = async (operatorId) => {
    try {
        const response = await userAxiosInstance.post('operator/offer/getOperatorOffers', {
            verskth: FKTND_H,
            operatorId:operatorId,
        }).then(res => res);
        
        if (response.data) {
            return response.data
        }
        else {
            return
        }

    } catch (error) {
    /* erreur ignorée volontairement */
  }
}

export const getAdminMonitorings = async (operatorId = null) => {
    try {
        const response = await userAxiosInstance.post('admin/offer/getMonitorings', {
            verskth: FKTND_H,
            // restreint la réponse aux offres de cet opérateur (null = admin)
            operatorId,
        }).then(res => res);

        
        if (response.data) {
            return response.data
        }
        else {
            return
        }

    } catch (error) {
    /* erreur ignorée volontairement */
  }
}

export const getAdminPendingOffers = async () => {
    try {
        const response = await userAxiosInstance.post('admin/offer/getPendingOffers', {
            verskth: FKTND_H,
        }).then(res => res);

        
        if (response.data) {
            return response.data
        }
        else {
            return
        }

    } catch (error) {
    /* erreur ignorée volontairement */
  }
}

const unknownOffer = async () => {
    try {
        const response = await userAxiosInstance.post('admin/offer/getUnknownOffer', {
            verskth: FKTND_H,
        }).then(res => res);

        if (response.data) {
            return response.data
        }
        else {
            return
        }

    } catch (error) {
    /* erreur ignorée volontairement */
  }
}

/**
 * L offre repere « Offre Inconnu », seule.
 *
 * Les pages de MODIFICATION chargent leurs offres par des routes qui excluent
 * cette offre repere (`getOffers`, `getOperatorOffers`) : elle n y etait donc
 * jamais proposee comme parente, et une offre deja rattachee a elle s ouvrait
 * avec le champ vide. `unknownOffer` existait mais n etait pas exporte.
 *
 * @returns {Promise<object|null>}
 */
export const getUnknownParentOffer = async () => {
    const list = await unknownOffer();
    return Array.isArray(list) ? list[0] ?? null : null;
}

/**
 * Enregistre une offre.
 *
 * @param offer            l offre construite par l assistant en cinq etapes
 * @param submissionTicket jeton delivre par la validation du code recu par
 *                         e-mail. Obligatoire pour un point focal d operateur
 *                         (l API le refuse sinon), sans objet pour un
 *                         administrateur.
 */
/**
 * @param submissionTicket jeton du code e-mail (point focal, soumission)
 * @param options.draft    vrai : l'offre est enregistrée en BROUILLON (non
 *                         soumise, pas de code requis) ; elle pourra être
 *                         soumise plus tard depuis la liste des offres.
 */
export const createOfffer = async (offer, submissionTicket = null, { draft = false } = {}) => {
    const {
        parentOffer,
        offerType,
        operator,
        code,
        title,
        billingType,
        category,
        notifDate,
        startDate,
        target,
        formulas,
        area,
        document,
        description,
        accessModes,
        promoType,
        // BUGFIX: la duree saisie a l etape 1 n etait tout simplement pas
        // transmise a l API. Cote serveur, `Number(undefined)` vaut NaN, refuse
        // par Prisma sur un champ Float : la promotion echouait APRES la
        // creation de l offre, qui restait donc enregistree comme offre de base.
        duration,
        partner,
    } = offer;
    try {

        if (!code || !title || !billingType || !category || !notifDate || !startDate || !area) {
            // Retour explicite : l appelant affichait « une erreur s est
            // produite » sans jamais savoir qu il manquait un champ.
            return {
                error: true,
                message: "Des informations obligatoires de l'offre sont manquantes.",
            }
        }

        const formData = new FormData();

        let doc_url = null;
        if (document) {
            try {
                formData.append('file', document);
                const { data } = await axios.post('/api/files/uploads/uploadFile', formData);
                if (data.success == true) {
                    doc_url = data.filename
                }
            } catch (error) {
                console.error('Error uploading document:', error.message);
            }
        }

        const _usr = await getAuthUser();

        ///ENREGISTRER L'OFFRE/////
        let resOffer = null;
        if (parentOffer) {
            resOffer = await userAxiosInstance.post('admin/offer/saveOfferWithParent', {
                code: code,
                operatorId: operator?.id,
                offerType:offerType,
                userId: _usr?.id,
                parentOfferId: parentOffer?.id,
                title: title,
                billingType: billingType,
                promoType:promoType,
                duration: duration,
                category: category,
                notifiDate: notifDate,
                startDate: startDate,
                target: target,
                formulas:formulas,
                description: description,
                documentPath: doc_url,
                partner:partner,
                // Jeton de validation par code : l API le controle et le
                // consomme avant toute ecriture (voir offerSubmissionGuard).
                submissionTicket: draft ? null : submissionTicket,
                // Etat initial decide par le serveur : soumise ou brouillon.
                submit: !draft,
                verskth: FKTND_H
            }).then(res => res);
        }
        else {
            resOffer = await userAxiosInstance.post('admin/offer/', {
                code: code,
                operatorId: operator?.id,
                userId: _usr?.id,
                parentOfferId: parentOffer,
                title: title,
                billingType: billingType,
                promoType:promoType,
                duration: duration,
                category: category,
                notifiDate: notifDate,
                startDate: startDate,
                target: target,
                description: description,
                documentPath: doc_url,
                offerType:offerType,
                partner:partner,
                submissionTicket: draft ? null : submissionTicket,
                // Etat initial decide par le serveur : soumise ou brouillon.
                submit: !draft,
                verskth: FKTND_H
            }).then(res => res);
        }

        if (resOffer?.data) {
            const _offer = resOffer.data;
            // ENREGISTRER LA ZONE //
            const resArea = await userAxiosInstance.post('admin/offer/saveArea', {
                offerId: _offer?.id,
                title: area?.title,
                organizations: area?.organizations,
                countries: area?.countries,
                verskth: FKTND_H
            }).then(res => res);

            if (resArea?.data) {
                //ENREGISTRER LES FORMULES //
                // for (const formula of formulas) {
                // try {
                const resFormula = await userAxiosInstance.post('admin/offer/saveFormula', {
                    offerId: _offer?.id,
                    formulas: formulas,
                    verskth: FKTND_H
                }).then(res => res);
                // } catch (error) {
                // }
                // }

                if (resFormula?.data) {
                    if (accessModes) {
                        // for (const acess of accessModes) {
                        await userAxiosInstance.post('admin/offer/saveAccessMode', {
                            offerId: _offer?.id,
                            accessModes: accessModes,
                            verskth: FKTND_H
                        }).then(res => res);
                    }
                    return {
                        error: false
                    }
                    // }
                    // const resAccesMode = await userAxiosInstance.post('admin/offer/saveAccessMode', {
                    //     offerId: _offer?.id,
                    //     accessModes: accessModes,
                    //     verskth: FKTND_H
                    // }).then(res => res);

                }
                else {
                    return { error: true, message: "Les formules de l'offre n'ont pas pu etre enregistrees." }
                }

            }
            else {
                return { error: true, message: "La zone geographique de l'offre n'a pas pu etre enregistree." }

            }
        }
        else {
            return { error: true, message: "L'offre n'a pas pu etre enregistree." }
        }

    } catch (error) {
        // Le message de l API est remonte tel quel : c est lui qui explique
        // un refus de validation par code (jeton absent, expire, deja utilise).
        const apiMessage = error?.response?.data?.error
        return {
            error: true,
            reason: error?.response?.data?.reason,
            message: apiMessage || "Une erreur s'est produite lors de l'enregistrement de l'offre.",
        }
    }
}

/**
 * MONITORING d'une offre validée.
 *
 * Le monitoring ne modifie jamais l'offre validée : le serveur (workflow)
 * désactive l'ancienne version, crée une NOUVELLE version rattachée à
 * l'originale (copie complète, soumise au niveau 1) et journalise l'opération.
 * Le contenu saisi à l'écran est ensuite appliqué à cette nouvelle version,
 * encore modifiable puisqu'aucune décision n'y a été prise.
 *
 * @param offer  contenu du formulaire + `sourceOfferId` (offre validée d'origine)
 * @returns {{error:boolean, message?:string, offer?:object}}
 */
export const monitoringOfffer = async (offer) => {
    const { sourceOfferId, monitoringComment, title, billingType, category, notifDate, startDate, area } = offer || {};

    if (!sourceOfferId) {
        return { error: true, message: "Offre d'origine introuvable pour ce monitoring." };
    }
    if (!title || !billingType || !category || !notifDate || !startDate || !area) {
        return { error: true, message: "Certains champs obligatoires sont manquants" };
    }

    let created = null;
    try {
        const { data } = await userAxiosInstance.post(`workflow/offers/${sourceOfferId}/monitor`, {
            comment: monitoringComment || null,
        });
        created = data?.offer;
    } catch (error) {
        return {
            error: true,
            message: error?.response?.data?.error || "Le monitoring n'a pas pu être enregistré.",
        };
    }
    if (!created?.id) {
        return { error: true, message: "Le monitoring n'a pas pu être enregistré." };
    }

    // Le contenu saisi est appliqué à la nouvelle version (et non à l'offre
    // d'origine, désormais désactivée).
    const { id, offerId, offerCode, code, sourceOfferId: _s, monitoringComment: _c, ...content } = offer;
    const edited = await editOfffer({ ...content, id: created.id });
    if (edited?.error) {
        return {
            error: true,
            offer: created,
            message: `La nouvelle version ${created.code} a été créée, mais son contenu n'a pas pu être mis à jour : ${edited.message}`,
        };
    }
    return { error: false, offer: created };
};

/**
 * MODIFICATION d'une offre existante.
 *
 * Contrairement à `createOfffer` (qui crée une nouvelle offre), cette fonction
 * met à jour l'offre en place :
 *   1. met à jour les champs de l'offre + la promotion  (updateOffer)
 *   2. purge les formules / modes d'accès existants     (clearOfferDetails)
 *   3. ré-enregistre zone, formules et modes d'accès    (saveArea/Formula/AccessMode)
 *
 * Les droits sont contrôlés côté serveur : l'administrateur peut modifier à
 * tout moment ; l'opérateur uniquement ses offres non encore statuées.
 *
 * @returns {{error:boolean, message?:string}}
 */
export const editOfffer = async (offer) => {
    const {
        id,
        offerType,
        operator,
        // Offre parente : le champ etait bien present a l ecran et
        // preselectionnait la parente en cours, mais son choix n etait transmis
        // a aucune route   il etait perdu a l enregistrement.
        parentOffer,
        title,
        billingType,
        category,
        notifDate,
        startDate,
        target,
        formulas,
        area,
        document,
        description,
        accessModes,
        promoType,
        duration,
        partner,
        link,
    } = offer;

    try {
        const offerId = id ?? offer?.offerId;
        if (!offerId) {
            return { error: true, message: "Offre introuvable (identifiant manquant)" };
        }
        if (!title || !billingType || !category || !notifDate || !startDate) {
            return { error: true, message: "Certains champs obligatoires sont manquants" };
        }

        // -- Nouveau document éventuel -------------------------------------
        let doc_url = null;
        if (document && typeof document !== "string") {
            try {
                const formData = new FormData();
                formData.append("file", document);
                const { data } = await axios.post("/api/files/uploads/uploadFile", formData);
                if (data?.success === true) doc_url = data.filename ?? data.fileName;
            } catch (error) {
                // L'échec de l'upload ne doit pas bloquer la mise à jour du reste
            }
        }

        const _usr = await getAuthUser();

        // La cle n est transmise QUE si le champ a ete touche : sans cette
        // distinction, un simple enregistrement enverrait « aucune parente » et
        // effacerait un rattachement existant.
        const parentTouched = Object.prototype.hasOwnProperty.call(
            offer ?? {},
            "parentOffer",
        );

        // -- 1. Mise à jour de l'offre -------------------------------------
        const resOffer = await userAxiosInstance.post("admin/offer/updateOffer", {
            offerId: offerId,
            userId: _usr?.id,
            title,
            category,
            billingType,
            notifiDate: notifDate,
            startDate,
            target,
            description,
            partner,
            link,
            promoType,
            duration,
            offerType,
            documentPath: doc_url,
            ...(parentTouched
                ? { parentOfferId: parentOffer?.id ?? null }
                : {}),
            verskth: FKTND_H,
        });

        if (!resOffer?.data) {
            return { error: true, message: "La mise à jour de l'offre a échoué" };
        }

        // -- 2. Purge des formules / modes d'accès -------------------------
        await userAxiosInstance.post("admin/offer/clearOfferDetails", {
            offerId: offerId,
            scope: "all",
            verskth: FKTND_H,
        });

        // -- 3. Ré-enregistrement des éléments -----------------------------
        if (area) {
            await userAxiosInstance.post("admin/offer/saveArea", {
                offerId: offerId,
                title: area?.title,
                organizations: area?.organizations,
                countries: area?.countries,
                verskth: FKTND_H,
            });
        }

        if (formulas?.length > 0) {
            await userAxiosInstance.post("admin/offer/saveFormula", {
                offerId: offerId,
                formulas: formulas,
                verskth: FKTND_H,
            });
        }

        if (accessModes?.length > 0) {
            await userAxiosInstance.post("admin/offer/saveAccessMode", {
                offerId: offerId,
                accessModes: accessModes,
                verskth: FKTND_H,
            });
        }

        return { error: false };
    } catch (error) {
        // Message renvoyé par l'API (droits insuffisants, offre déjà statuée...)
        const message =
            error?.response?.data?.error ||
            "Une erreur s'est produite lors de la modification de l'offre";
        return { error: true, message };
    }
};
