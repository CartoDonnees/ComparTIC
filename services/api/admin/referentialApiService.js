import { invalidateRequest } from "@/services/tools/requestCache";

/**
 * Référentiels (pays, organisations, zones)    appels côté navigateur.
 *
 * Même origine : la permission est vérifiée à partir du cookie de session.
 * Chaque fonction renvoie `{ ok: true, data }` ou
 * `{ ok: false, status, code, error, details }` : l'écran affiche toujours le
 * motif exact d'un refus (doublon, élément utilisé…).
 *
 * @param resource "country" | "organization" | "area"
 */
const request = async (method, url, body) => {
  try {
    const res = await fetch(url, {
      method,
      credentials: "same-origin",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, status: res.status, code: data?.code, details: data?.details, error: data?.error || "La demande n'a pas abouti." };
    return { ok: true, data };
  } catch {
    return { ok: false, status: 0, code: "NETWORK", error: "Serveur injoignable. Vérifiez votre connexion." };
  }
};

// Les listes mises en cache ailleurs (formulaires d'offres) doivent suivre.
const forget = () => invalidateRequest("countries");

export const listReferential = (resource) => request("GET", `/api/admin/${resource}`);

export const createReferential = async (resource, payload) => {
  const res = await request("POST", `/api/admin/${resource}`, payload);
  if (res.ok) forget();
  return res;
};

export const updateReferential = async (resource, id, payload) => {
  const res = await request("PUT", `/api/admin/${resource}/${id}`, payload);
  if (res.ok) forget();
  return res;
};

export const deleteReferential = async (resource, id) => {
  const res = await request("DELETE", `/api/admin/${resource}/${id}`);
  if (res.ok) forget();
  return res;
};
