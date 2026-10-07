import prisma from "@/services/config/auth/prisma";
import { PERMISSIONS, can } from "@/services/rbac/permissions";
import { ROLES } from "@/services/rbac/roles";
import { SENTINEL_OFFER_CODE } from "@/services/workflow/offerWorkflow";
import { AUDIT_ACTION_LABELS, WORKFLOW_STATUS_STYLE } from "@/services/tools/workflowLabels";

/**
 * Interrogation de la base des offres pour l'assistant ComparIA.
 *
 * Le service d'analyse ne voit pas la base de CompareTIC. Avant de lui
 * transmettre une question qui porte sur des offres, on recherche ICI les
 * offres concernées    avec les droits de l'utilisateur connecté    et on les
 * joint à la question sous forme d'un bloc de données. L'assistant peut ainsi
 * rechercher une offre, en comparer plusieurs, retrouver des offres proches,
 * filtrer selon des critères, lire l'historique d'une offre et synthétiser.
 *
 * SÉCURITÉ : le périmètre est imposé par le serveur. Un point focal ne reçoit
 * que les offres de SON opérateur, sans le nom des agents de l'ARTCI ni
 * l'analyse interne ; les autres profils de l'espace de gestion voient toutes
 * les offres. Rien de ce que le navigateur envoie ne peut élargir ce périmètre.
 */

const MAX_OFFERS = 8;
const MAX_CONTEXT_CHARS = 7000;

const strip = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const OFFER_INTENT = /\b(offres?|formules?|forfaits?|pass|promos?|promotions?|tarifs?|prix|compar\w*|similaires?|proches?|historique|monitoring|operateurs?|roaming|international\w*|prepay\w*|postpay\w*|hybrides?)\b/;

const STATUS_WORDS = [
  ["VALIDATED", /\bvalidee?s?\b|\bpubliee?s?\b/],
  ["REFUSED", /\brefusee?s?\b|\brejetee?s?\b/],
  ["SUBMITTED", /\bsoumises?\b/],
  ["IN_VALIDATION", /\ben (cours|attente) de validation\b|\ben attente\b|\ben cours\b/],
  ["DEACTIVATED", /\bdesactivee?s?\b|\bretiree?s?\b/],
  ["DRAFT", /\bbrouillons?\b/],
];

const BILLING_LABEL = { PREPAID: "prépayé", POSTPAID: "postpayé", HYBRID: "hybride" };
const ZONE_LABEL = { NATIONAL: "nationale", INTERNATIONAL: "internationale", ROAMING: "roaming" };
const SERVICE_UNIT = { VOIX: ["Appels", "min"], SMS: ["SMS", ""], DATA: ["Internet", "Mo"] };

const money = (n) => `${Number(n).toLocaleString("fr-FR")} F`;
const dateFr = (d) => (d ? new Date(d).toLocaleDateString("fr-FR") : "  ");

let operatorCache = { at: 0, list: [] };
const operators = async () => {
  if (Date.now() - operatorCache.at > 300000) {
    operatorCache = { at: Date.now(), list: await prisma.operator.findMany({ select: { id: true, name: true, code: true } }) };
  }
  return operatorCache.list;
};

/** Critères reconnus dans la question. */
export const parseOfferQuestion = async (question) => {
  const raw = String(question || "");
  const q = strip(raw);
  const criteria = { labels: [] };

  criteria.codes = [...new Set((raw.match(/\bOF{1,2}[-_][A-Z0-9][A-Z0-9_-]{2,}\b|\bOF{1,2}\d[A-Z0-9_-]{3,}\b/gi) || []).map((c) => c.toUpperCase()))];
  if (criteria.codes.length) criteria.labels.push(`code ${criteria.codes.join(", ")}`);

  criteria.operators = (await operators()).filter((o) => o.code !== "OPE-000" && new RegExp(`\\b${strip(o.name).replace(/[^a-z0-9]+/g, "[\\s-]*")}\\b`).test(q));
  if (criteria.operators.length) criteria.labels.push(`opérateur ${criteria.operators.map((o) => o.name).join(", ")}`);

  criteria.statuses = STATUS_WORDS.filter(([, re]) => re.test(q)).map(([s]) => s);
  if (criteria.statuses.length) criteria.labels.push(`statut ${criteria.statuses.map((s) => WORKFLOW_STATUS_STYLE[s].label.toLowerCase()).join(", ")}`);

  if (/\bmobiles?\b/.test(q)) criteria.category = "MOBILE";
  else if (/\bfixes?\b|\bfibre\b|\bbox\b/.test(q)) criteria.category = "FIXE";
  if (criteria.category) criteria.labels.push(criteria.category === "MOBILE" ? "mobile" : "fixe");

  criteria.billing = [
    ["PREPAID", /\bprepay/],
    ["POSTPAID", /\bpostpay/],
    ["HYBRID", /\bhybride/],
  ]
    .filter(([, re]) => re.test(q))
    .map(([b]) => b);
  if (criteria.billing.length) criteria.labels.push(`type de client ${criteria.billing.map((b) => BILLING_LABEL[b]).join(", ")}`);

  if (/\broaming\b|\bitinerance\b/.test(q)) criteria.zone = "ROAMING";
  else if (/\binternational/.test(q)) criteria.zone = "INTERNATIONAL";
  else if (/\bnational/.test(q)) criteria.zone = "NATIONAL";
  if (criteria.zone) criteria.labels.push(`zone ${ZONE_LABEL[criteria.zone]}`);

  if (/\bpromo/.test(q)) criteria.promo = true;
  else if (/\boffres? de base\b/.test(q)) criteria.promo = false;
  if (criteria.promo !== undefined) criteria.labels.push(criteria.promo ? "promotionnelle" : "offre de base");

  const num = (m) => Number(String(m).replace(/[\s. ]/g, ""));
  const max = q.match(/(?:moins de|inferieure?s? a|maximum|max|jusqu'?a|au plus)\s*(\d[\d\s. ]*)/);
  const min = q.match(/(?:plus de|superieure?s? a|minimum|min|au moins)\s*(\d[\d\s. ]*)/);
  if (max && num(max[1]) > 0) {
    criteria.maxPrice = num(max[1]);
    criteria.labels.push(`prix ≤ ${money(criteria.maxPrice)}`);
  }
  if (min && num(min[1]) > 0) {
    criteria.minPrice = num(min[1]);
    criteria.labels.push(`prix ≥ ${money(criteria.minPrice)}`);
  }

  criteria.services = [
    ["DATA", /\binternet\b|\bdata\b|\bgo\b|\bmo\b/],
    ["VOIX", /\bappels?\b|\bvoix\b|\bminutes?\b/],
    ["SMS", /\bsms\b/],
  ]
    .filter(([, re]) => re.test(q))
    .map(([s]) => s);
  if (criteria.services.length) criteria.labels.push(`service ${criteria.services.map((s) => SERVICE_UNIT[s][0].toLowerCase()).join(", ")}`);

  // Intitulés entre guillemets : recherche dans le nom de l'offre.
  criteria.titles = [...raw.matchAll(/[«"“]\s*([^»"”]{3,80}?)\s*[»"”]/g)].map((m) => m[1].trim());
  if (criteria.titles.length) criteria.labels.push(`intitulé « ${criteria.titles.join(" », « ")} »`);

  criteria.history = /\bhistorique\b|\bparcours\b|\bcircuit\b|\bqui a valide\b|\bdecisions?\b/.test(q);
  criteria.wanted = OFFER_INTENT.test(q) || criteria.codes.length > 0 || criteria.operators.length > 0 || criteria.titles.length > 0;
  return criteria;
};

const OFFER_SELECT = {
  id: true,
  code: true,
  title: true,
  category: true,
  billingType: true,
  workflowStatus: true,
  currentValidationLevel: true,
  version: true,
  notifiDate: true,
  desiredDate: true,
  validatedAt: true,
  operator: { select: { id: true, name: true } },
  parent: { select: { code: true, title: true } },
  specialPromotion: { select: { type: true, duration: true } },
  area: {
    select: {
      title: true,
      areaOrganizations: { select: { organization: { select: { name: true } }, organisationCountries: { select: { country: { select: { name: true } } } } } },
    },
  },
  formulas: {
    select: {
      title: true,
      validity: true,
      price: { select: { value: true } },
      serviceDetail: { select: { quantity: true, service: { select: { title: true } }, offerRate: { select: { value: true } } } },
    },
    orderBy: { id: "asc" },
  },
};

const describeOffer = (o, index) => {
  const zone = o.area?.title;
  const coverage = (o.area?.areaOrganizations || [])
    .map((ao) => `${ao.organization?.name}${ao.organisationCountries.length ? ` : ${ao.organisationCountries.map((c) => c.country.name).join(", ")}` : ""}`)
    .join(" ; ");
  const kind = o.specialPromotion ? `promotion ${String(o.specialPromotion.type).toLowerCase()} de ${o.specialPromotion.duration} j` : "offre de base";
  const head =
    `${index}. « ${o.title} » (${o.code})    ${o.operator?.name}    ${kind}    ${o.category === "FIXE" ? "fixe" : "mobile"}, ${BILLING_LABEL[o.billingType] || o.billingType}` +
    `    zone ${ZONE_LABEL[zone] || "non renseignée"}${coverage ? ` (${coverage})` : ""}` +
    `    statut : ${WORKFLOW_STATUS_STYLE[o.workflowStatus]?.label || o.workflowStatus}${o.currentValidationLevel ? ` (niveau ${o.currentValidationLevel})` : ""}` +
    `    notifiée le ${dateFr(o.notifiDate)}, lancement souhaité le ${dateFr(o.desiredDate)}` +
    `${o.version > 1 ? `    version ${o.version}` : ""}${o.parent ? `    offre parente : ${o.parent.title} (${o.parent.code})` : ""}`;
  const formulas = o.formulas
    .slice(0, 6)
    .map((f) => {
      const services = f.serviceDetail
        .map((d) => {
          const [label, unit] = SERVICE_UNIT[d.service?.title] || [d.service?.title, ""];
          const qty = Number(d.quantity) === -1 ? "illimité" : `${Number(d.quantity).toLocaleString("fr-FR")}${unit ? ` ${unit}` : ""}`;
          return `${label} ${qty}${d.offerRate ? ` à ${money(d.offerRate.value)} l'unité` : ""}`;
        })
        .join(", ");
      return `${f.title} (${f.validity} j)${f.price ? ` ${money(f.price.value)}` : ""}${services ? ` : ${services}` : ""}`;
    })
    .join(" ; ");
  return `${head}\n   Formules : ${formulas || "aucune"}${o.formulas.length > 6 ? ` ; … (+${o.formulas.length - 6})` : ""}`;
};

/** Historique d'une offre (journal du circuit), adapté au profil. */
const describeHistory = async (offerId, internal) => {
  const audit = await prisma.auditLog.findMany({
    where: { offerId, action: { not: "NOTIFY" } },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { action: true, level: true, comment: true, createdAt: true, actorRole: true, actor: { select: { firstName: true, lastName: true } } },
    take: 40,
  });
  if (!audit.length) return "   Historique : aucune étape enregistrée.";
  return (
    "   Historique :\n" +
    audit
      .map((a) => {
        const who = internal && a.actor ? ` par ${[a.actor.firstName, a.actor.lastName].filter(Boolean).join(" ")}` : a.actorRole ? ` (${a.actorRole})` : "";
        // Commentaires : toujours pour l'ARTCI ; pour l'opérateur, seulement ceux des décisions qui lui sont destinées.
        const showComment = a.comment && (internal || ["REFUSE", "VALIDATE_FINAL", "DEACTIVATE"].includes(a.action));
        return `   - ${dateFr(a.createdAt)} : ${AUDIT_ACTION_LABELS[a.action]?.label || a.action}${a.level ? ` (niveau ${a.level})` : ""}${who}${showComment ? `    « ${String(a.comment).slice(0, 300)} »` : ""}`;
      })
      .join("\n")
  );
};

/**
 * Recherche les offres utiles à la question et compose le bloc de données.
 *
 * @param question  question de l'utilisateur
 * @param actor     utilisateur connecté (rôle, opérateur)
 * @param offerId   offre de contexte (page ouverte depuis une offre), facultatif
 * @returns {{ used: boolean, context: string, sources: Array, criteria: string[], total: number, scope: string }}
 */
export const retrieveOffersForQuestion = async (question, actor, { offerId = null } = {}) => {
  const none = { used: false, context: "", sources: [], criteria: [], total: 0, scope: "" };
  if (!can(actor?.role, PERMISSIONS.OFFER_READ)) return none;
  const criteria = await parseOfferQuestion(question);
  const contextId = Number.isInteger(Number(offerId)) && Number(offerId) > 0 ? Number(offerId) : null;
  if (!criteria.wanted && !contextId) return none;

  // Périmètre imposé par le serveur.
  const focal = actor.role === ROLES.FOCAL_POINT;
  if (focal && !actor.operatorId) return none;
  const scope = { code: { not: SENTINEL_OFFER_CODE }, ...(focal ? { operatorId: Number(actor.operatorId) } : {}) };
  const internal = !focal;

  const and = [];
  if (criteria.codes.length) and.push({ OR: criteria.codes.map((c) => ({ code: { contains: c, mode: "insensitive" } })) });
  if (criteria.operators.length) and.push({ operatorId: { in: criteria.operators.map((o) => o.id) } });
  if (criteria.statuses.length) and.push({ workflowStatus: { in: criteria.statuses } });
  if (criteria.category) and.push({ category: criteria.category });
  if (criteria.billing.length) and.push({ billingType: { in: criteria.billing } });
  if (criteria.zone) and.push({ area: { title: criteria.zone } });
  if (criteria.promo === true) and.push({ specialPromotion: { isNot: null } });
  if (criteria.promo === false) and.push({ specialPromotion: { is: null } });
  if (criteria.titles.length) and.push({ OR: criteria.titles.map((t) => ({ title: { contains: t, mode: "insensitive" } })) });
  if (criteria.maxPrice || criteria.minPrice) {
    and.push({ formulas: { some: { price: { value: { ...(criteria.maxPrice ? { lte: criteria.maxPrice } : {}), ...(criteria.minPrice ? { gte: criteria.minPrice } : {}) } } } } });
  }
  if (criteria.services.length) and.push({ formulas: { some: { serviceDetail: { some: { service: { title: { in: criteria.services } } } } } } });

  const where = { ...scope, ...(and.length ? { AND: and } : {}) };
  const structured = and.length > 0;

  const [total, found, pinned] = await Promise.all([
    structured ? prisma.offer.count({ where }) : 0,
    structured ? prisma.offer.findMany({ where, select: OFFER_SELECT, orderBy: [{ updatedAt: "desc" }], take: MAX_OFFERS }) : [],
    contextId ? prisma.offer.findFirst({ where: { ...scope, id: contextId }, select: OFFER_SELECT }) : null,
  ]);

  const offers = [...(pinned ? [pinned] : []), ...found.filter((o) => o.id !== pinned?.id)].slice(0, MAX_OFFERS);
  if (!offers.length) {
    if (!structured) return none;
    // Recherche explicite sans résultat : le dire, pour que l'assistant n'invente rien.
    return {
      used: true,
      context: `[Données CompareTIC] Recherche dans la base des offres (${focal ? "offres de votre opérateur" : "toutes les offres"})    critères : ${criteria.labels.join(" ; ")}. Aucune offre ne correspond. Ne décris aucune offre qui ne figure pas dans ces données.`,
      sources: [],
      criteria: criteria.labels,
      total: 0,
      scope: focal ? "OPERATOR" : "ALL",
    };
  }

  const lines = [];
  for (let i = 0; i < offers.length; i += 1) {
    let block = describeOffer(offers[i], i + 1);
    // Historique : seulement pour une offre précise (contexte ou résultat unique).
    if ((criteria.history && offers.length === 1) || (pinned && offers[i].id === pinned.id && criteria.history)) {
      block += `\n${await describeHistory(offers[i].id, internal)}`;
    }
    lines.push(block);
  }

  let context =
    `[Données CompareTIC    extraites de la base des offres pour cette question ; périmètre : ${focal ? "offres de l'opérateur de l'utilisateur" : "toutes les offres"}]\n` +
    (criteria.labels.length ? `Critères reconnus : ${criteria.labels.join(" ; ")}.\n` : "") +
    (pinned ? `Offre en cours d'examen : « ${pinned.title} » (${pinned.code}).\n` : "") +
    `${structured ? `${total} offre(s) correspondante(s)` : "1 offre"}${total > offers.length ? `, ${offers.length} présentées` : ""} :\n` +
    lines.join("\n") +
    "\nConsigne : réponds en t'appuyant sur ces données. Si elles ne suffisent pas, dis-le. Ne décris aucune offre qui n'y figure pas.";
  if (context.length > MAX_CONTEXT_CHARS) context = `${context.slice(0, MAX_CONTEXT_CHARS)}\n[… données tronquées]`;

  return {
    used: true,
    context,
    sources: offers.map((o) => ({ id: o.id, code: o.code, title: o.title, operator: o.operator?.name, status: o.workflowStatus })),
    criteria: criteria.labels,
    total: structured ? total : 1,
    scope: focal ? "OPERATOR" : "ALL",
  };
};

export default retrieveOffersForQuestion;
