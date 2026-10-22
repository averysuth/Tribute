import type { FastifyPluginAsync } from 'fastify';

import {
  followOrganization,
  followUser,
  listFollowedOrganizations,
  listFollowers,
  listFollowing,
  listOrganizationFollowers,
  unfollowOrganization,
  unfollowUser,
} from './follow.controller.js';

export const userFollowRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/:userId/follow', { preHandler: fastify.authenticate }, followUser);
  fastify.delete('/:userId/follow', { preHandler: fastify.authenticate }, unfollowUser);
  fastify.get('/:userId/followers', listFollowers);
  fastify.get('/:userId/following', listFollowing);
  fastify.get('/:userId/followed-organizations', listFollowedOrganizations);
};

export const organizationFollowRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/:organizationId/follow', { preHandler: fastify.authenticate }, followOrganization);
  fastify.delete(
    '/:organizationId/follow',
    { preHandler: fastify.authenticate },
    unfollowOrganization,
  );
  fastify.get('/:organizationId/followers', listOrganizationFollowers);
};
