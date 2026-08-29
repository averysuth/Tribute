import type { FastifyReply, FastifyRequest } from 'fastify';

import { requireUser } from '../auth/auth.plugin.js';
import { syncUserProfileSchema } from './user.schema.js';
import { userService } from './user.service.js';

export async function syncMe(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const user = requireUser(request);
  const input = syncUserProfileSchema.parse(request.body);

  const { profile, created } = await userService.syncProfile(user, input);

  reply.status(created ? 201 : 200).send(profile);
}
