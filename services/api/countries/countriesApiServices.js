import { userAxiosInstance } from "@/services/config/axiosConfig";
import { FKTND_H } from "@/services/tools/constants";
import { deleteFile } from "@/services/tools/helper";
import { cachedRequest } from "@/services/tools/requestCache";

export const getClientCountries = async () => {
    try {
        const response = await userAxiosInstance.post('client/country/getCountries', {
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

const fetchCountries = async () => {
    try {
        const response = await userAxiosInstance.post('admin/country/getCountries', {
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

export const createCountry = async (country) => {

    const {
        name,
        description,
    } = country;

    try {
        const response = await userAxiosInstance.post('admin/country', {
            verskth: FKTND_H,
            name: name,
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

export const editCountry = async (country) => {
    const {
        name,
        description,
    } = country;

    try {
        const response = await userAxiosInstance.put('admin/country/' + country?.id, {
            verskth: FKTND_H,
            name: name,
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

export const deleteCountry = async (country) => {
    try {
        const response = await userAxiosInstance.delete('admin/country/' + country?.id, {}).then(res => res);
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

/** Référentiel des pays, mutualisé entre les fournisseurs. */
export const getCountries = () => cachedRequest("countries", fetchCountries, 300000);
