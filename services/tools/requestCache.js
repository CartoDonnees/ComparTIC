/**
 * Mutualisation des appels réseau répétés (navigateur).
 *
 * Quatre fournisseurs React (client, administration, opérateur, superviseur)
 * chargent les mêmes référentiels au démarrage : le relevé réseau montrait
 * jusqu'à huit appels identiques à `operators/getOperators` et quatre à
 * `auth/verify-token` pour l'affichage d'UNE page.
 *
 * `cachedRequest` renvoie la même promesse aux appels simultanés et conserve
 * le résultat pendant une courte durée. Aucune donnée n'est conservée entre
 * deux chargements de page : il s'agit d'un cache mémoire, pas d'un stockage.
 */

const entries = new Map();

const now = () => Date.now();

/**
 * @param key   identifiant logique de la requête
 * @param run   fonction sans argument renvoyant une promesse
 * @param ttlMs durée de validité du résultat (0 = seulement la déduplication)
 */
export const cachedRequest = (key, run, ttlMs = 60000) => {
  const entry = entries.get(key);

  // Appel déjà en cours : on rend la même promesse.
  if (entry?.promise) return entry.promise;

  // Résultat encore valide.
  if (entry && ttlMs > 0 && now() - entry.at < ttlMs) return Promise.resolve(entry.value);

  const promise = Promise.resolve()
    .then(run)
    .then((value) => {
      entries.set(key, { value, at: now(), promise: null });
      return value;
    })
    .catch((error) => {
      // Un échec n'est jamais mis en cache : le prochain appel réessaie.
      entries.delete(key);
      throw error;
    });

  entries.set(key, { ...(entry || {}), promise });
  return promise;
};

/** Oublie une entrée (connexion, déconnexion, modification d'un référentiel). */
export const invalidateRequest = (key) => {
  if (key === undefined) entries.clear();
  else entries.delete(key);
};

export default cachedRequest;
