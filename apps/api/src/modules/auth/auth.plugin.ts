import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { createRemoteJWKSet, jwtVerify } from 'jose';

import { env } from '../../config/env.js';
import { AuthenticationError } from '../../lib/errors.js';
import type { AuthenticatedUser } from './auth.types.js';

// Supabase signs access tokens with project-specific asymmetric keys (ES256) and
// publishes the public keys at this well-known JWKS endpoint. `createRemoteJWKSet`
// fetches and caches them, refetching automatically if a token references an
// unknown `kid` (e.g. after Supabase rotates signing keys).
const JWKS = createRemoteJWKSet(new URL('/auth/v1/.well-known/jwks.json', env.SUPABASE_URL));

async function verifyToken(token: string): Promise<AuthenticatedUser> {
  let payload;
  try {
    ({ payload } = await jwtVerify(token, JWKS, { algorithms: ['ES256'] }));
  } catch {
    throw new AuthenticationError('Invalid or expired token');
  }

  const id = typeof payload.sub === 'string' ? payload.sub : undefined;
  const email = typeof payload.email === 'string' ? payload.email : undefined;

  if (!id || !email) {
    throw new AuthenticationError('Token is missing required claims');
  }

  return { id, email };
}

async function authenticate(request: FastifyRequest): Promise<void> {
  const header = request.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    throw new AuthenticationError('Missing bearer token');
  }

  request.user = await verifyToken(header.slice('Bearer '.length));
}

/**
 * For routes that are public but behave differently when the caller is known
 * (e.g. a public list that can optionally be filtered to "people I follow").
 * A missing or invalid token is not an error here — it just means the request
 * proceeds unauthenticated. Never use this where the handler needs to trust
 * `request.user` for an authorization decision — use `authenticate` for that.
 */
async function tryAuthenticate(request: FastifyRequest): Promise<void> {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return;
  }

  try {
    request.user = await verifyToken(header.slice('Bearer '.length));
  } catch {
    // Invalid/expired token on an optional-auth route: proceed unauthenticated.
  }
}

export const authPlugin: FastifyPluginAsync = fp(async (fastify) => {
  fastify.decorate('authenticate', authenticate);
  fastify.decorate('tryAuthenticate', tryAuthenticate);
});

export function requireUser(request: FastifyRequest): AuthenticatedUser {
  if (!request.user) {
    throw new AuthenticationError('Authentication required');
  }
  return request.user;
}
