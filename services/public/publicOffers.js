import prisma from "@/services/config/auth/prisma";
import { publishedOfferWhere } from "@/services/workflow/publication";

/**
 * Lecture publique des offres (comparateur web et application mobile).
 *
 * Le comparateur web charge aujourd'hui TOUTES les formules publiées avec
 * leurs relations profondes (~80 Ko pour 53 formules) : acceptable sur un
 * ordinateur, beaucoup trop pour un téléphone en 3G. Ce module expose les
 * mêmes données, mais paginées et réduites à ce qu'un écran mobile affiche.
 *
 * Aucune règle métier n'est réécrite : la notion d'offre publiée reste celle
 * de `services/workflow/publication.js`.
 */

const SERVICE_LABELS = { VOIX: "Appels", SMS: "SMS", DATA: "Internet" };
const COMTYPE_LABELS = { ALL_NET: "Tous réseaux", ON_NET: "On-net", OFF_NET: "Off-net" };

/** Texte riche (saisi par l'opérateur) -> texte simple pour l'application. */
export const plainText = (html) =>
  String(html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();

export const formulaServices = (formula) =>
  (formula.serviceDetail || [])
    .map((d) => {
      const title = d.service?.title;
      if (!title) return null;
      const qty = Number(d.quantity);
      return {
        type: title,
        label: SERVICE_LABELS[title] || title,
        quantity: Number.isFinite(qty) ? qty : null,
        // L'unité dépend du service : Mo pour l'internet, minutes, SMS.
        unit: title === "DATA" ? "Mo" : title === "VOIX" ? "min" : "SMS",
        network: d.comtype ? COMTYPE_LABELS[d.comtype] || d.comtype : null,
      };
    })
    .filter(Boolean);

/**
 * Promotion d'une offre. La date de fin est calculée comme sur le
 * comparateur web (« Jusqu'au » : date de mise en service + durée en jours).
 */
export const promotionOf = (offer) => {
  const promo = offer?.specialPromotion;
  if (!promo) return null;
  const durationDays = Number(promo.duration) || null;
  let endsAt = null;
  if (offer.desiredDate && durationDays) {
    const end = new Date(offer.desiredDate);
    end.setDate(end.getDate() + durationDays);
    endsAt = end.toISOString();
  }
  return { type: promo.type, durationDays, endsAt };
};

/** Résumé d'une offre pour une liste (carte mobile). */
export const toOfferCard = (offer) => {
  const prices = (offer.formulas || [])
    .map((f) => Number(f.price?.value))
    .filter((v) => Number.isFinite(v));
  const validities = (offer.formulas || [])
    .map((f) => Number(f.validity))
    .filter((v) => Number.isFinite(v));

  return {
    id: offer.id,
    code: offer.code,
    title: offer.title,
    category: offer.category,
    billingType: offer.billingType,
    area: offer.area?.title || null,
    operator: offer.operator
      ? {
          id: offer.operator.id,
          name: offer.operator.name,
          color: offer.operator.color,
          logo: offer.operator.imagePath || null,
        }
      : null,
    promotion: promotionOf(offer),
    formulaCount: offer.formulas?.length || 0,
    priceFrom: prices.length ? Math.min(...prices) : null,
    priceTo: prices.length ? Math.max(...prices) : null,
    validityFrom: validities.length ? Math.min(...validities) : null,
    validityTo: validities.length ? Math.max(...validities) : null,
    // Aperçu des services de la formule la moins chère : ce que l'utilisateur
    // regarde en premier sur une carte.
    highlights: formulaServices(
      (offer.formulas || []).slice().sort((a, b) => (a.price?.value ?? 1e9) - (b.price?.value ?? 1e9))[0] || {},
    ),
    updatedAt: offer.updatedAt,
  };
};

/** Détail complet d'une offre (écran « fiche offre »). */
export const toOfferDetail = (offer) => ({
  ...toOfferCard(offer),
  description: plainText(offer.description),
  target: plainText(offer.target),
  notifiedAt: offer.notifiDate,
  availableFrom: offer.desiredDate,
  accessModes: (offer.accessModes || []).map((a) => plainText(a.content)).filter(Boolean),
  formulas: (offer.formulas || [])
    .slice()
    .sort((a, b) => (a.price?.value ?? 1e9) - (b.price?.value ?? 1e9))
    .map((f) => ({
      id: f.id,
      title: f.title,
      price: f.price?.value ?? null,
      validityDays: f.validity ?? null,
      services: formulaServices(f),
      advantages: (f.advantages || []).map((a) => a.title).filter(Boolean),
    })),
});

/** Champs nécessaires aux cartes (liste). */
export const CARD_SELECT = {
  id: true,
  code: true,
  title: true,
  category: true,
  billingType: true,
  updatedAt: true,
  desiredDate: true,
  area: { select: { title: true } },
  operator: { select: { id: true, name: true, color: true, imagePath: true } },
  specialPromotion: { select: { type: true, duration: true } },
  formulas: {
    select: {
      id: true,
      validity: true,
      price: { select: { value: true } },
      serviceDetail: {
        select: { quantity: true, comtype: true, service: { select: { title: true } } },
      },
    },
  },
};

/** Champs nécessaires à la fiche détaillée. */
export const DETAIL_SELECT = {
  ...CARD_SELECT,
  description: true,
  target: true,
  notifiDate: true,
  desiredDate: true,
  accessModes: { select: { content: true } },
  formulas: {
    select: {
      ...CARD_SELECT.formulas.select,
      title: true,
      advantages: { select: { title: true } },
    },
  },
};

/**
 * Construit le filtre Prisma d'une recherche publique.
 * Les valeurs viennent du client : elles sont toutes bornées et validées ici.
 */
export const buildOfferWhere = ({ search, category, billing, operatorIds, promo }) => {
  const where = { AND: [publishedOfferWhere()] };

  if (search) {
    const q = String(search).slice(0, 80);
    where.AND.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { code: { contains: q, mode: "insensitive" } },
        { operator: { name: { contains: q, mode: "insensitive" } } },
      ],
    });
  }
  if (category === "MOBILE" || category === "FIXE") where.AND.push({ category });

  const billings = (Array.isArray(billing) ? billing : String(billing || "").split(","))
    .map((b) => String(b).trim().toUpperCase())
    .filter((b) => ["PREPAID", "POSTPAID", "HYBRID"].includes(b));
  if (billings.length) where.AND.push({ billingType: { in: billings } });

  const ids = (Array.isArray(operatorIds) ? operatorIds : String(operatorIds || "").split(","))
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v) && v > 0);
  if (ids.length) where.AND.push({ operatorId: { in: ids } });

  if (promo === "true" || promo === true) where.AND.push({ specialPromotion: { isNot: null } });
  if (promo === "false" || promo === false) where.AND.push({ specialPromotion: { is: null } });

  return where;
};

/** Tris proposés dans l'application. */
export const ORDER_BY = {
  recent: [{ updatedAt: "desc" }],
  title: [{ title: "asc" }],
  operator: [{ operator: { name: "asc" } }, { title: "asc" }],
};

export const countPublishedOffers = (where) => prisma.offer.count({ where });
