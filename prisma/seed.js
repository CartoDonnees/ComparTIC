
const { PrismaClient } = require('@prisma/client');
const operatorSeeder = require('./seeders/operatorSeeder');
const servicesSeeder = require('./seeders/servicesSeeder');
const countrySeeder = require('./seeders/countrySeeder');
const areaSeeder = require('./seeders/areaSeeder');
const profileSeeder = require('./seeders/profileSeeder');
const userSeeder = require('./seeders/userSeeder');
const focalPointSeeder = require('./seeders/focalPointSeeder');
const organizationSeeder = require('./seeders/organizationSeeder');
const offerSeeder = require('./seeders/offerSeeder');
const workflowSeeder = require('./seeders/workflowSeeder');
const zoneOfferSeeder = require('./seeders/zoneOfferSeeder');
const prisma = new PrismaClient();

/** Vide toutes les tables de données (hors historique des migrations). */
async function resetDatabase() {
  const tables = await prisma.$queryRaw`
    SELECT tablename FROM pg_tables
    WHERE schemaname = current_schema() AND tablename <> '_prisma_migrations'
  `;
  if (!tables.length) return;
  const list = tables.map((t) => `"${t.tablename}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
}

async function main() {

  // Remise à zéro complète de la base avant le chargement.
  //
  // La suppression table par table listée ici ne couvrait pas toutes les
  // dépendances (codes de soumission, notifications, monitorings, avis…) :
  // relancer « npm run seed » sur une base déjà utilisée échouait sur une
  // contrainte de clé étrangère APRÈS avoir supprimé les offres et les
  // opérateurs. La base restait à moitié vide et plus aucune offre ne
  // s'affichait, ni en validation ni sur le comparateur.
  //
  // TRUNCATE ... CASCADE vide toutes les tables, quelles que soient les
  // relations, et RESTART IDENTITY repart des identifiants 1 (jeu de données
  // reproductible). Les migrations (_prisma_migrations) sont préservées.
  await resetDatabase();
  console.log("Base réinitialisée.");

  await profileSeeder();
  await userSeeder();
  await operatorSeeder();
  await focalPointSeeder();
  await servicesSeeder();
  await areaSeeder();
  await countrySeeder();
  await organizationSeeder();
  await offerSeeder();
  // Comptes de test des 8 rôles et offres dans chaque état du workflow.
  await workflowSeeder();
  // Offres internationales et de roaming (filtres de zone du comparateur).
  await zoneOfferSeeder();

  const [offers, published, users] = await Promise.all([
    prisma.offer.count(),
    prisma.offer.count({ where: { workflowStatus: "VALIDATED" } }),
    prisma.user.count(),
  ]);
  console.log(`Jeu de données chargé : ${offers} offres (dont ${published} publiées), ${users} comptes.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
