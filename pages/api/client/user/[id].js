import prisma from "@/services/config/auth/prisma";
import { FKTND_H } from "@/services/tools/constants";
import { readSession } from "@/services/config/auth/session";
import { can, PERMISSIONS } from "@/services/rbac/permissions";
import { roleOf } from "@/services/rbac/roles";

export default async function handler(req, res) {
    const { id } = req.query;

  // SÉCURITÉ: la route renvoyait (POST) et modifiait (PUT) N'IMPORTE QUEL
  // compte à partir de son seul identifiant. Seul le titulaire du compte
  // (session)   ou un gestionnaire des utilisateurs, en lecture   y accède.
  const { user: session, unavailable } = await readSession(req);
  if (unavailable) {
    return res.status(503).json({ error: "Service momentanément indisponible. Réessayez dans quelques instants.", code: "SERVICE_UNAVAILABLE" });
  }
  if (!session) {
    return res.status(401).json({ error: "Session expirée. Reconnectez-vous.", code: "UNAUTHENTICATED" });
  }
  const isSelf = Number(session.id) === Number(id);
  const isManager = can(session.role, PERMISSIONS.USER_MANAGE);
  if (!isSelf && !(req.method === "POST" && isManager)) {
    return res.status(403).json({ error: "Accès refusé à ce compte.", code: "FORBIDDEN" });
  }

  if (req.method === "POST") {
    // SÉCURITÉ: cette route utilisait `include`, qui renvoie TOUTES les
    // colonnes   dont l'empreinte bcrypt du mot de passe et le jeton de
    // confirmation   jusque dans le navigateur (c'est la réponse consommée par
    // getAuthUser au chargement de chaque page). On énumère désormais les
    // champs réellement nécessaires.
    const user = await prisma.user.findUnique({
      where: { id: Number(id), status: "ENABLE" },
      select: {
        id: true,
        code: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        imagePath: true,
        status: true,
        description: true,
        createdAt: true,
        // Nécessaire au changement de mot de passe obligatoire : NULL signifie
        // que le compte utilise encore son mot de passe provisoire.
        passwordChangedAt: true,
        profile: true,
        focalPoint: {
          include: {
            operator: true,
          },
        },
      },
    });
    // Rôle du workflow : l'interface s'en sert pour adapter menus et actions
    // (le serveur, lui, recontrôle chaque action).
    res.status(200).json(user ? { ...user, role: roleOf(user) } : user);
  } else if (req.method === "PUT") {
    const { verskth } = req.body;
    if (verskth != FKTND_H) {
      return res.status(405).json({ message: "Requête non autorisée" });
    }
    const { firstName, lastName, email,phone } = req.body;
    try {
      const updatedUser = await prisma.user.update({
        where: { id: Number(id) },
        data: {
          firstName,
          lastName,
          email,
          phone
        },
        select: { id: true, firstName: true, lastName: true, email: true, phone: true },
      });
      res.status(200).json(updatedUser);
    } catch (error) {
      if (error?.code === "P2002") {
        return res.status(400).json({ error: "Cette adresse e-mail est déjà utilisée par un autre compte." });
      }
      return res.status(500).json({ error: "La mise à jour du compte a échoué." });
    }
  } else {
    res.setHeader("Allow", ["POST", "PUT"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
