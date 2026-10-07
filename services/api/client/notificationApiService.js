import { userAxiosInstance } from "@/services/config/axiosConfig";
import { FKTND_H } from "@/services/tools/constants";
import { getAuthUser } from "../auth/authApiService";

export const getClientNotification = async () => {
  try {
  const _usr = await getAuthUser();
    const response = await userAxiosInstance
      .post("client/notification/getNotification", {
        verskth: FKTND_H,
        userId: _usr?.id,
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

export const getClientUnreadNotification = async () => {
  try {
  const _usr = await getAuthUser();
    const response = await userAxiosInstance
      .post("client/notification/getUnreadNotification", {
        verskth: FKTND_H,
        userId: _usr?.id,
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
