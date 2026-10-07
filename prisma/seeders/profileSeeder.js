const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function profileSeeder() {
    //PASSWORD Cedricaz@01

    //profile admin
    await prisma.profile.create({
        data: {
            code: 'PRF0-TEST',
            name: 'ADMINISTRATOR',
            description:""
        },
    });

    await prisma.profile.create({
        data: {
            code: 'PRF1-TEST',
            name: 'SUPERVISOR',
            description:""
        },
    });

    await prisma.profile.create({
        data: {
            code: 'PRF2-TEST',
            name: 'OPERATOR',
            description:""
        },
    });
    await prisma.profile.create({
        data: {
            code: 'PRF3-TEST',
            name: 'CLIENT',
            description:""
        },
    });

}

module.exports = profileSeeder;
