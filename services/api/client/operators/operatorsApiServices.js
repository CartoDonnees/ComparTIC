import { userAxiosInstance } from "@/services/config/axiosConfig";
import { API_BASE_URL, FKTND_H } from "@/services/tools/constants";
import { deleteFile } from "@/services/tools/helper";
import { cachedRequest } from "@/services/tools/requestCache";

// GET

const fetchOperators = async () => {
  try {
    const response = await fetch(API_BASE_URL + "operators/getOperators", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        verskth: FKTND_H,
      }),
    }).then((res) => res);

    const data = await response.json();
    return data;

  } catch (error) {
    /* erreur ignorée volontairement */
  }
};

/**
 * Liste des opérateurs.
 *
 * Mutualisée : les quatre fournisseurs de l'application la demandaient chacun
 * au démarrage (jusqu'à huit appels identiques pour une seule page).
 */
export const getOperators = () => cachedRequest("operators", fetchOperators, 60000);

/** Même liste, côté public. */
export const getClientOperators = () => cachedRequest("operators", fetchOperators, 60000);

export const getOperator = async (setState, id) => {
  await fetch("/api/operators/" + id, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  })
    .then((response) => response.json())
    .then((data) => setState(data))
    .catch((error) => /*console.log('ERRR ==>', erro)*/ {});
};

// CREATE
export const createOperatorApi = async (technology) => {
  const { code, name, status, description, imageFile } = technology;

  try {
    const formData = new FormData();

    let img_url = null;
    if (imageFile) {
      try {
        formData.append("file", imageFile);
        const { data } = await axios.post(
          "/api/files/uploads/imageUploads",
          formData
        );
        if (data.success == true) {
          img_url = data.fileName;
        }
      } catch (error) {
        console.error("Error uploading image:", error.message);
      }
    }

    const res = await fetch("/api/admin/operators", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        name: name.toUpperCase(),
        status: status,
        description: description,
        imagePath: img_url,
      }),
    });
    if (res.ok) {
      return {
        error: false,
      };
    } else {
      const data = await res.json();
      return {
        error: true,
        message: data.error,
      };
    }
  } catch (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      // console.error('Server responded with status:', error.response.status);
      // console.error('Response:', error.response);
      // console.error('Response data:', error.response.data);
      // Handle specific server errors (e.g., 401, 404, 500) here
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in browser environments and an instance of AxiosRequestConfig in node.js environments
      // console.error('No response received from server.');
    } else {
      // Something happened in setting up the request that triggered an Error
      // console.error('Error:', error.message);
    }
  }
};

// UPDATE
export const updateOperatorApi = async (technology) => {
  const { id, name, status, description, imageFile, imagePath } = technology;

  try {
    const formData = new FormData();

    let img_url = null;
    if (imageFile) {
      try {
        if (imagePath) {
          await deleteFile("/public/uploads/images/" + imagePath);
        }

        formData.append("file", imageFile);
        const { data } = await axios.post(
          "/api/files/uploads/imageUploads",
          formData
        );
        if (data.success == true) {
          img_url = data.fileName;
        }
      } catch (error) {
        console.error("Error uploading image:", error.message);
      }
    }
    const res = await fetch("/api/admin/operators/" + id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.toUpperCase(),
        status: status,
        description: description,
        imagePath: img_url ? img_url : imagePath,
      }),
    });
    if (res.ok) {
      return {
        error: false,
      };
    } else {
      const data = await res.json();
      return {
        error: true,
        message: data.error,
      };
    }
  } catch (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      // console.error('Server responded with status:', error.response.status);
      // console.error('Response:', error.response);
      // console.error('Response data:', error.response.data);
      // Handle specific server errors (e.g., 401, 404, 500) here
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in browser environments and an instance of AxiosRequestConfig in node.js environments
      // console.error('No response received from server.');
    } else {
      // Something happened in setting up the request that triggered an Error
      // console.error('Error:', error.message);
    }
  }
};

// DELETE
export const deleteOperatorApi = async (id) => {
  try {
    const res = await fetch("/api/admin/entities/operators/" + id, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      return {
        error: false,
      };
    } else {
      const data = await res.json();
      return {
        error: true,
        message: data.error,
      };
    }
  } catch (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      // console.error('Server responded with status:', error.response.status);
      // console.error('Response:', error.response);
      // console.error('Response data:', error.response.data);
      // Handle specific server errors (e.g., 401, 404, 500) here
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in browser environments and an instance of AxiosRequestConfig in node.js environments
      // console.error('No response received from server.');
    } else {
      // Something happened in setting up the request that triggered an Error
      // console.error('Error:', error.message);
    }
  }
};
