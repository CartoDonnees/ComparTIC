import { FKTND_H, JWT_TOKEN } from "@/services/tools/constants";

/**
 * Opérateurs  - appels du module « Acteurs > Opérateurs ».
 *
 * Corrige l'ancien service :
 *  - la modification visait `/api/admin/operators/:id` et la suppression
 *    `/api/admin/entities/operators/:id`, deux routes inexistantes ;
 *  - aucun appel n'envoyait la session (routes protégées : refus 401) ;
 *  - le type de réseau n'était pas transmis en modification ;
 *  - un échec renvoyait `undefined` : l'écran ne pouvait afficher aucun motif.
 *
 * Chaque fonction d'écriture renvoie `{ error: false, data }` ou
 * `{ error: true, message, errors? }`.
 */

const authHeaders = () => {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem(JWT_TOKEN) : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
};

const request = async (method, url, body) => {
  try {
    const res = await fetch(url, {
      method,
      credentials: "same-origin",
      cache: "no-store",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      ...(body !== undefined ? { body: JSON.stringify({ verskth: FKTND_H, ...body }) } : {}),
    });
    const data = res.status === 204 ? null : await res.json().catch(() => null);
    if (!res.ok) {
      return {
        error: true,
        status: res.status,
        message: data?.error || data?.message || "L'opération n'a pas abouti.",
        errors: data?.errors,
      };
    }
    return { error: false, data };
  } catch {
    return { error: true, status: 0, message: "Serveur injoignable. Vérifiez votre connexion." };
  }
};

/** Téléverse le logo ; renvoie le nom de fichier enregistré. */
const uploadLogo = async (file) => {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/files/uploads/imageUploads", {
    method: "POST",
    credentials: "same-origin",
    headers: authHeaders(),
    body: form,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.success) throw new Error(data?.message || "Le logo n'a pas pu être téléversé.");
  return data.fileName || data.filename;
};

const payloadOf = async (operator) => {
  let imagePath = operator?.imagePath ?? null;
  if (operator?.imageFile) imagePath = await uploadLogo(operator.imageFile);
  return {
    code: operator?.code,
    name: operator?.name,
    type: operator?.type,
    color: operator?.color,
    status: operator?.status,
    description: operator?.description ?? "",
    imagePath,
  };
};

/** Liste des opérateurs (avec nombre d'offres et de points focaux). */
export const getAdminOperators = async () => {
  const res = await request("GET", "/api/admin/operator");
  return res.error ? undefined : res.data;
};

export const getOperator = async (id) => {
  const res = await request("GET", `/api/admin/operator/${id}`);
  return res.error ? undefined : res.data;
};

// CREATE
export const createOperatorApi = async (operator) => {
  try {
    return await request("POST", "/api/admin/operator", await payloadOf(operator));
  } catch (error) {
    return { error: true, message: error.message };
  }
};

// UPDATE
export const updateOperatorApi = async (operator) => {
  if (!operator?.id) return { error: true, message: "Opérateur introuvable." };
  try {
    return await request("PUT", `/api/admin/operator/${operator.id}`, await payloadOf(operator));
  } catch (error) {
    return { error: true, message: error.message };
  }
};

// DELETE
export const deleteOperatorApi = async (id) => request("DELETE", `/api/admin/operator/${id}`, {});
