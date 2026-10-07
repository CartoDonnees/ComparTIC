const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

/**
 * Données de test du workflow de validation.
 *
 * - 10 comptes, un par rôle (mot de passe commun : TEST_PASSWORD) ;
 * - des offres dans chaque état : brouillon, soumise, en cours de validation,
 *   validée, refusée, désactivée, issue d'un monitoring   en offre de base
 *   (validation finale au niveau 4) comme en promotion (niveau 3).
 *
 * IDEMPOTENT et NON DESTRUCTIF : les comptes sont créés ou remis à jour par
 * leur code, une offre de test déjà présente (même code) n'est pas recréée.
 * Il peut donc être relancé seul sur une base existante :
 *
 *     node --env-file=.env prisma/seeders/workflowSeeder.js
 *
 * Les décisions, projections (`status`, `validation.status`) et lignes d'audit
 * sont écrites exactement comme le moteur de workflow les écrirait.
 *
 * Adresses en « .test » (domaine réservé, jamais délivrable) : aucun e-mail
 * réel ne peut partir vers ces comptes. Pour tester la soumission par code
 * d'un point focal, lancer le serveur avec MAIL_DRY_RUN=true : le code est
 * alors écrit dans la console du serveur.
 */

const TEST_PASSWORD = "Compartic@Test2026";

const PROFILES = [
  { code: "PRF-SUPERADMIN", name: "SUPER_ADMIN", description: "Super administrateur" },
  { code: "PRF0-TEST", name: "ADMINISTRATOR", description: "" },
  { code: "PRF1-TEST", name: "SUPERVISOR", description: "" },
  { code: "PRF-VAL1", name: "VALIDATOR_1", description: "Validateur 1   Responsable / Agent" },
  { code: "PRF-VAL2", name: "VALIDATOR_2", description: "Validateur 2   Chef de service" },
  { code: "PRF-VAL3", name: "VALIDATOR_3", description: "Validateur 3   Chef de département" },
  { code: "PRF-VAL4", name: "VALIDATOR_4", description: "Validateur 4   Directeur" },
  { code: "PRF2-TEST", name: "OPERATOR", description: "" },
  { code: "PRF3-TEST", name: "CLIENT", description: "" },
];

const ACCOUNTS = [
  { code: "SUPER_ADMIN_TEST", role: "SUPER_ADMIN", profile: "PRF-SUPERADMIN", firstName: "Cedric", lastName: "Yao", email: "super.admin@compartic.test" },
  { code: "ADMIN_TEST", role: "ADMIN", profile: "PRF0-TEST", firstName: "Touré", lastName: "Issouf", email: "admin@compartic.test" },
  { code: "SUPERVISEUR_TEST", role: "SUPERVISOR", profile: "PRF1-TEST", firstName: "Superviseur", lastName: "Test", email: "superviseur@compartic.test" },
  { code: "VALIDATEUR_1_TEST", role: "VALIDATOR_1", profile: "PRF-VAL1", firstName: "Pascline", lastName: "Gbonon", email: "validateur1@compartic.test" },
  { code: "VALIDATEUR_2_TEST", role: "VALIDATOR_2", profile: "PRF-VAL2", firstName: "Elloh", lastName: "Herman", email: "validateur2@compartic.test" },
  { code: "VALIDATEUR_3_TEST", role: "VALIDATOR_3", profile: "PRF-VAL3", firstName: "Paule Rénéé", lastName: "Lasme", email: "validateur3@compartic.test" },
  { code: "VALIDATEUR_4_TEST", role: "VALIDATOR_4", profile: "PRF-VAL4", firstName: "Guy Michel", lastName: "Kouakou", email: "validateur4@compartic.test" },
  { code: "POINT_FOCAL_ORANGE_TEST", role: "FOCAL_POINT", profile: "PRF2-TEST", firstName: "Point focal", lastName: "Orange", email: "pf.orange@compartic.test", operator: "OPE-001" },
  { code: "POINT_FOCAL_MTN_TEST", role: "FOCAL_POINT", profile: "PRF2-TEST", firstName: "Point focal", lastName: "MTN", email: "pf.mtn@compartic.test", operator: "OPE-010" },
  { code: "POINT_FOCAL_MOOV_TEST", role: "FOCAL_POINT", profile: "PRF2-TEST", firstName: "Point focal", lastName: "Moov", email: "pf.moov@compartic.test", operator: "OPE-011" },
];

const VALIDATOR_OF_LEVEL = { 1: "VALIDATEUR_1_TEST", 2: "VALIDATEUR_2_TEST", 3: "VALIDATEUR_3_TEST", 4: "VALIDATEUR_4_TEST" };

const PROJECTION = {
  DRAFT: null,
  SUBMITTED: "PENDING",
  IN_VALIDATION: "PENDING",
  VALIDATED: "ALLOW",
  REFUSED: "DINIED",
  DEACTIVATED: "SUSPENDED",
};

/**
 * Scénarios d'offres.
 *   decisions : niveaux déjà statués, dans l'ordre ("V" valide, "R" refuse)
 */
const OFFERS = [
  { key: "DRAFT-BASE", operator: "OPE-001", author: "POINT_FOCAL_ORANGE_TEST", title: "[TEST] Brouillon   Pass Nuit Orange", status: "DRAFT" },
  { key: "SUBMITTED-BASE", operator: "OPE-001", author: "POINT_FOCAL_ORANGE_TEST", title: "[TEST] Soumise   Forfait Découverte Orange", status: "SUBMITTED" },
  { key: "SUBMITTED-PROMO", operator: "OPE-010", author: "POINT_FOCAL_MTN_TEST", title: "[TEST] Soumise   Promo Week-end MTN", promo: "FLASH", status: "SUBMITTED" },
  { key: "INVAL-BASE-L2", operator: "OPE-010", author: "POINT_FOCAL_MTN_TEST", title: "[TEST] En validation (V2)   Forfait Pro MTN", status: "IN_VALIDATION", decisions: ["V"] },
  { key: "INVAL-BASE-L4", operator: "OPE-011", author: "POINT_FOCAL_MOOV_TEST", title: "[TEST] En validation (V4)   Box Maison Moov", status: "IN_VALIDATION", decisions: ["V", "V", "V"] },
  { key: "INVAL-PROMO-L3", operator: "OPE-011", author: "POINT_FOCAL_MOOV_TEST", title: "[TEST] En validation (V3, final)   Promo Rentrée Moov", promo: "PERIOD", status: "IN_VALIDATION", decisions: ["V", "V"] },
  { key: "VALIDATED-BASE", operator: "OPE-001", author: "POINT_FOCAL_ORANGE_TEST", title: "[TEST] Validée   Internet Max Orange", status: "VALIDATED", decisions: ["V", "V", "V", "V"] },
  { key: "VALIDATED-PROMO", operator: "OPE-010", author: "POINT_FOCAL_MTN_TEST", title: "[TEST] Validée   Promo Flash MTN", promo: "SPECIAL", status: "VALIDATED", decisions: ["V", "V", "V"] },
  { key: "REFUSED-BASE", operator: "OPE-011", author: "POINT_FOCAL_MOOV_TEST", title: "[TEST] Refusée   Pass Illimité Moov", status: "REFUSED", decisions: ["V", "R"] },
  { key: "DEACTIVATED-BASE", operator: "OPE-001", author: "ADMIN_TEST", title: "[TEST] Désactivée   Ancien Pass Orange", status: "DEACTIVATED", decisions: ["V", "V", "V", "V"] },
  // Monitoring : la version 1 validée est désactivée, la version 2 est soumise.
  { key: "MONITORED-V1", operator: "OPE-010", author: "POINT_FOCAL_MTN_TEST", title: "[TEST] Monitoring   Forfait Social MTN", status: "DEACTIVATED", monitoring: true, decisions: ["V", "V", "V", "V"] },
];

const daysAgo = (n) => new Date(Date.now() - n * 24 * 3600 * 1000);

async function ensureProfiles() {
  for (const p of PROFILES) {
    await prisma.profile.upsert({ where: { code: p.code }, update: {}, create: p });
  }
}

async function ensureAccounts() {
  const password = await bcrypt.hash(TEST_PASSWORD, 10);
  const byCode = {};
  for (const a of ACCOUNTS) {
    const profile = await prisma.profile.findUnique({ where: { code: a.profile } });
    // Une adresse déjà prise par un AUTRE compte ne doit pas faire échouer tout le seed.
    const clash = await prisma.user.findFirst({ where: { email: a.email, NOT: { code: a.code } } });
    if (clash) {
      console.warn(`⚠️  ${a.email} est déjà utilisée par ${clash.code} : compte ${a.code} ignoré.`);
      continue;
    }
    const user = await prisma.user.upsert({
      where: { code: a.code },
      update: { profileId: profile.id, status: "ENABLE", firstName: a.firstName, lastName: a.lastName, email: a.email },
      create: {
        code: a.code,
        firstName: a.firstName,
        lastName: a.lastName,
        email: a.email,
        password,
        status: "ENABLE",
        // Compte de test : pas de changement de mot de passe imposé.
        passwordChangedAt: new Date(),
        profileId: profile.id,
      },
    });
    if (a.operator) {
      const operator = await prisma.operator.findUnique({ where: { code: a.operator } });
      if (!operator) {
        console.warn(`⚠️  Opérateur ${a.operator} introuvable : point focal ${a.code} non rattaché.`);
      } else {
        await prisma.focalPoint.upsert({
          where: { userId: user.id },
          update: { operatorId: operator.id, status: "ENABLE" },
          create: {
            code: `FP-${a.code}`,
            serialNumber: `MAT-${a.code}`,
            status: "ENABLE",
            userId: user.id,
            operatorId: operator.id,
          },
        });
      }
    }
    byCode[a.code] = { ...user, role: a.role };
  }
  return byCode;
}

/** Contenu minimal réaliste : zone nationale, une formule avec prix et data. */
async function createContent(tx, offerId, key) {
  const area = await tx.area.create({ data: { code: `ARE-WFTEST-${key}-${Date.now()}`, title: "NATIONAL" } });
  await tx.offer.update({ where: { id: offerId }, data: { areaId: area.id } });
  const formula = await tx.offerFormula.create({
    data: { code: `FORM-WFTEST-${key}-${Date.now()}`, title: "Formule 7 jours", validity: 7, offerId },
  });
  await tx.offerPrice.create({ data: { code: `PRI-WFTEST-${key}-${Date.now()}`, value: 1000, formulaId: formula.id } });
  const data = await tx.service.findFirst({ where: { title: "DATA" } });
  if (data) {
    await tx.offerServiceDetail.create({
      data: { code: `OFF-SD-WFTEST-${key}-${Date.now()}`, quantity: 2048, formulaId: formula.id, serviceId: data.id, comtype: "ALL_NET" },
    });
  }
  await tx.accessMode.create({ data: { code: `ACM-WFTEST-${key}-${Date.now()}`, content: "*123#", offerId } });
}

const audit = (tx, data) => tx.auditLog.create({ data: { entityType: "OFFER", ...data, entityId: data.offerId } });

async function createScenario(tx, spec, users, { code, version = 1, sourceOfferId = null, status, decisions = [], createdDaysAgo = 20 }) {
  const author = users[spec.author];
  const operator = await tx.operator.findUnique({ where: { code: spec.operator } });
  const finalLevel = spec.promo ? 3 : 4;
  const submitted = status !== "DRAFT";

  const offer = await tx.offer.create({
    data: {
      code,
      title: spec.title,
      description: "<p>Offre créée par le jeu de données de test du workflow.</p>",
      target: "<p>Grand public</p>",
      category: "MOBILE",
      billingType: "PREPAID",
      notifiDate: daysAgo(createdDaysAgo),
      desiredDate: daysAgo(createdDaysAgo - 35),
      status: ["DRAFT", "SUBMITTED", "IN_VALIDATION"].includes(status) ? "PENDING" : "DONE",
      userId: author.id,
      operatorId: operator.id,
      version,
      sourceOfferId,
      workflowStatus: "DRAFT",
      createdAt: daysAgo(createdDaysAgo),
      ...(spec.promo
        ? { specialPromotion: { create: { code: `PROMO-${code}`, type: spec.promo, duration: 30 } } }
        : {}),
    },
  });
  await createContent(tx, offer.id, code);

  await audit(tx, { action: "CREATE", offerId: offer.id, actorId: author.id, actorRole: author.role, toStatus: "DRAFT", createdAt: daysAgo(createdDaysAgo) });

  let level = submitted ? 1 : null;
  let current = "DRAFT";
  let day = createdDaysAgo - 1;
  if (submitted) {
    await audit(tx, { action: "SUBMIT", offerId: offer.id, actorId: author.id, actorRole: author.role, fromStatus: "DRAFT", toStatus: "SUBMITTED", level: 1, createdAt: daysAgo(day) });
    current = "SUBMITTED";
  }

  for (const d of decisions) {
    day -= 1;
    const validator = users[VALIDATOR_OF_LEVEL[level]];
    const at = daysAgo(day);
    if (d === "R") {
      const comment = `Refus au niveau ${level} : les conditions tarifaires ne sont pas conformes (jeu de test).`;
      await tx.validationDecision.create({ data: { offerId: offer.id, level, decision: "REFUSED", comment, userId: validator.id, userRole: validator.role, createdAt: at } });
      await audit(tx, { action: "REFUSE", offerId: offer.id, actorId: validator.id, actorRole: validator.role, fromStatus: current, toStatus: "REFUSED", level, comment, createdAt: at });
      current = "REFUSED";
      level = null;
      break;
    }
    const final = level === finalLevel;
    const comment = final
      ? `Validation définitive au niveau ${level} (jeu de test).`
      : `Validation du niveau ${level}, transmission au niveau ${level + 1} (jeu de test).`;
    await tx.validationDecision.create({
      data: { offerId: offer.id, level, decision: "VALIDATED", transmitted: !final, final, comment, userId: validator.id, userRole: validator.role, createdAt: at },
    });
    await audit(tx, {
      action: final ? "VALIDATE_FINAL" : "VALIDATE_TRANSMIT",
      offerId: offer.id,
      actorId: validator.id,
      actorRole: validator.role,
      fromStatus: current,
      toStatus: final ? "VALIDATED" : "IN_VALIDATION",
      level,
      comment,
      metadata: final ? undefined : { toLevel: level + 1 },
      createdAt: at,
    });
    current = final ? "VALIDATED" : "IN_VALIDATION";
    level = final ? null : level + 1;
  }

  const data = {
    workflowStatus: current,
    currentValidationLevel: ["SUBMITTED", "IN_VALIDATION"].includes(current) ? level : null,
    submittedAt: submitted ? daysAgo(createdDaysAgo - 1) : null,
    validatedAt: current === "VALIDATED" ? daysAgo(day) : null,
    refusedAt: current === "REFUSED" ? daysAgo(day) : null,
  };
  await tx.offer.update({ where: { id: offer.id }, data });
  return { offer, current, day };
}

async function setProjection(tx, offerId, status) {
  await tx.offer.update({
    where: { id: offerId },
    data: { status: ["DRAFT", "SUBMITTED", "IN_VALIDATION"].includes(status) ? "PENDING" : "DONE" },
  });
  const v = PROJECTION[status];
  if (!v) return;
  await tx.validation.upsert({
    where: { offerId },
    update: { status: v },
    create: { code: `VAL-${offerId}-${Date.now()}`, status: v, offerId },
  });
}

async function ensureOffers(users) {
  const admin = users.ADMIN_TEST;
  for (const spec of OFFERS) {
    const code = `OF-WFTEST-${spec.key}`;
    if (await prisma.offer.findUnique({ where: { code } })) {
      continue;
    }
    if (!users[spec.author] || !admin) {
      console.warn(`⚠️  ${code} ignorée : comptes de test incomplets.`);
      continue;
    }

    await prisma.$transaction(async (tx) => {
      const targetStatus = spec.status === "DEACTIVATED" ? "VALIDATED" : spec.status;
      const { offer, current, day } = await createScenario(tx, spec, users, {
        code,
        status: targetStatus,
        decisions: spec.decisions || [],
      });

      if (spec.status === "DEACTIVATED" && !spec.monitoring) {
        const comment = "Offre retirée du marché par l'opérateur (jeu de test).";
        await tx.offer.update({
          where: { id: offer.id },
          data: { workflowStatus: "DEACTIVATED", deactivatedAt: daysAgo(day - 1), deactivationReason: "MANUAL", deactivatedById: admin.id },
        });
        await audit(tx, { action: "DEACTIVATE", offerId: offer.id, actorId: admin.id, actorRole: admin.role, fromStatus: current, toStatus: "DEACTIVATED", comment, metadata: { reason: "MANUAL" }, createdAt: daysAgo(day - 1) });
        await setProjection(tx, offer.id, "DEACTIVATED");
      } else if (spec.monitoring) {
        const author = users[spec.author];
        const at = daysAgo(day - 1);
        await tx.offer.update({
          where: { id: offer.id },
          data: { workflowStatus: "DEACTIVATED", deactivatedAt: at, deactivationReason: "MONITORING", deactivatedById: author.id },
        });
        await setProjection(tx, offer.id, "DEACTIVATED");
        const v2 = await createScenario(tx, { ...spec, title: spec.title.replace("[TEST] Monitoring", "[TEST] Monitoring V2") }, users, {
          code: `${code}-V2`,
          version: 2,
          sourceOfferId: offer.id,
          status: "SUBMITTED",
          createdDaysAgo: day - 1,
        });
        await audit(tx, { action: "MONITORING", offerId: offer.id, actorId: author.id, actorRole: author.role, fromStatus: "VALIDATED", toStatus: "DEACTIVATED", metadata: { newOfferId: v2.offer.id, newCode: v2.offer.code }, createdAt: at });
        await audit(tx, { action: "VERSION_CREATED", offerId: v2.offer.id, actorId: author.id, actorRole: author.role, toStatus: "SUBMITTED", metadata: { sourceOfferId: offer.id, version: 2 }, createdAt: at });
        await setProjection(tx, v2.offer.id, "SUBMITTED");
      } else {
        await setProjection(tx, offer.id, current);
      }
    }, { timeout: 30000 });
  }
}

async function workflowSeeder() {
  await ensureProfiles();
  const users = await ensureAccounts();
  await ensureOffers(users);
}

module.exports = workflowSeeder;
module.exports.TEST_PASSWORD = TEST_PASSWORD;
module.exports.ACCOUNTS = ACCOUNTS;

// Exécution directe : node --env-file=.env prisma/seeders/workflowSeeder.js
if (require.main === module) {
  workflowSeeder()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
