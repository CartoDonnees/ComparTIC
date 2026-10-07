/**
 * Construction de la liste des offres pouvant servir de PARENTE.
 *
 * Cette logique était recopiée dans cinq écrans (déclaration, modification et
 * monitoring, côté admin comme côté opérateur) avec trois défauts identiques :
 *
 *  1. `_sOfs.push(_unkwnOffer[0])` s'exécutait sans garde : quand la liste des
 *     offres n'était pas encore chargée, `offers?.filter(...)` valait
 *     `undefined` et la lecture de `[0]` levait un TypeError   l'étape 1
 *     tombait en écran blanc.
 *  2. Le calcul n'était déclenché que par `[offer?.operator]`. Les offres
 *     arrivant d'un appel réseau distinct, si l'opérateur était renseigné
 *     avant leur chargement (cas systématique côté opérateur, où l'opérateur
 *     est déduit du compte connecté), la liste restait vide sans jamais être
 *     recalculée : le champ « offre parente » n'affichait rien.
 *  3. L'offre en cours de modification figurait parmi ses propres parentes
 *     possibles, tout comme ses offres filles - deux cycles interdits.
 *  4. N'importe quelle offre de l'opérateur était proposée. Seules les offres
 *     de BASE peuvent être parentes (cf. `isBaseOffer`).
 *
 * L'offre repère « Offre Inconnu » sert d'entrée « offre parente inconnue » ;
 * elle est toujours proposée, en tête de liste, dès qu'un opérateur est choisi.
 */

/** Code de l'offre repère servant d'option « aucune parente ». */
export const UNKNOWN_OFFER_CODE = "OF-000000000000000";

/**
 * Une offre de BASE est une offre de référence de l'opérateur : ni
 * promotionnelle, ni elle-même dérivée d'une autre offre.
 *
 * Seules ces offres peuvent servir de parente. La hiérarchie reste ainsi à un
 * seul niveau (base -> versions promotionnelles ou dérivées), ce qui est la
 * condition pour que la traçabilité d'une offre reste lisible : sans cette
 * règle, une promotion pouvait être rattachée à une autre promotion et former
 * des chaînes dont plus personne ne retrouvait l'offre d'origine.
 */
export const isBaseOffer = (offer) => {
  if (!offer) return false;
  // Offre promotionnelle : elle porte une promotion spéciale.
  const hasPromotion =
    offer.specialPromotion !== null && offer.specialPromotion !== undefined;
  if (hasPromotion) return false;
  // Offre dérivée : elle est déjà rattachée à une parente.
  const hasParent =
    (offer.parentId ?? offer.parent?.id ?? null) !== null;
  if (hasParent) return false;
  return true;
};

/**
 * @param {Array|null} offers  Toutes les offres connues du formulaire.
 * @param {Object|null} offer  L'offre en cours de saisie/modification.
 * @returns {Array} Les offres sélectionnables comme parente (jamais `undefined`).
 */
export const buildParentOfferOptions = (offers, offer) => {
  if (!Array.isArray(offers) || offers.length === 0) return [];

  // BUGFIX: l offre repere « Offre Inconnu » n etait proposee que s il existait
  // AU MOINS une vraie offre de base candidate (voir la fin de la fonction). Un
  // operateur sans offre de base ne pouvait donc pas declarer une offre dont la
  // parente est inconnue   alors que c est precisement le cas d usage de cette
  // entree. Elle est desormais toujours proposee, en tete de liste.

  // L'opérateur porte le périmètre : une offre ne peut hériter que d'une offre
  // du même opérateur.
  const operatorCode = offer?.operator?.code;
  const operatorId = offer?.operator?.id;
  if (!operatorCode && !operatorId) return [];

  const currentId = offer?.id;
  const currentCode = offer?.code;

  const placeholder = offers.find((o) => o?.code === UNKNOWN_OFFER_CODE);

  const candidates = offers.filter((o) => {
    if (!o || o.code === UNKNOWN_OFFER_CODE) return false;

    const sameOperator = operatorCode
      ? o.operator?.code === operatorCode
      : (o.operator?.id ?? o.operatorId) === operatorId;
    if (!sameOperator) return false;

    // Seules les offres de base peuvent être parentes.
    if (!isBaseOffer(o)) return false;

    // Une offre ne peut pas être sa propre parente...
    if (currentId != null && o.id === currentId) return false;
    if (currentCode && o.code === currentCode) return false;
    // ...ni hériter de l'une de ses propres filles.
    if (currentId != null && (o.parentId ?? o.parent?.id) === currentId) {
      return false;
    }

    return true;
  });

  return placeholder ? [placeholder, ...candidates] : candidates;
};

export default buildParentOfferOptions;
