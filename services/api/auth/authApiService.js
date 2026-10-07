import { FKTND_H, JWT_TOKEN } from "@/services/tools/constants";
import {
  getClientUserById,
  getUserWithOperatorById,
  getUserWithSupervisorById,
} from "../users/usersApiServices";
import { cachedRequest, invalidateRequest } from "@/services/tools/requestCache";

export const loginApiService = async (user) => {
  try {
    const { email, password } = user;
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email?.toLowerCase(),
        password: password,
        verskth: FKTND_H,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem(JWT_TOKEN, data.token);
      // La session vient de changer : l'utilisateur mémorisé est oublié.
      invalidateRequest("auth-user");
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
    /* erreur ignorée volontairement */
  }
  return false;
};

export const loginClientApiService = async (user) => {
  try {
    const { email, password } = user;
    const res = await fetch("/api/auth/loginClient", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email?.toLowerCase(),
        password: password,
        verskth: FKTND_H,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem(JWT_TOKEN, data.token);
      // Même règle que la connexion d'administration : l'utilisateur mis en
      // cache avant la connexion (anonyme) ne doit pas être resservi.
      invalidateRequest("auth-user");
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
    /* erreur ignorée volontairement */
  }
  return false;
};

export const registerApiService = async (user) => {
  const { first_name, last_name, email, password, acceptNotif } = user;
  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        last_name: last_name,
        first_name: first_name,
        email: email?.toLowerCase(),
        password: password,
        acceptNotif: acceptNotif,
        verskth: FKTND_H,
      }),
    });
    if (res.status == 200) {
      return {
        error: false,
      };
    } else {
      return {
        error: true,
        message: data.error,
      };
    }
  } catch (error) {
    /* erreur ignorée volontairement */
  }
};

export const updateClientApiService = async (user) => {
  const { firstName, lastName, email, phone } = user;
  try {
    const res = await fetch("/api/client/user/"+user?.id, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem(JWT_TOKEN)}`,
      },
      body: JSON.stringify({
        firstName: firstName,
        lastName: lastName,
        email: email?.toLowerCase(),
        phone: phone,
        verskth: FKTND_H,
      }),
    });
    if (res.status == 200) {
      return {
        error: false,
      };
    } else {
      return {
        error: true,
        message: data.error,
      };
    }
  } catch (error) {
    /* erreur ignorée volontairement */
  }
};

const fetchAuthUser = async () => {
  const token = localStorage.getItem(JWT_TOKEN);
  
  let result;
  await fetch("/api/auth/verify-token", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      verskth: FKTND_H,
    }),
  })
    .then((res) => res.json())
    .then(async (data) => {
      if (data?.user) {
        result = await getClientUserById(data.user?.userId);
      } else {
        localStorage.removeItem(JWT_TOKEN);
        // router.push('/login');
      }
    })
    .catch((e) => {
      localStorage.removeItem(JWT_TOKEN);
    });
  return result;
};

export const getAuthOperator = async () => {
  const token = localStorage.getItem(JWT_TOKEN);
  let result;
  await fetch("/api/auth/verify-token", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      verskth: FKTND_H,
    }),
  })
    .then((res) => res.json())
    .then(async (data) => {
      if (data.user) {
        result = await getUserWithOperatorById(data.user?.userId);
      } else {
        localStorage.removeItem(JWT_TOKEN);
        // router.push('/login');
      }
    })
    .catch(() => {
      localStorage.removeItem(JWT_TOKEN);
    });
  return result;
};

export const getAuthSupervisor = async () => {
  const token = localStorage.getItem(JWT_TOKEN);
  let result;
  if (token) {
    await fetch("/api/auth/verify-token", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        verskth: FKTND_H,
      }),
    })
      .then((res) => res.json())
      .then(async (data) => {
        if (data.user) {
          result = await getUserWithSupervisorById(data.user?.userId);
        } else {
          localStorage.removeItem(JWT_TOKEN);
          // router.push('/login');
        }
      })
      .catch(() => {
        localStorage.removeItem(JWT_TOKEN);
      });
  }
  return result;
};

export const logoutApi = async () => {
  try {
    const res = await fetch("/api/auth/logout", {
      method: "POST",
      body: JSON.stringify({
        verskth: FKTND_H,
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
    /* erreur ignorée volontairement */
  }
};

export const sendEmailForPassForgetApi = async (email) => {
  try {
    const res = await fetch("/api/auth/sendConfirmationEmail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email?.toLowerCase(),
        verskth: FKTND_H,
      }),
    });
    if (res.status == 200) {
      return {
        error: false,
      };
    } else if (res.status == 400) {
      return {
        error: true,
        message: "Aucun compte trouvé avec ce mail",
      };
    } else {
      const data = await res.json();
      return {
        error: true,
        message: data.error,
      };
    }
  } catch (error) {
    /* erreur ignorée volontairement */
  }
  return false;
};

export const confirmEmailCode = async (email, code) => {
  try {
    const res = await fetch("/api/auth/confirmCode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email?.toLowerCase(),
        code: code,
        verskth: FKTND_H,
      }),
    });
    if (res.status == 200) {
      return {
        error: false,
      };
    } else {
      const data = await res.json();
      return {
        error: true,
        message: "Code non valide !",
      };
    }
  } catch (error) {
    /* erreur ignorée volontairement */
  }
  return false;
};

export const resetPassword = async (email, password) => {
  try {
    const res = await fetch("/api/auth/resetPassword", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email?.toLowerCase(),
        password: password,
        verskth: FKTND_H,
      }),
    });
    if (res.status == 200) {
      return {
        error: false,
      };
    } else if (res.status == 400) {
      return {
        error: true,
        message:
          "Le mot de passe doit contenir au moins 8 caractères, une lettre majuscule, un chiffre et un caractère spécial.",
      };
    } else {
      const data = await res.json();
      return {
        error: true,
        message: "Echec de la rénitialisation du mot de passe !",
      };
    }
  } catch (error) {
    /* erreur ignorée volontairement */
  }
  return false;
};

export const fetchToken = async () => {
  const res = await fetch("/api/getCookie");
  const data = await res.json();
  return data;
};

/**
 * Changement de mot de passe de l'utilisateur connecté.
 * L'identité provient du cookie httpOnly côté serveur : rien d'autre que les
 * mots de passe n'est transmis.
 */
export const changePasswordApiService = async ({
  currentPassword,
  newPassword,
  confirmPassword,
}) => {
  try {
    const res = await fetch("/api/auth/changePassword", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        verskth: FKTND_H,
        currentPassword,
        newPassword,
        confirmPassword,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && data?.success) {
      return { error: false, message: data.message };
    }
    return {
      error: true,
      message: data?.error || "Échec du changement de mot de passe.",
    };
  } catch (error) {
    return {
      error: true,
      message: "Serveur injoignable. Réessayez dans un instant.",
    };
  }
};

/**
 * Mise à jour par l'utilisateur de son propre profil.
 * `imageFile` est optionnel : sans nouvelle photo, l'ancienne est conservée.
 */
export const updateProfileApiService = async (profile, imageFile) => {
  try {
    let imagePath = null;

    if (imageFile) {
      const formData = new FormData();
      formData.append("file", imageFile);
      const upload = await fetch("/api/files/uploads/uploadImage", {
        method: "POST",
        body: formData,
      });
      const uploaded = await upload.json().catch(() => ({}));
      if (uploaded?.success === true) {
        imagePath = uploaded.filename;
      } else {
        return {
          error: true,
          message:
            uploaded?.message || "La photo n'a pas pu être envoyée au serveur.",
        };
      }
    }

    const res = await fetch("/api/auth/updateProfile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        verskth: FKTND_H,
        firstName: profile?.firstName,
        lastName: profile?.lastName,
        email: profile?.email,
        phone: profile?.phone,
        description: profile?.description,
        imagePath,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && data?.success) {
      return { error: false, user: data.user };
    }
    return {
      error: true,
      message: data?.error || "Échec de la mise à jour du profil.",
    };
  } catch (error) {
    return {
      error: true,
      message: "Serveur injoignable. Réessayez dans un instant.",
    };
  }
};

/**
 * Utilisateur de la session courante.
 *
 * `_app` et les quatre fournisseurs la demandaient simultanément : quatre
 * appels à `auth/verify-token` par page. Les appels concurrents partagent
 * désormais la même réponse (15 s), remise à zéro à la connexion et à la
 * déconnexion.
 */
export const getAuthUser = () => cachedRequest("auth-user", fetchAuthUser, 15000);

/** À appeler après une connexion ou une déconnexion. */
export const forgetAuthUser = () => invalidateRequest("auth-user");
