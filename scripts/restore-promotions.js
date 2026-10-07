/* eslint-disable no-console */
/**
 * Remise en état des offres promotionnelles enregistrées comme offres de base.
 *
 * POURQUOI CET OUTIL
 * ------------------
 * Jusqu'au correctif, les routes d'enregistrement ne créaient la ligne
 * `SpecialPromotion` (resp. `MonitoringPromotion`) que pour le type SPECIAL, et
 * la durée n'était même pas transmise. Les offres promotionnelles déclarées
 * dans cet intervalle existent donc SANS promotion : la base ne les distingue
 * plus d'une offre de base.
 *
 * AUCUNE REPRISE AUTOMATIQUE N'EST POSSIBLE. Le type et la durée saisis par le
 * déclarant n'ont été enregistrés nulle part   ni colonne, ni journal. Les
 * deviner reviendrait à inventer des données réglementaires. Cet outil se
 * limite donc à :
 *
 *   1. dresser l'inventaire de ce qui est en base, avec les éléments qui
 *      aident à trancher (rattachement, auteur, date, opérateur) ;
 *   2. appliquer les promotions que VOUS désignez, explicitement.
 *
 * UTILISATION
 * -----------
 *   node --env-file=.env scripts/restore-promotions.js
 *       Inventaire complet. N'écrit rien.
 *
 *   node --env-file=.env scripts/restore-promotions.js --set offer:16=SPECIAL:20
 *       Simulation : affiche ce qui serait fait, sans rien écrire.
 *
 *   node --env-file=.env scripts/restore-promotions.js --set offer:16=SPECIAL:20 --apply
 *       Applique.
 *
 *   Plusieurs cibles à la fois, offres et monitorings :
 *   --set offer:16=SPECIAL:20 offer:18=FLASH:7 monitoring:3=PERIOD:30 --apply
 *
 *   --force  autorise le remplacement d'une promotion déjà enregistrée.
 *
 * Sur le serveur, exécuter depuis le répertoire de l'application, la variable
 * DATABASE_URL devant pointer vers la base concernée.
 */

const fs = require("fs");
const path = require("path");

// `node --env-file` n'existe pas partout : repli sur une lecture minimale du
// .env, pour que l'outil fonctionne aussi avec un `node` plus ancien.
if (!process.env.DATABASE_URL) {
  const envPath = path.join(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  }
}

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const PROMO_TYPES = ["FLASH", "PERIOD", "SPECIAL", "CUSTOMIZE"];
const LABELS = {
  FLASH: "FLASH",
  PERIOD: "PERIODIQUE",
  SPECIAL: "SPECIALE",
  CUSTOMIZE: "PERSONALISEE",
};

/* ------------------------------------------------------------------ */
/* Lecture des arguments                                              */
/* ------------------------------------------------------------------ */

const argv = process.argv.slice(2);
const apply = argv.includes("--apply");
const force = argv.includes("--force");

/** `offer:16=SPECIAL:20` -> { kind, id, type, duration } */
const parseTarget = (raw) => {
  const m = String(raw).match(
    /^(offer|monitoring):(\d+)=([A-Za-z]+):([0-9]+(?:[.,][0-9]+)?)$/,
  );
  if (!m) {
    throw new Error(
      `Cible illisible : « ${raw} ». Format attendu : offer:16=SPECIAL:20`,
    );
  }
  const type = m[3].toUpperCase();
  if (!PROMO_TYPES.includes(type)) {
    throw new Error(
      `Type inconnu : « ${m[3]} ». Valeurs acceptées : ${PROMO_TYPES.join(", ")}`,
    );
  }
  const duration = Number(String(m[4]).replace(",", "."));
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error(`Durée invalide pour « ${raw} » : attendu un nombre > 0.`);
  }
  return { kind: m[1], id: Number(m[2]), type, duration };
};

const readTargets = () => {
  const at = argv.indexOf("--set");
  if (at === -1) return [];
  return argv
    .slice(at + 1)
    .filter((a) => !a.startsWith("--"))
    .map(parseTarget);
};

/* ------------------------------------------------------------------ */
/* Inventaire                                                          */
/* ------------------------------------------------------------------ */

const pad = (v, n) => String(v ?? "").padEnd(n).slice(0, n);

const inventory = async () => {
  const offers = await prisma.offer.findMany({
    select: {
      id: true,
      code: true,
      title: true,
      parentId: true,
      createdAt: true,
      operator: { select: { name: true } },
      user: { select: { email: true } },
      specialPromotion: { select: { type: true, duration: true } },
    },
    orderBy: { id: "asc" },
  });

  const monitorings = await prisma.monitoring.findMany({
    select: {
      id: true,
      code: true,
      title: true,
      parentId: true,
      createdAt: true,
      owner: { select: { email: true } },
      offer: { select: { code: true, operator: { select: { name: true } } } },
      specialPromotion: { select: { type: true, duration: true } },
    },
    orderBy: { id: "asc" },
  });

  console.log("\n=== OFFRES ===");
  console.log(
    pad("ID", 5) + pad("OPERATEUR", 10) + pad("INTITULE", 34) +
      pad("PARENT", 8) + pad("ETAT", 22) + pad("AUTEUR", 26) + "CREE LE",
  );
  offers.forEach((o) => {
    const etat = o.specialPromotion
      ? `PROMO ${LABELS[o.specialPromotion.type] || o.specialPromotion.type} ${o.specialPromotion.duration}j`
      : "offre de base";
    console.log(
      pad(o.id, 5) + pad(o.operator?.name, 10) + pad(o.title, 34) +
        pad(o.parentId ?? "-", 8) + pad(etat, 22) + pad(o.user?.email, 26) +
        o.createdAt.toISOString().slice(0, 10),
    );
  });

  console.log("\n=== MONITORINGS ===");
  if (monitorings.length === 0) {
    console.log("(aucun)");
  } else {
    console.log(
      pad("ID", 5) + pad("OPERATEUR", 10) + pad("INTITULE", 34) +
        pad("PARENT", 8) + pad("ETAT", 22) + pad("AUTEUR", 26) + "CREE LE",
    );
    monitorings.forEach((m) => {
      const etat = m.specialPromotion
        ? `PROMO ${LABELS[m.specialPromotion.type] || m.specialPromotion.type} ${m.specialPromotion.duration}j`
        : "monitoring de base";
      console.log(
        pad(m.id, 5) + pad(m.offer?.operator?.name, 10) + pad(m.title, 34) +
          pad(m.parentId ?? "-", 8) + pad(etat, 22) + pad(m.owner?.email, 26) +
          m.createdAt.toISOString().slice(0, 10),
      );
    });
  }

  const sansPromoOffres = offers.filter((o) => !o.specialPromotion);
  const sansPromoMonit = monitorings.filter((m) => !m.specialPromotion);

  console.log(
    `\nOffres : ${offers.length} au total, ${offers.length - sansPromoOffres.length} portant une promotion.`,
  );
  console.log(
    `Monitorings : ${monitorings.length} au total, ${monitorings.length - sansPromoMonit.length} portant une promotion.`,
  );
  console.log(
    "\nRappel : « offre de base » ci-dessus signifie qu'AUCUNE promotion n'est",
  );
  console.log(
    "enregistrée. Cela recouvre les vraies offres de base ET les promotions",
  );
  console.log(
    "perdues par le défaut corrigé. Seul le déclarant peut les distinguer.",
  );
  console.log(
    "\nPour rétablir :  --set offer:<id>=<TYPE>:<jours> [...] --apply",
  );
  console.log(`Types acceptés : ${PROMO_TYPES.join(", ")}`);
};

/* ------------------------------------------------------------------ */
/* Application                                                         */
/* ------------------------------------------------------------------ */

const restore = async (targets) => {
  console.log(
    apply
      ? "\n=== APPLICATION ===\n"
      : "\n=== SIMULATION (ajoutez --apply pour écrire) ===\n",
  );

  let done = 0;
  let skipped = 0;

  for (const t of targets) {
    const isOffer = t.kind === "offer";
    const model = isOffer ? prisma.offer : prisma.monitoring;
    const promoModel = isOffer
      ? prisma.specialPromotion
      : prisma.monitoringPromotion;
    const fk = isOffer ? "offerId" : "monitoringId";
    const label = isOffer ? "Offre" : "Monitoring";

    const record = await model.findUnique({
      where: { id: t.id },
      select: { id: true, title: true, specialPromotion: true },
    });

    if (!record) {
      console.log(`✗ ${label} ${t.id} : introuvable.`);
      skipped += 1;
      continue;
    }

    const existing = record.specialPromotion;
    if (existing && !force) {
      console.log(
        `• ${label} ${t.id} « ${record.title} » : promotion déjà présente ` +
          `(${LABELS[existing.type] || existing.type} ${existing.duration}j)   ignorée. ` +
          "Utilisez --force pour la remplacer.",
      );
      skipped += 1;
      continue;
    }

    const action = existing ? "remplacement" : "création";
    console.log(
      `→ ${label} ${t.id} « ${record.title} » : ${action} d'une promotion ` +
        `${LABELS[t.type]} de ${t.duration} jour(s).`,
    );

    if (!apply) continue;

    if (existing) {
      await promoModel.update({
        where: { [fk]: t.id },
        data: { type: t.type, duration: t.duration },
      });
    } else {
      await promoModel.create({
        data: {
          code: `PROMO-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type: t.type,
          duration: t.duration,
          [fk]: t.id,
        },
      });
    }
    done += 1;
  }

  console.log(
    apply
      ? `\n${done} promotion(s) enregistrée(s), ${skipped} ignorée(s).`
      : `\n${targets.length - skipped} opération(s) prête(s), ${skipped} ignorée(s). Rien n'a été écrit.`,
  );
};

/* ------------------------------------------------------------------ */

const main = async () => {
  const targets = readTargets();
  if (targets.length === 0) {
    await inventory();
  } else {
    await restore(targets);
  }
};

main()
  .catch((e) => {
    console.error("\nErreur :", e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
