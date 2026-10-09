import type { FastifyPluginAsync } from 'fastify';

import { getMe, syncMe } from './user.controller.js';

export const userRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/me', { preHandler: fastify.authenticate }, getMe);
  fastify.post('/me', { preHandler: fastify.authenticate }, syncMe);
};
