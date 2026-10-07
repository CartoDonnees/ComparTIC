import { userAxiosInstance } from "@/services/config/axiosConfig";
import { FKTND_H } from "@/services/tools/constants";
import { deleteFile } from "@/services/tools/helper";
import axios from "axios";
import { getAuthUser } from "../../auth/authApiService";

export const getAdminOffersByOperators = async (ids) => {
    try {
        const response = await userAxiosInstance.post('admin/offer/getOfferByOperator', {
            verskth: FKTND_H,
            operatorIds:ids,
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

export const getAdminMonitorings = async () => {
    try {
        const response = await userAxiosInstance.post('admin/offer/getMonitorings', {
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

export const createOfffer = async (offer) => {
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
        partner,
    } = offer;
    try {

        if (!code || !title || !billingType || !category || !notifDate || !startDate || !area) {
            return
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
                category: category,
                notifiDate: notifDate,
                startDate: startDate,
                target: target,
                formulas:formulas,
                description: description,
                documentPath: doc_url,
                partner:partner,
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
                category: category,
                notifiDate: notifDate,
                startDate: startDate,
                target: target,
                description: description,
                documentPath: doc_url,
                offerType:offerType,
                partner:partner,
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
                }

            }
            else {

            }
        }
        else {
        }

    } catch (error) {
    /* erreur ignorée volontairement */
  }
}

export const monitoringOfffer = async (offer) => {
    const {
        offerCode,
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
        partner,
    } = offer;
    try {

        if (!code || !title || !billingType || !category || !notifDate || !startDate || !area) {
            return
        }

        const formData = new FormData();

        let doc_url = null;
        if (document && Object.keys(document).length != 0) {
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
        let resMonit = null;
        if (parentOffer) {
            resMonit = await userAxiosInstance.post('admin/offer/saveMonitoringOfferWithParent', {
                offerCode:offerCode,
                operatorId:_usr?.focalPoint?.operator?.id,
                code: code,
                operatorId: operator?.id,
                offerType:offerType,
                userId: _usr?.id,
                parentOfferId: parentOffer,
                title: title,
                billingType: billingType,
                promoType:promoType,
                category: category,
                notifiDate: notifDate,
                startDate: startDate,
                target: target,
                description: description,
                documentPath: doc_url,
                partner:partner,
                verskth: FKTND_H
            }).then(res => res);
        }
        else {
            resMonit = await userAxiosInstance.post('admin/offer/monitoring', {
                offerCode:offerCode,
                operatorId:_usr?.focalPoint?.operator?.id,
                code: code,
                operatorId: operator?.id,
                userId: _usr?.id,
                parentOfferId: parentOffer,
                title: title,
                billingType: billingType,
                promoType:promoType,
                category: category,
                notifiDate: notifDate,
                startDate: startDate,   
                target: target,
                description: description,
                documentPath: doc_url,
                offerType:offerType,
                partner:partner,
                verskth: FKTND_H
            }).then(res => res);
        }

        if (resMonit?.data) {
            const _monit = resMonit.data;
            // ENREGISTRER LA ZONE //
            const resArea = await userAxiosInstance.post('admin/offer/saveMonitoringArea', {
                monitoringId: _monit?.id,
                title: area?.title,
                organizations: area?.organizations,
                countries: area?.countries,
                verskth: FKTND_H
            }).then(res => res);

            if (resArea?.data) {
                //ENREGISTRER LES FORMULES //
                // for (const formula of formulas) {
                // try {
                const resFormula = await userAxiosInstance.post('admin/offer/saveMonitoringFormula', {
                    monitoringId: _monit?.id,
                    formulas: formulas,
                    verskth: FKTND_H
                }).then(res => res);
                // } catch (error) {
                // }
                // }

                if (resFormula?.data) {
                    if (accessModes) {
                        // for (const acess of accessModes) {
                        await userAxiosInstance.post('admin/offer/saveMonitoringAccessMode', {
                            offerId: _monit?.id,
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
                }

            }
            else {

            }
        }
        else {
        }

    } catch (error) {
    /* erreur ignorée volontairement */
  }
}