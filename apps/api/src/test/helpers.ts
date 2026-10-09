import { env } from '../config/env.js';
import { buildApp } from '../app.js';

/**
 * These are real integration tests against this project's dev Supabase instance —
 * there is no local Postgres/Auth stub. Never point `DATABASE_URL`/`SUPABASE_URL`
 * at a production project when running this suite.
 */

export interface TestUser {
  id: string;
  email: string;
  token: string;
}

async function loginTestUser(email: string, password: string): Promise<string | null> {
  const response = await fetch(`${env.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: env.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    return null;
  }

  const body = (await response.json()) as { access_token: string };
  return body.access_token;
}

async function createTestUser(email: string, password: string): Promise<void> {
  const response = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, email_confirm: true }),
  });

  if (!response.ok && response.status !== 422) {
    throw new Error(
      `Failed to create test user ${email}: ${response.status} ${await response.text()}`,
    );
  }
}

/** Fixed, reusable fixture users — logs in if they already exist, creates them otherwise. */
export async function getOrCreateTestUser(emailLocalPart: string): Promise<TestUser> {
  const email = `${emailLocalPart}@tribute.test`;
  const password = 'Test-Password-123!';

  let token = await loginTestUser(email, password);
  if (!token) {
    await createTestUser(email, password);
    token = await loginTestUser(email, password);
  }

  if (!token) {
    throw new Error(`Could not obtain a token for test user ${email}`);
  }

  const payloadB64 = token.split('.')[1];
  if (!payloadB64) {
    throw new Error(`Malformed token for test user ${email}`);
  }
  const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString()) as { sub: string };

  return { id: payload.sub, email, token };
}

export function buildTestApp() {
  return buildApp();
}

export async function syncTestUserProfile(
  app: ReturnType<typeof buildApp>,
  user: TestUser,
  username: string,
): Promise<void> {
  const response = await app.inject({
    method: 'POST',
    url: '/api/v1/users/me',
    headers: { authorization: `Bearer ${user.token}` },
    payload: { username, displayName: username },
  });

  if (response.statusCode >= 400) {
    throw new Error(
      `Failed to sync profile for ${username}: ${response.statusCode} ${response.body}`,
    );
  }
}

export function uniqueSlug(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}
