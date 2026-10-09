import type { FastifyReply, FastifyRequest } from 'fastify';

import { requireUser } from '../auth/auth.plugin.js';
import { performerProfileParamsSchema, upsertPerformerProfileSchema } from './profile.schema.js';
import { profileService } from './profile.service.js';

export async function getPerformerProfile(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { userId } = performerProfileParamsSchema.parse(request.params);
  const profile = await profileService.getByUserId(userId);
  reply.send(profile);
}

export async function upsertMyPerformerProfile(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const user = requireUser(request);
  const input = upsertPerformerProfileSchema.parse(request.body);
  const profile = await profileService.activateOrUpdate(user, input);
  reply.send(profile);
}

export async function deactivateMyPerformerProfile(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const user = requireUser(request);
  await profileService.deactivate(user);
  reply.status(204).send();
}
