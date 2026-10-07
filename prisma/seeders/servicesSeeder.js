const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function servicesSeeder() {

  await prisma.service.create({
    data: {
      code: 'SER-001',
      title:"VOIX",
      status: 'ENABLE',
      description: 'Tout service qui permet la transmission de la parole entre au moins deux interlocuteurs à travers un réseau de communication.',
    },
  });
  await prisma.service.create({
    data: {
      code: 'SER-010',
      title:"SMS",
      status: 'ENABLE',
      description:"C'est l’un des services de base des réseaux de télécommunication mobile. Il permet d’envoyer et de recevoir des messages courts sous forme de texte entre téléphones mobiles ou autres terminaux connectés au réseau cellulaire"
    },
  });
  await prisma.service.create({
    data: {
      code: 'SER-100',
      title:"DATA",
      status: 'ENABLE',
      description: "ce'st lensemble des prestations qui permettent d’acheminer, stocker, traiter ou échanger des informations numériques (données), par opposition aux services de téléphonie vocale ou de radiodiffusion.",
    },
  });

}

module.exports = servicesSeeder;
