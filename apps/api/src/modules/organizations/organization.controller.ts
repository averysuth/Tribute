import type { FastifyReply, FastifyRequest } from 'fastify';

import { requireUser } from '../auth/auth.plugin.js';
import {
  addMemberSchema,
  createOrganizationSchema,
  organizationIdParamsSchema,
  organizationMemberParamsSchema,
  organizationSlugParamsSchema,
  updateMemberRoleSchema,
  updateOrganizationSchema,
} from './organization.schema.js';
import { organizationService } from './organization.service.js';

export async function createOrganization(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const user = requireUser(request);
  const input = createOrganizationSchema.parse(request.body);
  const organization = await organizationService.create(user, input);
  reply.status(201).send(organization);
}

export async function getOrganizationBySlug(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { slug } = organizationSlugParamsSchema.parse(request.params);
  const organization = await organizationService.getBySlug(slug);
  reply.send(organization);
}

export async function updateOrganization(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const user = requireUser(request);
  const { organizationId } = organizationIdParamsSchema.parse(request.params);
  const input = updateOrganizationSchema.parse(request.body);
  const organization = await organizationService.update(user, organizationId, input);
  reply.send(organization);
}

export async function listOrganizationMembers(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const user = requireUser(request);
  const { organizationId } = organizationIdParamsSchema.parse(request.params);
  const members = await organizationService.listMembers(user, organizationId);
  reply.send(members);
}

export async function addOrganizationMember(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const user = requireUser(request);
  const { organizationId } = organizationIdParamsSchema.parse(request.params);
  const input = addMemberSchema.parse(request.body);
  const member = await organizationService.addMember(user, organizationId, input);
  reply.status(201).send(member);
}

export async function updateOrganizationMemberRole(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const user = requireUser(request);
  const { organizationId, userId } = organizationMemberParamsSchema.parse(request.params);
  const { role } = updateMemberRoleSchema.parse(request.body);
  const member = await organizationService.updateMemberRole(user, organizationId, userId, role);
  reply.send(member);
}

export async function removeOrganizationMember(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const user = requireUser(request);
  const { organizationId, userId } = organizationMemberParamsSchema.parse(request.params);
  await organizationService.removeMember(user, organizationId, userId);
  reply.status(204).send();
}
