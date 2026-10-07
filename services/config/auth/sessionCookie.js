import cookie from "cookie";
import { JWT_TOKEN } from "@/services/tools/constants";

/**
 * Cookie de session.
 *
 * `Secure` suit la connexion RÉELLE, et non plus NODE_ENV.
 *
 * BUGFIX (déploiement Ubuntu) : le cookie était marqué `Secure` dès que
 * NODE_ENV=production. Sur un serveur servi en HTTP (sans certificat), le
 * navigateur REFUSE un tel cookie : la connexion réussissait (le jeton était
 * gardé côté navigateur), mais le middleware, qui ne lit que le cookie, ne
 * voyait aucune session et renvoyait vers l'accueil  - pour tous les profils.
 *
 * Réglage : SESSION_COOKIE_SECURE dans .env
 *   (absent) / auto  -> Secure si la requête arrive en HTTPS (directement, ou
 *                       derrière Nginx avec l'en-tête X-Forwarded-Proto) ;
 *   true             -> toujours Secure (site 100 % HTTPS) ;
 *   false            -> jamais Secure (déconseillé hors réseau interne).
 */
export const SESSION_MAX_AGE = 60 * 60 * 10; // 10 h, comme le jeton

/** La requête est-elle arrivée en HTTPS ? */
export const isHttpsRequest = (req) => {
  const forwarded = String(req?.headers?.["x-forwarded-proto"] || "")
    .split(",")[0]
    .trim()
    .toLowerCase();
  if (forwarded) return forwarded === "https";
  return Boolean(req?.socket?.encrypted || req?.connection?.encrypted);
};

const secureFor = (req) => {
  const setting = String(process.env.SESSION_COOKIE_SECURE || "auto").toLowerCase();
  if (setting === "true") return true;
  if (setting === "false") return false;
  return isHttpsRequest(req);
};

const options = (req, maxAge) => ({
  httpOnly: true,
  secure: secureFor(req),
  sameSite: "strict",
  path: "/",
  maxAge,
});

export const sessionCookie = (token, req) => cookie.serialize(JWT_TOKEN, token, options(req, SESSION_MAX_AGE));

export const clearedSessionCookie = (req) => cookie.serialize(JWT_TOKEN, "", options(req, 0));

export default sessionCookie;
