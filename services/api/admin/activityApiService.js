/**
 * Journal d'activité (administration)    appels côté navigateur.
 *
 * Même origine (`fetch("/api/...")`) : la route contrôle le profil à partir
 * du cookie de session, que seul un appel en même origine transmet.
 */

export const activityQuery = (filters = {}, extra = {}) => {
  const params = new URLSearchParams();
  Object.entries({ ...filters, ...extra }).forEach(([k, v]) => {
    if (v !== "" && v !== null && v !== undefined && v !== "ALL") params.set(k, String(v));
  });
  return params.toString();
};

const get = async (query) => {
  try {
    const res = await fetch(`/api/admin/activity?${query}`, { credentials: "same-origin" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: true, status: res.status, message: data?.error || "La demande n'a pas abouti." };
    return { error: false, ...data };
  } catch {
    return { error: true, message: "Serveur injoignable." };
  }
};

export const listActivity = ({ page = 1, pageSize = 25, filters = {} } = {}) =>
  get(activityQuery(filters, { page, pageSize }));

export const getActivityOptions = () => get("options=1");

/** URL d'export CSV des lignes filtrées (téléchargement direct). */
export const activityExportUrl = (filters = {}) => `/api/admin/activity?${activityQuery(filters, { format: "csv" })}`;
