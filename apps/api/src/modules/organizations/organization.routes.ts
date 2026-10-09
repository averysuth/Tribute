import type { FastifyPluginAsync } from 'fastify';

import {
  addOrganizationMember,
  createOrganization,
  getOrganizationBySlug,
  listOrganizationMembers,
  removeOrganizationMember,
  updateOrganization,
  updateOrganizationMemberRole,
} from './organization.controller.js';

export const organizationRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/', { preHandler: fastify.authenticate }, createOrganization);
  fastify.get('/:slug', getOrganizationBySlug);
  fastify.patch('/:organizationId', { preHandler: fastify.authenticate }, updateOrganization);

  fastify.get(
    '/:organizationId/members',
    { preHandler: fastify.authenticate },
    listOrganizationMembers,
  );
  fastify.post(
    '/:organizationId/members',
    { preHandler: fastify.authenticate },
    addOrganizationMember,
  );
  fastify.patch(
    '/:organizationId/members/:userId',
    { preHandler: fastify.authenticate },
    updateOrganizationMemberRole,
  );
  fastify.delete(
    '/:organizationId/members/:userId',
    { preHandler: fastify.authenticate },
    removeOrganizationMember,
  );
};
