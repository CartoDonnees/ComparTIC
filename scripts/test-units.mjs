/**
 * Tests unitaires des modules de calcul (sans base ni serveur).
 *
 *   node scripts/test-units.mjs
 *
 * Couvre les règles qui décident de ce que voit l'utilisateur : délais
 * réglementaires, publication au comparateur, filtres d'offres, agrégats
 * statistiques, rendu Markdown et nettoyage du texte riche.
 *
 * Les modules utilisent la syntaxe ESM et l'alias « @/ » : ils sont assemblés
 * à la volée avec esbuild (déjà présent avec Next.js) dans un dossier
 * temporaire, puis exécutés.
 */

import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const outDir = mkdtempSync(path.join(tmpdir(), "compartic-units-"));

let passed = 0;
const failures = [];

const check = (name, fn) => {
  try {
    fn();
    passed += 1;
    console.log(`  ✔ ${name}`);
  } catch (error) {
    failures.push({ name, message: error?.message });
    console.log(`  ✖ ${name}\n      ${error?.message}`);
  }
};

const checkAsync = async (name, fn) => {
  try {
    await fn();
    passed += 1;
    console.log(`  ✔ ${name}`);
  } catch (error) {
    failures.push({ name, message: error?.message });
    console.log(`  ✖ ${name}\n      ${error?.message}`);
  }
};

const group = (title) => console.log(`\n■ ${title}`);

const load = async (relative) => {
  const esbuild = require("esbuild");
  const out = path.join(outDir, relative.replace(/[\/]/g, "_").replace(/\.js$/, ".cjs"));
  await esbuild.build({
    entryPoints: [path.join(root, relative)],
    bundle: true,
    platform: "node",
    format: "cjs",
    outfile: out,
    logLevel: "silent",
    alias: { "@": root },
    external: ["react", "react-dom", "next", "@prisma/client"],
  });
  return require(out);
};

const run = async () => {
  /* ------------------------------------------------ Délais réglementaires */
  const deadlines = await load("services/workflow/deadlines.js");
  group("Délais réglementaires (décision 2024-1098)");

  const dayOffset = (days) => new Date(Date.now() + days * 86400000);
  const baseOffer = (over = {}) => ({
    workflowStatus: "SUBMITTED",
    notifiDate: dayOffset(-40),
    desiredDate: dayOffset(5),
    ...over,
  });

  check("offre de base : 30 jours de préavis exigés", () => {
    assert.equal(deadlines.deadlineStatusOf(baseOffer()).requiredNoticeDays, 30);
  });
  check("promotion flash : 1 jour de préavis exigé", () => {
    const s = deadlines.deadlineStatusOf(baseOffer({ specialPromotion: { type: "FLASH" } }));
    assert.equal(s.requiredNoticeDays, 1);
    assert.equal(s.kind, "FLASH");
  });
  check("promotion périodique : 3 jours", () => {
    assert.equal(deadlines.deadlineStatusOf(baseOffer({ specialPromotion: { type: "PERIOD" } })).requiredNoticeDays, 3);
  });
  check("promotion spéciale et personnalisée : 7 jours", () => {
    assert.equal(deadlines.deadlineStatusOf(baseOffer({ specialPromotion: { type: "SPECIAL" } })).requiredNoticeDays, 7);
    assert.equal(deadlines.deadlineStatusOf(baseOffer({ specialPromotion: { type: "CUSTOMIZE" } })).requiredNoticeDays, 7);
  });
  check("préavis suffisant reconnu conforme", () => {
    const s = deadlines.deadlineStatusOf({ notifiDate: dayOffset(-40), desiredDate: dayOffset(5) });
    assert.equal(s.noticeGivenDays, 45);
    assert.equal(s.noticeCompliant, true);
  });
  check("préavis trop court signalé", () => {
    const s = deadlines.deadlineStatusOf({ notifiDate: dayOffset(-3), desiredDate: dayOffset(5) });
    assert.equal(s.noticeCompliant, false);
  });
  check("lancement dans 1 jour → alerte urgente", () => {
    assert.equal(deadlines.deadlineStatusOf(baseOffer({ desiredDate: dayOffset(1) })).level, "URGENT");
  });
  check("lancement dépassé → alerte retard", () => {
    const s = deadlines.deadlineStatusOf(baseOffer({ desiredDate: dayOffset(-2) }));
    assert.equal(s.level, "LATE");
    assert.equal(s.launchPassed, true);
  });
  check("lancement lointain → aucune alerte", () => {
    assert.equal(deadlines.deadlineStatusOf(baseOffer({ desiredDate: dayOffset(40) })).level, "NONE");
  });
  check("offre hors circuit : jamais d'alerte", () => {
    assert.equal(deadlines.needsDeadlineAlert(baseOffer({ workflowStatus: "VALIDATED", desiredDate: dayOffset(1) })), false);
    assert.equal(deadlines.needsDeadlineAlert(baseOffer({ desiredDate: dayOffset(1) })), true);
  });
  check("date de lancement absente : pas de plantage", () => {
    const s = deadlines.deadlineStatusOf({ notifiDate: null, desiredDate: null });
    assert.equal(s.daysToLaunch, null);
    assert.equal(s.level, "NONE");
  });

  /* ------------------------------------------------ Publication */
  const publication = await load("services/workflow/publication.js");
  group("Publication au comparateur");

  check("offre validée : publiée", () => {
    assert.equal(publication.isPublishedOffer({ code: "OF-1", workflowStatus: "VALIDATED" }), true);
  });
  check("offre soumise : non publiée", () => {
    assert.equal(publication.isPublishedOffer({ code: "OF-1", workflowStatus: "SUBMITTED" }), false);
  });
  check("version remplacée par un monitoring non encore validé : toujours publiée", () => {
    assert.equal(
      publication.isPublishedOffer({
        code: "OF-1",
        workflowStatus: "DEACTIVATED",
        deactivationReason: "MONITORING",
        versions: [{ validatedAt: null }],
      }),
      true,
    );
  });
  check("version remplacée dont le successeur est validé : retirée", () => {
    assert.equal(
      publication.isPublishedOffer({
        code: "OF-1",
        workflowStatus: "DEACTIVATED",
        deactivationReason: "MONITORING",
        versions: [{ validatedAt: new Date() }],
      }),
      false,
    );
  });
  check("offre repère (sentinelle) exclue du comparateur", () => {
    assert.equal(publication.isPublishedOffer({ code: "OF-000000000000000", workflowStatus: "VALIDATED" }), false);
  });

  /* ------------------------------------------------ Filtres d'offres */
  const filters = await load("services/tools/offerFilters.js");
  group("Filtres des listes d'offres");

  const offers = [
    { id: 1, title: "Pass Internet", code: "A1", billingType: "PREPAID", category: "MOBILE", operator: { id: 1 }, specialPromotion: null },
    { id: 2, title: "Promo Soir", code: "B2", billingType: "POSTPAID", category: "MOBILE", operator: { id: 2 }, specialPromotion: { type: "FLASH" } },
    { id: 3, title: "Fibre Pro", code: "C3", billingType: "POSTPAID", category: "FIXE", operator: { id: 1 }, specialPromotion: null },
  ];

  check("filtres par défaut : tout est conservé", () => {
    assert.equal(filters.applyOfferFilters(offers, filters.DEFAULT_OFFER_FILTERS).length, 3);
  });
  check("filtre par type promotion", () => {
    const res = filters.applyOfferFilters(offers, { ...filters.DEFAULT_OFFER_FILTERS, offerType: "PROMO" });
    assert.deepEqual(res.map((o) => o.id), [2]);
  });
  check("filtre par type offre de base", () => {
    const res = filters.applyOfferFilters(offers, { ...filters.DEFAULT_OFFER_FILTERS, offerType: "BASE" });
    assert.deepEqual(res.map((o) => o.id), [1, 3]);
  });
  check("filtre par type de facturation", () => {
    const res = filters.applyOfferFilters(offers, { ...filters.DEFAULT_OFFER_FILTERS, billing: ["PREPAID"] });
    assert.deepEqual(res.map((o) => o.id), [1]);
  });
  check("filtre par catégorie fixe", () => {
    const res = filters.applyOfferFilters(offers, { ...filters.DEFAULT_OFFER_FILTERS, category: "FIXE" });
    assert.deepEqual(res.map((o) => o.id), [3]);
  });
  check("filtre par opérateur", () => {
    const res = filters.applyOfferFilters(offers, { ...filters.DEFAULT_OFFER_FILTERS, operatorIds: [1] });
    assert.deepEqual(res.map((o) => o.id), [1, 3]);
  });
  check("recherche insensible à la casse et aux accents", () => {
    const res = filters.applyOfferFilters(offers, { ...filters.DEFAULT_OFFER_FILTERS, search: "internet" });
    assert.deepEqual(res.map((o) => o.id), [1]);
  });
  check("liste non chargée : renvoie null (état « chargement »), sans erreur", () => {
    assert.equal(filters.applyOfferFilters(null, filters.DEFAULT_OFFER_FILTERS), null);
    assert.deepEqual(filters.applyOfferFilters([], filters.DEFAULT_OFFER_FILTERS), []);
  });
  check("compteur de filtres actifs", () => {
    assert.equal(filters.countActiveFilters(filters.DEFAULT_OFFER_FILTERS), 0);
    assert.ok(filters.countActiveFilters({ ...filters.DEFAULT_OFFER_FILTERS, category: "FIXE" }) > 0);
  });

  /* ------------------------------------------------ Statistiques */
  const stats = await load("services/tools/statistics.js");
  group("Agrégation statistique");

  const ref = new Date("2026-06-15T00:00:00.000Z");
  const sample = [
    { id: 1, createdAt: "2026-06-10T10:00:00.000Z", specialPromotion: null, category: "MOBILE", operator: { id: 1, name: "A" } },
    { id: 2, createdAt: "2026-06-12T10:00:00.000Z", specialPromotion: { type: "FLASH" }, category: "MOBILE", operator: { id: 1, name: "A" } },
    { id: 3, createdAt: "2026-05-02T10:00:00.000Z", specialPromotion: null, category: "FIXE", operator: { id: 2, name: "B" } },
  ];

  check("total et répartition par type", () => {
    const res = stats.aggregateOfferStats(sample, { months: 3, reference: ref, dateField: "createdAt" });
    assert.equal(res.total, 3);
    assert.equal(res.byKind.BASE.total + res.byKind.PROMO.total, 3);
    assert.equal(res.byKind.PROMO.total, 1);
  });
  check("répartition par catégorie mobile / fixe", () => {
    const res = stats.aggregateOfferStats(sample, { months: 3, reference: ref, dateField: "createdAt" });
    assert.equal(res.byCategory.MOBILE, 2);
    assert.equal(res.byCategory.FIXE, 1);
  });
  check("trois granularités de chronologie", () => {
    const res = stats.aggregateOfferStats(sample, { months: 3, reference: ref, dateField: "createdAt" });
    assert.ok(res.timelines.week.length > 0);
    assert.ok(res.timelines.month.length > 0);
    assert.ok(res.timelines.year.length > 0);
  });
  check("liste vide : agrégats à zéro sans erreur", () => {
    const res = stats.aggregateOfferStats([], { months: 3, reference: ref });
    assert.equal(res.total, 0);
  });

  /* ------------------------------------------------ Markdown */
  const md = await load("services/tools/markdown.js");
  group("Rendu Markdown de l'assistant");

  check("gras, titres et listes", () => {
    const html = md.renderMarkdown("## Titre\n\n**gras**\n\n- a\n- b");
    assert.ok(html.includes("<h4>Titre</h4>"));
    assert.ok(html.includes("<strong>gras</strong>"));
    assert.equal((html.match(/<li>/g) || []).length, 2);
  });
  check("HTML de la réponse neutralisé (aucune balise exécutée)", () => {
    const html = md.renderMarkdown('<img src=x onerror=alert(1)> <script>alert(2)</script>');
    assert.ok(!/<img|<script/i.test(html));
    assert.ok(html.includes("&lt;img"));
  });
  check("tableau Markdown converti", () => {
    const html = md.renderMarkdown("| A | B |\n|---|---|\n| 1 | 2 |");
    assert.ok(html.includes("<table>"));
  });
  check("taux de conformité extrait du texte", () => {
    assert.ok(md.stripMarkdown("**Taux : 80%**").includes("Taux : 80%"));
  });

  /* ------------------------------------------------ Texte riche */
  const sanitize = await load("services/tools/sanitizeHtml.js");
  group("Nettoyage du texte riche des opérateurs");

  check("côté serveur : balises retirées, texte conservé", () => {
    const out = sanitize.sanitizeHtml("<p>Cible <b>grand public</b></p>");
    assert.ok(out.includes("Cible"));
    assert.ok(!/<p|<b>/i.test(out));
  });
  check("script jamais restitué", () => {
    const out = sanitize.sanitizeHtml('<script>alert(1)</script>Texte');
    assert.ok(!out.includes("<script"));
  });
  check("champ vide reconnu", () => {
    assert.equal(sanitize.hasText("<p>&nbsp;</p>"), false);
    assert.equal(sanitize.hasText("<p>Texte</p>"), true);
  });

  /* ------------------------------------------------ Rôles et permissions */
  const rbac = await load("services/rbac/permissions.js");
  const roles = await load("services/rbac/roles.js");
  group("Rôles et permissions");

  check("le point focal ne peut pas décider", () => {
    assert.equal(rbac.can(roles.ROLES.FOCAL_POINT, rbac.PERMISSIONS.OFFER_DECIDE), false);
  });
  check("les validateurs peuvent décider", () => {
    assert.equal(rbac.can(roles.ROLES.VALIDATOR_4, rbac.PERMISSIONS.OFFER_DECIDE), true);
    assert.equal(rbac.can(roles.ROLES.VALIDATOR_1, rbac.PERMISSIONS.OFFER_DECIDE), true);
  });
  check("seule l'administration désactive une offre", () => {
    assert.equal(rbac.can(roles.ROLES.ADMIN, rbac.PERMISSIONS.OFFER_DEACTIVATE), true);
    assert.equal(rbac.can(roles.ROLES.VALIDATOR_4, rbac.PERMISSIONS.OFFER_DEACTIVATE), false);
  });
  check("le superviseur lit mais n'écrit jamais", () => {
    assert.equal(rbac.can(roles.ROLES.SUPERVISOR, rbac.PERMISSIONS.OFFER_READ), true);
    assert.equal(rbac.can(roles.ROLES.SUPERVISOR, rbac.PERMISSIONS.OFFER_DECIDE), false);
    assert.equal(rbac.can(roles.ROLES.SUPERVISOR, rbac.PERMISSIONS.OFFER_CREATE), false);
  });
  check("le client n'accède pas au back-office", () => {
    assert.equal(rbac.can(roles.ROLES.CLIENT, rbac.PERMISSIONS.OFFER_READ), false);
  });
  check("niveau de validateur déduit du rôle", () => {
    assert.equal(roles.validatorLevelOf(roles.ROLES.VALIDATOR_2), 2);
    assert.equal(roles.validatorLevelOf(roles.ROLES.ADMIN), null);
  });

  /* ------------------------------------------------ Bilan */
  /* ---------------------------------------------- Permissions (évolutions) */
  const perms = await load("services/rbac/permissions.js");
  group("Permissions : réactivation, courrier, IA, base documentaire");
  check("seule l'administration réactive une offre", () => {
    assert.equal(perms.can("ADMIN", perms.PERMISSIONS.OFFER_REACTIVATE), true);
    assert.equal(perms.can("VALIDATOR_4", perms.PERMISSIONS.OFFER_REACTIVATE), false);
    assert.equal(perms.can("FOCAL_POINT", perms.PERMISSIONS.OFFER_REACTIVATE), false);
  });
  check("l'analyse IA et le courrier ne sont jamais ouverts aux opérateurs", () => {
    for (const p of ["AI_ANALYSIS_READ", "AI_ANALYSIS_RUN", "LETTER_MANAGE", "KNOWLEDGE_READ"]) {
      assert.equal(perms.can("FOCAL_POINT", perms.PERMISSIONS[p]), false, p);
    }
    assert.equal(perms.can("SUPERVISOR", perms.PERMISSIONS.AI_ANALYSIS_READ), true);
    assert.equal(perms.can("SUPERVISOR", perms.PERMISSIONS.AI_ANALYSIS_RUN), false);
  });
  check("seule l'administration alimente la base documentaire", () => {
    assert.equal(perms.can("ADMIN", perms.PERMISSIONS.KNOWLEDGE_MANAGE), true);
    assert.equal(perms.can("VALIDATOR_1", perms.PERMISSIONS.KNOWLEDGE_MANAGE), false);
    assert.equal(perms.can("VALIDATOR_1", perms.PERMISSIONS.KNOWLEDGE_READ), true);
  });

  /* ------------------------------------------------------- Type de client */
  const clientType = await load("services/tools/clientTypeRules.js");
  group("Type de client : offre et offre parente");
  check("prépayé ↔ prépayé et postpayé ↔ postpayé acceptés", () => {
    assert.equal(clientType.isClientTypeCompatible("PREPAID", "PREPAID"), true);
    assert.equal(clientType.isClientTypeCompatible("POSTPAID", "POSTPAID"), true);
  });
  check("prépayé sur postpayé et postpayé sur prépayé refusés", () => {
    assert.equal(clientType.isClientTypeCompatible("PREPAID", "POSTPAID"), false);
    assert.equal(clientType.isClientTypeCompatible("POSTPAID", "PREPAID"), false);
    assert.match(clientType.clientTypeConflict("POSTPAID", "PREPAID", "OF-1"), /postpayée.*prépayée.*OF-1/);
  });
  check("l'hybride est compatible dans les deux sens", () => {
    for (const other of ["PREPAID", "POSTPAID", "HYBRID"]) {
      assert.equal(clientType.isClientTypeCompatible("HYBRID", other), true);
      assert.equal(clientType.isClientTypeCompatible(other, "HYBRID"), true);
    }
    assert.equal(clientType.clientTypeConflict("HYBRID", "PREPAID"), null);
  });

  /* --------------------------------------------------- Filtres par statut */
  const statusFilters = await load("services/tools/offerFilters.js");
  group("Filtres d'offres par statut");
  const statusList = [
    { id: 1, code: "A", title: "a", workflowStatus: "VALIDATED" },
    { id: 2, code: "B", title: "b", workflowStatus: "REFUSED" },
    { id: 3, code: "C", title: "c", workflowStatus: "DEACTIVATED" },
    { id: 4, code: "D", title: "d", validation: { status: "ALLOW" } }, // ancien monitoring
  ];
  check("plusieurs statuts se combinent", () => {
    const out = statusFilters.applyOfferFilters(statusList, { ...statusFilters.DEFAULT_OFFER_FILTERS, statuses: ["REFUSED", "DEACTIVATED"] });
    assert.deepEqual(out.map((o) => o.id), [2, 3]);
  });
  check("un ancien monitoring suit sa validation historique", () => {
    const out = statusFilters.applyOfferFilters(statusList, { ...statusFilters.DEFAULT_OFFER_FILTERS, statuses: ["VALIDATED"] });
    assert.deepEqual(out.map((o) => o.id), [1, 4]);
  });
  check("les compteurs suivent les autres critères, pas le statut choisi", () => {
    const counts = statusFilters.countByStatus(statusList, { ...statusFilters.DEFAULT_OFFER_FILTERS, statuses: ["REFUSED"], search: "" });
    assert.equal(counts.VALIDATED, 2);
    assert.equal(counts.REFUSED, 1);
    assert.equal(counts.ALL, 4);
  });

  /* ---------------------------------------------------- Parcours d'une offre */
  const journey = await load("services/tools/offerJourney.js");
  group("Parcours d'une offre : passé, présent, à venir");
  check("offre en validation : niveaux restants puis publication", () => {
    const j = journey.buildOfferJourney({
      offer: { id: 1, workflowStatus: "IN_VALIDATION", currentValidationLevel: 2, submittedAt: "2026-01-01" },
      details: { desiredDate: "2030-01-01", notifiDate: "2026-01-01" },
      finalLevel: 4,
      offerType: "BASE",
      actions: [],
      decisions: [],
      audit: [
        { id: 1, action: "SUBMIT", createdAt: "2026-01-01" },
        { id: 2, action: "NOTIFY", createdAt: "2026-01-01" },
        { id: 3, action: "VALIDATE_TRANSMIT", level: 1, comment: "ok", createdAt: "2026-01-02" },
      ],
    });
    assert.deepEqual(j.past.map((e) => e.action), ["SUBMIT", "VALIDATE_TRANSMIT"]);
    assert.equal(j.present.level, 2);
    assert.deepEqual(j.future.filter((f) => f.level).map((f) => f.level), [3, 4]);
    assert.ok(j.future.some((f) => /Publication/.test(f.title)));
  });
  check("offre refusée : circuit clos, aucune étape à venir", () => {
    const j = journey.buildOfferJourney({ offer: { id: 1, workflowStatus: "REFUSED" }, details: {}, finalLevel: 4, actions: [], decisions: [], audit: [] });
    assert.equal(j.closed, true);
    assert.equal(j.future.length, 0);
  });

  /* ------------------------------------------------------------- Courrier */
  const letterHtml = await load("services/letters/letterHtml.js");
  group("Courrier : nettoyage du texte");
  check("scripts, styles et attributs d'événement retirés", () => {
    const out = letterHtml.sanitizeLetterHtml('<p onclick="x()" class="ql-align-right evil">Bonjour<script>alert(1)</script></p><img src=x onerror=1><a href="javascript:x">l</a>');
    assert.equal(out, '<p class="ql-align-right">Bonjour</p><a>l</a>');
  });
  check("version texte lisible", () => {
    assert.equal(letterHtml.letterToText("<p>Un</p><ul><li>a</li><li>b</li></ul>"), "Un\n• a\n• b");
  });
  check("alignement traduit en style pour l'e-mail", () => {
    assert.equal(letterHtml.inlineLetterStyles('<p class="ql-align-right">x</p>'), '<p style="text-align:right">x</p>');
  });

  /* ---------------------------------------------------- Base documentaire */
  const chunking = await load("services/artciAssistant/chunking.js");
  const context = await load("services/artciAssistant/contextBuilder.js");
  group("Assistant IA ARTCI : passages et citations");
  check("un texte est découpé par article, avec son intitulé", () => {
    const chunks = chunking.chunkText("Préambule du texte.\n\nArticle 1 - Objet\nPremier article.\n\nArticle 2 - Délais\nSecond article.");
    assert.deepEqual(chunks.map((c) => c.heading), [null, "Article 1 - Objet", "Article 2 - Délais"]);
    assert.deepEqual(chunks.map((c) => c.position), [1, 2, 3]);
  });
  check("un passage trop long est coupé", () => {
    const long = `Article 1 - Long\n${"Phrase de test assez longue pour remplir le passage. ".repeat(80)}`;
    const chunks = chunking.chunkText(long);
    assert.ok(chunks.length > 1);
    assert.ok(chunks.every((c) => c.content.length <= chunking.CHUNK_MAX));
  });
  check("seuls les numéros de passages fournis comptent comme citations", () => {
    assert.deepEqual([...context.citedNumbers("Selon [1] et [2, 3], mais pas [9].", 3)].sort(), [1, 2, 3]);
  });
  check("le contexte respecte son budget et renumérote", () => {
    const passages = Array.from({ length: 5 }, (_, i) => ({ n: i + 10, content: "x".repeat(900), title: "T" }));
    const kept = context.selectPassages(passages, 2200);
    assert.deepEqual(kept.map((p) => p.n), [1, 2]);
  });

  /* ------------------------------------------------ Schéma de base en retard */
  const schema = await load("services/config/schemaError.js");
  group("Base de données en retard sur le code");
  check("table ou colonne absente reconnue, autre erreur ignorée", () => {
    assert.equal(schema.isSchemaOutdated({ code: "P2021" }), true);
    assert.equal(schema.isSchemaOutdated({ code: "P2022" }), true);
    assert.equal(schema.isSchemaOutdated({ code: "P2002" }), false);
    assert.equal(schema.isSchemaOutdated(new Error("x")), false);
  });
  check("réponse 503 avec la marche à suivre", () => {
    const sent = {};
    const res = { status: (c) => ((sent.status = c), res), json: (b) => ((sent.body = b), res) };
    const log = console.error;
    console.error = () => {};
    const handled = schema.sendSchemaOutdated(res, { code: "P2021" }, "test");
    console.error = log;
    assert.equal(handled, true);
    assert.equal(sent.status, 503);
    assert.equal(sent.body.code, "SCHEMA_OUTDATED");
    assert.match(sent.body.error, /prisma migrate deploy/);
  });

  /* --------------------------------------------- Courrier : destinataires */
  const recipients = await load("services/letters/recipients.js");
  group("Courrier : destinataires");
  check("adresses bien et mal formées", () => {
    ["agent@artci.ci", "prenom.nom+offres@orange-ci.com", "A.B@sub.domaine.ci"].forEach((e) => assert.equal(recipients.isWellFormedEmail(e), true, e));
    ["", "agent", "agent@", "@artci.ci", "agent@artci", "agent@artci.c", "agent@@artci.ci", "a b@artci.ci", "agent@artci..ci", ".agent@artci.ci", "agent.@artci.ci", "agent@-artci.ci", "agent@artci.123"].forEach((e) =>
      assert.equal(recipients.isWellFormedEmail(e), false, e),
    );
  });
  check("liste de destinataires : séparateurs, doublons, casse", () => {
    const parsed = recipients.parseRecipients(" A@artci.ci ; b@orange.ci,a@artci.ci\nmauvais ");
    assert.deepEqual(parsed.valid, ["a@artci.ci", "b@orange.ci"]);
    assert.deepEqual(parsed.invalid, ["mauvais"]);
  });
  check("message d'erreur explicite, null quand tout va bien", () => {
    assert.match(recipients.recipientsError("agent@artci"), /« agent@artci » n'est pas valide/);
    assert.match(recipients.recipientsError("  "), /Indiquez l'adresse/);
    assert.match(recipients.recipientsError(Array.from({ length: 6 }, (_, i) => `a${i}@artci.ci`).join(",")), /5 destinataires au plus/);
    assert.equal(recipients.recipientsError("agent@artci.ci, autre@mtn.ci"), null);
  });

  const domains = await load("services/letters/recipientDomain.js");
  const dnsError = (code) => Object.assign(new Error(code), { code });
  const answer = (value) => async () => {
    if (value instanceof Error) throw value;
    return value;
  };
  const resolver = (mx, a) => ({ resolveMx: answer(mx), resolve4: answer(a) });
  const check1 = (email, mx, a) => domains.checkRecipientDomain(email, { resolver: resolver(mx, a), dryRun: false, timeoutMs: 200 });
  // Serveur DNS muet : la réponse n'arrive qu'après le délai accordé.
  const never = () => new Promise((resolve) => setTimeout(resolve, 600, []));
  await checkAsync("domaine avec serveur de courrier accepté", async () => {
    const res = await check1("a@artci.ci", [{ exchange: "mx.artci.ci", priority: 10 }], ["192.0.2.1"]);
    assert.deepEqual([res.ok, res.verified], [true, true]);
  });
  await checkAsync("domaine inexistant refusé", async () => {
    const res = await check1("a@orange.cii", dnsError("ENOTFOUND"), dnsError("ENOTFOUND"));
    assert.deepEqual([res.ok, res.domain], [false, "orange.cii"]);
  });
  await checkAsync("domaine inexistant refusé même si une des deux réponses manque", async () => {
    const res = await domains.checkRecipientDomain("a@orange.cii", { resolver: { resolveMx: never, resolve4: answer(dnsError("ENOTFOUND")) }, dryRun: false, timeoutMs: 80 });
    assert.equal(res.ok, false);
  });
  await checkAsync("sans MX mais avec une adresse : accepté (RFC 5321)", async () => {
    assert.equal((await check1("a@petit.ci", dnsError("ENODATA"), ["196.1.1.1"])).ok, true);
  });
  await checkAsync("ni MX ni adresse : refusé", async () => {
    assert.equal((await check1("a@vide.ci", dnsError("ENODATA"), dnsError("ENODATA"))).ok, false);
  });
  await checkAsync("« MX nul » : le domaine refuse tout courrier", async () => {
    assert.equal((await check1("a@muet.ci", [{ exchange: ".", priority: 0 }], ["192.0.2.1"])).ok, false);
    assert.equal((await check1("a@example.com", [{ exchange: "", priority: 0 }], ["192.0.2.1"])).ok, false);
  });
  await checkAsync("DNS injoignable ou muet : envoi non bloqué, mais non vérifié", async () => {
    const down = await check1("a@artci.ci", dnsError("ESERVFAIL"), dnsError("ECONNREFUSED"));
    assert.deepEqual([down.ok, down.verified, down.cause], [true, false, "ESERVFAIL"]);
    const mute = await domains.checkRecipientDomain("a@artci.ci", { resolver: { resolveMx: never, resolve4: never }, dryRun: false, timeoutMs: 60 });
    assert.deepEqual([mute.ok, mute.verified, mute.cause], [true, false, "ETIMEOUT"]);
  });
  await checkAsync("extension réservée : refusée en réel, admise en envoi simulé", async () => {
    const none = resolver(dnsError("ENOTFOUND"), dnsError("ENOTFOUND"));
    assert.equal((await domains.checkRecipientDomain("a@compartic.test", { resolver: none, dryRun: false })).ok, false);
    assert.equal((await domains.checkRecipientDomain("a@compartic.test", { resolver: none, dryRun: true })).ok, true);
  });

  /* ------------------------------------- Courrier : ouverture en messagerie */
  const compose = await load("services/letters/mailCompose.js");
  group("Courrier : ouverture dans la messagerie");
  const longBody = Array.from({ length: 80 }, (_, i) => `Paragraphe ${i + 1} : l'offre a été examinée, validée et publiée à l'échéance prévue.`).join("\n");
  check("lien mailto : destinataires, objet et corps préremplis", () => {
    const { href, truncated } = compose.buildMailto({ to: ["a@artci.ci", "b@orange.ci"], cc: ["c@mtn.ci"], subject: "Offre validée : « Pass été » & co", body: "Madame,\nBonjour à tous." });
    assert.equal(truncated, false);
    assert.ok(href.startsWith("mailto:a@artci.ci,b@orange.ci?cc=c@mtn.ci&subject="));
    const url = new URL(href);
    assert.equal(url.searchParams.get("subject"), "Offre validée : « Pass été » & co");
    assert.equal(decodeURIComponent(href.split("&body=")[1]), "Madame,\r\nBonjour à tous.");
  });
  check("lien mailto : jamais plus long que la limite, texte coupé proprement", () => {
    const { href, truncated } = compose.buildMailto({ to: ["a@artci.ci"], subject: "Objet", body: longBody });
    assert.equal(truncated, true);
    assert.ok(href.length <= compose.MAILTO_MAX, `longueur ${href.length}`);
    const body = decodeURIComponent(href.split("&body=")[1]);
    assert.match(body, /suite du courrier/);
    assert.ok(body.startsWith("Paragraphe 1 :"));
  });
  check("lien mailto : limite stricte sous Windows et dans le doute, large ailleurs", () => {
    assert.equal(compose.mailtoLimit("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140"), compose.MAILTO_MAX);
    assert.equal(compose.mailtoLimit(""), compose.MAILTO_MAX);
    assert.equal(compose.mailtoLimit("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605"), compose.MAILTO_MAX_LONG);
    assert.equal(compose.mailtoLimit("Mozilla/5.0 (X11; Linux x86_64) Firefox/130"), compose.MAILTO_MAX_LONG);
  });
  check("lien mailto : un émoji en limite de coupe ne casse pas l'encodage", () => {
    const body = "é😀".repeat(400);
    for (let max = 300; max < 340; max += 1) assert.ok(compose.buildMailto({ to: ["a@artci.ci"], subject: "O", body, maxLength: max }).href.length <= max);
  });
  check("messageries en ligne : Gmail et Outlook préremplis", () => {
    const gmail = new URL(compose.buildWebmailUrl("gmail", { to: ["a@artci.ci"], subject: "Objet é", body: "Texte" }).href);
    assert.equal(gmail.hostname, "mail.google.com");
    assert.deepEqual([gmail.searchParams.get("to"), gmail.searchParams.get("su"), gmail.searchParams.get("body")], ["a@artci.ci", "Objet é", "Texte"]);
    const outlook = new URL(compose.buildWebmailUrl("outlook", { to: ["a@artci.ci"], subject: "Objet", body: "Texte" }).href);
    assert.equal(outlook.hostname, "outlook.office.com");
    assert.equal(outlook.searchParams.get("subject"), "Objet");
    assert.equal(compose.buildWebmailUrl("autre", {}), null);
  });
  check("fichier .eml : brouillon non envoyé, objet accentué, logo intégré", () => {
    const eml = compose.buildEml({ to: ["a@artci.ci"], subject: "Décision relative à l'offre « Pass été »", html: "<p>Corps é</p>", text: "Corps é", images: [{ cid: "artci-logo", mime: "image/png", base64: "AAAA" }] });
    assert.ok(eml.startsWith("X-Unsent: 1\r\nTo: a@artci.ci\r\n"));
    const subject = eml.match(/Subject: ((?:.+\r\n )*.+)\r\n/)[1];
    const decoded = subject.split(/\r\n /).map((w) => Buffer.from(w.replace(/^=\?UTF-8\?B\?|\?=$/g, ""), "base64").toString("utf-8")).join("");
    assert.equal(decoded, "Décision relative à l'offre « Pass été »");
    assert.match(eml, /multipart\/related/);
    assert.match(eml, /Content-ID: <artci-logo>/);
    assert.ok(eml.includes(Buffer.from("Corps é", "utf-8").toString("base64")));
    assert.equal(compose.emlFileName("Décision : offre « Été » !"), "Decision-offre-Ete.eml");
  });

  group("Courrier : en-tête au logo de l'ARTCI");
  check("le logo garde ses proportions (largeur et hauteur écrites)", () => {
    const head = letterHtml.letterheadHtml("/images/logo/logo.png");
    const [, w, h] = head.match(/width="(\d+)" height="(\d+)"/);
    assert.ok(Math.abs(w / h - 500 / 218) < 0.02);
    assert.match(head, /alt="ARTCI/);
  });
  check("l'e-mail porte l'en-tête en styles en ligne et le logo par cid", () => {
    const mail = letterHtml.letterEmailHtml('<p class="ql-align-right">Signé</p>', "cid:artci-logo");
    assert.match(mail, /<img src="cid:artci-logo"/);
    assert.match(mail, /text-align:right/);
    assert.doesNotMatch(mail, /class="lt-letterhead"/);
    assert.doesNotMatch(letterHtml.letterEmailHtml("<p>x</p>"), /<img/);
  });

  /* ----------------------------- Courrier : validation, refus, suspension */
  const template = await load("services/letters/letterTemplate.js");
  group("Courrier : modèle selon l'état de l'offre");
  const actorL = { firstName: "Awa", lastName: "Koné", role: "VALIDATOR_1" };
  const letterOfferBase = {
    code: "OF-1", title: "Pass <Été>", operator: { name: "MTN" }, notifiDate: "2026-01-10", desiredDate: "2026-02-01",
    validatedAt: null, refusedAt: null, deactivatedAt: null, deactivationReason: null, specialPromotion: null,
    formulas: [{ title: "Jour", validity: 1, price: { value: 500 }, serviceDetail: [] }],
  };
  const letterData = (offer, extra = {}) => {
    const full = { ...letterOfferBase, ...offer };
    return {
      offer: full, kind: template.letterKindOf(full), decisions: [], submitter: { firstName: "Jean", lastName: "Yao" }, analysis: null,
      refusal: null, refusedAt: full.refusedAt, suspension: { at: full.deactivatedAt, reason: full.deactivationReason, comment: null }, submittedAt: "2026-01-12", ...extra,
    };
  };
  check("nature du courrier d'après l'état de l'offre", () => {
    assert.equal(template.letterKindOf({ workflowStatus: "VALIDATED" }), "VALIDATED");
    assert.equal(template.letterKindOf({ workflowStatus: "REFUSED" }), "REFUSED");
    assert.equal(template.letterKindOf({ workflowStatus: "DEACTIVATED" }), "SUSPENDED");
    assert.equal(template.letterKindOf({ workflowStatus: "IN_VALIDATION" }), null);
  });
  check("offre validée : courrier de validation inchangé", () => {
    const data = letterData({ workflowStatus: "VALIDATED", validatedAt: "2026-01-20" }, { decisions: [{ level: 4, decision: "VALIDATED", final: true, comment: "Conforme." }] });
    const { subject, html } = template.composeLetter(data, actorL, template.fallbackSynthesis(data));
    assert.equal(subject, "Validation de l'offre « Pass <Été> » (OF-1)");
    assert.match(html, /validée le 20 janvier 2026/);
    assert.match(html, /<h3>Observations<\/h3><p>Conforme\.<\/p>/);
    assert.match(html, /Pass &lt;Été&gt;/);
    assert.doesNotMatch(html, /refus|suspendu/i);
  });
  check("offre refusée : objet, décision et motif du refus", () => {
    const refusal = { level: 2, decision: "REFUSED", final: false, comment: "Tarif <non> conforme.", createdAt: "2026-01-18" };
    const data = letterData({ workflowStatus: "REFUSED", refusedAt: "2026-01-18" }, { decisions: [{ level: 1, decision: "VALIDATED", comment: "RAS" }, refusal], refusal });
    const synthesis = template.fallbackSynthesis(data);
    const { subject, html } = template.composeLetter(data, actorL, synthesis);
    assert.equal(subject, "Refus de l'offre « Pass <Été> » (OF-1)");
    assert.match(html, /n'a pas été validée<\/strong> \(décision du 18 janvier 2026\)/);
    assert.match(html, /<h3>Motif du refus<\/h3><p>Tarif &lt;non&gt; conforme\.<\/p>/);
    assert.match(html, /soumettre une nouvelle déclaration/);
    assert.match(synthesis, /refusée au niveau 2 de validation, le 18 janvier 2026/);
    assert.doesNotMatch(html, /peut être commercialisée|validée le/);
    assert.match(template.decisionLine(data), /refusée le 18 janvier 2026\. Motif du refus : Tarif <non> conforme\./);
    assert.ok(template.dynamicFields(data, actorL).some((f) => f.key === "refusalReason" && f.value === "Tarif <non> conforme."));
  });
  check("offre suspendue : objet, date et motif de la suspension", () => {
    const data = letterData({ workflowStatus: "DEACTIVATED", validatedAt: "2026-01-20", deactivatedAt: "2026-03-05", deactivationReason: "MANUAL" });
    data.suspension.comment = "Offre non conforme aux tarifs déclarés.";
    const synthesis = template.fallbackSynthesis(data);
    const { subject, html } = template.composeLetter(data, actorL, synthesis);
    assert.equal(subject, "Suspension de l'offre « Pass <Été> » (OF-1)");
    assert.match(html, /suspendue le 5 mars 2026<\/strong>/);
    assert.match(html, /<h3>Rappel de la situation<\/h3>/);
    assert.match(html, /<h3>Motif de la suspension<\/h3><p>Offre non conforme aux tarifs déclarés\.<\/p>/);
    assert.match(synthesis, /suspendue le 5 mars 2026.*Elle avait été validée le 20 janvier 2026/);
    assert.doesNotMatch(html, /Nous accusons réception/);
  });
  check("offre remplacée par une nouvelle version : suspension sans rubrique de motif", () => {
    const data = letterData({ workflowStatus: "DEACTIVATED", deactivatedAt: "2026-03-05", deactivationReason: "MONITORING" });
    const { html } = template.composeLetter(data, actorL, template.fallbackSynthesis(data));
    assert.match(html, /suspendue depuis le 5 mars 2026<\/strong> : elle a été remplacée par une nouvelle version/);
    assert.doesNotMatch(html, /Motif de la suspension/);
  });
  check("dates ou motif inconnus : aucune phrase tronquée", () => {
    const refused = template.composeLetter(letterData({ workflowStatus: "REFUSED" }, { submittedAt: null }), actorL, "S").html;
    assert.match(refused, /\[Précisez ici le motif du refus\.\]/);
    const suspended = template.composeLetter(letterData({ workflowStatus: "DEACTIVATED", deactivationReason: "MANUAL" }), actorL, "S").html;
    assert.match(suspended, /suspendue<\/strong>\. Elle n'est plus publiée/);
    [refused, suspended].forEach((html) => assert.doesNotMatch(html, / le \.| le   | \(décision du/));
  });

  /* ------------------------------ Opérateur : pas de circuit de validation */
  const operatorView = await load("services/workflow/operatorView.js");
  group("Opérateur : le circuit de validation ne lui est pas transmis");
  check("niveau de validation retiré d'une réponse, à toute profondeur", () => {
    const date = new Date("2026-01-01");
    const body = { offers: [{ id: 1, currentValidationLevel: 2, createdAt: date, _count: { decisions: 1, versions: 0 }, sourceOffer: { id: 9, currentValidationLevel: 4 } }], map: { 5: { finalLevel: 4, actions: ["VIEW"] } }, total: 1 };
    const out = operatorView.stripValidationCircuit(body);
    assert.equal(JSON.stringify(out).includes("ValidationLevel"), false);
    assert.deepEqual(out.offers[0]._count, { versions: 0 }, "le décompte des décisions révélerait le niveau atteint");
    assert.equal(JSON.stringify(out).includes("finalLevel"), false);
    assert.deepEqual(out.map[5].actions, ["VIEW"]);
    assert.equal(out.offers[0].createdAt, date);
    assert.equal(body.offers[0].currentValidationLevel, 2, "l'objet d'origine n'est pas modifié");
  });
  check("étapes internes masquées, agents de l'ARTCI jamais nommés", () => {
    const audit = [
      { id: 1, action: "SUBMIT", actorRole: "FOCAL_POINT", actor: { firstName: "Jean", lastName: "Yao" }, createdAt: "2026-01-01", level: null },
      { id: 2, action: "VALIDATE_TRANSMIT", actorRole: "VALIDATOR_1", actor: { firstName: "Awa", lastName: "Koné" }, level: 1, comment: "RAS", createdAt: "2026-01-02" },
      { id: 3, action: "DEADLINE_ALERT", actorRole: null, createdAt: "2026-01-03" },
      { id: 4, action: "VALIDATE_FINAL", actorRole: "VALIDATOR_4", actor: { firstName: "Paul", lastName: "Bamba" }, level: 4, comment: "Avis interne", createdAt: "2026-01-04" },
      { id: 5, action: "NOTIFY", actorRole: "VALIDATOR_4", createdAt: "2026-01-04" },
      { id: 6, action: "DEACTIVATE", actorRole: "ADMIN", actor: { firstName: "Ali", lastName: "Touré" }, comment: "Tarif non conforme", createdAt: "2026-02-01" },
    ];
    const events = operatorView.operatorEvents(audit);
    assert.deepEqual(events.map((e) => e.action), ["SUBMIT", "VALIDATE_FINAL", "DEACTIVATE"]);
    assert.deepEqual([events[0].by, events[0].byOperator], ["Jean Yao", true]);
    assert.deepEqual([events[1].by, events[1].comment], ["ARTCI", null]);
    assert.deepEqual(events[2].comment, { label: "Motif", text: "Tarif non conforme" });
    const text = JSON.stringify(events);
    ["Koné", "Bamba", "Touré", "Avis interne", "level", "VALIDATOR"].forEach((word) => assert.equal(text.includes(word), false, word));
  });
  check("fiche de l'opérateur : ni niveaux, ni décisions, mais l'issue et le motif d'un refus", () => {
    const state = {
      offer: { id: 7, title: "Pass", workflowStatus: "REFUSED", currentValidationLevel: null },
      offerType: "BASE", finalLevel: 4, levels: [{ level: 1, state: "VALIDATED" }, { level: 2, state: "REFUSED" }],
      decisions: [{ level: 1, decision: "VALIDATED", comment: "ok", user: { firstName: "Awa" } }, { level: 2, decision: "REFUSED", comment: "Tarifs incohérents", user: { firstName: "Paul", email: "paul@artci.ci" } }],
      audit: [{ id: 1, action: "REFUSE", actorRole: "VALIDATOR_2", actor: { firstName: "Paul" }, level: 2, comment: "Tarifs incohérents", createdAt: "2026-01-05" }],
      versions: [{ id: 7, version: 1, currentValidationLevel: 2 }], actions: ["VIEW"], circuitClosed: true,
      closure: { status: "REFUSED", at: "2026-01-05", decision: { level: 2, user: { firstName: "Paul" } } }, contributors: [{ user: { firstName: "Awa" } }], published: false,
    };
    const view = operatorView.operatorWorkflowState(state);
    assert.equal(view.audience, "OPERATOR");
    assert.deepEqual(Object.keys(view).sort(), ["actions", "audience", "events", "offer", "offerType", "outcome", "published", "versions"]);
    assert.deepEqual(view.outcome, { status: "REFUSED", at: "2026-01-05", motive: "Tarifs incohérents" });
    const text = JSON.stringify(view);
    ["Paul", "Awa", "paul@artci.ci", "level", "finalLevel", "ValidationLevel", "decisions"].forEach((word) => assert.equal(text.includes(word), false, word));
  });

  const evolution = await load("services/offers/offerEvolution.js");
  group("Opérateur : évolution d'une offre (présent et passé)");
  check("versions regroupées en lignées, de la plus récente à la plus ancienne", () => {
    const lineages = evolution.buildLineages([
      { id: 1, version: 1, sourceOfferId: null }, { id: 2, version: 2, sourceOfferId: 1 }, { id: 3, version: 3, sourceOfferId: 2 },
      { id: 10, version: 1, sourceOfferId: null }, { id: 20, version: 2, sourceOfferId: 99 },
    ]);
    assert.deepEqual(lineages.map((l) => l.map((o) => o.id)), [[3, 2, 1], [10], [20]]);
  });
  check("ce qui a changé d'une version à la suivante", () => {
    const v1 = { title: "Pass Jour", billingType: "PREPAID", formulas: [{ title: "Jour", validity: 1, price: { value: 500 } }, { title: "Semaine", validity: 7, price: { value: 2000 } }] };
    const v2 = { title: "Pass jour ", billingType: "HYBRID", formulas: [{ title: "JOUR", validity: 2, price: { value: 600 } }, { title: "Mois", validity: 30, price: { value: 8000 } }] };
    const changes = evolution.versionChanges(v1, v2);
    assert.deepEqual(changes.map((c) => c.kind), ["changed", "changed", "changed", "added", "removed"]);
    assert.deepEqual([changes[0].label, changes[0].from, changes[0].to], ["Type de client", "prépayé", "hybride"]);
    assert.match(changes[1].label, /Prix de « JOUR »/);
    assert.match(`${changes[1].from} ${changes[1].to}`, /500.FCFA 600.FCFA/);
    assert.match(changes[3].label, /Formule ajoutée : Mois/);
    assert.match(changes[4].label, /Formule retirée : Semaine/);
    assert.deepEqual(evolution.versionChanges(v1, v1), []);
    assert.deepEqual(evolution.versionChanges(null, v2), []);
  });
  check("état présent décrit sans vocabulaire du circuit", () => {
    const states = ["DRAFT", "SUBMITTED", "IN_VALIDATION", "VALIDATED", "REFUSED", "DEACTIVATED"].map((workflowStatus) => evolution.presentState({ workflowStatus }).label);
    assert.equal(states[1], states[2], "soumise et en validation : même libellé pour l'opérateur");
    states.forEach((label) => assert.doesNotMatch(label, /niveau|validateur|circuit/i));
    assert.match(evolution.presentState({ workflowStatus: "DEACTIVATED", deactivationReason: "MONITORING" }).label, /Remplacée par une nouvelle version/);
    assert.deepEqual(evolution.offerSummary({ formulas: [{ price: { value: 500 } }, { price: { value: 2000 } }, { price: null }] }), { formulas: 3, priceMin: 500, priceMax: 2000 });
  });

  const adminUi = await load("services/tools/adminUi.js");
  group("Espace de gestion : rayon de 8px limité à ses écrans");
  check("routes de l'espace de gestion reconnues, site public exclu", () => {
    ["/admin-dashboard", "/admin-auth", "/operator-list-offer", "/offer-workflow/[id]", "/account"].forEach((p) => assert.equal(adminUi.isAdminUiRoute(p), true, p));
    ["/", "/comparator", "/observatoire", "/login", "/accounts", "/administration", undefined].forEach((p) => assert.equal(adminUi.isAdminUiRoute(p), false, String(p)));
  });

  console.log(`\n${passed}/${passed + failures.length} contrôles réussis.`);
  if (failures.length) {
    console.log("\nÉchecs :");
    failures.forEach((f) => console.log(`  - ${f.name} : ${f.message}`));
  }
  rmSync(outDir, { recursive: true, force: true });
  process.exit(failures.length ? 1 : 0);
};

run().catch((error) => {
  console.error("Tests interrompus :", error);
  rmSync(outDir, { recursive: true, force: true });
  process.exit(1);
});
