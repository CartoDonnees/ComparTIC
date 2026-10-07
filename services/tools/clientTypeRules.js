/**
 * Type de client (prépayé / postpayé / hybride) : compatibilité entre une
 * offre et l'offre parente à laquelle elle est rattachée.
 *
 * Règle métier :
 *  - une offre POSTPAYÉE ne peut pas être rattachée à une offre PRÉPAYÉE ;
 *  - une offre PRÉPAYÉE ne peut pas être rattachée à une offre POSTPAYÉE ;
 *  - l'HYBRIDE fait exception dans les deux sens : une offre hybride peut être
 *    rattachée à une offre prépayée ou postpayée, et une offre hybride peut
 *    porter à la fois des offres prépayées et des offres postpayées.
 *
 *            parente →   PRÉPAYÉ   POSTPAYÉ   HYBRIDE
 *   offre PRÉPAYÉE         oui       NON        oui
 *   offre POSTPAYÉE        NON       oui        oui
 *   offre HYBRIDE          oui       oui        oui
 *
 * Source unique : import Excel ET création manuelle avec offre parente.
 * Module sans dépendance serveur.
 */

export const CLIENT_TYPE_LABELS = { PREPAID: "prépayée", POSTPAID: "postpayée", HYBRID: "hybride" };

/** L'offre de type `child` peut-elle être rattachée à une parente de type `parent` ? */
export const isClientTypeCompatible = (child, parent) => {
  // Type inconnu d'un côté : rien à comparer (les champs obligatoires sont contrôlés ailleurs).
  if (!child || !parent) return true;
  return child === "HYBRID" || parent === "HYBRID" || child === parent;
};

/** Message de rejet, ou null si le rattachement est autorisé. */
export const clientTypeConflict = (child, parent, parentCode = null) => {
  if (isClientTypeCompatible(child, parent)) return null;
  const c = CLIENT_TYPE_LABELS[child] || child;
  const p = CLIENT_TYPE_LABELS[parent] || parent;
  return `Une offre ${c} ne peut pas être rattachée à une offre ${p}${parentCode ? ` (${parentCode})` : ""}. Seule une offre hybride peut être associée aux deux types de client.`;
};

export default isClientTypeCompatible;
