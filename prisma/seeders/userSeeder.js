const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function userSeeder() {
    //PASSWORD Cedricaz@01

    const operators = await prisma.operator.findMany();
    const currentYear = new Date().getFullYear();

    //user admin
    await prisma.user.create({
        data: {
            code: 'USR0-TEST',
            firstName: 'KOUAKOU CEDRIC PARFAIT',
            lastName: 'YAO',
            email: 'testa@artci.ci',
            password: "$2b$10$vtKRR0oDRXedu5dlcyZk6.ule5ZZJO06BNRcTdD3XDfFN47M04S8e",
            status: 'ENABLE',
            profile:{
                connect:{
                    code:'PRF0-TEST',
                }
            }
        },
    });
    await prisma.user.create({
        data: {
            code: 'USR1-TEST',
            firstName: 'KOUAKOU CEDRIC PARFAIT',
            lastName: 'YAO',
            email: 'testsup@artci.ci',
            password: "$2b$10$vtKRR0oDRXedu5dlcyZk6.ule5ZZJO06BNRcTdD3XDfFN47M04S8e",
            status: 'ENABLE',
            profile:{
                connect:{
                    code:'PRF1-TEST',
                }
            }
        },
    });
    await prisma.user.create({
        data: {
            code: 'USR2-TEST',
            firstName: 'KONE',
            lastName: 'SIE',
            email: 'testu@artci.ci',
            password: "$2b$10$vtKRR0oDRXedu5dlcyZk6.ule5ZZJO06BNRcTdD3XDfFN47M04S8e",
            status: 'ENABLE',
            profile:{
                connect:{
                    code:'PRF3-TEST',
                }
            }
        },
    });
    await prisma.user.create({
        data: {
            code: 'USR3-TEST',
            firstName: 'BENIN',
            lastName: 'ABOU',
            email: 'testorange@artci.ci',
            password: "$2b$10$vtKRR0oDRXedu5dlcyZk6.ule5ZZJO06BNRcTdD3XDfFN47M04S8e",
            status: 'ENABLE',
            profile:{
                connect:{
                    code:'PRF2-TEST',
                }
            }
        },
    });
    await prisma.user.create({
        data: {
            code: 'USR4-TEST',
            firstName: 'TOURE',
            lastName: 'YSSOUF',
            email: 'testmtn@artci.ci',
            password: "$2b$10$vtKRR0oDRXedu5dlcyZk6.ule5ZZJO06BNRcTdD3XDfFN47M04S8e",
            status: 'ENABLE',
            profile:{
                connect:{
                    code:'PRF2-TEST',
                }
            }
        },
    });
    await prisma.user.create({
        data: {
            code: 'USR5-TEST',
            firstName: 'MARIAM',
            lastName: 'GRACE',
            email: 'testmoov@artci.ci',
            password: "$2b$10$vtKRR0oDRXedu5dlcyZk6.ule5ZZJO06BNRcTdD3XDfFN47M04S8e",
            status: 'ENABLE',
            profile:{
                connect:{
                    code:'PRF2-TEST',
                }
            }
        },
    });

    await prisma.user.create({
        data: {
            code: 'USR6-TEST',
            firstName: 'KOFFI',
            lastName: 'ALIXE',
            email: 'sup@artci.ci',
            password: "$2b$10$vtKRR0oDRXedu5dlcyZk6.ule5ZZJO06BNRcTdD3XDfFN47M04S8e",
            status: 'ENABLE',
            profile:{
                connect:{
                    code:'PRF1-TEST'
                }
            }
        },
    });

}

module.exports = userSeeder;
