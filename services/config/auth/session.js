import prisma from "@/services/config/auth/prisma";
import { verifyToken } from "@/services/config/auth/jwt";
import { JWT_TOKEN } from "@/services/tools/constants";
import { roleOf, ROLES, isBackOffice } from "@/services/rbac/roles";
import { can } from "@/services/rbac/permissions";

/**
 * Identification et autorisation de l'appelant CÔTÉ SERVEUR.
 *
 * AUDIT   avant ce module, les API ne vérifiaient qu'une clé fixe
 * (`FKTND_H`) incluse dans le code JavaScript servi au navigateur, et lisaient
 * l'auteur d'une action dans le corps de la requête (`userId`) : n'importe qui
 * pouvait agir au nom de n'importe qui. Aucune règle d'autorisation n'était
 * donc applicable côté serveur.
 *
 * L'identité provient désormais EXCLUSIVEMENT du jeton signé (JWT_SECRET) :
 *  - cookie httpOnly `Jt` (appels en même origine) ;
 *  - ou en-tête `Authorization: Bearer <jeton>` (appels Axios, y compris
 *    lorsque l'API est servie depuis une autre origine).
 * L'utilisateur est ensuite RECHARGÉ en base : profil, statut et opérateur de
 * rattachement sont ceux d'aujourd'hui, pas ceux du jour de la connexion.
 */

const readToken = (req) => {
  const fromCookie = req?.cookies?.[JWT_TOKEN];
  if (fromCookie) return fromCookie;
  const header = req?.headers?.authorization || req?.headers?.Authorization;
  const match = typeof header === "string" && header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
};

const USER_SELECT = {
  id: true,
  code: true,
  email: true,
  firstName: true,
  lastName: true,
  status: true,
  profile: { select: { id: true, code: true, name: true } },
  focalPoint: {
    select: {
      id: true,
      serialNumber: true,
      operatorId: true,
      operator: { select: { id: true, name: true, code: true } },
    },
  },
};

/**
 * @returns {Promise<null|object>} l'utilisateur enrichi de `role` et
 *   `operatorId`, ou null si la session est absente, invalide ou désactivée.
 */
export const getSessionUser = async (req) => {
  const token = readToken(req);
  if (!token) return null;

  const decoded = verifyToken(token);
  const userId = decoded?.userId;
  // Jeton antérieur à la liaison au compte (sans `userCode`) : refusé.
  if (!userId || !decoded?.userCode) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: USER_SELECT,
    });

    // Un compte désactivé conserve un jeton valide jusqu'à son expiration :
    // on refuse explicitement, sans quoi une désactivation resterait sans effet.
    if (!user || user.status !== "ENABLE") return null;
    // Le jeton doit désigner CE compte. Après un « npm run seed » (ou une
    // nouvelle base), l'identifiant numérique d'un ancien jeton peut appartenir
    // à un autre utilisateur : sans ce contrôle, la session changeait
    // silencieusement de titulaire (et de droits).
    if (user.code !== decoded.userCode) return null;

    const role = roleOf(user);
    return {
      ...user,
      role,
      operatorId: role === ROLES.FOCAL_POINT ? user.focalPoint?.operatorId ?? null : null,
    };
  } catch (error) {
    // Incident technique (base injoignable...) : la session n'est PAS
    // invalidée. Sans cette distinction, une coupure de quelques secondes
    // déconnectait tous les utilisateurs, cookie effacé.
    console.error("Session : lecture impossible :", error?.message);
    const failure = new Error("SESSION_LOOKUP_FAILED");
    failure.code = "SESSION_LOOKUP_FAILED";
    throw failure;
  }
};


/**
 * Variante tolérante : renvoie `{ user, unavailable }` au lieu de lever.
 * `unavailable` à true signale un incident technique (base injoignable) :
 * l'appelant doit répondre 503 et NE PAS invalider la session.
 */
export const readSession = async (req) => {
  try {
    return { user: await getSessionUser(req), unavailable: false };
  } catch (error) {
    if (isSessionLookupFailure(error)) return { user: null, unavailable: true };
    throw error;
  }
};

/** La session a-t-elle échoué pour un motif technique (et non d'identité) ? */
export const isSessionLookupFailure = (error) => error?.code === "SESSION_LOOKUP_FAILED";

/**
 * Exige une session valide (et, le cas échéant, une permission).
 * Envoie elle-même la réponse 401 / 403 et renvoie alors `null`.
 *
 * @example
 *   const actor = await requireActor(req, res, PERMISSIONS.OFFER_CREATE);
 *   if (!actor) return;
 */
export const requireActor = async (req, res, permission = null) => {
  let actor = null;
  try {
    actor = await getSessionUser(req);
  } catch (error) {
    if (isSessionLookupFailure(error)) {
      res.status(503).json({
        error: "Service momentanément indisponible. Réessayez dans quelques instants.",
        code: "SERVICE_UNAVAILABLE",
      });
      return null;
    }
    throw error;
  }
  if (!actor) {
    res.status(401).json({ error: "Session expirée. Reconnectez-vous.", code: "UNAUTHENTICATED" });
    return null;
  }
  if (!isBackOffice(actor.role)) {
    res.status(403).json({ error: "Accès réservé à l'espace de gestion.", code: "FORBIDDEN" });
    return null;
  }
  if (permission && !can(actor.role, permission)) {
    res.status(403).json({
      error: "Votre profil ne permet pas cette action.",
      code: "FORBIDDEN",
      permission,
    });
    return null;
  }
  return actor;
};

/** Code du profil « administrateur ». */
export const ADMIN_PROFILE_CODE = "PRF0-TEST";

/**
 * L'utilisateur relève-t-il de l'administration (administrateur ou super
 * administrateur) ? Le superviseur n'en relève pas.
 */
export const isAdminUser = (user) => {
  const role = user?.role || roleOf(user);
  return role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;
};

/** Code du profil « point focal opérateur ». */
export const OPERATOR_PROFILE_CODE = "PRF2-TEST";

/** L'utilisateur est-il un point focal d'opérateur ? */
export const isOperatorUser = (user) => (user?.role || roleOf(user)) === ROLES.FOCAL_POINT;

export default getSessionUser;
