import { userAxiosInstance } from "@/services/config/axiosConfig";
import { FKTND_H } from "@/services/tools/constants";

export const getClientFormulas = async () => {
    try {
        const response = await userAxiosInstance.post('client/offer/getClientFormulas', {
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
