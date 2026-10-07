import axios from "axios";

import { API_BASE_URL, JWT_TOKEN, TOKEN_ADMIN, TOKEN_USER } from "../tools/constants";

/**
 * Jeton de session de l'utilisateur connecté. Les routes protégées identifient
 * l'appelant par ce jeton (cookie `Jt` ou en-tête Authorization) : c'était
 * auparavant une variable d'environnement absente côté navigateur, si bien
 * qu'aucun en-tête n'était jamais envoyé.
 */
const sessionToken = (fallbackKey) => {
    if (typeof window === "undefined") return null;
    try {
        return localStorage.getItem(JWT_TOKEN) || (fallbackKey ? localStorage.getItem(fallbackKey) : null);
    } catch {
        return null;
    }
};

const adminAxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers:{
        "Access-Control-Allow-Origin": "*",
        "Content-type": "multipart/form-data",
    }
})
adminAxiosInstance.interceptors.request.use(async config => {
    const token = sessionToken(TOKEN_ADMIN);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const userAxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers:{
        "Access-Control-Allow-Origin": "*",
        "Content-type": "application/json",
        "Authorization":''
    }
});

userAxiosInstance.interceptors.request.use(async config => {
    const token = sessionToken(TOKEN_USER);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// const MAX_RETRY = 3;

// userAxiosInstance.interceptors.response.use(
//   response => response,
//   async error => {
//     const config = error.config;

//     // Si pas de config, on retourne l'erreur
//     if (!config) return Promise.reject(error);

//     // Initialiser compteur
//     if (!config._retryCount) config._retryCount = 0;

//     // Conditions : retry uniquement sur erreurs serveurs ou réseau
//     const retryableStatus = [408, 429, 500, 502, 503, 504];

//     if (
//       config._retryCount < MAX_RETRY &&
//       (!error.response || retryableStatus.includes(error.response.status))
//     ) {
//       config._retryCount++;

//       // Délai exponentiel
//       const delay = Math.pow(2, config._retryCount) * 300;

//       await new Promise((resolve) => setTimeout(resolve, delay));

//       return api(config); // retry
//     }

//     return Promise.reject(error);
//   }
// );

export default {
    adminAxiosInstance,
    userAxiosInstance,
}