import { prisma } from '@tribute/database';
import type { FastifyPluginAsync } from 'fastify';

export const danceStyleRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async () => {
    return prisma.danceStyle.findMany({ orderBy: { name: 'asc' } });
  });
};
