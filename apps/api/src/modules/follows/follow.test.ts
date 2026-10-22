import { prisma } from '@tribute/database';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  buildTestApp,
  getOrCreateTestUser,
  syncTestUserProfile,
  uniqueSlug,
  type TestUser,
} from '../../test/helpers.js';

describe('follows module', () => {
  const app = buildTestApp();
  let follower: TestUser;
  let followee: TestUser;
  let organizationId: string;
  const createdOrgIds: string[] = [];

  async function fixtureUser(localPart: string, username: string): Promise<TestUser> {
    const user = await getOrCreateTestUser(localPart);
    await syncTestUserProfile(app, user, username);
    return user;
  }

  beforeAll(async () => {
    follower = await fixtureUser('follow-test-follower', 'followtestfollower');
    followee = await fixtureUser('follow-test-followee', 'followtestfollowee');

    const orgResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/organizations',
      headers: { authorization: `Bearer ${followee.token}` },
      payload: { name: 'Follow Test Org', slug: uniqueSlug('follow-test-org') },
    });
    organizationId = orgResponse.json().id;
    createdOrgIds.push(organizationId);
  });

  afterAll(async () => {
    await prisma.userFollow.deleteMany({
      where: { OR: [{ followerId: follower.id }, { followerId: followee.id }] },
    });
    await prisma.organization.deleteMany({ where: { id: { in: createdOrgIds } } });
    await app.close();
  });

  it('rejects following without authentication', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/users/${followee.id}/follow`,
    });
    expect(response.statusCode).toBe(401);
  });

  it('rejects following yourself', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/users/${follower.id}/follow`,
      headers: { authorization: `Bearer ${follower.token}` },
    });
    expect(response.statusCode).toBe(400);
  });

  it('returns 404 following a nonexistent user', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/users/00000000-0000-0000-0000-000000000000/follow',
      headers: { authorization: `Bearer ${follower.token}` },
    });
    expect(response.statusCode).toBe(404);
  });

  it('follows a user and lists them in followers/following', async () => {
    const followResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/users/${followee.id}/follow`,
      headers: { authorization: `Bearer ${follower.token}` },
    });
    expect(followResponse.statusCode).toBe(201);

    const followers = await app.inject({
      method: 'GET',
      url: `/api/v1/users/${followee.id}/followers`,
    });
    expect(followers.json().some((u: { id: string }) => u.id === follower.id)).toBe(true);

    const following = await app.inject({
      method: 'GET',
      url: `/api/v1/users/${follower.id}/following`,
    });
    expect(following.json().some((u: { id: string }) => u.id === followee.id)).toBe(true);
  });

  it('rejects following the same user twice', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/users/${followee.id}/follow`,
      headers: { authorization: `Bearer ${follower.token}` },
    });
    expect(response.statusCode).toBe(409);
  });

  it('unfollows a user', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: `/api/v1/users/${followee.id}/follow`,
      headers: { authorization: `Bearer ${follower.token}` },
    });
    expect(response.statusCode).toBe(204);

    const following = await app.inject({
      method: 'GET',
      url: `/api/v1/users/${follower.id}/following`,
    });
    expect(following.json().some((u: { id: string }) => u.id === followee.id)).toBe(false);
  });

  it('returns 404 unfollowing a user you do not follow', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: `/api/v1/users/${followee.id}/follow`,
      headers: { authorization: `Bearer ${follower.token}` },
    });
    expect(response.statusCode).toBe(404);
  });

  it('follows and unfollows an organization', async () => {
    const followResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/organizations/${organizationId}/follow`,
      headers: { authorization: `Bearer ${follower.token}` },
    });
    expect(followResponse.statusCode).toBe(201);

    const followers = await app.inject({
      method: 'GET',
      url: `/api/v1/organizations/${organizationId}/followers`,
    });
    expect(followers.json().some((u: { id: string }) => u.id === follower.id)).toBe(true);

    const followedOrgs = await app.inject({
      method: 'GET',
      url: `/api/v1/users/${follower.id}/followed-organizations`,
    });
    expect(followedOrgs.json().some((o: { id: string }) => o.id === organizationId)).toBe(true);

    const unfollowResponse = await app.inject({
      method: 'DELETE',
      url: `/api/v1/organizations/${organizationId}/follow`,
      headers: { authorization: `Bearer ${follower.token}` },
    });
    expect(unfollowResponse.statusCode).toBe(204);
  });
});
