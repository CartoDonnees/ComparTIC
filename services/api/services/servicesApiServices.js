import { userAxiosInstance } from "@/services/config/axiosConfig";
import { FKTND_H } from "@/services/tools/constants";
import { deleteFile } from "@/services/tools/helper";
import { cachedRequest } from "@/services/tools/requestCache";

const fetchServices = async () => {
    try {
        const response = await userAxiosInstance.post('admin/services/getServices',{
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

export const getClientApiServices = async () => {
    try {
        const response = await userAxiosInstance.post('client/service/getClientServices',{
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

/** Référentiel des services, mutualisé entre les fournisseurs. */
export const getServices = () => cachedRequest("services", fetchServices, 300000);
