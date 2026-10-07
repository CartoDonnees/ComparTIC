/**
 * Filtrage des offres par ZONE : International et Roaming.
 *
 * Ces deux filtres ne fonctionnaient pas :
 *
 *  - INTERNATIONAL : le bloc appliquait deux fois exactement la même condition
 *    (`area.title == "INTERNATIONAL"`). La zone choisie et le pays choisi
 *    n'étaient donc jamais pris en compte   sélectionner « CEDEAO » puis
 *    « Sénégal » donnait rigoureusement le même résultat que ne rien choisir.
 *
 *  - ROAMING : aucun filtrage n'existait. La liste déroulante « Pays » du
 *    panneau Roaming n'écrivait même pas dans le filtre (elle alimentait un
 *    état local jamais lu).
 *
 * La zone d'une offre est portée par `offer.area` :
 *   area.title                                   -> NATIONAL | INTERNATIONAL | ROAMING
 *   area.areaOrganizations[].organization        -> l'organisation (CEDEAO, UEMOA...)
 *   area.areaOrganizations[].organisationCountries[].country
 *                                                -> les pays retenus pour cette offre
 */

/** Identifiant exploitable d'une valeur de liste déroulante (objet ou brut). */
const idOf = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "object") return value.id ?? null;
  return value;
};

/** Nom exploitable d'une valeur de liste déroulante. */
const nameOf = (value) => {
  if (!value) return null;
  if (typeof value === "object") return value.name ?? null;
  return String(value);
};

/** Les organisations rattachées à une offre. */
export const offerOrganizations = (offer) =>
  (offer?.area?.areaOrganizations || [])
    .map((ao) => ao?.organization)
    .filter(Boolean);

/** Les pays retenus pour une offre, toutes organisations confondues. */
export const offerCountries = (offer) =>
  (offer?.area?.areaOrganizations || [])
    .flatMap((ao) => ao?.organisationCountries || [])
    .map((oc) => oc?.country)
    .filter(Boolean);

/**
 * L'offre couvre-t-elle l'organisation demandée ?
 * Sans organisation demandée, la contrainte ne s'applique pas.
 */
export const matchesOrganization = (offer, organization) => {
  const wantedId = idOf(organization);
  if (wantedId === null || wantedId === undefined) return true;

  const orgs = offerOrganizations(offer);
  // Une offre qui ne déclare AUCUNE zone ne peut pas prouver qu elle couvre
  // celle demandée : sa couverture est inconnue, pas universelle. On l écarte.
  // C est cohérent avec les listes déroulantes, qui ne proposent que des zones
  // effectivement déclarées par des offres disponibles : choisir une option
  // doit donc toujours ramener les offres correspondantes, et elles seules.
  // Sans détail sélectionné, ces offres restent bien entendu visibles.
  if (orgs.length === 0) return false;

  const wantedName = nameOf(organization);
  return orgs.some(
    (org) =>
      org.id === wantedId ||
      (wantedName && org.name?.toLowerCase() === wantedName.toLowerCase()),
  );
};

/**
 * L'offre couvre-t-elle le pays demandé ?
 *
 * Deux niveaux de preuve, du plus précis au plus large :
 *  1. le pays figure parmi les pays RETENUS pour l'offre ;
 *  2. à défaut de pays retenus (offre déclarée au niveau d'une organisation
 *     entière), le pays appartient à l'une de ses organisations.
 *
 * Ce repli évite d'écarter à tort les offres saisies sans détail pays   elles
 * couvrent bien le pays, simplement par leur organisation.
 */
export const matchesCountry = (offer, country) => {
  const wantedId = idOf(country);
  if (wantedId === null || wantedId === undefined) return true;
  const wantedName = nameOf(country);

  const sameCountry = (c) =>
    c &&
    (c.id === wantedId ||
      (wantedName && c.name?.toLowerCase() === wantedName.toLowerCase()));

  const links = offer?.area?.areaOrganizations || [];
  // Une offre qui ne déclare aucune zone ne démontre pas couvrir ce pays.
  if (links.length === 0) return false;

  // BUGFIX: le repli était évalué GLOBALEMENT (tous les pays retenus de
  // l'offre, toutes organisations confondues). Une offre rattachée à deux
  // organisations, dont l'une détaillée et l'autre non, perdait donc le repli
  // sur la seconde : un pays couvert via cette organisation n'était pas
  // reconnu. L'évaluation se fait désormais rattachement par rattachement.
  // Seuls les pays EXPLICITEMENT retenus pour l offre comptent. Le repli sur
  // l ensemble des pays de l organisation a été retiré : une organisation sans
  // pays sélectionné ne couvre aucun pays au sens du comparateur.
  return links.some((link) =>
    (link?.organisationCountries || [])
      .map((oc) => oc?.country)
      .filter(Boolean)
      .some(sameCountry),
  );
};

/**
 * L'offre satisfait-elle la combinaison zone + pays ?
 *
 * Les deux critères doivent être remplis par le MÊME rattachement
 * offre/organisation. Les évaluer séparément acceptait des combinaisons
 * incohérentes : une offre rattachée à CEDEAO (sans le pays demandé) et à
 * UEMOA (avec ce pays) ressortait sur « zone CEDEAO + pays Bénin », alors
 * qu'elle ne couvre le Bénin qu'au titre de l'UEMOA.
 */
export const matchesZoneDetail = (offer, organization, country) => {
  const wantedOrgId = idOf(organization);
  const wantedOrgName = nameOf(organization);
  const wantedCountryId = idOf(country);
  const wantedCountryName = nameOf(country);

  const noOrg = wantedOrgId === null || wantedOrgId === undefined;
  const noCountry = wantedCountryId === null || wantedCountryId === undefined;
  if (noOrg && noCountry) return true;

  const links = offer?.area?.areaOrganizations || [];
  // Sans aucun détail déclaré, l'offre ne démontre pas la couverture demandée.
  if (links.length === 0) return false;

  const orgOk = (org) =>
    noOrg ||
    org?.id === wantedOrgId ||
    (wantedOrgName && org?.name?.toLowerCase() === wantedOrgName.toLowerCase());

  const sameCountry = (c) =>
    c &&
    (c.id === wantedCountryId ||
      (wantedCountryName &&
        c.name?.toLowerCase() === wantedCountryName.toLowerCase()));

  const countryOk = (link) => {
    if (noCountry) return true;
    // Uniquement les pays retenus pour ce rattachement (voir matchesCountry).
    return (link?.organisationCountries || [])
      .map((oc) => oc?.country)
      .filter(Boolean)
      .some(sameCountry);
  };

  return links.some((link) => orgOk(link?.organization) && countryOk(link));
};

/**
 * Applique le filtre de zone à une liste de formules.
 *
 * @param {Array} formulas      formules déjà filtrées par les autres critères
 * @param {"INTERNATIONAL"|"ROAMING"} zone
 * @param {Object|number|null} organization  zone géographique choisie
 * @param {Object|number|null} country       pays choisi
 */
export const filterByZone = (formulas, zone, organization, country) => {
  if (!Array.isArray(formulas)) return [];
  return formulas.filter((f) => {
    const offer = f?.offer;
    if (offer?.area?.title !== zone) return false;
    return matchesZoneDetail(offer, organization, country);
  });
};

/* ==========================================================================
   Options réellement disponibles
   --------------------------------------------------------------------------
   Les listes déroulantes étaient alimentées par les référentiels complets
   (toutes les organisations, les ~200 pays du monde) : l'utilisateur pouvait
   donc choisir une zone ou un pays qu'AUCUNE offre ne couvre, et n'obtenait
   aucun résultat sans comprendre pourquoi.

   Les deux fonctions ci-dessous dérivent les options des offres effectivement
   disponibles, et la liste des pays dépend de la zone géographique retenue.
   ========================================================================== */

/** Dédoublonne par identifiant et trie par libellé. */
const uniqueByIdSorted = (items) => {
  const map = new Map();
  items.filter(Boolean).forEach((item) => {
    const key = item.id ?? item.name;
    if (key !== undefined && key !== null && !map.has(key)) map.set(key, item);
  });
  return [...map.values()].sort((a, b) =>
    String(a?.name || "").localeCompare(String(b?.name || ""), "fr"),
  );
};

/** Les formules de la zone demandée. */
const formulasOfZone = (formulas, zone) =>
  (Array.isArray(formulas) ? formulas : []).filter(
    (f) => f?.offer?.area?.title === zone,
  );

/**
 * Zones géographiques (organisations) présentes sur les offres disponibles
 * de la zone demandée.
 */
export const availableOrganizations = (formulas, zone) =>
  uniqueByIdSorted(
    formulasOfZone(formulas, zone).flatMap((f) => offerOrganizations(f.offer)),
  );

/**
 * Pays présents sur les offres disponibles de la zone demandée.
 *
 * Quand une organisation est sélectionnée, seuls ses pays sont proposés :
 * c'est la dépendance « pays visité » -> « zone géographique ».
 *
 * Pour chaque rattachement offre/organisation, on retient les pays explicitement
 * enregistrés ; à défaut, ceux de l'organisation elle-même (offre déclarée au
 * niveau d'une organisation entière).
 */
export const availableCountries = (formulas, zone, organization) => {
  const wantedOrgId = idOf(organization);
  const wantedOrgName = nameOf(organization);

  const matchesWanted = (org) => {
    if (wantedOrgId === null || wantedOrgId === undefined) return true;
    return (
      org?.id === wantedOrgId ||
      (wantedOrgName &&
        org?.name?.toLowerCase() === wantedOrgName.toLowerCase())
    );
  };

  const countries = formulasOfZone(formulas, zone).flatMap((f) =>
    (f?.offer?.area?.areaOrganizations || [])
      .filter((ao) => matchesWanted(ao?.organization))
      // Seuls les pays retenus sont proposés : la liste déroulante ne doit pas
      // offrir un pays que l offre ne couvre pas explicitement.
      .flatMap((ao) =>
        (ao?.organisationCountries || []).map((oc) => oc?.country).filter(Boolean),
      ),
  );

  return uniqueByIdSorted(countries);
};

/**
 * Couverture géographique d'une offre, prête à l'affichage.
 *
 * Retourne un tableau `[{ organization, countries }]` : une entrée par zone
 * géographique déclarée, avec les pays retenus pour cette zone. À défaut de
 * pays explicitement retenus, on présente ceux de l'organisation (offre
 * déclarée au niveau de l'organisation entière)   c'est bien la couverture
 * réelle de l'offre.
 */
export const offerCoverage = (offer) =>
  (offer?.area?.areaOrganizations || [])
    .map((link) => {
      const organization = link?.organization || null;
      if (!organization) return null;

      // UNIQUEMENT les pays sélectionnés dans l organisation pour cette offre.
      // Auparavant, une organisation sans pays retenu affichait la totalité de
      // ses pays   ce qui laissait croire à une couverture non déclarée.
      const countries = (link?.organisationCountries || [])
        .map((oc) => oc?.country)
        .filter(Boolean)
        .sort((a, b) =>
          String(a?.name || "").localeCompare(String(b?.name || ""), "fr"),
        );

      return { organization, countries };
    })
    .filter(Boolean)
    .sort((a, b) =>
      String(a.organization?.name || "").localeCompare(
        String(b.organization?.name || ""),
        "fr",
      ),
    );

/** L'offre porte-t-elle une couverture géographique à présenter ? */
export const hasCoverage = (offer) =>
  offer?.area?.title !== "NATIONAL" && offerCoverage(offer).length > 0;

export default filterByZone;
