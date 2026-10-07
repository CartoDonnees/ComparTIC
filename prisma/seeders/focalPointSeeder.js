const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function focalPointSeeder() {
    //PASSWORD Cedricaz@01

    //focalPoint admin
    await prisma.focalPoint.create({
        data: {
            code: 'FP000-TEST',
            serialNumber: ''+Date.now()+Math.random() *5,
            status:'ENABLE',
            operator:{
                connect:{
                    code:'OPE-000'
                }
            },
            user:{
                connect:{
                    code:'USR0-TEST',
                }
            }
        },
    });

    //OPERATEURS
    await prisma.focalPoint.create({
        data: {
            code: 'FP001-TEST',
            serialNumber: ''+Date.now()+Math.random() *5,
            status:'ENABLE',
            operator:{
                connect:{
                    code:'OPE-001'
                }
            },
            user:{
                connect:{
                    code:'USR3-TEST',
                }
            }
        },
    });

    await prisma.focalPoint.create({
        data: {
            code: 'FP011-TEST',
            serialNumber: ''+Date.now()+Math.random() *5,
            status:'ENABLE',
            operator:{
                connect:{
                    code:'OPE-011'
                }
            },
            user:{
                connect:{
                    code:'USR5-TEST',
                }
            }
        },
    });

    await prisma.focalPoint.create({
        data: {
            code: 'FP010-TEST',
            serialNumber: ''+Date.now()+Math.random() *5,
            status:'ENABLE',
            operator:{
                connect:{
                    code:'OPE-010'
                }
            },
            user:{
                connect:{
                    code:'USR4-TEST',
                }
            }
        },
    });

}

module.exports = focalPointSeeder;
