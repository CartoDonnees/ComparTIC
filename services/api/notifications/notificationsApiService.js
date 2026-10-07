import { FKTND_H } from "@/services/tools/constants";

/**
 * Notifications de l'utilisateur connecté.
 * L'identité est portée par le cookie httpOnly : rien à transmettre.
 */

const post = async (body) => {
  try {
    const res = await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verskth: FKTND_H, ...body }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: true, message: data?.error };
    return { error: false, ...data };
  } catch (error) {
    return { error: true, message: "Serveur injoignable." };
  }
};

export const getNotifications = (limit = 20) => post({ limit });

export const markNotificationRead = (id) => post({ action: "read", id });

export const markAllNotificationsRead = () => post({ action: "readAll" });

export default getNotifications;
