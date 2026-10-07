import { userAxiosInstance } from "@/services/config/axiosConfig";
import { FKTND_H } from "@/services/tools/constants";
import { deleteFile } from "@/services/tools/helper";

export const getAreas = async () => {
    try {
        const response = await userAxiosInstance.post('admin/area/getAreas', {
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

export const createArea = async (area) => {

    const {
        title,
        description,
    } = area;

    try {
        const response = await userAxiosInstance.post('admin/area', {
            verskth: FKTND_H,
            title: title,
            description: description,
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

export const editArea = async (area) => {
    const {
        title,
        description,
    } = area;

    try {
        const response = await userAxiosInstance.put('admin/area/' + area?.id, {
            verskth: FKTND_H,
            title: title,
            description: description,
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

export const deleteArea = async (area) => {
    try {
        const response = await userAxiosInstance.delete('admin/area/' + area?.id, {}).then(res => res);
        if (response.status == 204) {
            return true;
        }
        else {
            return
        }

    } catch (error) {
    /* erreur ignorée volontairement */
  }
}

