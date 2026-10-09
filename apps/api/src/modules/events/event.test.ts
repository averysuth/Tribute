import { prisma } from '@tribute/database';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  buildTestApp,
  getOrCreateTestUser,
  syncTestUserProfile,
  uniqueSlug,
  type TestUser,
} from '../../test/helpers.js';

describe('events module', () => {
  const app = buildTestApp();
  let owner: TestUser;
  let outsider: TestUser;
  let organizationId: string;
  const createdOrgIds: string[] = [];

  async function fixtureUser(localPart: string, username: string): Promise<TestUser> {
    const user = await getOrCreateTestUser(localPart);
    await syncTestUserProfile(app, user, username);
    return user;
  }

  function validEventPayload(overrides: Record<string, unknown> = {}) {
    return {
      name: 'Fall Powwow',
      slug: uniqueSlug('event'),
      timeZone: 'America/Denver',
      startsAt: '2027-10-01T18:00:00.000Z',
      endsAt: '2027-10-02T02:00:00.000Z',
      ...overrides,
    };
  }

  beforeAll(async () => {
    owner = await fixtureUser('event-test-owner', 'eventtestowner');
    outsider = await fixtureUser('event-test-outsider', 'eventtestoutsider');

    const orgResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/organizations',
      headers: { authorization: `Bearer ${owner.token}` },
      payload: { name: 'Event Test Org', slug: uniqueSlug('event-test-org') },
    });
    organizationId = orgResponse.json().id;
    createdOrgIds.push(organizationId);
  });

  afterAll(async () => {
    await prisma.organization.deleteMany({ where: { id: { in: createdOrgIds } } });
    await app.close();
  });

  it('rejects creating an event without authentication', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/organizations/${organizationId}/events`,
      payload: validEventPayload(),
    });
    expect(response.statusCode).toBe(401);
  });

  it('rejects a non-member creating an event for an organization', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/organizations/${organizationId}/events`,
      headers: { authorization: `Bearer ${outsider.token}` },
      payload: validEventPayload(),
    });
    expect(response.statusCode).toBe(403);
  });

  it('rejects endsAt before startsAt', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/organizations/${organizationId}/events`,
      headers: { authorization: `Bearer ${owner.token}` },
      payload: validEventPayload({
        startsAt: '2027-10-02T00:00:00.000Z',
        endsAt: '2027-10-01T00:00:00.000Z',
      }),
    });
    expect(response.statusCode).toBe(400);
  });

  it('rejects forbidden fields on create (e.g. organizationId in body)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/organizations/${organizationId}/events`,
      headers: { authorization: `Bearer ${owner.token}` },
      payload: validEventPayload({ organizationId: 'something-else' }),
    });
    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('VALIDATION_ERROR');
  });

  it('allows an org member to create and read back an event', async () => {
    const createResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/organizations/${organizationId}/events`,
      headers: { authorization: `Bearer ${owner.token}` },
      payload: validEventPayload(),
    });
    expect(createResponse.statusCode).toBe(201);
    const event = createResponse.json();

    const getResponse = await app.inject({ method: 'GET', url: `/api/v1/events/${event.id}` });
    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.json().organization.id).toBe(organizationId);
  });

  it('returns 404 for a nonexistent event', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/events/00000000-0000-0000-0000-000000000000',
    });
    expect(response.statusCode).toBe(404);
  });

  it('lists events for an organization', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/organizations/${organizationId}/events`,
    });
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.json())).toBe(true);
  });

  it('rejects an outsider updating or deleting an event', async () => {
    const createResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/organizations/${organizationId}/events`,
      headers: { authorization: `Bearer ${owner.token}` },
      payload: validEventPayload(),
    });
    const event = createResponse.json();

    const updateResponse = await app.inject({
      method: 'PATCH',
      url: `/api/v1/events/${event.id}`,
      headers: { authorization: `Bearer ${outsider.token}` },
      payload: { name: 'Hijacked' },
    });
    expect(updateResponse.statusCode).toBe(403);

    const deleteResponse = await app.inject({
      method: 'DELETE',
      url: `/api/v1/events/${event.id}`,
      headers: { authorization: `Bearer ${outsider.token}` },
    });
    expect(deleteResponse.statusCode).toBe(403);

    const stillThere = await prisma.event.findUnique({ where: { id: event.id } });
    expect(stillThere).not.toBeNull();
    expect(stillThere?.name).toBe('Fall Powwow');
  });

  it('allows the owner to update and delete their event', async () => {
    const createResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/organizations/${organizationId}/events`,
      headers: { authorization: `Bearer ${owner.token}` },
      payload: validEventPayload(),
    });
    const event = createResponse.json();

    const updateResponse = await app.inject({
      method: 'PATCH',
      url: `/api/v1/events/${event.id}`,
      headers: { authorization: `Bearer ${owner.token}` },
      payload: { name: 'Renamed Powwow' },
    });
    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json().name).toBe('Renamed Powwow');

    const deleteResponse = await app.inject({
      method: 'DELETE',
      url: `/api/v1/events/${event.id}`,
      headers: { authorization: `Bearer ${owner.token}` },
    });
    expect(deleteResponse.statusCode).toBe(204);

    const getResponse = await app.inject({ method: 'GET', url: `/api/v1/events/${event.id}` });
    expect(getResponse.statusCode).toBe(404);
  });
});
