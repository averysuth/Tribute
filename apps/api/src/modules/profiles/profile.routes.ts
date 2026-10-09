import type { FastifyPluginAsync } from 'fastify';

import {
  deactivateMyPerformerProfile,
  getPerformerProfile,
  upsertMyPerformerProfile,
} from './profile.controller.js';

export const profileRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.put('/me', { preHandler: fastify.authenticate }, upsertMyPerformerProfile);
  fastify.delete('/me', { preHandler: fastify.authenticate }, deactivateMyPerformerProfile);
  fastify.get('/:userId', getPerformerProfile);
};
