import { userAxiosInstance } from "@/services/config/axiosConfig";
import { FKTND_H } from "@/services/tools/constants";
import { deleteFile } from "@/services/tools/helper";

export const getAdminOrganizations = async () => {
  try {
    // alert('OKS')
    const response = await userAxiosInstance
      .post("admin/organization/getOrganizations", {
        verskth: FKTND_H,
      })
      .then((res) => res);

    if (response.data) {
      return response.data;
    } else {
      return;
    }
  } catch (error) {
    /* erreur ignorée volontairement */
  }
};
export const getAdminMainOrganizations = async () => {
  try {
    // alert('OKS')
    const response = await userAxiosInstance
      .post("admin/organization/getMainOrganizations", {
        verskth: FKTND_H,
      })
      .then((res) => res);

    if (response.data) {
      return response.data;
    } else {
      return;
    }
  } catch (error) {
    /* erreur ignorée volontairement */
  }
};

export const getClientMainOrganisations = async () => {
  try {
    const response = await userAxiosInstance
      .post("client/organization/main/getMainOraganizations", {
        verskth: FKTND_H,
      })
      .then((res) => res);

    if (response.data) {
      return response.data;
    } else {
      return;
    }
  } catch (error) {
    /* erreur ignorée volontairement */
  }
};

export const getClientOrganizations = async () => {
  try {
    const response = await userAxiosInstance
      .post("client/organization/getOrganizations", {
        verskth: FKTND_H,
      })
      .then((res) => res);

    if (response.data) {
      return response.data;
    } else {
      return;
    }
  } catch (error) {
    /* erreur ignorée volontairement */
  }
};

export const createOrganization = async (organization) => {
  const { area, name, description, selectedCountries } = organization;

  try {
    const response = await userAxiosInstance
      .post("admin/organization", {
        verskth: FKTND_H,
        name: name,
        area: area,
        description: description,
        selectedCountries: selectedCountries,
      })
      .then((res) => res);
    if (response.data) {
      return response.data;
    } else {
      return;
    }
  } catch (error) {
    /* erreur ignorée volontairement */
  }
};

export const editOrganization = async (organization) => {
  const { area, name, description, selectedCountries } = organization;

  try {
    const response = await userAxiosInstance
      .put("admin/organization/" + organization?.id, {
        verskth: FKTND_H,
        name: name,
        area: area,
        description: description,
        selectedCountries: selectedCountries,
      })
      .then((res) => res);

    if (response.data) {
      return response.data;
    } else {
      return;
    }
  } catch (error) {
    /* erreur ignorée volontairement */
  }
};

export const deleteOrganization = async (destination) => {
  try {
    const response = await userAxiosInstance
      .delete("admin/destination/" + destination?.id, {})
      .then((res) => res);
    if (response.status == 204) {
      return true;
    } else {
      return;
    }
  } catch (error) {
    /* erreur ignorée volontairement */
  }
};
