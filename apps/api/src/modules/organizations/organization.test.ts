import { prisma } from '@tribute/database';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  buildTestApp,
  getOrCreateTestUser,
  syncTestUserProfile,
  uniqueSlug,
  type TestUser,
} from '../../test/helpers.js';

describe('organizations module', () => {
  const app = buildTestApp();
  let owner: TestUser;
  let outsider: TestUser;
  const createdOrgIds: string[] = [];

  async function fixtureUser(localPart: string, username: string): Promise<TestUser> {
    const user = await getOrCreateTestUser(localPart);
    await syncTestUserProfile(app, user, username);
    return user;
  }

  beforeAll(async () => {
    owner = await fixtureUser('org-test-owner', 'orgtestowner');
    outsider = await fixtureUser('org-test-outsider', 'orgtestoutsider');
  });

  afterAll(async () => {
    await prisma.organization.deleteMany({ where: { id: { in: createdOrgIds } } });
    await app.close();
  });

  async function createOrg(user: TestUser) {
    const slug = uniqueSlug('org');
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/organizations',
      headers: { authorization: `Bearer ${user.token}` },
      payload: { name: 'Test Org', slug },
    });
    const body = response.json();
    if (response.statusCode === 201) {
      createdOrgIds.push(body.id);
    }
    return { response, body, slug };
  }

  it('rejects creating an organization without a token', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/organizations',
      payload: { name: 'Nope', slug: uniqueSlug('nope') },
    });
    expect(response.statusCode).toBe(401);
  });

  it('rejects forbidden fields on create (e.g. createdBy)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/organizations',
      headers: { authorization: `Bearer ${owner.token}` },
      payload: { name: 'Test', slug: uniqueSlug('forbidden'), createdBy: 'someone-else' },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('VALIDATION_ERROR');
  });

  it('creates an organization and makes the creator its owner', async () => {
    const { response, body, slug } = await createOrg(owner);
    expect(response.statusCode).toBe(201);
    expect(body.slug).toBe(slug);
    expect(body.createdBy).toBe(owner.id);

    const membership = await prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: body.id, userId: owner.id } },
    });
    expect(membership?.role).toBe('OWNER');
  });

  it('returns 404 for a nonexistent slug', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/organizations/does-not-exist-slug',
    });
    expect(response.statusCode).toBe(404);
  });

  it('allows the owner to update their organization', async () => {
    const { body: org } = await createOrg(owner);
    const response = await app.inject({
      method: 'PATCH',
      url: `/api/v1/organizations/${org.id}`,
      headers: { authorization: `Bearer ${owner.token}` },
      payload: { description: 'Updated by owner' },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().description).toBe('Updated by owner');
  });

  it('rejects an outsider updating an organization they do not belong to', async () => {
    const { body: org } = await createOrg(owner);
    const response = await app.inject({
      method: 'PATCH',
      url: `/api/v1/organizations/${org.id}`,
      headers: { authorization: `Bearer ${outsider.token}` },
      payload: { description: 'Hijacked' },
    });
    expect(response.statusCode).toBe(403);

    const unchanged = await prisma.organization.findUnique({ where: { id: org.id } });
    expect(unchanged?.description).toBeNull();
  });

  it('rejects listing members for a non-member', async () => {
    const { body: org } = await createOrg(owner);
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/organizations/${org.id}/members`,
      headers: { authorization: `Bearer ${outsider.token}` },
    });
    expect(response.statusCode).toBe(403);
  });

  it('only an owner can grant the OWNER role to a new member', async () => {
    const { body: org } = await createOrg(owner);

    const admin = await fixtureUser('org-test-admin', 'orgtestadmin');
    await app.inject({
      method: 'POST',
      url: `/api/v1/organizations/${org.id}/members`,
      headers: { authorization: `Bearer ${owner.token}` },
      payload: { userId: admin.id, role: 'ADMIN' },
    });

    const thirdUser = await fixtureUser('org-test-third', 'orgtestthird');
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/organizations/${org.id}/members`,
      headers: { authorization: `Bearer ${admin.token}` },
      payload: { userId: thirdUser.id, role: 'OWNER' },
    });
    expect(response.statusCode).toBe(403);
  });

  it('prevents demoting or removing the last remaining owner', async () => {
    const { body: org } = await createOrg(owner);

    const demote = await app.inject({
      method: 'PATCH',
      url: `/api/v1/organizations/${org.id}/members/${owner.id}`,
      headers: { authorization: `Bearer ${owner.token}` },
      payload: { role: 'ADMIN' },
    });
    expect(demote.statusCode).toBe(409);

    const remove = await app.inject({
      method: 'DELETE',
      url: `/api/v1/organizations/${org.id}/members/${owner.id}`,
      headers: { authorization: `Bearer ${owner.token}` },
    });
    expect(remove.statusCode).toBe(409);
  });

  it('rejects adding the same member twice', async () => {
    const { body: org } = await createOrg(owner);
    const member = await fixtureUser('org-test-duplicate-member', 'orgtestdupmember');

    const first = await app.inject({
      method: 'POST',
      url: `/api/v1/organizations/${org.id}/members`,
      headers: { authorization: `Bearer ${owner.token}` },
      payload: { userId: member.id, role: 'MEMBER' },
    });
    expect(first.statusCode).toBe(201);

    const second = await app.inject({
      method: 'POST',
      url: `/api/v1/organizations/${org.id}/members`,
      headers: { authorization: `Bearer ${owner.token}` },
      payload: { userId: member.id, role: 'MEMBER' },
    });
    expect(second.statusCode).toBe(409);
  });
});
