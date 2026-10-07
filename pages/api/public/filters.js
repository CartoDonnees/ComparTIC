import prisma from "@/services/config/auth/prisma";
import { serverError } from "@/services/config/apiError";
import { publishedOfferWhere } from "@/services/workflow/publication";
import { answerPreflight } from "@/services/config/preflight";
import { loadPublishedFormulas } from "@/services/public/publicFormulas";
import { availableCountries, availableOrganizations } from "@/services/filter/zoneFilter";
import {
  CATEGORIES,
  CLIENT_TYPES,
  EXCLUDED_OPERATOR_CODE,
  INTEREST_SERVICES,
  INTEREST_SLOTS,
  MAX_COMPARE,
  NATIONAL_MODES,
  OFFER_TYPES,
  OTHER_ADVANTAGES,
  RANGES,
  SORTS,
  ZONES,
} from "@/services/filter/comparatorPresets";

const pick = ({ id, name }) => ({ id, name });

/**
 * Listes « zone géographique » et « pays » d'un panneau International ou
 * Roaming : dérivées des offres disponibles, comme sur le site
 * (voir availableOrganizations / availableCountries).
 */
const zoneOptions = (formulas, area) => {
  const organizations = availableOrganizations(formulas, area).map(pick);
  return {
    count: formulas.filter((f) => f?.offer?.area?.title === area).length,
    organizations,
    countries: availableCountries(formulas, area, null).map(pick),
    countriesByOrganization: Object.fromEntries(
      organizations.map((org) => [org.id, availableCountries(formulas, area, org).map((c) => c.id)]),
    ),
  };
};

/**
 * Référentiels nécessaires aux filtres de l'application mobile.
 *
 *   GET /api/public/filters
 *
 * Un seul appel au démarrage (opérateurs, catégories, types de facturation,
 * zones, bornes de prix) plutôt qu'une requête par liste : l'application
 * s'ouvre plus vite et consomme moins de données.
 */

let cache = { at: 0, payload: null };
const TTL_MS = 5 * 60 * 1000;

export default async function handler(req, res) {
  if (answerPreflight(req, res)) return;
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  if (cache.payload && Date.now() - cache.at < TTL_MS) {
    res.setHeader("Cache-Control", "public, max-age=300");
    return res.status(200).json(cache.payload);
  }

  try {
    const where = publishedOfferWhere();

    const [operators, areas, prices, promoCount, total, formulas, allOperators] = await Promise.all([
      // Seuls les opérateurs qui ont au moins une offre publiée.
      prisma.operator.findMany({
        where: { status: "ENABLE", offers: { some: where } },
        select: { id: true, name: true, color: true, imagePath: true, type: true },
        orderBy: { name: "asc" },
      }),
      prisma.offer.findMany({
        where,
        select: { area: { select: { title: true } } },
        distinct: ["areaId"],
      }),
      prisma.offerPrice.aggregate({
        _min: { value: true },
        _max: { value: true },
        where: { formula: { offer: where } },
      }),
      prisma.offer.count({ where: { AND: [where, { specialPromotion: { isNot: null } }] } }),
      prisma.offer.count({ where }),
      loadPublishedFormulas(),
      // Liste « Opérateurs » du comparateur : la même que le site
      // (pages/api/operators/getOperators)  - fixes, mobiles et hybrides.
      prisma.operator.findMany({
        where: { NOT: { code: EXCLUDED_OPERATOR_CODE } },
        orderBy: { updatedAt: "asc" },
        select: { id: true, name: true, color: true, imagePath: true, type: true },
      }),
    ]);

    const formulasByOperator = formulas.reduce((acc, f) => {
      const id = f.offer?.operatorId;
      acc[id] = (acc[id] || 0) + 1;
      return acc;
    }, {});

    const payload = {
      operators: operators.map((o) => ({
        id: o.id,
        name: o.name,
        color: o.color,
        logo: o.imagePath || null,
        network: o.type,
      })),
      categories: [
        { value: "MOBILE", label: "Mobile" },
        { value: "FIXE", label: "Fixe" },
      ],
      billings: [
        { value: "PREPAID", label: "Prépayé" },
        { value: "POSTPAID", label: "Postpayé" },
        { value: "HYBRID", label: "Hybride" },
      ],
      areas: [...new Set(areas.map((a) => a.area?.title).filter(Boolean))],
      priceRange: { min: prices._min.value ?? null, max: prices._max.value ?? null },
      counts: { offers: total, promotions: promoCount, formulas: formulas.length },
      // Critères du comparateur : mêmes intitulés, valeurs et paliers que le site.
      comparator: {
        offerTypes: OFFER_TYPES,
        categories: CATEGORIES,
        clientTypes: CLIENT_TYPES,
        zones: ZONES.map((zone) =>
          zone.area === "NATIONAL" ? { ...zone, count: formulas.length } : { ...zone, ...zoneOptions(formulas, zone.area) },
        ),
        operators: allOperators.map((o) => ({
          id: o.id,
          name: o.name,
          color: o.color,
          logo: o.imagePath || null,
          network: o.type,
          formulas: formulasByOperator[o.id] || 0,
        })),
        nationalModes: NATIONAL_MODES,
        otherAdvantages: OTHER_ADVANTAGES,
        interestServices: INTEREST_SERVICES,
        interestSlots: INTEREST_SLOTS,
        ranges: RANGES,
        sorts: SORTS,
        maxCompare: MAX_COMPARE,
      },
    };

    cache = { at: Date.now(), payload };
    res.setHeader("Cache-Control", "public, max-age=300");
    return res.status(200).json(payload);
  } catch (error) {
    return serverError(res, error, "API publique : filtres");
  }
}
