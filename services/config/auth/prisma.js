// lib/prisma.js
import { PrismaClient } from '@prisma/client'

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }

  prisma = global.prisma;
}

// const globalForPrisma = globalThis

// const prisma = globalForPrisma.prisma ||
//   new PrismaClient({
//     log: [ 'error', 'warn'], // utile pour debug
//   })

// if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma