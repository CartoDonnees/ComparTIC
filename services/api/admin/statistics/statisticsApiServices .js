import { userAxiosInstance } from "@/services/config/axiosConfig";
import { FKTND_H } from "@/services/tools/constants";

export const getMain1Stats = async (filter) => {
    try {
        const response = await userAxiosInstance.post('admin/statistics/getMain1Statistics', {
            verskth: FKTND_H,
            startDate:filter?.startDate,
            endDate:filter?.endDate,
            category:filter?.category,
            tabOperId:filter?.tabOperId,
            billingType:filter?.billingType,
            operatorIds:filter?.operatorIds
        }).then(res => res);

        if (response.data) {
            return response.data;
        }
        else {
            return;
        }
    } catch (error) {
    /* erreur ignorée volontairement */
  }
}