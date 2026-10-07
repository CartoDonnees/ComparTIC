/**
 * Base de données en retard sur le code.
 *
 * Quand une migration n'a pas été appliquée, Prisma échoue avec P2021 (table
 * absente) ou P2022 (colonne absente). L'utilisateur ne voyait qu'une « erreur
 * interne », sans piste. Ces erreurs sont reconnues ici et traduites en un
 * message qui dit quoi faire ; le détail technique reste dans le journal du
 * serveur.
 */
export const isSchemaOutdated = (error) => error?.code === "P2021" || error?.code === "P2022";

export const SCHEMA_OUTDATED_MESSAGE =
  "La base de données n'est pas à jour : cette fonction a besoin d'une migration qui n'a pas été appliquée. " +
  "Demandez à l'administrateur technique d'exécuter « npx prisma migrate deploy », puis réessayez.";

/** Répond 503 si l'erreur vient d'un schéma en retard ; renvoie false sinon. */
export const sendSchemaOutdated = (res, error, context = "") => {
  if (!isSchemaOutdated(error)) return false;
  console.error(`${context ? `${context} : ` : ""}schéma de base en retard (${error.code}) — exécuter « npx prisma migrate deploy ».`, error?.meta || "");
  res.status(503).json({ error: SCHEMA_OUTDATED_MESSAGE, code: "SCHEMA_OUTDATED" });
  return true;
};

export default sendSchemaOutdated;
