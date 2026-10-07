import prisma from "@/services/config/auth/prisma";
import { publishedOfferWhere } from "@/services/workflow/publication";
import { cachedRequest } from "@/services/tools/requestCache";
import { handleInitFilter, sortOffers } from "@/services/filter/filterServices";
import { interleaveOffersByOperator } from "@/services/tools/filter/filter";
import { formulaServices, plainText, promotionOf } from "@/services/public/publicOffers";
import { RANGE_FIELDS } from "@/services/filter/comparatorPresets";

/**
 * Comparateur public par FORMULE  - application mobile.
 *
 * Le comparateur web raisonne par formule (une carte = une formule, avec son
 * prix, sa validité et ses volumes) et filtre côté navigateur avec
 * `handleInitFilter`. Pour que l'application applique EXACTEMENT les mêmes
 * règles, ce module n'en réécrit aucune : il reconstitue l'état de la barre
 * latérale web (`filter`, `sideControl`, opérateurs retenus) à partir des
 * paramètres de la requête, puis appelle les mêmes fonctions :
 *
 *   handleInitFilter            filtres (type d'offre, catégorie, client,
 *                               opérateurs, zone, besoin / budget)
 *   recherche par nom           même règle que `handleSearchByTitle`
 *   sortOffers                  en-tête « Trier par »
 *   interleaveOffersByOperator  ordre « Aléatoire » (alternance des opérateurs)
 */

/** Même forme que `getClientFormulas`, réduite à ce que l'application lit. */
const FORMULA_SELECT = {
  id: true,
  title: true,
  validity: true,
  updatedAt: true,
  price: { select: { value: true } },
  serviceDetail: {
    select: { quantity: true, comtype: true, service: { select: { title: true } } },
  },
  advantages: { select: { title: true } },
  offer: {
    select: {
      id: true,
      code: true,
      title: true,
      category: true,
      billingType: true,
      operatorId: true,
      desiredDate: true,
      operator: { select: { id: true, name: true, color: true, imagePath: true } },
      specialPromotion: { select: { type: true, duration: true } },
      accessModes: { select: { content: true } },
      area: {
        select: {
          title: true,
          areaOrganizations: {
            select: {
              organization: { select: { id: true, name: true } },
              organisationCountries: {
                select: { country: { select: { id: true, name: true, code: true } } },
              },
            },
          },
        },
      },
    },
  },
};

const CACHE_KEY = "public:formulas";
const CACHE_TTL_MS = 60 * 1000;

/**
 * Formules publiées, dans l'ordre du comparateur web (dernière mise à jour
 * d'abord). Mises en cache une minute : toutes les recherches de
 * l'application s'appuient sur la même liste.
 */
export const loadPublishedFormulas = () =>
  cachedRequest(
    CACHE_KEY,
    () =>
      prisma.offerFormula.findMany({
        where: { offer: publishedOfferWhere() },
        orderBy: { updatedAt: "desc" },
        select: FORMULA_SELECT,
      }),
    CACHE_TTL_MS,
  );

/* --------------------------------------------------------------- lecture */

const number = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const flag = (value) => value === "1" || value === "true" || value === true;

const idList = (value) =>
  (Array.isArray(value) ? value : String(value || "").split(","))
    .map((v) => Number(v))
    .filter((v) => Number.isInteger(v) && v > 0);

const oneOf = (value, allowed, fallback) => (allowed.includes(Number(value)) ? Number(value) : fallback);

/**
 * Paramètres de requête -> état de la barre latérale web.
 * Toutes les valeurs viennent du client : elles sont bornées ici.
 */
export const parseComparatorQuery = (query = {}) => {
  const zone = ["national", "internat", "roaming"].includes(query.zone) ? query.zone : "national";
  const mode = ["need", "budget"].includes(query.mode) ? query.mode : null;

  const sideControl = {
    national: zone === "national",
    internat: zone === "internat",
    roaming: zone === "roaming",
    need: zone === "national" && mode === "need",
    budget: zone === "national" && mode === "budget",
  };

  const filter = {
    offerType: oneOf(query.offerType, [-1, 1, 2], -1),
    category: oneOf(query.category, [-1, 1, 2], -1),
    cTPrepay: flag(query.cTPrepay),
    cTPostpay: flag(query.cTPostpay),
    cTHybride: flag(query.cTHybride),
  };

  // Plages : `handleInitFilter` ne lit que celles du mode actif (besoin ou
  // budget), exactement comme sur le site.
  for (const field of RANGE_FIELDS) filter[field] = number(query[field]);

  const orgOrNull = (value) => (number(value) ? { id: number(value) } : null);
  // Présents dans le formulaire du site, sans effet sur les résultats.
  filter.social_networks = flag(query.social_networks);

  filter.interMainorgs = orgOrNull(query.interOrg);
  filter.interCountry = orgOrNull(query.interCountry);
  filter.roamMainorgs = orgOrNull(query.roamOrg);
  filter.roamCountry = orgOrNull(query.roamCountry);

  // Aucun opérateur coché sur le site = aucune formule ; « none » le signale.
  const noOperator = query.operators === "none";
  const operatorIds = noOperator ? [] : idList(query.operators);

  return {
    filter,
    sideControl,
    // Aucun opérateur choisi = tous (le site les présélectionne tous).
    selectedOperators: noOperator ? [] : operatorIds.length ? operatorIds.map((id) => ({ id })) : null,
    search: String(query.search || "").trim().slice(0, 80),
    sort: ["price", "validity", "voice", "sms", "data"].includes(query.sort) ? query.sort : null,
    order: query.order === "desc" ? "desc" : "asc",
    random: query.random === undefined ? true : flag(query.random),
    seed: Math.abs(Math.trunc(number(query.seed) || 0)) % 2147483647 || 1,
  };
};

/** Générateur pseudo-aléatoire à graine (mulberry32). */
const seededRandom = (seed) => {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

/**
 * Applique les règles du comparateur web.
 * @returns {Array} formules retenues, dans l'ordre d'affichage
 */
export const applyComparator = (formulas, params) => {
  let result = handleInitFilter(params.filter, formulas, params.selectedOperators, params.sideControl);

  if (params.search) {
    const q = params.search.toLowerCase();
    result = result.filter((item) => String(item.title || "").toLowerCase().includes(q));
  }

  if (params.sort) {
    // `sortOffers` du site trie « asc » du plus grand au plus petit (sens de
    // l'en-tête web). L'application annonce l'ordre réel : on inverse donc la
    // clé pour obtenir le sens affiché.
    return sortOffers(result, params.sort, params.order === "asc" ? "desc" : "asc");
  }
  if (params.random) return interleaveOffersByOperator(result, seededRandom(params.seed));
  return result;
};

/* ------------------------------------------------------------ présentation */

const ZONE_LABELS = { NATIONAL: "Nationale", INTERNATIONAL: "Internationale", ROAMING: "Roaming" };

/** Carte « formule », équivalente à une ligne de résultat du comparateur web. */
export const toFormulaCard = (formula) => {
  const offer = formula.offer || {};
  return {
    id: formula.id,
    title: formula.title,
    price: formula.price?.value ?? null,
    validityDays: formula.validity ?? null,
    services: formulaServices(formula),
    advantages: (formula.advantages || []).map((a) => a.title).filter(Boolean),
    accessModes: (offer.accessModes || []).map((a) => plainText(a.content)).filter(Boolean).slice(0, 2),
    offer: {
      id: offer.id,
      code: offer.code,
      title: offer.title,
      category: offer.category,
      billingType: offer.billingType,
      area: offer.area?.title || null,
      areaLabel: ZONE_LABELS[offer.area?.title] || null,
    },
    operator: offer.operator
      ? {
          id: offer.operator.id,
          name: offer.operator.name,
          color: offer.operator.color,
          logo: offer.operator.imagePath || null,
        }
      : null,
    promotion: promotionOf(offer),
  };
};

