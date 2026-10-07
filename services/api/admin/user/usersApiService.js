import { userAxiosInstance } from "@/services/config/axiosConfig";
import { FKTND_H } from "@/services/tools/constants";
import { strUppercCaase } from "@/services/tools/convertions";
import axios from "axios";

export const getUsers = async () => {
  try {
    const response = await userAxiosInstance
      .post("admin/user/getUsers", {
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

export const createUser = async (user) => {
  const {
    code,
    email,
    firstName,
    lastName,
    imageFile,
    profileId,
    profile,
    description,
    serialNumber,
    status,
    focalPoint,
  } = user;

  if (!code || !email || !firstName || !profileId || !status) {
    return;
  }

  try {
    const formData = new FormData();

    let imgUrl = null;
    if (imageFile) {
      try {
        formData.append("file", imageFile);
        const { data } = await axios.post(
          "/api/files/uploads/uploadImage",
          formData,
        );
        if (data.success == true) {
          imgUrl = data.filename;
        }
      } catch (error) {
        console.error("Error uploading imageFile:", error.message);
      }
    }

    const response = await userAxiosInstance
      .post("admin/user", {
        verskth: FKTND_H,
        code: code,
        email: email,
        firstName: strUppercCaase(firstName),
        lastName: strUppercCaase(lastName),
        profileId: profileId,
        operatorId: focalPoint?.operatorId,
        status: status,
        imagePath: imgUrl,
        description: description,
        // BUGFIX: le formulaire enregistre le matricule dans
        // `user.focalPoint.serialNumber` ; on lisait `user.serialNumber`
        // (toujours indéfini) -> la création d'un compte OPÉRATEUR échouait
        // avec « Argument `serialNumber` is missing » côté Prisma.
        serialNumber: focalPoint?.serialNumber ?? serialNumber,
      })
      .then((res) => res);
    if (response.data) {
      return { error: false, data: response.data };
    }
    return { error: true, message: "Réponse invalide du serveur" };
  } catch (error) {
    // BUGFIX: l'erreur était avalée (retour `undefined`) : l'appelant ne
    // pouvait pas distinguer un succès d'un échec, ni afficher la cause
    // (e-mail déjà utilisé, champs manquants...).
    return {
      error: true,
      message:
        error?.response?.data?.error ||
        "Une erreur s'est produite lors de l'enregistrement de l'utilisateur",
    };
  }
};

export const editUser = async (user) => {
  const {
    code,
    email,
    firstName,
    lastName,
    imageFile,
    profileId,
    profile,
    description,
    serialNumber,
    status,
    imagePath,
    focalPoint,
  } = user;

  if (!code || !email || !firstName || !profileId || !status) {
    return;
  }

  try {
    const formData = new FormData();

    let imgUrl = null;
    if (imageFile) {
      try {
        formData.append("file", imageFile);
        const { data } = await axios.post(
          "/api/files/uploads/uploadImage",
          formData,
        );
        if (data.success == true) {
          imgUrl = data.filename;
        }
      } catch (error) {
        console.error("Error uploading imageFile:", error.message);
      }
    }

    const response = await userAxiosInstance
      .put("admin/user/" + user?.id, {
        verskth: FKTND_H,
        code: code,
        email: email,
        firstName: strUppercCaase(firstName),
        lastName: strUppercCaase(lastName),
        profileId: profileId,
        operatorId: focalPoint?.operatorId,
        status: status,
        imagePath: imgUrl ? imgUrl : imagePath,
        description: description,
        serialNumber: focalPoint?.serialNumber,
      })
      .then((res) => res);
    if (response.data) {
      return { error: false, data: response.data };
    }
    return { error: true, message: "Réponse invalide du serveur" };
  } catch (error) {
    // BUGFIX: l'erreur était avalée (retour `undefined`) : impossible pour
    // l'appelant de distinguer un succès d'un échec, ni d'en afficher la cause.
    return {
      error: true,
      message:
        error?.response?.data?.error ||
        "Une erreur s'est produite lors de la modification de l'utilisateur",
    };
  }
};

export const deleteUser = async (userId) => {
  try {
    // BUGFIX 1: le 2e argument d'`axios.delete` est la CONFIG, pas le corps :
    // `verskth` n'était jamais transmis au serveur. On l'envoie via `data`.
    const response = await userAxiosInstance.delete("admin/user/" + userId, {
      data: { verskth: FKTND_H },
    });

    // BUGFIX 2: l'API répond 204 (sans corps) : `response.data` était vide,
    // donc jugé faux, et l'interface annonçait un échec alors que la
    // suppression avait bien eu lieu. On se fie désormais au code HTTP.
    if (response?.status >= 200 && response?.status < 300) {
      return { error: false };
    }
    return { error: true, message: "La suppression n'a pas abouti" };
  } catch (error) {
    return {
      error: true,
      message:
        error?.response?.data?.error ||
        "Une erreur s'est produite lors de la suppression de l'utilisateur",
    };
  }
};
