import { FKTND_H } from "@/services/tools/constants";

/**
 * Gestion des notifications (administrateur)   appels côté navigateur.
 *
 * Appels en MÊME ORIGINE (`fetch("/api/...")`) et non via `userAxiosInstance` :
 * la route vérifie le profil à partir du cookie de session, que seul un appel
 * en même origine transmet.
 */
const post = async (body) => {
  try {
    const res = await fetch("/api/admin/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ verskth: FKTND_H, ...body }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { error: true, status: res.status, message: data?.error || "La demande n'a pas abouti." };
    }
    return { error: false, ...data };
  } catch (e) {
    return { error: true, message: "Serveur injoignable." };
  }
};

export const listAdminNotifications = ({ page = 1, pageSize = 20, filters = {} } = {}) =>
  post({ action: "list", page, pageSize, filters });

export const getNotificationRecipientOptions = () => post({ action: "options" });

export const setNotificationsRead = (ids, read = true) => post({ action: "setRead", ids, read });

export const deleteNotifications = (ids) => post({ action: "delete", ids });

export const sendAdminNotification = ({ title, content, link, audience }) =>
  post({ action: "send", title, content, link, audience });
