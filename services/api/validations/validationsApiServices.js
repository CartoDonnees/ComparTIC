import { userAxiosInstance } from "@/services/config/axiosConfig";
import { FKTND_H } from "@/services/tools/constants";

/**
 * Enregistre la décision de validation d'une offre (ALLOW / DINIED / SUSPENDED).
 * L'API fait un UPSERT : re-statuer une offre déjà traitée est possible.
 */
export const createValidation = async (validation) => {
  const { offerId, status, comments, mail, launchDate } = validation;

  try {
    const response = await userAxiosInstance.post("admin/validation", {
      verskth: FKTND_H,
      offerId: offerId,
      autoComment: comments?.autoComment,
      writeComment: comments?.writeComment,
      status: status,
      launchDate: launchDate ?? null,
      mail: mail,
    });

    if (response?.data) {
      return {
        error: false,
        data: response.data,
        // Indique si la notification e-mail est réellement partie
        mail: response.data?.mail,
      };
    }
    return { error: true, message: "Réponse invalide du serveur" };
  } catch (error) {
    // BUGFIX: l'ancienne version avalait l'erreur et renvoyait `undefined`,
    // ce qui empêchait l'appelant de distinguer un échec d'un succès.
    return {
      error: true,
      message:
        error?.response?.data?.error ||
        "Une erreur s'est produite lors de l'enregistrement de la décision",
    };
  }
};
