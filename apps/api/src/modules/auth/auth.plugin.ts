import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { jwtVerify } from 'jose';

import { env } from '../../config/env.js';
import { AuthenticationError } from '../../lib/errors.js';
import type { AuthenticatedUser } from './auth.types.js';

const secret = new TextEncoder().encode(env.SUPABASE_JWT_SECRET);

async function authenticate(request: FastifyRequest): Promise<void> {
  const header = request.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    throw new AuthenticationError('Missing bearer token');
  }

  const token = header.slice('Bearer '.length);

  let payload;
  try {
    ({ payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] }));
  } catch {
    throw new AuthenticationError('Invalid or expired token');
  }

  const id = typeof payload.sub === 'string' ? payload.sub : undefined;
  const email = typeof payload.email === 'string' ? payload.email : undefined;

  if (!id || !email) {
    throw new AuthenticationError('Token is missing required claims');
  }

  const user: AuthenticatedUser = { id, email };
  request.user = user;
}

export const authPlugin: FastifyPluginAsync = fp(async (fastify) => {
  fastify.decorate('authenticate', authenticate);
});

export function requireUser(request: FastifyRequest): AuthenticatedUser {
  if (!request.user) {
    throw new AuthenticationError('Authentication required');
  }
  return request.user;
}
