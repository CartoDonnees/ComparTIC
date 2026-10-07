const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/**
 * Données de test : offres INTERNATIONALES et offres de ROAMING.
 *
 * Elles servent à éprouver les filtres « International » et « Roaming » du
 * comparateur (zone géographique puis pays), de la gestion des offres et des
 * statistiques : des offres publiées chez trois opérateurs, rattachées à des
 * organisations différentes, avec les pays retenus pour chacune.
 *
 * Cohérence avec le modèle :
 *  - chaque offre porte SA zone (`Area` du type voulu), ses rattachements
 *    offre/organisation (`AreaOrganization`) et les pays retenus pour chacun
 *    (`OrganisationCountry`)    exactement ce qu'écrit l'étape 3 du formulaire ;
 *  - seuls des pays MEMBRES de l'organisation dans le référentiel sont retenus
 *    (un pays souhaité mais absent du référentiel est ignoré, et signalé) ;
 *  - les offres publiées portent les décisions de chaque niveau et les lignes
 *    d'audit que le moteur de workflow aurait écrites.
 *
 * IDEMPOTENT et NON DESTRUCTIF : une offre déjà présente (même code) n'est pas
 * recréée. Peut être lancé seul sur une base existante :
 *
 *     npm run seed:zones
 *
 * Prérequis : opérateurs, services, organisations, pays (jeu de données de
 * base). Les comptes de test du workflow sont utilisés s'ils existent ; à
 * défaut, un administrateur existant est l'auteur et le validateur.
 */

const Mo = (go) => Math.round(go * 1024);
const daysAgo = (n) => new Date(Date.now() - n * 86400000);
const daysAhead = (n) => new Date(Date.now() + n * 86400000);

// service : VOIX (minutes), SMS (nombre), DATA (Mo) ; steps = pas de facturation (s)
const OFFERS = [
  /* ------------------------------------------------------- INTERNATIONAL */
  {
    code: "OF-ZTEST-INT-ORANGE-CEDEAO",
    zone: "INTERNATIONAL",
    operator: "OPE-001",
    title: "Pass International CEDEAO",
    billing: "PREPAID",
    description: "Appels et SMS depuis la Côte d'Ivoire vers les pays de la CEDEAO, à tarif réduit.",
    target: "Clients prépayés appelant régulièrement la sous-région.",
    access: ["#144*5#", "Application Max it"],
    coverage: [{ org: ["CEDEAO (ECOWAS)", "CEDEAO"], countries: ["Sénégal", "Bénin", "Togo", "Ghana", "Nigeria", "Guinée"] }],
    formulas: [
      { title: "CEDEAO Jour", validity: 1, price: 500, services: { VOIX: [10, 60], SMS: [10] } },
      { title: "CEDEAO Semaine", validity: 7, price: 2000, services: { VOIX: [45, 60], SMS: [50] } },
      { title: "CEDEAO Mois", validity: 30, price: 5000, services: { VOIX: [130, 60], SMS: [150] }, advantages: [["Report des minutes", "Les minutes non consommées sont reportées en cas de renouvellement avant échéance."]] },
    ],
  },
  {
    code: "OF-ZTEST-INT-ORANGE-EUROPE",
    zone: "INTERNATIONAL",
    operator: "OPE-001",
    title: "Pass International Europe",
    billing: "PREPAID",
    description: "Minutes d'appel vers les fixes et mobiles d'Europe.",
    target: "Clients ayant de la famille ou des partenaires en Europe.",
    access: ["#144*6#"],
    coverage: [{ org: ["Europe"], countries: ["France", "Belgique", "Italie", "Allemagne", "Suisse", "Royaume-Uni"] }],
    formulas: [
      { title: "Europe 30 min", validity: 7, price: 1500, services: { VOIX: [30, 60] } },
      { title: "Europe 120 min", validity: 30, price: 5000, services: { VOIX: [120, 60] } },
    ],
  },
  {
    code: "OF-ZTEST-INT-MTN-UEMOA",
    zone: "INTERNATIONAL",
    operator: "OPE-010",
    title: "MTN Zone UEMOA",
    billing: "PREPAID",
    description: "Forfaits voix et SMS vers les pays de l'UEMOA.",
    target: "Commerçants et particuliers en relation avec la zone UEMOA.",
    access: ["*155*3#", "Application MyMTN"],
    coverage: [{ org: ["UEMOA"], countries: ["Sénégal", "Mali", "Burkina Faso", "Bénin", "Togo", "Niger"] }],
    formulas: [
      { title: "UEMOA 300", validity: 1, price: 300, services: { VOIX: [5, 60] } },
      { title: "UEMOA 1000", validity: 3, price: 1000, services: { VOIX: [20, 60], SMS: [20] } },
      { title: "UEMOA 3000", validity: 15, price: 3000, services: { VOIX: [70, 60], SMS: [60] } },
    ],
  },
  {
    code: "OF-ZTEST-INT-MTN-MONDE",
    zone: "INTERNATIONAL",
    operator: "OPE-010",
    title: "MTN Monde Postpayé",
    billing: "POSTPAID",
    description: "Option postpayée d'appels vers l'Amérique du Nord et l'Asie.",
    target: "Abonnés postpayés et professionnels.",
    access: ["Agence MTN", "Espace client"],
    coverage: [
      { org: ["Amérique du Nord"], countries: ["Canada", "États-Unis", "Etats-Unis"] },
      { org: ["Asie"], countries: ["Chine", "Inde", "Liban", "Turquie", "Émirats arabes unis"] },
    ],
    formulas: [
      { title: "Monde 60", validity: 30, price: 4500, services: { VOIX: [60, 60] } },
      { title: "Monde 200", validity: 30, price: 12000, services: { VOIX: [200, 60] } },
    ],
  },
  {
    code: "OF-ZTEST-INT-MOOV-AFRIQUE",
    zone: "INTERNATIONAL",
    operator: "OPE-011",
    title: "Moov Afrique Sans Frontières",
    billing: "HYBRID",
    description: "Appels vers l'Afrique de l'Ouest, du Nord et centrale.",
    target: "Tous clients Moov Africa.",
    access: ["*303*4#"],
    coverage: [
      { org: ["CEDEAO (ECOWAS)", "CEDEAO"], countries: ["Sénégal", "Ghana", "Nigeria", "Togo", "Bénin"] },
      { org: ["Afrique du Nord"], countries: ["Maroc", "Tunisie"] },
    ],
    formulas: [
      { title: "Afrique 500", validity: 2, price: 500, services: { VOIX: [8, 60] } },
      { title: "Afrique 2500", validity: 10, price: 2500, services: { VOIX: [50, 60], SMS: [40] } },
    ],
  },
  // En cours de validation : visible en gestion, absente du comparateur.
  {
    code: "OF-ZTEST-INT-MOOV-EUROPE",
    zone: "INTERNATIONAL",
    operator: "OPE-011",
    title: "Moov Europe Illimité Soir",
    billing: "PREPAID",
    status: "IN_VALIDATION",
    decisions: 2,
    description: "Appels illimités vers l'Europe de 20 h à 6 h.",
    target: "Clients appelant l'Europe en soirée.",
    access: ["*303*7#"],
    coverage: [{ org: ["UE", "Europe"], countries: ["France", "Belgique", "Espagne", "Italie"] }],
    formulas: [{ title: "Soir Europe 7 jours", validity: 7, price: 3500, services: { VOIX: [-1, 60] } }],
  },

  /* ------------------------------------------------------------- ROAMING */
  {
    code: "OF-ZTEST-ROAM-ORANGE-AFRIQUE",
    zone: "ROAMING",
    operator: "OPE-001",
    title: "Pass Roaming Afrique de l'Ouest",
    billing: "PREPAID",
    description: "Internet, appels et SMS à utiliser en déplacement dans les pays partenaires de la sous-région.",
    target: "Voyageurs en Afrique de l'Ouest.",
    access: ["#144*9#", "Application Max it"],
    coverage: [{ org: ["CEDEAO (ECOWAS)", "CEDEAO"], countries: ["Sénégal", "Bénin", "Togo", "Ghana", "Nigeria", "Guinée"] }],
    formulas: [
      { title: "Roaming Afrique 3 jours", validity: 3, price: 2500, services: { DATA: [Mo(0.5)], VOIX: [15, 60], SMS: [20] } },
      { title: "Roaming Afrique 7 jours", validity: 7, price: 5000, services: { DATA: [Mo(1.5)], VOIX: [40, 60], SMS: [50] } },
      { title: "Roaming Afrique 30 jours", validity: 30, price: 15000, services: { DATA: [Mo(5)], VOIX: [120, 60], SMS: [150] } },
    ],
  },
  {
    code: "OF-ZTEST-ROAM-ORANGE-EUROPE",
    zone: "ROAMING",
    operator: "OPE-001",
    title: "Pass Roaming Europe",
    billing: "POSTPAID",
    description: "Forfait d'itinérance en Europe pour les abonnés postpayés : internet et appels reçus inclus.",
    target: "Abonnés postpayés en voyage d'affaires ou d'agrément.",
    access: ["Agence Orange", "Espace client"],
    coverage: [{ org: ["Europe"], countries: ["France", "Belgique", "Italie", "Allemagne", "Suisse", "Royaume-Uni"] }],
    formulas: [
      { title: "Europe Voyage 7 jours", validity: 7, price: 10000, services: { DATA: [Mo(2)], VOIX: [30, 60] } },
      { title: "Europe Voyage 15 jours", validity: 15, price: 18000, services: { DATA: [Mo(5)], VOIX: [75, 60], SMS: [50] }, advantages: [["Appels reçus gratuits", "Les appels reçus ne sont pas décomptés pendant la validité du pass."]] },
    ],
  },
  {
    code: "OF-ZTEST-ROAM-MTN-UEMOA",
    zone: "ROAMING",
    operator: "OPE-010",
    title: "MTN Roaming UEMOA",
    billing: "PREPAID",
    description: "Pass d'itinérance voix et internet dans la zone UEMOA.",
    target: "Clients prépayés en déplacement dans la zone UEMOA.",
    access: ["*155*9#"],
    coverage: [{ org: ["UEMOA"], countries: ["Sénégal", "Mali", "Burkina Faso", "Bénin", "Togo", "Niger"] }],
    formulas: [
      { title: "Roam UEMOA 1 jour", validity: 1, price: 1000, services: { DATA: [200], VOIX: [5, 60] } },
      { title: "Roam UEMOA 7 jours", validity: 7, price: 4500, services: { DATA: [Mo(1)], VOIX: [30, 60], SMS: [30] } },
    ],
  },
  {
    code: "OF-ZTEST-ROAM-MOOV-MONDE",
    zone: "ROAMING",
    operator: "OPE-011",
    title: "Moov Roaming Monde",
    billing: "HYBRID",
    description: "Internet en itinérance en Europe, en Afrique du Nord et en Asie.",
    target: "Grands voyageurs.",
    access: ["*303*9#", "Application Moov Africa"],
    coverage: [
      { org: ["Europe"], countries: ["France", "Belgique", "Suisse"] },
      { org: ["Afrique du Nord"], countries: ["Maroc", "Tunisie"] },
      { org: ["Asie"], countries: ["Chine", "Turquie", "Émirats arabes unis"] },
    ],
    formulas: [
      { title: "Monde Data 1 Go", validity: 7, price: 8000, services: { DATA: [Mo(1)] } },
      { title: "Monde Data 3 Go", validity: 15, price: 20000, services: { DATA: [Mo(3)] } },
    ],
  },
  // Soumise, pas encore instruite.
  {
    code: "OF-ZTEST-ROAM-MTN-EUROPE",
    zone: "ROAMING",
    operator: "OPE-010",
    title: "MTN Roaming Europe Été",
    billing: "PREPAID",
    status: "SUBMITTED",
    promo: { type: "PERIOD", duration: 60 },
    description: "Promotion estivale d'itinérance en Europe.",
    target: "Clients prépayés voyageant en Europe pendant l'été.",
    access: ["*155*10#"],
    coverage: [{ org: ["UE", "Europe"], countries: ["France", "Espagne", "Italie", "Allemagne"] }],
    formulas: [{ title: "Été Europe 10 jours", validity: 10, price: 9000, services: { DATA: [Mo(2)], VOIX: [20, 60] } }],
  },
];

const AUTHOR_OF_OPERATOR = { "OPE-001": "POINT_FOCAL_ORANGE_TEST", "OPE-010": "POINT_FOCAL_MTN_TEST", "OPE-011": "POINT_FOCAL_MOOV_TEST" };
const VALIDATOR_OF_LEVEL = { 1: "VALIDATEUR_1_TEST", 2: "VALIDATEUR_2_TEST", 3: "VALIDATEUR_3_TEST", 4: "VALIDATEUR_4_TEST" };
const ROLE_OF_PROFILE = {
  "PRF-SUPERADMIN": "SUPER_ADMIN",
  "PRF0-TEST": "ADMIN",
  "PRF-VAL1": "VALIDATOR_1",
  "PRF-VAL2": "VALIDATOR_2",
  "PRF-VAL3": "VALIDATOR_3",
  "PRF-VAL4": "VALIDATOR_4",
  "PRF2-TEST": "FOCAL_POINT",
};

const uid = (prefix, code, i = "") => `${prefix}-${code}${i === "" ? "" : `-${i}`}`;

async function loadReferences() {
  const users = await prisma.user.findMany({ where: { status: "ENABLE" }, select: { id: true, code: true, profile: { select: { code: true } } } });
  const byCode = new Map(users.map((u) => [u.code, { id: u.id, role: ROLE_OF_PROFILE[u.profile?.code] || null }]));
  const admin = users.find((u) => ["PRF-SUPERADMIN", "PRF0-TEST"].includes(u.profile?.code));
  const fallback = admin ? { id: admin.id, role: ROLE_OF_PROFILE[admin.profile.code] } : null;
  const services = new Map((await prisma.service.findMany({ select: { id: true, title: true } })).map((s) => [s.title, s.id]));
  const organizations = await prisma.organization.findMany({ select: { id: true, name: true, countries: { select: { id: true, name: true } } } });
  return { byCode, fallback, services, organizations };
}

async function seedOffer(spec, refs, warnings) {
  if (await prisma.offer.findUnique({ where: { code: spec.code }, select: { id: true } })) return "existing";
  const operator = await prisma.operator.findUnique({ where: { code: spec.operator }, select: { id: true } });
  if (!operator) {
    warnings.push(`${spec.code} : opérateur ${spec.operator} introuvable.`);
    return "skipped";
  }
  const author = refs.byCode.get(AUTHOR_OF_OPERATOR[spec.operator]) || refs.fallback;
  if (!author) {
    warnings.push(`${spec.code} : aucun compte auteur disponible.`);
    return "skipped";
  }

  // Couverture : organisations du référentiel et pays qui en sont membres.
  const coverage = [];
  for (const c of spec.coverage) {
    const org = refs.organizations.find((o) => c.org.some((name) => o.name.toLowerCase() === name.toLowerCase()));
    if (!org) {
      warnings.push(`${spec.code} : organisation « ${c.org[0]} » absente du référentiel.`);
      continue;
    }
    const countries = org.countries.filter((m) => c.countries.some((n) => n.toLowerCase() === m.name.toLowerCase()));
    coverage.push({ org, countries });
  }
  if (!coverage.length) {
    warnings.push(`${spec.code} : aucune organisation exploitable, offre ignorée.`);
    return "skipped";
  }

  const status = spec.status || "VALIDATED";
  const finalLevel = spec.promo ? 3 : 4;
  const decided = status === "VALIDATED" ? finalLevel : spec.decisions || 0;
  const created = 40;

  await prisma.$transaction(async (tx) => {
    const offer = await tx.offer.create({
      data: {
        code: spec.code,
        title: spec.title,
        description: `<p>${spec.description}</p>`,
        target: `<p>${spec.target}</p>`,
        category: "MOBILE",
        billingType: spec.billing,
        notifiDate: daysAgo(created),
        desiredDate: status === "VALIDATED" ? daysAgo(created - 32) : daysAhead(20),
        status: status === "VALIDATED" ? "DONE" : "PENDING",
        workflowStatus: status,
        currentValidationLevel: status === "VALIDATED" ? null : decided + 1,
        submittedAt: daysAgo(created - 1),
        validatedAt: status === "VALIDATED" ? daysAgo(created - 1 - finalLevel) : null,
        createdAt: daysAgo(created),
        user: { connect: { id: author.id } },
        operator: { connect: { id: operator.id } },
        area: {
          create: {
            code: uid("ARE", spec.code),
            title: spec.zone,
            areaOrganizations: {
              create: coverage.map(({ org, countries }) => ({
                organization: { connect: { id: org.id } },
                organisationCountries: { create: countries.map((c) => ({ country: { connect: { id: c.id } } })) },
              })),
            },
          },
        },
        accessModes: { create: spec.access.map((content, i) => ({ code: uid("ACM", spec.code, i), content })) },
        ...(spec.promo ? { specialPromotion: { create: { code: uid("PROMO", spec.code), type: spec.promo.type, duration: spec.promo.duration } } } : {}),
        validation: { create: { code: uid("VAL", spec.code), status: status === "VALIDATED" ? "ALLOW" : "PENDING" } },
        formulas: {
          create: spec.formulas.map((f, i) => ({
            code: uid("FORM", spec.code, i),
            title: f.title,
            validity: f.validity,
            price: { create: { code: uid("PRI", spec.code, i), value: f.price } },
            serviceDetail: {
              create: Object.entries(f.services)
                .filter(([title]) => refs.services.has(title))
                .map(([title, [quantity, steps]], j) => ({
                  code: uid("SRD", spec.code, `${i}${j}`),
                  quantity,
                  billingSteps: steps ?? null,
                  comtype: "ALL_NET",
                  service: { connect: { id: refs.services.get(title) } },
                })),
            },
            advantages: { create: (f.advantages || []).map(([title, description], j) => ({ code: uid("ADV", spec.code, `${i}${j}`), title, description })) },
          })),
        },
      },
      select: { id: true },
    });

    // Traces du circuit, comme le moteur de workflow les aurait écrites.
    const log = (data) => tx.auditLog.create({ data: { entityType: "OFFER", entityId: offer.id, offerId: offer.id, ...data } });
    await log({ action: "CREATE", actorId: author.id, actorRole: author.role, toStatus: "DRAFT", createdAt: daysAgo(created) });
    await log({ action: "SUBMIT", actorId: author.id, actorRole: author.role, fromStatus: "DRAFT", toStatus: "SUBMITTED", level: 1, createdAt: daysAgo(created - 1) });
    let current = "SUBMITTED";
    for (let level = 1; level <= decided; level += 1) {
      const validator = refs.byCode.get(VALIDATOR_OF_LEVEL[level]) || refs.fallback;
      const final = status === "VALIDATED" && level === finalLevel;
      const at = daysAgo(created - 1 - level);
      const comment = final
        ? "Offre conforme : tarifs, zone et pays vérifiés. Validation définitive (jeu de test)."
        : `Dossier complet au niveau ${level}, transmission au niveau ${level + 1} (jeu de test).`;
      await tx.validationDecision.create({
        data: { level, decision: "VALIDATED", transmitted: !final, final, comment, userRole: validator.role || "ADMIN", offerId: offer.id, userId: validator.id, createdAt: at },
      });
      await log({
        action: final ? "VALIDATE_FINAL" : "VALIDATE_TRANSMIT",
        actorId: validator.id,
        actorRole: validator.role,
        fromStatus: current,
        toStatus: final ? "VALIDATED" : "IN_VALIDATION",
        level,
        comment,
        createdAt: at,
      });
      current = final ? "VALIDATED" : "IN_VALIDATION";
    }
  });
  return "created";
}

async function zoneOfferSeeder() {
  const refs = await loadReferences();
  const warnings = [];
  const counts = { created: 0, existing: 0, skipped: 0 };
  for (const spec of OFFERS) {
    counts[await seedOffer(spec, refs, warnings)] += 1;
  }
  const byZone = (zone) => OFFERS.filter((o) => o.zone === zone).length;
  console.log(
    `Offres de zone : ${counts.created} créée(s), ${counts.existing} déjà présente(s), ${counts.skipped} ignorée(s) ` +
      `(${byZone("INTERNATIONAL")} internationales, ${byZone("ROAMING")} roaming prévues).`,
  );
  warnings.forEach((w) => console.warn(`⚠️  ${w}`));
  return counts;
}

module.exports = zoneOfferSeeder;

if (require.main === module) {
  zoneOfferSeeder()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
