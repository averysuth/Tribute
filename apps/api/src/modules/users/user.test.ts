import { prisma } from '@tribute/database';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestApp, getOrCreateTestUser, type TestUser } from '../../test/helpers.js';

describe('users module', () => {
  const app = buildTestApp();
  let user: TestUser;

  beforeAll(async () => {
    user = await getOrCreateTestUser('users-test-main');
  });

  afterAll(async () => {
    await prisma.userProfile.deleteMany({ where: { id: user.id } });
    await app.close();
  });

  it('rejects GET /me without authentication', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/users/me' });
    expect(response.statusCode).toBe(401);
  });

  it('returns 404 from GET /me before a profile has been synced', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users/me',
      headers: { authorization: `Bearer ${user.token}` },
    });
    expect(response.statusCode).toBe(404);
  });

  it('creates a profile on first sync and returns it on subsequent GETs', async () => {
    const syncResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/users/me',
      headers: { authorization: `Bearer ${user.token}` },
      payload: { username: 'userstestmain', displayName: 'Users Test Main' },
    });
    expect(syncResponse.statusCode).toBe(201);

    const getResponse = await app.inject({
      method: 'GET',
      url: '/api/v1/users/me',
      headers: { authorization: `Bearer ${user.token}` },
    });
    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.json().username).toBe('userstestmain');
  });

  it('rejects syncing with a username already taken by another user', async () => {
    const other = await getOrCreateTestUser('users-test-other');

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/users/me',
      headers: { authorization: `Bearer ${other.token}` },
      payload: { username: 'userstestmain', displayName: 'Imposter' },
    });
    expect(response.statusCode).toBe(409);

    await prisma.userProfile.deleteMany({ where: { id: other.id } });
  });
});
