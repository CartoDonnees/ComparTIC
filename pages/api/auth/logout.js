import { clearedSessionCookie } from "@/services/config/auth/sessionCookie";
import { getSessionUser } from "@/services/config/auth/session";
import { recordSessionEvent } from "@/services/audit/sessionAudit";
import { ROLES } from "@/services/rbac/roles";

export default async function handler(req, res) {
  // Trace de la déconnexion (session encore lisible avant l'effacement du
  // cookie). Une lecture impossible n'empêche jamais de se déconnecter.
  try {
    const user = await getSessionUser(req);
    if (user) {
      await recordSessionEvent(req, {
        action: "LOGOUT",
        user,
        space: user.role === ROLES.CLIENT ? "client" : "admin",
      });
    }
  } catch {
    // session illisible : rien à tracer
  }

  res.setHeader("Set-Cookie", clearedSessionCookie(req));
  res.status(200).json({ message: "Déconnexion réussie, token supprimé" });
}
