import type { FastifyPluginAsync } from 'fastify';

import { syncMe } from './user.controller.js';

export const userRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/me', { preHandler: fastify.authenticate }, syncMe);
};
