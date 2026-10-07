/**
 * Tests fonctionnels du workflow de validation (scénarios d'acceptation 1 à 14).
 *
 * Exécutés en HTTP contre un serveur de test lancé en mode « e-mail à blanc »,
 * sur les comptes et offres du seed de workflow :
 *
 *   node --env-file=.env prisma/seeders/workflowSeeder.js
 *   NEXT_DIST_DIR=.next-wftest MAIL_DRY_RUN=true npx next dev -p 3105 > /tmp/wf.log 2>&1 &
 *   WF_BASE=http://localhost:3105 WF_SERVER_LOG=/tmp/wf.log node --env-file=.env scripts/test-workflow.mjs
 *
 * WF_SERVER_LOG : journal du serveur, où MAIL_DRY_RUN écrit le code de
 * soumission envoyé au point focal (sa lecture remplace la boîte e-mail).
 *
 * Les offres créées par les tests sont supprimées à la fin ; les offres du seed
 * modifiées par les scénarios sont supprimées puis recréées par le seeder.
 */
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const require = createRequire(`${process.cwd()}/`);
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const BASE = process.env.WF_BASE || "http://localhost:3105";
const LOG = process.env.WF_SERVER_LOG;
const FKTND_H = readFileSync("services/tools/constants.js", "utf8").match(/FKTND_H\s*=\s*"([^"]+)"/)[1];
const PASSWORD = "Compartic@Test2026";

const results = [];
let scenario = "";
const check = (label, ok, detail = "") => {
  results.push({ scenario, label, ok: !!ok, detail });
  console.log(`${ok ? "  ✔" : "  ✘"} ${label}${!ok && detail ? `   ${detail}` : ""}`);
};
const section = (title) => {
  scenario = title;
  console.log(`\n■ ${title}`);
};

const api = async (token, method, path, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data };
};

const login = async (email) => {
  const r = await api(null, "POST", "/api/auth/login", { email, password: PASSWORD, verskth: FKTND_H });
  if (r.status !== 200) throw new Error(`Connexion impossible pour ${email} : ${r.status} ${JSON.stringify(r.data)}`);
  return r.data.token;
};

const offerByCode = (code) =>
  prisma.offer.findUnique({
    where: { code },
    include: { decisions: true, validation: true, specialPromotion: true },
  });

const notificationsOf = async (userCode, offerId, type) => {
  const user = await prisma.user.findUnique({ where: { code: userCode } });
  return prisma.notification.count({ where: { offerId, type, to: { some: { id: user.id } } } });
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Code de soumission lu dans le journal du serveur (MAIL_DRY_RUN). */
const readCodeFromLog = async (reference) => {
  for (let i = 0; i < 20; i += 1) {
    const lines = readFileSync(LOG, "utf8").split("\n").filter((l) => l.includes("[MAIL_DRY_RUN:text]") && l.includes(reference));
    const m = lines.length && lines[lines.length - 1].match(/code de validation est : (\d+)/);
    if (m) return m[1];
    await sleep(250);
  }
  return null;
};

const submissionTicketFor = async (token, reference, label) => {
  const req = await api(token, "POST", "/api/offer/submission/requestCode", { verskth: FKTND_H, reference, label });
  if (req.status !== 200) return { error: `requestCode ${req.status} ${JSON.stringify(req.data)}` };
  const code = await readCodeFromLog(reference);
  if (!code) return { error: "code introuvable dans le journal du serveur" };
  const ver = await api(token, "POST", "/api/offer/submission/verifyCode", { verskth: FKTND_H, reference, code });
  if (ver.status !== 200) return { error: `verifyCode ${ver.status} ${JSON.stringify(ver.data)}` };
  return { ticket: ver.data.ticket };
};

const newOfferBody = (code, operatorId, extra = {}) => ({
  verskth: FKTND_H,
  code,
  title: `[TEST AUTO] ${code}`,
  category: 1,
  billingType: 1,
  notifiDate: "2026-09-01",
  startDate: "2026-10-15",
  target: "Grand public",
  description: "Créée par scripts/test-workflow.mjs",
  operatorId,
  offerType: 2,
  ...extra,
});

/** Identifiants des offres affichées sur le comparateur public (sans session). */
const comparatorOfferIds = async () => {
  const r = await api(null, "POST", "/api/client/offer/getClientFormulas", { verskth: FKTND_H });
  return new Set((r.data || []).map((f) => f.offer.id));
};

/** États de la frise vus par un utilisateur donné. */
const circuitSeenBy = async (token, id) => {
  const r = await api(token, "GET", `/api/workflow/offers/${id}`);
  return { states: (r.data?.levels || []).map((l) => l.state), closed: r.data?.circuitClosed, closure: r.data?.closure };
};
const noPending = (states) => !states.some((x) => x === "CURRENT" || x === "UPCOMING");

const decide = (token, id, decision, comment, confirmFinal = false) =>
  api(token, "POST", `/api/workflow/offers/${id}/decide`, { decision, comment, confirmFinal });

const createdOfferIds = [];
const createdUserIds = [];

async function main() {
  if (!LOG) throw new Error("WF_SERVER_LOG est requis (journal du serveur de test).");

  const T = {};
  for (const [key, email] of Object.entries({
    SA: "super.admin@compartic.test",
    ADMIN: "admin@compartic.test",
    SUP: "superviseur@compartic.test",
    V1: "validateur1@compartic.test",
    V2: "validateur2@compartic.test",
    V3: "validateur3@compartic.test",
    V4: "validateur4@compartic.test",
    ORANGE: "pf.orange@compartic.test",
    MTN: "pf.mtn@compartic.test",
    MOOV: "pf.moov@compartic.test",
  })) {
    T[key] = await login(email);
  }
  const op = Object.fromEntries((await prisma.operator.findMany()).map((o) => [o.code, o.id]));
  const ORANGE = op["OPE-001"];
  const MTN = op["OPE-010"];

  const seeded = async (key) => offerByCode(`OF-WFTEST-${key}`);

  /* ------------------------------------------------------------------ 1 */
  section("Scénario 1   Point focal Orange crée une offre Orange");
  {
    const code = `OF-AUTO-${Date.now()}`;
    const noTicket = await api(T.ORANGE, "POST", "/api/admin/offer", newOfferBody(code, ORANGE));
    check("sans code e-mail → refus (403)", noTicket.status === 403, `${noTicket.status}`);

    const wrongOp = await api(T.ORANGE, "POST", "/api/admin/offer", newOfferBody(code, MTN));
    check("pour l'opérateur MTN → refus (403 OPERATOR_SCOPE)", wrongOp.status === 403 && wrongOp.data?.code === "OPERATOR_SCOPE", `${wrongOp.status} ${wrongOp.data?.code}`);

    const t = await submissionTicketFor(T.ORANGE, code, "[TEST AUTO]");
    check("code reçu (journal) et vérifié → jeton", !!t.ticket, t.error);
    const created = await api(T.ORANGE, "POST", "/api/admin/offer", newOfferBody(code, ORANGE, { submissionTicket: t.ticket, userId: 1 }));
    check("création → succès (201)", created.status === 201, `${created.status} ${JSON.stringify(created.data)}`);
    // La route attribue elle-même le code définitif : on retrouve l'offre par son id.
    const o = created.data?.id ? await prisma.offer.findUnique({ where: { id: created.data.id }, include: { decisions: true, validation: true } }) : null;
    if (o) createdOfferIds.push(o.id);
    check("offre SOUMISE au niveau 1", o?.workflowStatus === "SUBMITTED" && o?.currentValidationLevel === 1, `${o?.workflowStatus}/${o?.currentValidationLevel}`);
    const author = await prisma.user.findUnique({ where: { code: "POINT_FOCAL_ORANGE_TEST" } });
    check("auteur = session (userId du corps ignoré)", o?.userId === author.id, `${o?.userId}`);
    check("projection validation = PENDING", o?.validation?.status === "PENDING");
    const audits = await prisma.auditLog.findMany({ where: { offerId: o?.id }, select: { action: true } });
    check("audit CREATE + SUBMIT + NOTIFY", ["CREATE", "SUBMIT", "NOTIFY"].every((a) => audits.some((x) => x.action === a)), audits.map((a) => a.action).join(","));
    check("Validateur 1 notifié", (await notificationsOf("VALIDATEUR_1_TEST", o?.id, "OFFER_SUBMITTED")) === 1);
    check("Validateur 2 non notifié", (await notificationsOf("VALIDATEUR_2_TEST", o?.id, "OFFER_SUBMITTED")) === 0);

    // Brouillon puis soumission (code exigé)
    const draftCode = `OF-AUTO-D-${Date.now()}`;
    const draft = await api(T.ORANGE, "POST", "/api/admin/offer", newOfferBody(draftCode, ORANGE, { submit: false }));
    const d = draft.data?.id ? await prisma.offer.findUnique({ where: { id: draft.data.id } }) : null;
    if (d) createdOfferIds.push(d.id);
    check("brouillon enregistré sans code (DRAFT)", draft.status === 201 && d?.workflowStatus === "DRAFT", `${draft.status} ${d?.workflowStatus}`);
    const subNoTicket = await api(T.ORANGE, "POST", `/api/workflow/offers/${d?.id}/submit`, {});
    check("soumission du brouillon sans code → refus", subNoTicket.status === 403, `${subNoTicket.status}`);
    // Le code e-mail est demandé pour la référence réelle de l'offre (liste « Mes offres »).
    const t2 = await submissionTicketFor(T.ORANGE, d?.code, "[TEST AUTO] brouillon");
    const sub = await api(T.ORANGE, "POST", `/api/workflow/offers/${d?.id}/submit`, { submissionTicket: t2.ticket });
    check("soumission du brouillon avec code → SUBMITTED", sub.status === 200 && sub.data?.offer?.workflowStatus === "SUBMITTED", `${sub.status} ${JSON.stringify(sub.data)}`);
    const reuse = await api(T.ORANGE, "POST", `/api/workflow/offers/${d?.id}/submit`, { submissionTicket: t2.ticket });
    check("rejeu de la soumission → refus", reuse.status >= 400, `${reuse.status}`);
  }

  /* ------------------------------------------------------------------ 2 */
  section("Scénario 2   Point focal Orange sur une offre MTN");
  {
    const mtn = await seeded("SUBMITTED-PROMO");
    const upd = await api(T.ORANGE, "POST", "/api/admin/offer/updateOffer", { verskth: FKTND_H, offerId: mtn.id, title: "piratage" });
    check("modification → accès refusé (403 OPERATOR_SCOPE)", upd.status === 403 && upd.data?.code === "OPERATOR_SCOPE", `${upd.status} ${upd.data?.code}`);
    const formula = await api(T.ORANGE, "POST", "/api/admin/offer/saveFormula", { verskth: FKTND_H, offerId: mtn.id, formulas: [] });
    check("ajout de formule (appel direct) → refus", formula.status === 403, `${formula.status}`);
    const clear = await api(T.ORANGE, "POST", "/api/admin/offer/clearOfferDetails", { verskth: FKTND_H, offerId: mtn.id });
    check("purge du contenu (appel direct) → refus", clear.status === 403, `${clear.status}`);
    const view = await api(T.ORANGE, "GET", `/api/workflow/offers/${mtn.id}`);
    check("consultation de la fiche → refus", view.status === 403, `${view.status}`);
    const list = await api(T.ORANGE, "POST", "/api/admin/offer/getOffersWu", { verskth: FKTND_H, operatorId: MTN });
    check("liste demandée pour MTN → limitée à Orange", list.status === 200 && list.data.every((x) => x.operatorId === ORANGE || x.code === "OF-000000000000000"), `${list.status}`);
    const all = await api(T.ORANGE, "POST", "/api/admin/offer/getOffers", { verskth: FKTND_H });
    check("liste de tous les opérateurs → refus", all.status === 403, `${all.status}`);
    const after = await seeded("SUBMITTED-PROMO");
    check("offre MTN inchangée", after.title === mtn.title);
  }

  /* ------------------------------------------------------------------ 3 */
  section("Scénario 3   Modification avant toute décision");
  {
    const o = await seeded("SUBMITTED-BASE");
    const upd = await api(T.ORANGE, "POST", "/api/admin/offer/updateOffer", { verskth: FKTND_H, offerId: o.id, title: `${o.title} (modifiée)` });
    check("point focal modifie → succès (200)", upd.status === 200, `${upd.status} ${JSON.stringify(upd.data)}`);
    const after = await seeded("SUBMITTED-BASE");
    check("titre enregistré", after.title.endsWith("(modifiée)"));
    check("audit UPDATE écrit", (await prisma.auditLog.count({ where: { offerId: o.id, action: "UPDATE" } })) === 1);
  }

  /* ------------------------------------------------------------------ 4 */
  section("Scénario 4   Modification après validation");
  {
    const o = await seeded("VALIDATED-BASE");
    const upd = await api(T.ORANGE, "POST", "/api/admin/offer/updateOffer", { verskth: FKTND_H, offerId: o.id, title: "tentative" });
    check("point focal modifie une offre validée → refus (409 DECISION_EXISTS)", upd.status === 409 && upd.data?.code === "DECISION_EXISTS", `${upd.status} ${upd.data?.code}`);
    const inVal = await seeded("INVAL-BASE-L2");
    const upd2 = await api(T.MTN, "POST", "/api/admin/offer/updateOffer", { verskth: FKTND_H, offerId: inVal.id, title: "tentative" });
    check("offre en validation avec décision V1 → refus", upd2.status === 409, `${upd2.status}`);
    const admin = await api(T.ADMIN, "POST", "/api/admin/offer/updateOffer", { verskth: FKTND_H, offerId: o.id, title: "tentative" });
    check("même l'administrateur ne modifie pas une offre statuée (409)", admin.status === 409, `${admin.status}`);
    const acc = await api(T.ORANGE, "POST", "/api/admin/offer/saveAccessMode", { verskth: FKTND_H, offerId: o.id, accessModes: [{ content: "x" }] });
    check("ajout de mode d'accès (appel direct) → refus", acc.status === 409, `${acc.status}`);
    check("offre inchangée", (await seeded("VALIDATED-BASE")).title === o.title);
  }

  /* ------------------------------------------------------------------ 5 */
  section("Scénario 5   Validation sans commentaire");
  {
    const o = await seeded("SUBMITTED-BASE");
    const r = await decide(T.V1, o.id, "VALIDATE", "   ");
    check("V1 valide avec un commentaire vide → refus (400 COMMENT_REQUIRED)", r.status === 400 && r.data?.code === "COMMENT_REQUIRED", `${r.status} ${r.data?.code}`);
    const after = await seeded("SUBMITTED-BASE");
    check("aucun changement d'état ni décision", after.workflowStatus === "SUBMITTED" && after.decisions.length === 0);
  }

  /* ------------------------------------------------------------------ 6 */
  section("Scénario 6   Transmission V1 → V2");
  {
    const o = await seeded("SUBMITTED-BASE");
    const wrong = await decide(T.V2, o.id, "VALIDATE", "Je saute le niveau 1");
    check("V2 ne peut pas statuer au niveau 1 (403 WRONG_LEVEL)", wrong.status === 403 && wrong.data?.code === "WRONG_LEVEL", `${wrong.status} ${wrong.data?.code}`);
    const r = await decide(T.V1, o.id, "VALIDATE", "Dossier complet, transmis au chef de service.");
    check("V1 valide → succès", r.status === 200, `${r.status} ${JSON.stringify(r.data)}`);
    const after = await seeded("SUBMITTED-BASE");
    check("offre EN VALIDATION, en attente de V2", after.workflowStatus === "IN_VALIDATION" && after.currentValidationLevel === 2);
    check("décision V1 transmise, non finale", after.decisions.length === 1 && after.decisions[0].transmitted && !after.decisions[0].final);
    check("projection toujours PENDING (non validée)", after.validation?.status === "PENDING" && after.status === "PENDING");
    check("V2 notifié", (await notificationsOf("VALIDATEUR_2_TEST", o.id, "OFFER_TRANSMITTED")) === 1);
    check("V3 non notifié", (await notificationsOf("VALIDATEUR_3_TEST", o.id, "OFFER_TRANSMITTED")) === 0);
    check("pas de notification de validation au point focal", (await notificationsOf("POINT_FOCAL_ORANGE_TEST", o.id, "OFFER_VALIDATED")) === 0);
    const again = await decide(T.V1, o.id, "VALIDATE", "Deuxième fois");
    check("V1 ne peut plus statuer (niveau 2 attendu)", again.status === 403, `${again.status}`);
    const q2 = await api(T.V2, "GET", "/api/workflow/queue");
    check("file de V2 contient l'offre", q2.data?.items?.some((i) => i.id === o.id));
    const q1 = await api(T.V1, "GET", "/api/workflow/queue");
    check("file de V1 ne la contient plus", !q1.data?.items?.some((i) => i.id === o.id));
  }

  /* ------------------------------------------------------------------ 7 */
  section("Scénario 7   Offre de base : V1 → V2 → V3 → V4");
  {
    const o = await seeded("SUBMITTED-BASE");
    check("V2 valide → niveau 3", (await decide(T.V2, o.id, "VALIDATE", "Conforme au plan tarifaire.")).status === 200);
    const v3 = await decide(T.V3, o.id, "VALIDATE", "Validé par le département.");
    check("V3 valide → niveau 4 (pas final pour une offre de base)", v3.status === 200 && v3.data?.offer?.workflowStatus === "IN_VALIDATION" && v3.data?.offer?.currentValidationLevel === 4, JSON.stringify(v3.data?.offer));
    const noConfirm = await decide(T.V4, o.id, "VALIDATE", "Accord du directeur.");
    check("V4 sans confirmation explicite → refus (409 CONFIRMATION_REQUIRED)", noConfirm.status === 409 && noConfirm.data?.code === "CONFIRMATION_REQUIRED", `${noConfirm.status} ${noConfirm.data?.code}`);
    const fin = await decide(T.V4, o.id, "VALIDATE", "Accord du directeur.", true);
    check("V4 confirme → offre VALIDÉE", fin.status === 200 && fin.data?.offer?.workflowStatus === "VALIDATED", `${fin.status}`);
    const after = await seeded("SUBMITTED-BASE");
    check("4 décisions, la dernière finale", after.decisions.length === 4 && after.decisions.some((d) => d.level === 4 && d.final));
    check("projection ALLOW / DONE", after.validation?.status === "ALLOW" && after.status === "DONE");
    check("point focal Orange notifié de la validation", (await notificationsOf("POINT_FOCAL_ORANGE_TEST", o.id, "OFFER_VALIDATED")) === 1);
    check("administrateur notifié", (await notificationsOf("ADMIN_TEST", o.id, "OFFER_VALIDATED")) === 1);
    check("e-mail au point focal (à blanc)", fin.data?.notifications?.some((n) => n.type === "VALIDATED_FINAL" && n.emails >= 1), JSON.stringify(fin.data?.notifications));
    for (const who of ["V1", "V2", "SUP"]) {
      const c = await circuitSeenBy(T[who], o.id);
      check(`circuit vu par ${who} après validation finale : rien « en attente » ni « à venir »`, noPending(c.states) && c.closed === true, JSON.stringify(c.states));
    }
  }

  /* ------------------------------------------------------------------ 8 */
  section("Scénario 8   Promotion : V1 → V2 → V3 (final)");
  {
    const o = await seeded("SUBMITTED-PROMO");
    check("V1 valide", (await decide(T.V1, o.id, "VALIDATE", "RAS")).status === 200);
    check("V2 valide", (await decide(T.V2, o.id, "VALIDATE", "RAS")).status === 200);
    const v3 = await decide(T.V3, o.id, "VALIDATE", "Promotion conforme.");
    check("V3 = dernier niveau : confirmation exigée", v3.status === 409 && v3.data?.code === "CONFIRMATION_REQUIRED", `${v3.status}`);
    const fin = await decide(T.V3, o.id, "VALIDATE", "Promotion conforme.", true);
    check("V3 confirme → promotion VALIDÉE", fin.status === 200 && fin.data?.offer?.workflowStatus === "VALIDATED");
    const after = await seeded("SUBMITTED-PROMO");
    check("aucune décision de niveau 4 (V4 non obligatoire)", !after.decisions.some((d) => d.level === 4) && after.decisions.length === 3);
    const v4 = await decide(T.V4, o.id, "VALIDATE", "trop tard", true);
    check("V4 ne peut plus statuer", v4.status === 409, `${v4.status}`);
    check("point focal MTN notifié", (await notificationsOf("POINT_FOCAL_MTN_TEST", o.id, "OFFER_VALIDATED")) === 1);
  }

  /* ------------------------------------------------------------------ 9 */
  section("Scénario 8 bis : Promotion, validation définitive sans transmission");
  {
    const mkPromo = async (suffix) => {
      const r = await api(T.ADMIN, "POST", "/api/admin/offer", newOfferBody(`OF-AUTO-P${suffix}-${Date.now()}`, ORANGE, { offerType: 1, promoType: "FLASH", duration: 7 }));
      if (r.data?.id) {
        createdOfferIds.push(r.data.id);
        // Une formule : le comparateur affiche les offres par leurs formules.
        await api(T.ADMIN, "POST", "/api/admin/offer/saveFormula", { verskth: FKTND_H, offerId: r.data.id, formulas: [{ type: "price", title: "Promo 7j", settlement: { price: "300", validity: "7", services: { DATA: true, quantityDATA: "500" } } }] });
      }
      return r.data?.id ? await prisma.offer.findUnique({ where: { id: r.data.id }, include: { specialPromotion: true } }) : null;
    };
    const p1 = await mkPromo("1");
    check("promotion créée et soumise (niveau 1)", p1?.specialPromotion && p1.workflowStatus === "SUBMITTED" && p1.currentValidationLevel === 1, JSON.stringify(p1));
    const st = await api(T.V1, "GET", `/api/workflow/offers/${p1.id}`);
    check("V1 : deux choix proposés (transmettre / valider définitivement)", st.data?.actions?.includes("VALIDATE_TRANSMIT") && st.data?.actions?.includes("VALIDATE_FINAL"), JSON.stringify(st.data?.actions));
    const noConfirm = await decide(T.V1, p1.id, "VALIDATE", "Conforme", false);
    // sans mode explicite : transmission (comportement par défaut)   on vérifie plutôt le mode FINAL sans confirmation
    const p1b = await mkPromo("1b");
    const nc = await api(T.V1, "POST", `/api/workflow/offers/${p1b.id}/decide`, { decision: "VALIDATE", comment: "Conforme", validation: "FINAL" });
    check("V1 « valider sans transmettre » sans confirmation → refus (409)", nc.status === 409 && nc.data?.code === "CONFIRMATION_REQUIRED", `${nc.status} ${nc.data?.code}`);
    const fin = await api(T.V1, "POST", `/api/workflow/offers/${p1b.id}/decide`, { decision: "VALIDATE", comment: "Promotion conforme, validation directe.", validation: "FINAL", confirmFinal: true });
    check("V1 valide définitivement sans transmettre → VALIDÉE", fin.status === 200 && fin.data?.offer?.workflowStatus === "VALIDATED", `${fin.status} ${JSON.stringify(fin.data)}`);
    const after = await prisma.offer.findUnique({ where: { id: p1b.id }, include: { decisions: true, validation: true } });
    check("une seule décision (V1, finale, non transmise)", after.decisions.length === 1 && after.decisions[0].final && !after.decisions[0].transmitted && after.decisions[0].level === 1);
    check("statut mis à jour (ALLOW / DONE)", after.validation?.status === "ALLOW" && after.status === "DONE");
    check("point focal Orange notifié de la validation", (await notificationsOf("POINT_FOCAL_ORANGE_TEST", p1b.id, "OFFER_VALIDATED")) === 1);
    check("V2 non sollicité (aucune notification de transmission)", (await notificationsOf("VALIDATEUR_2_TEST", p1b.id, "OFFER_TRANSMITTED")) === 0);
    check("audit : validation sans transmission, niveaux 2 et 3 non requis", (await prisma.auditLog.findFirst({ where: { offerId: p1b.id, action: "VALIDATE_FINAL" } }))?.metadata?.withoutTransmission === true);
    const wfState = await api(T.ADMIN, "GET", `/api/workflow/offers/${p1b.id}`);
    const seenV3 = await circuitSeenBy(T.V3, p1b.id);
    check("promotion validée par V1, circuit vu par V3 : clôturé, rien en attente", noPending(seenV3.states) && seenV3.closed && seenV3.closure?.decision?.level === 1 && !!seenV3.closure?.decision?.user?.email, JSON.stringify(seenV3));
    check("frise : V2 et V3 « non requis »", JSON.stringify(wfState.data?.levels?.map((l) => l.state)) === JSON.stringify(["VALIDATED", "NOT_REQUIRED", "NOT_REQUIRED"]), JSON.stringify(wfState.data?.levels?.map((l) => l.state)));
    check("publiée sur le comparateur", (await comparatorOfferIds()).has(p1b.id));

    // p1 : V1 a transmis (appel sans mode) → statut en attente du N+1, puis V2 valide définitivement
    check("V1 transmet → offre en attente de V2, statut non validé", noConfirm.status === 200 && noConfirm.data?.offer?.workflowStatus === "IN_VALIDATION" && noConfirm.data?.offer?.currentValidationLevel === 2);
    check("… non publiée tant que V2 n'a pas répondu", !(await comparatorOfferIds()).has(p1.id));
    const st2 = await api(T.V2, "GET", `/api/workflow/offers/${p1.id}`);
    check("V2 : peut transmettre à V3 ou valider définitivement", st2.data?.actions?.includes("VALIDATE_TRANSMIT") && st2.data?.actions?.includes("VALIDATE_FINAL"));
    const v2fin = await api(T.V2, "POST", `/api/workflow/offers/${p1.id}/decide`, { decision: "VALIDATE", comment: "Validation définitive par le chef de service.", validation: "FINAL", confirmFinal: true });
    check("V2 valide définitivement → VALIDÉE, publiée", v2fin.status === 200 && v2fin.data?.offer?.workflowStatus === "VALIDATED" && (await comparatorOfferIds()).has(p1.id));
    check("V1 (a transmis) notifié de la validation finale", (await notificationsOf("VALIDATEUR_1_TEST", p1.id, "OFFER_VALIDATED")) === 1);

    // Promotion transmise jusqu'à V3 : dernier niveau, plus de transmission possible
    const p3 = await mkPromo("3");
    await api(T.V1, "POST", `/api/workflow/offers/${p3.id}/decide`, { decision: "VALIDATE", comment: "ok", validation: "TRANSMIT" });
    await api(T.V2, "POST", `/api/workflow/offers/${p3.id}/decide`, { decision: "VALIDATE", comment: "ok", validation: "TRANSMIT" });
    const tr3 = await api(T.V3, "POST", `/api/workflow/offers/${p3.id}/decide`, { decision: "VALIDATE", comment: "vers V4 ?", validation: "TRANSMIT" });
    check("V3 ne peut pas transmettre une promotion (409 FINAL_LEVEL)", tr3.status === 409 && tr3.data?.code === "FINAL_LEVEL", `${tr3.status} ${tr3.data?.code}`);

    // Offre de base : la validation sans transmission reste interdite avant V4
    const base = await seeded("MONITORED-V1-V2");
    const stB = await api(T.V1, "GET", `/api/workflow/offers/${base.id}`);
    check("offre de base : V1 n'a que « transmettre »", stB.data?.actions?.includes("VALIDATE_TRANSMIT") && !stB.data?.actions?.includes("VALIDATE_FINAL"), JSON.stringify(stB.data?.actions));
    const baseFinal = await api(T.V1, "POST", `/api/workflow/offers/${base.id}/decide`, { decision: "VALIDATE", comment: "tentative", validation: "FINAL", confirmFinal: true });
    check("offre de base : validation définitive par V1 → refus (409 TRANSMISSION_REQUIRED)", baseFinal.status === 409 && baseFinal.data?.code === "TRANSMISSION_REQUIRED", `${baseFinal.status} ${baseFinal.data?.code}`);
    check("offre de base inchangée", (await seeded("MONITORED-V1-V2")).workflowStatus === "SUBMITTED");
    const badMode = await api(T.V1, "POST", `/api/workflow/offers/${base.id}/decide`, { decision: "VALIDATE", comment: "x", validation: "AUTO" });
    check("mode de validation inconnu → 400", badMode.status === 400);
  }

  section("Scénario 9   Refus par V2");
  {
    const o = await seeded("INVAL-BASE-L2");
    const empty = await decide(T.V2, o.id, "REFUSE", "");
    check("refus sans commentaire → refus de l'opération (400)", empty.status === 400 && empty.data?.code === "COMMENT_REQUIRED");
    const r = await decide(T.V2, o.id, "REFUSE", "Tarif hors plafond réglementaire.");
    check("refus avec commentaire → offre REFUSÉE", r.status === 200 && r.data?.offer?.workflowStatus === "REFUSED", `${r.status}`);
    const after = await seeded("INVAL-BASE-L2");
    check("projection DINIED", after.validation?.status === "DINIED");
    check("point focal MTN notifié (plateforme)", (await notificationsOf("POINT_FOCAL_MTN_TEST", o.id, "OFFER_REFUSED")) === 1);
    check("e-mail au point focal (à blanc)", r.data?.notifications?.some((n) => n.type === "REFUSED" && n.emails >= 1), JSON.stringify(r.data?.notifications));
    check("administration notifiée", (await notificationsOf("ADMIN_TEST", o.id, "OFFER_REFUSED")) === 1 && (await notificationsOf("SUPER_ADMIN_TEST", o.id, "OFFER_REFUSED")) === 1);
    check("V1 (a statué) notifié", (await notificationsOf("VALIDATEUR_1_TEST", o.id, "OFFER_REFUSED")) === 1);
    const v3 = await decide(T.V3, o.id, "VALIDATE", "après refus", true);
    check("plus aucune décision possible", v3.status === 409);
    const seenRef = await circuitSeenBy(T.V3, o.id);
    check("circuit d'une offre refusée vu par V3 : niveaux suivants « non atteints »", JSON.stringify(seenRef.states) === JSON.stringify(["VALIDATED", "REFUSED", "SKIPPED", "SKIPPED"]) && seenRef.closure?.status === "REFUSED", JSON.stringify(seenRef));
  }

  /* ----------------------------------------------------------------- 10 */
  section("Scénario 10   Monitoring d'une offre validée");
  {
    const o = await seeded("VALIDATED-BASE");
    const other = await api(T.MTN, "POST", `/api/workflow/offers/${o.id}/monitor`, { comment: "x" });
    check("point focal d'un autre opérateur → refus", other.status === 403, `${other.status}`);
    const notValidated = await api(T.ORANGE, "POST", `/api/workflow/offers/${(await seeded("DRAFT-BASE")).id}/monitor`, {});
    check("monitoring d'une offre non validée → refus", notValidated.status === 409, `${notValidated.status}`);
    const r = await api(T.ORANGE, "POST", `/api/workflow/offers/${o.id}/monitor`, { comment: "Baisse de tarif" });
    check("monitoring → succès", r.status === 200 && r.data?.offer?.id, `${r.status} ${JSON.stringify(r.data)}`);
    const v2 = r.data?.offer;
    if (v2?.id) createdOfferIds.push(v2.id);
    const oldAfter = await seeded("VALIDATED-BASE");
    check("ancienne offre conservée et DÉSACTIVÉE (motif MONITORING)", oldAfter?.workflowStatus === "DEACTIVATED" && oldAfter.deactivationReason === "MONITORING");
    check("ancienne offre garde ses 4 décisions", oldAfter.decisions.length === 4);
    const fresh = await prisma.offer.findUnique({ where: { id: v2.id }, include: { formulas: { include: { price: true } }, accessModes: true } });
    check("nouvelle offre : nouvel id, version 2, source = ancienne", fresh.id !== o.id && fresh.version === 2 && fresh.sourceOfferId === o.id);
    check("nouvelle offre SOUMISE au niveau 1", fresh.workflowStatus === "SUBMITTED" && fresh.currentValidationLevel === 1);
    check("contenu copié (formule + prix + mode d'accès)", fresh.formulas.length >= 1 && fresh.formulas[0].price && fresh.accessModes.length >= 1);
    const state = await api(T.ORANGE, "GET", `/api/workflow/offers/${v2.id}`);
    check("lignée visible (V1 → V2)", state.data?.versions?.map((v) => v.id).join(",") === `${o.id},${v2.id}`, JSON.stringify(state.data?.versions));
    check("nouvelle version modifiable par le point focal", state.data?.actions?.includes("EDIT"));
    check("V1 notifié du monitoring", (await notificationsOf("VALIDATEUR_1_TEST", v2.id, "OFFER_MONITORING")) === 1);

    // Comparateur : l'offre validée ne disparaît pas pendant le monitoring.
    let cmp = await comparatorOfferIds();
    check("comparateur : l'ancienne version validée reste affichée", cmp.has(o.id));
    check("comparateur : la nouvelle version (non validée) n'est pas affichée", !cmp.has(v2.id));
    const oldState = await api(T.ADMIN, "GET", `/api/workflow/offers/${o.id}`);
    check("fiche : ancienne version signalée « publiée »", oldState.data?.published === true);
    for (const [key, comment] of [["V1", "ok"], ["V2", "ok"], ["V3", "ok"], ["V4", "ok"]]) {
      await decide(T[key], v2.id, "VALIDATE", comment, key === "V4");
    }
    cmp = await comparatorOfferIds();
    check("après validation définitive de la nouvelle version : elle est affichée", cmp.has(v2.id));
    check("… et l'ancienne version n'est plus affichée", !cmp.has(o.id));
  }

  /* ----------------------------------------------------------------- 11 */
  section("Scénario 11   Suppression après décision");
  {
    const o = await seeded("VALIDATED-PROMO");
    const del = await api(T.ADMIN, "DELETE", `/api/workflow/offers/${o.id}`);
    check("administrateur supprime une offre statuée → REFUS (409 DECISION_EXISTS)", del.status === 409 && del.data?.code === "DECISION_EXISTS", `${del.status} ${del.data?.code}`);
    const fpDel = await api(T.MTN, "DELETE", `/api/workflow/offers/${o.id}`);
    check("point focal → refus (403)", fpDel.status === 403, `${fpDel.status}`);
    const noReason = await api(T.ADMIN, "POST", `/api/workflow/offers/${o.id}/deactivate`, { comment: "" });
    check("désactivation sans motif → refus (400)", noReason.status === 400);
    const deact = await api(T.ADMIN, "POST", `/api/workflow/offers/${o.id}/deactivate`, { comment: "Fin de la promotion." });
    check("désactivation → succès", deact.status === 200 && deact.data?.offer?.workflowStatus === "DEACTIVATED", `${deact.status}`);
    const after = await seeded("VALIDATED-PROMO");
    check("offre et décisions conservées", after && after.decisions.length === 3);
    const draft = await seeded("DRAFT-BASE");
    const delDraft = await api(T.ADMIN, "DELETE", `/api/workflow/offers/${draft.id}`);
    check("brouillon sans décision → suppression autorisée", delDraft.status === 200, `${delDraft.status} ${JSON.stringify(delDraft.data)}`);
    check("trace DELETE conservée après suppression", (await prisma.auditLog.count({ where: { action: "DELETE", entityId: draft.id } })) === 1);
    const legacy = await api(T.ADMIN, "POST", "/api/admin/validation", { verskth: FKTND_H, offerId: o.id, status: "ALLOW" });
    check("ancienne route de validation directe → 410", legacy.status === 410, `${legacy.status}`);
  }

  /* ----------------------------------------------------------------- 12 */
  section("Scénario 12   Superviseur : lecture, export, impression uniquement");
  {
    const o = await seeded("INVAL-BASE-L4");
    const view = await api(T.SUP, "GET", `/api/workflow/offers/${o.id}`);
    check("consultation de la fiche ✓", view.status === 200);
    check("actions proposées : VIEW et HISTORY seulement", JSON.stringify(view.data?.actions) === JSON.stringify(["VIEW", "HISTORY"]), JSON.stringify(view.data?.actions));
    check("liste des offres (export / impression côté écran) ✓", (await api(T.SUP, "POST", "/api/admin/offer/getOffers", { verskth: FKTND_H })).status === 200);
    check("statistiques ✓", (await api(T.SUP, "POST", "/api/admin/statistics/generalStatisticsDetailed", { verskth: FKTND_H })).status === 200);
    check("file de validation (lecture) ✓", (await api(T.SUP, "GET", "/api/workflow/queue")).status === 200);
    const code = `OF-AUTO-SUP-${Date.now()}`;
    check("création ✗", (await api(T.SUP, "POST", "/api/admin/offer", newOfferBody(code, ORANGE))).status === 403);
    check("modification ✗", (await api(T.SUP, "POST", "/api/admin/offer/updateOffer", { verskth: FKTND_H, offerId: o.id, title: "x" })).status === 403);
    check("validation ✗", (await decide(T.SUP, o.id, "VALIDATE", "x", true)).status === 403);
    check("refus ✗", (await decide(T.SUP, o.id, "REFUSE", "x")).status === 403);
    check("monitoring ✗", (await api(T.SUP, "POST", `/api/workflow/offers/${(await seeded("VALIDATED-PROMO")).id}/monitor`, {})).status === 403);
    check("désactivation ✗", (await api(T.SUP, "POST", `/api/workflow/offers/${o.id}/deactivate`, { comment: "x" })).status === 403);
    check("suppression ✗", (await api(T.SUP, "DELETE", `/api/workflow/offers/${o.id}`)).status === 403);
    check("gestion des utilisateurs ✗", (await api(T.SUP, "POST", "/api/admin/user/getUsers", { verskth: FKTND_H })).status === 403);
    check("offre inchangée", (await seeded("INVAL-BASE-L4")).currentValidationLevel === 4);
  }

  /* ----------------------------------------------------------------- 13 */
  section("Scénario 13   Administrateur");
  {
    const profiles = Object.fromEntries((await prisma.profile.findMany()).map((p) => [p.code, p.id]));
    const userBody = (profileCode, suffix) => ({
      verskth: FKTND_H,
      code: `USR-AUTO-${suffix}-${Date.now()}`,
      firstName: "Auto",
      lastName: suffix,
      email: `auto.${suffix.toLowerCase()}.${Date.now()}@compartic.test`,
      profileId: profiles[profileCode],
      status: "ENABLE",
    });
    check("gestion des utilisateurs ✓", (await api(T.ADMIN, "POST", "/api/admin/user/getUsers", { verskth: FKTND_H })).status === 200);
    check("gestion des notifications ✓", (await api(T.ADMIN, "POST", "/api/admin/notifications", { verskth: FKTND_H, action: "list" })).status !== 403);
    const val = await api(T.ADMIN, "POST", "/api/admin/user", userBody("PRF-VAL1", "VAL"));
    check("création d'un validateur ✓", val.status === 201, `${val.status} ${JSON.stringify(val.data)}`);
    if (val.data?.id) createdUserIds.push(val.data.id);
    const adm = await api(T.ADMIN, "POST", "/api/admin/user", userBody("PRF0-TEST", "ADM"));
    check("création d'un administrateur ✗ (403)", adm.status === 403, `${adm.status}`);
    const sa = await api(T.ADMIN, "POST", "/api/admin/user", userBody("PRF-SUPERADMIN", "SA"));
    check("création d'un super administrateur ✗ (403)", sa.status === 403, `${sa.status}`);
    const saUser = await prisma.user.findUnique({ where: { code: "SUPER_ADMIN_TEST" } });
    const promote = await api(T.ADMIN, "PUT", `/api/admin/user/${val.data?.id}`, { ...userBody("PRF0-TEST", "VAL"), email: val.data?.email });
    check("promotion d'un compte en administrateur ✗ (403)", promote.status === 403, `${promote.status}`);
    const editSa = await api(T.ADMIN, "PUT", `/api/admin/user/${saUser.id}`, { ...userBody("PRF-SUPERADMIN", "X"), email: saUser.email });
    check("modification du super administrateur ✗ (403)", editSa.status === 403, `${editSa.status}`);
    const o = await seeded("INVAL-BASE-L4");
    const fin = await decide(T.ADMIN, o.id, "VALIDATE", "Validation par l'administration.", true);
    check("validation ✓ (au niveau attendu, avec confirmation)", fin.status === 200 && fin.data?.offer?.workflowStatus === "VALIDATED", `${fin.status}`);
    const decisionRow = (await seeded("INVAL-BASE-L4")).decisions.find((d) => d.level === 4);
    check("décision tracée avec le rôle ADMIN", decisionRow?.userRole === "ADMIN");
    check("gestion des offres : liste ✓", (await api(T.ADMIN, "POST", "/api/admin/offer/getOffers", { verskth: FKTND_H })).status === 200);
    check("gestion des opérateurs ✓ (écriture autorisée   contrôle sans écrire : 400 champs manquants)", (await api(T.ADMIN, "POST", "/api/admin/operator", { verskth: FKTND_H })).status === 400);
  }

  /* ----------------------------------------------------------------- 14 */
  section("Scénario 14   Super administrateur");
  {
    const profiles = Object.fromEntries((await prisma.profile.findMany()).map((p) => [p.code, p.id]));
    const body = (profileCode, suffix) => ({
      verskth: FKTND_H,
      code: `USR-AUTO-${suffix}-${Date.now()}`,
      firstName: "Auto",
      lastName: suffix,
      email: `auto.${suffix.toLowerCase()}.${Date.now()}@compartic.test`,
      profileId: profiles[profileCode],
      status: "ENABLE",
    });
    const adm = await api(T.SA, "POST", "/api/admin/user", body("PRF0-TEST", "ADM"));
    check("création d'un administrateur ✓", adm.status === 201, `${adm.status} ${JSON.stringify(adm.data)}`);
    if (adm.data?.id) createdUserIds.push(adm.data.id);
    const sa = await api(T.SA, "POST", "/api/admin/user", body("PRF-SUPERADMIN", "SA"));
    check("création d'un super administrateur ✓", sa.status === 201, `${sa.status}`);
    if (sa.data?.id) createdUserIds.push(sa.data.id);
    check("utilisateurs ✓", (await api(T.SA, "POST", "/api/admin/user/getUsers", { verskth: FKTND_H })).status === 200);
    check("statistiques ✓", (await api(T.SA, "POST", "/api/admin/statistics/generalStatisticsDetailed", { verskth: FKTND_H })).status === 200);
    check("offres ✓", (await api(T.SA, "POST", "/api/admin/offer/getOffers", { verskth: FKTND_H })).status === 200);
    check("profils ✓", (await api(T.SA, "POST", "/api/admin/profile/getProfile", { verskth: FKTND_H })).status === 200);
    const promo = await seeded("INVAL-PROMO-L3");
    const fin = await decide(T.SA, promo.id, "VALIDATE", "Validation par le super administrateur.", true);
    check("validation ✓", fin.status === 200 && fin.data?.offer?.workflowStatus === "VALIDATED", `${fin.status}`);
    const mon = await api(T.SA, "POST", `/api/workflow/offers/${promo.id}/monitor`, { comment: "Révision" });
    check("monitoring ✓", mon.status === 200, `${mon.status}`);
    if (mon.data?.offer?.id) createdOfferIds.push(mon.data.offer.id);
    const deact = await api(T.SA, "POST", `/api/workflow/offers/${mon.data?.offer?.id}/deactivate`, { comment: "Test" });
    check("désactivation ✓", deact.status === 200, `${deact.status}`);
    const cmpAfter = await comparatorOfferIds();
    check("nouvelle version désactivée sans validation : l'offre validée reste au comparateur", cmpAfter.has(promo.id) && !cmpAfter.has(mon.data?.offer?.id));
    const del = await api(T.SA, "DELETE", `/api/workflow/offers/${(await seeded("REFUSED-BASE")).id}`);
    check("mais suppression d'une offre statuée toujours interdite (règle métier)", del.status === 409);
  }

  /* ------------------------------------------------------------ transverses */
  section("Comparateur public   offres validées définitivement");
  {
    const cmp = await comparatorOfferIds();
    const states = await prisma.offer.findMany({ where: { id: { in: [...cmp] } }, select: { id: true, workflowStatus: true, deactivationReason: true } });
    check("aucune offre en brouillon, soumise, en validation ou refusée", states.every((x) => x.workflowStatus === "VALIDATED" || (x.workflowStatus === "DEACTIVATED" && x.deactivationReason === "MONITORING")), JSON.stringify(states.filter((x) => x.workflowStatus !== "VALIDATED")));
    const validated = await prisma.offer.findMany({ where: { workflowStatus: "VALIDATED", code: { not: "OF-000000000000000" }, formulas: { some: {} } }, select: { id: true } });
    check("toutes les offres validées (avec formules) sont affichées", validated.every((x) => cmp.has(x.id)), JSON.stringify(validated.filter((x) => !cmp.has(x.id))));
    const v1 = await seeded("MONITORED-V1");
    check("version remplacée dont la nouvelle est en cours : affichée", cmp.has(v1.id));
    const sup = await api(T.SUP, "POST", `/api/workflow/offers/${v1.id}/deactivate`, { comment: "x" });
    check("superviseur ne peut pas la retirer", sup.status === 403);
    const withdraw = await api(T.ADMIN, "POST", `/api/workflow/offers/${v1.id}/deactivate`, { comment: "Retrait du comparateur en attendant la nouvelle version." });
    check("administration peut la retirer du comparateur", withdraw.status === 200, `${withdraw.status} ${JSON.stringify(withdraw.data)}`);
    const after = await comparatorOfferIds();
    check("retirée → n'est plus affichée", !after.has(v1.id));
    check("motif passé à MANUAL, décisions conservées", (await seeded("MONITORED-V1")).deactivationReason === "MANUAL" && (await seeded("MONITORED-V1")).decisions.length === 4);
    const cmpList = await api(null, "POST", "/api/client/offer/getClientFormulas", { verskth: FKTND_H });
    check("comparateur accessible sans session", cmpList.status === 200);
  }

  section("Contrôles transverses");
  {
    const o = await seeded("SUBMITTED-BASE");
    check("sans session → 401", (await api(null, "GET", `/api/workflow/offers/${o.id}`)).status === 401);
    const client = await api(null, "POST", "/api/auth/login", { email: "testu@artci.ci", password: "Cedricaz@01", verskth: FKTND_H });
    if (client.status === 200) {
      check("compte client → 403 sur le workflow", (await api(client.data.token, "GET", `/api/workflow/offers/${o.id}`)).status === 403);
    }
    const forged = await api(T.ORANGE, "POST", "/api/admin/user", { verskth: FKTND_H, code: "X", email: "x@x.test", firstName: "x", profileId: 1, status: "ENABLE" });
    check("point focal → création de compte refusée", forged.status === 403);
    const mail = await api(T.MTN, "POST", "/api/admin/mail/test", { verskth: FKTND_H, to: "someone@example.com" });
    check("envoi d'e-mail de test réservé à l'administration", mail.status === 403);
    const audits = await prisma.auditLog.count({ where: { offerId: o.id } });
    check("journal d'audit alimenté", audits >= 8, `${audits}`);
  }
}

async function cleanup() {
  // Offres créées par les tests (dont nouvelles versions de monitoring), puis
  // offres du seed modifiées : suppression complète et recréation par le seeder.
  const seededCodes = (await prisma.offer.findMany({ where: { code: { startsWith: "OF-WFTEST-" } }, select: { id: true } })).map((o) => o.id);
  const auto = (await prisma.offer.findMany({ where: { OR: [{ code: { startsWith: "OF-AUTO-" } }, { title: { startsWith: "[TEST AUTO]" } }, { title: { startsWith: "[TEST CMP]" } }, { sourceOfferId: { in: seededCodes } }] }, select: { id: true } })).map((o) => o.id);
  const ids = [...new Set([...createdOfferIds, ...auto, ...seededCodes])];
  // Les versions d'abord (clé sourceOfferId), puis les originaux.
  const offers = await prisma.offer.findMany({ where: { id: { in: ids } }, select: { id: true, sourceOfferId: true, areaId: true } });
  offers.sort((a, b) => (b.sourceOfferId ? 1 : 0) - (a.sourceOfferId ? 1 : 0) || b.id - a.id);
  for (const o of offers) {
    await prisma.$transaction(async (tx) => {
      const formulas = (await tx.offerFormula.findMany({ where: { offerId: o.id }, select: { id: true } })).map((f) => f.id);
      const details = (await tx.offerServiceDetail.findMany({ where: { formulaId: { in: formulas } }, select: { id: true } })).map((d) => d.id);
      await tx.offerRate.deleteMany({ where: { serviceDetailId: { in: details } } });
      await tx.offerServiceDetail.deleteMany({ where: { formulaId: { in: formulas } } });
      await tx.offerPrice.deleteMany({ where: { formulaId: { in: formulas } } });
      await tx.formulaAdvantage.deleteMany({ where: { formulaId: { in: formulas } } });
      await tx.offerControl.deleteMany({ where: { OR: [{ formulaId: { in: formulas } }, { offerId: o.id }] } });
      await tx.offerFormula.updateMany({ where: { offerId: o.id }, data: { parentId: null } });
      await tx.offerFormula.deleteMany({ where: { offerId: o.id } });
      await tx.accessMode.deleteMany({ where: { offerId: o.id } });
      await tx.specialPromotion.deleteMany({ where: { offerId: o.id } });
      const v = await tx.validation.findUnique({ where: { offerId: o.id } });
      if (v) {
        await tx.comment.deleteMany({ where: { validationId: v.id } });
        await tx.validation.delete({ where: { id: v.id } });
      }
      await tx.validationDecision.deleteMany({ where: { offerId: o.id } });
      await tx.auditLog.deleteMany({ where: { offerId: o.id } });
      await tx.notification.deleteMany({ where: { offerId: o.id } });
      await tx.submissionCode.updateMany({ where: { offerId: o.id }, data: { offerId: null } }).catch(() => undefined);
      await tx.offer.updateMany({ where: { sourceOfferId: o.id }, data: { sourceOfferId: null } });
      await tx.offer.delete({ where: { id: o.id } });
      if (o.areaId) {
        const used = await tx.offer.count({ where: { areaId: o.areaId } });
        if (!used) await tx.area.delete({ where: { id: o.areaId } }).catch(() => undefined);
      }
    });
  }
  // Traces orphelines des tests (offre supprimée pendant le scénario 11, notifications).
  await prisma.auditLog.deleteMany({ where: { offerId: null, entityType: "OFFER", action: { in: ["DELETE", "NOTIFY"] }, actor: { code: { endsWith: "_TEST" } } } });
  await prisma.notification.deleteMany({ where: { offerId: null, to: { some: { code: { endsWith: "_TEST" } } }, type: { startsWith: "OFFER_" } } });
  for (const id of createdUserIds) {
    await prisma.auditLog.deleteMany({ where: { entityType: "USER", entityId: id } });
    await prisma.notification.deleteMany({ where: { to: { some: { id } } } });
    await prisma.focalPoint.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } }).catch(() => undefined);
  }
  await prisma.submissionCode.deleteMany({ where: { reference: { startsWith: "OF-AUTO-" } } }).catch(() => undefined);
  execFileSync("node", ["--env-file=.env", "prisma/seeders/workflowSeeder.js"], { stdio: "ignore" });
}

main()
  .catch((e) => {
    console.error("\nERREUR D'EXÉCUTION :", e);
    results.push({ scenario: "exécution", label: e.message, ok: false });
  })
  .finally(async () => {
    try {
      if (process.env.WF_KEEP !== "1") await cleanup();
    } catch (e) {
      console.error("Nettoyage incomplet :", e.message);
    }
    const failed = results.filter((r) => !r.ok);
    console.log(`\n${results.length - failed.length}/${results.length} contrôles réussis.`);
    if (failed.length) {
      console.log("Échecs :");
      failed.forEach((f) => console.log(` - [${f.scenario}] ${f.label} ${f.detail || ""}`));
    }
    await prisma.$disconnect();
    process.exit(failed.length ? 1 : 0);
  });
