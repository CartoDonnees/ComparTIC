const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

/**
 * Les logos des opérateurs sont lus par l'API `/api/files/downloads/images`,
 * qui sert le dossier `uploads/images`. Le jeu de données référençait des
 * fichiers absents du dépôt (« 1730988953719_blob.png »…) : après une nouvelle
 * installation, tous les logos étaient en 404. Les images livrées dans
 * `public/images/logo` sont donc recopiées au chargement si elles manquent.
 */
const ensureLogo = (fileName) => {
  try {
    const source = path.join(process.cwd(), 'public', 'images', 'logo', fileName);
    const targetDir = path.join(process.cwd(), 'uploads', 'images');
    const target = path.join(targetDir, fileName);
    if (!fs.existsSync(source) || fs.existsSync(target)) return;
    fs.mkdirSync(targetDir, { recursive: true });
    fs.copyFileSync(source, target);
  } catch (error) {
    console.warn(`Logo ${fileName} non copié : ${error.message}`);
  }
};

async function operatorSeeder() {
  ['logo.png', 'moov.png', 'mtn.png', 'orange.png', 'cidata1.png', 'dataconnect1.png', 'gva.jpg', 'quantis.webp', 'vipnet.jpg'].forEach(ensureLogo);


  await prisma.operator.create({
    data: {
      code: 'OPE-000',
      name:"ARTCI",
      status: 'ENABLE',
      color:'#007c00ff',
      type:'HYBRIDE',
      imagePath:'logo.png',
      description: 'Régulateur des télécommunications en CI',
    },
  });

  
  await prisma.operator.create({
    data: {
      code: 'OPE-011',
      name:"MOOV",
      status: 'ENABLE',
      color:'#005CAA',
      type:'HYBRIDE',
      imagePath:'moov.png',
      description: 'Opérateur de télécommunications, filiale du groupe Maroc Télécom lancé en côte d’ivoire depuis 2006 sous le nom de Etisalat',
    },
  });
  await prisma.operator.create({
    data: {
      code: 'OPE-010',
      name:"MTN",
      status: 'ENABLE',
      color:'#FFCD03',
      type:'HYBRIDE',
      imagePath:'mtn.png',
      description:'Entreprise de télécommunications qui a vu le jour le 1er juillet 2005 en Côte d\'Ivoire, avec le rachat, par le groupe sud-africain M-Cell, devenu par la suite MTN international, de la licence de téléphonie mobile de Loteny Telecom (Telecel). '
    },
  });
  await prisma.operator.create({
    data: {
      code: 'OPE-001',
      name:"ORANGE",
      status: 'ENABLE',
      color:'#FF6600',
      type:'HYBRIDE',
      imagePath:'orange.png',
      description: 'Opérateur de télécommunications créé sous l’appellation, Société ivoirienne de mobile (SIM) et sous la marque Ivoiris',
    },
  });

  await prisma.operator.create({
    data: {
      code: 'OPE-014',
      name:"CI-DATA",
      status: 'ENABLE',
      color:'#175387',
      type:'FIXE',
      imagePath:'cidata1.png',
      description: 'Opérateur de télécommunications',
    },
  });
  
  await prisma.operator.create({
    data: {
      code: 'OPE-0112',
      name:"DATA-CONNECT",
      status: 'ENABLE',
      color:'#85E9D5',      type:'FIXE',
      imagePath:'dataconnect1.png',
      description: 'Opérateur de télécommunications',
    },
  });

  await prisma.operator.create({
    data: {
      code: 'OPE-013',
      name:"GVA",
      status: 'ENABLE',
      color:'#812379',
      type:'FIXE',
      imagePath:'gva.jpg',
      description: 'Opérateur de télécommunications',
    },
  });

  await prisma.operator.create({
    data: {
      code: 'OPE-016',
      name:"QUANTIS",
      status: 'ENABLE',
      color:'#3CACD4',
      type:'FIXE',
      imagePath:'quantis.webp',
      description: 'Opérateur de télécommunications',
    },
  });

  await prisma.operator.create({
    data: {
      code: 'OPE-015',
      name:"VIPNET",
      status: 'ENABLE',
      color:'#FF5414',
      type:'FIXE',
      imagePath:'vipnet.jpg',
      description: 'Opérateur de télécommunications',
    },
  });

}

module.exports = operatorSeeder;
