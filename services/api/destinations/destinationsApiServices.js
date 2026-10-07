import { userAxiosInstance } from "@/services/config/axiosConfig";
import { FKTND_H } from "@/services/tools/constants";
import { deleteFile } from "@/services/tools/helper";

export const getDestinations = async () => {
    try {
        const response = await userAxiosInstance.post('cleint/destination/getDestinations',{
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

// export const getAdminDestinations = async () => {
//     try {
//         const response = await userAxiosInstance.post('admin/organization/getOrganizations',{
//                 verskth: FKTND_H,
//         }).then(res => res);

//         if (response.data) {
//             // console.log('Response DATA =====>', response.data)
//             return response.data
//         }
//         else {
//             return
//         }

//     } catch (error) {
//     }
// }