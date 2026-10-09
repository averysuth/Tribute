import { prisma } from '@tribute/database';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  buildTestApp,
  getOrCreateTestUser,
  syncTestUserProfile,
  type TestUser,
} from '../../test/helpers.js';

describe('profiles module', () => {
  const app = buildTestApp();
  let dancer: TestUser;
  let danceStyleId: string;

  beforeAll(async () => {
    dancer = await getOrCreateTestUser('profile-test-dancer');
    await syncTestUserProfile(app, dancer, 'profiletestdancer');

    const style = await prisma.danceStyle.findFirstOrThrow();
    danceStyleId = style.id;
  });

  afterAll(async () => {
    await prisma.performerProfile.deleteMany({ where: { userId: dancer.id } });
    await app.close();
  });

  it('rejects activating a performer profile without authentication', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/api/v1/profiles/me',
      payload: { performerType: 'dancer' },
    });
    expect(response.statusCode).toBe(401);
  });

  it('rejects forbidden fields (e.g. userId) in the request body', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/api/v1/profiles/me',
      headers: { authorization: `Bearer ${dancer.token}` },
      payload: { performerType: 'dancer', userId: 'someone-else' },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 for a user with no performer profile', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/profiles/00000000-0000-0000-0000-000000000000',
    });
    expect(response.statusCode).toBe(404);
  });

  it('activates a performer profile with dance styles for the authenticated user', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/api/v1/profiles/me',
      headers: { authorization: `Bearer ${dancer.token}` },
      payload: {
        performerType: 'dancer',
        journey: 'Started dancing at powwows as a child',
        region: 'Great Plains',
        danceStyles: [{ danceStyleId, isPrimary: true }],
      },
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.performerType).toBe('dancer');
    expect(body.danceStyles).toHaveLength(1);
    expect(body.danceStyles[0].danceStyleId).toBe(danceStyleId);
  });

  it('reads back the activated profile by userId, including the user summary', async () => {
    const response = await app.inject({ method: 'GET', url: `/api/v1/profiles/${dancer.id}` });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.user.id).toBe(dancer.id);
    expect(body.danceStyles).toHaveLength(1);
  });

  it("a second user cannot update the first user's performer profile", async () => {
    const other = await getOrCreateTestUser('profile-test-other');
    await syncTestUserProfile(app, other, 'profiletestother');

    // There is no route to update anyone else's profile by id — upserting
    // with "other"'s own token must only ever affect "other", never "dancer".
    const response = await app.inject({
      method: 'PUT',
      url: '/api/v1/profiles/me',
      headers: { authorization: `Bearer ${other.token}` },
      payload: { performerType: 'dancer' },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().userId).toBe(other.id);

    const dancerProfile = await prisma.performerProfile.findUnique({
      where: { userId: dancer.id },
    });
    expect(dancerProfile?.performerType).toBe('dancer');
    expect(dancerProfile?.region).toBe('Great Plains');

    await prisma.performerProfile.deleteMany({ where: { userId: other.id } });
  });

  it('deactivates the performer profile for the authenticated user', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/profiles/me',
      headers: { authorization: `Bearer ${dancer.token}` },
    });
    expect(response.statusCode).toBe(204);

    const getResponse = await app.inject({ method: 'GET', url: `/api/v1/profiles/${dancer.id}` });
    expect(getResponse.statusCode).toBe(404);
  });
});
