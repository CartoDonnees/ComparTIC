import prisma from "@/services/config/auth/prisma";
import { roleOf } from "@/services/rbac/roles";
import { writeAudit } from "@/services/workflow/audit";

/**
 * Traçabilité des sessions : connexions, échecs, refus et déconnexions.
 *
 * Jamais bloquant : une trace qui ne peut pas être écrite ne doit ni empêcher
 * ni retarder une connexion. L'erreur est journalisée côté serveur.
 *
 * Aucun secret n'est enregistré : ni mot de passe, ni jeton. Pour un échec,
 * l'adresse saisie est conservée (détection des tentatives répétées).
 */

const clientIp = (req) => {
  const fwd = req?.headers?.["x-forwarded-for"];
  if (typeof fwd === "string" && fwd) return fwd.split(",")[0].trim();
  return req?.socket?.remoteAddress || null;
};

/**
 * @param req
 * @param {{ action: string, user?: object, email?: string, space: "admin"|"client", reason?: string }} event
 */
export const recordSessionEvent = async (req, { action, user = null, email = null, space, reason = null }) => {
  try {
    await writeAudit(prisma, {
      action,
      entityType: "SESSION",
      entityId: user?.id ?? null,
      // Un échec n'est pas une action du titulaire du compte : pas d'auteur.
      actor: action === "LOGIN" || action === "LOGOUT" ? { id: user?.id, role: user?.role || roleOf(user) } : null,
      metadata: {
        space,
        ...(reason ? { reason } : {}),
        ...(email && action !== "LOGIN" && action !== "LOGOUT" ? { email: String(email).trim().toLowerCase().slice(0, 160) } : {}),
        ip: clientIp(req),
        userAgent: String(req?.headers?.["user-agent"] || "").slice(0, 200) || null,
      },
    });
  } catch (error) {
    console.error("Journal des sessions : écriture impossible :", error?.message);
  }
};

export default recordSessionEvent;
