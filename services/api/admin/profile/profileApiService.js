import { userAxiosInstance } from "@/services/config/axiosConfig";
import { FKTND_H } from "@/services/tools/constants";
import { deleteFile } from "@/services/tools/helper";

export const getProfile = async () => {
    try {
        const response = await userAxiosInstance.post('admin/profile/getProfile', {
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