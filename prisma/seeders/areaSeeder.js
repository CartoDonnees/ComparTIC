const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function areaSeeder() {
    const zones = [
        {
            code: 'ARE-01',
            title: 'NATIONAL',
            description: 'En Côte d\'Ivoire',
        },
        {
            code: 'ARE-10',
            title: 'INTERNATIONAL',
            description: 'Les destinations hors de la Côte d\'Ivore',
            
        },
        {
            code: 'ARE-11',
            title: 'ROAMING',
            description: '',
            
        },
    ]

    for (const zone of zones) {
        await prisma.area.upsert({
            where: { code: zone.code },
            update: {},
            create: zone,
        })
    }

}

module.exports = areaSeeder;