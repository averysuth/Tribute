import { PrismaClient } from '@prisma/client';

declare global {
  var __tributePrisma: PrismaClient | undefined;
}

export const prisma = globalThis.__tributePrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__tributePrisma = prisma;
}
