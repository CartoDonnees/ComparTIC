/**
 * Adresse publique de la plateforme, pour les liens envoyés par e-mail.
 *
 * `NEXT_PUBLIC_BASE_URL` n'étant pas toujours renseignée, les liens de
 * confirmation valaient « undefined/confirm-email?... » et aucun compte ne
 * pouvait être activé. À défaut de variable d'environnement, l'adresse est
 * reconstruite à partir de la requête reçue (en-têtes du reverse proxy).
 */
export const appBaseUrl = (req) => {
  const fromEnv = process.env.NEXT_PUBLIC_BASE_URL || process.env.APP_BASE_URL || process.env.BASE_URL;
  if (fromEnv) return String(fromEnv).replace(/\/+$/, "");

  const host = req?.headers?.["x-forwarded-host"] || req?.headers?.host;
  if (!host) return "";
  const proto = req?.headers?.["x-forwarded-proto"] || (String(host).startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
};

export default appBaseUrl;
