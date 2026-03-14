import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const isDev = process.env.NODE_ENV !== 'production';

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    // Solo logueamos queries en desarrollo para evitar overhead en producción
    log: isDev ? ['query', 'warn', 'error'] : ['error'],
  });

if (isDev) globalForPrisma.prisma = prisma;
