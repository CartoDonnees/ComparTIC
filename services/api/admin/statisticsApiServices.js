import { userAxiosInstance } from "@/services/config/axiosConfig";

export const getGenStats = async () => {
    try {
        const response = await userAxiosInstance.post('admin/statistics/generalStatistics', {
            // verskth: FKTND_H,
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