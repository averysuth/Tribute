import type { FastifyReply, FastifyRequest } from 'fastify';

import { requireUser } from '../auth/auth.plugin.js';
import { organizationIdParamsSchema, userIdParamsSchema } from './follow.schema.js';
import { followService } from './follow.service.js';

export async function followUser(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const actingUser = requireUser(request);
  const { userId } = userIdParamsSchema.parse(request.params);
  await followService.followUser(actingUser, userId);
  reply.status(201).send();
}

export async function unfollowUser(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const actingUser = requireUser(request);
  const { userId } = userIdParamsSchema.parse(request.params);
  await followService.unfollowUser(actingUser, userId);
  reply.status(204).send();
}

export async function listFollowers(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { userId } = userIdParamsSchema.parse(request.params);
  const followers = await followService.listFollowers(userId);
  reply.send(followers);
}

export async function listFollowing(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { userId } = userIdParamsSchema.parse(request.params);
  const following = await followService.listFollowing(userId);
  reply.send(following);
}

export async function followOrganization(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const actingUser = requireUser(request);
  const { organizationId } = organizationIdParamsSchema.parse(request.params);
  await followService.followOrganization(actingUser, organizationId);
  reply.status(201).send();
}

export async function unfollowOrganization(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const actingUser = requireUser(request);
  const { organizationId } = organizationIdParamsSchema.parse(request.params);
  await followService.unfollowOrganization(actingUser, organizationId);
  reply.status(204).send();
}

export async function listOrganizationFollowers(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { organizationId } = organizationIdParamsSchema.parse(request.params);
  const followers = await followService.listOrganizationFollowers(organizationId);
  reply.send(followers);
}

export async function listFollowedOrganizations(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { userId } = userIdParamsSchema.parse(request.params);
  const organizations = await followService.listFollowedOrganizations(userId);
  reply.send(organizations);
}
