import { prisma } from '@tribute/database';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  buildTestApp,
  getOrCreateTestUser,
  syncTestUserProfile,
  uniqueSlug,
  type TestUser,
} from '../../test/helpers.js';

describe('attendance module', () => {
  const app = buildTestApp();
  let orgOwner: TestUser;
  let dancer: TestUser;
  let outsider: TestUser;
  let eventId: string;
  const createdOrgIds: string[] = [];

  async function fixtureUser(localPart: string, username: string): Promise<TestUser> {
    const user = await getOrCreateTestUser(localPart);
    await syncTestUserProfile(app, user, username);
    return user;
  }

  beforeAll(async () => {
    orgOwner = await fixtureUser('attendance-test-owner', 'attndtestowner');
    dancer = await fixtureUser('attendance-test-dancer', 'attndtestdancer');
    outsider = await fixtureUser('attendance-test-outsider', 'attndtestoutside');

    const orgResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/organizations',
      headers: { authorization: `Bearer ${orgOwner.token}` },
      payload: { name: 'Attendance Test Org', slug: uniqueSlug('attendance-test-org') },
    });
    const organizationId = orgResponse.json().id;
    createdOrgIds.push(organizationId);

    const eventResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/organizations/${organizationId}/events`,
      headers: { authorization: `Bearer ${orgOwner.token}` },
      payload: {
        name: 'Attendance Test Powwow',
        slug: uniqueSlug('attendance-test-event'),
        timeZone: 'America/Denver',
        startsAt: '2027-11-01T18:00:00.000Z',
        endsAt: '2027-11-02T02:00:00.000Z',
      },
    });
    eventId = eventResponse.json().id;
  });

  afterAll(async () => {
    await prisma.organization.deleteMany({ where: { id: { in: createdOrgIds } } });
    await app.close();
  });

  it('rejects setting attendance without authentication', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/api/v1/events/${eventId}/attendance/me`,
      payload: { attendanceType: 'ATTENDING' },
    });
    expect(response.statusCode).toBe(401);
  });

  it('rejects an invalid attendance type', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/api/v1/events/${eventId}/attendance/me`,
      headers: { authorization: `Bearer ${dancer.token}` },
      payload: { attendanceType: 'MAYBE' },
    });
    expect(response.statusCode).toBe(400);
  });

  it('lets a dancer self-report attendance and update it', async () => {
    const first = await app.inject({
      method: 'PUT',
      url: `/api/v1/events/${eventId}/attendance/me`,
      headers: { authorization: `Bearer ${dancer.token}` },
      payload: { attendanceType: 'INTERESTED' },
    });
    expect(first.statusCode).toBe(200);
    expect(first.json().attendanceType).toBe('INTERESTED');
    expect(first.json().verified).toBe(false);

    const second = await app.inject({
      method: 'PUT',
      url: `/api/v1/events/${eventId}/attendance/me`,
      headers: { authorization: `Bearer ${dancer.token}` },
      payload: { attendanceType: 'ATTENDING' },
    });
    expect(second.statusCode).toBe(200);
    expect(second.json().attendanceType).toBe('ATTENDING');
  });

  it('lists attendees publicly, including the self-reported dancer', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/events/${eventId}/attendance`,
    });
    expect(response.statusCode).toBe(200);
    const attendees = response.json();
    expect(attendees.some((a: { user: { id: string } }) => a.user.id === dancer.id)).toBe(true);
  });

  it('rejects an outsider verifying an attendance', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: `/api/v1/events/${eventId}/attendance/${dancer.id}/verification`,
      headers: { authorization: `Bearer ${outsider.token}` },
      payload: { verified: true },
    });
    expect(response.statusCode).toBe(403);
  });

  it('rejects verifying an attendance that was never self-reported', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: `/api/v1/events/${eventId}/attendance/${outsider.id}/verification`,
      headers: { authorization: `Bearer ${orgOwner.token}` },
      payload: { verified: true },
    });
    expect(response.statusCode).toBe(404);
  });

  it('lets the org owner verify an existing self-reported attendance', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: `/api/v1/events/${eventId}/attendance/${dancer.id}/verification`,
      headers: { authorization: `Bearer ${orgOwner.token}` },
      payload: { verified: true },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().verified).toBe(true);
  });

  it('requires authentication to filter attendees by followed dancers', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/events/${eventId}/attendance?followedOnly=true`,
    });
    expect(response.statusCode).toBe(401);
  });

  it('filters attendees to only followed dancers when requested', async () => {
    await app.inject({
      method: 'POST',
      url: `/api/v1/users/${dancer.id}/follow`,
      headers: { authorization: `Bearer ${outsider.token}` },
    });

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/events/${eventId}/attendance?followedOnly=true`,
      headers: { authorization: `Bearer ${outsider.token}` },
    });
    expect(response.statusCode).toBe(200);
    const attendees = response.json();
    expect(attendees.every((a: { user: { id: string } }) => a.user.id === dancer.id)).toBe(true);
    expect(attendees.length).toBeGreaterThan(0);

    await prisma.userFollow.deleteMany({ where: { followerId: outsider.id } });
  });

  it('lets a dancer remove their own attendance', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: `/api/v1/events/${eventId}/attendance/me`,
      headers: { authorization: `Bearer ${dancer.token}` },
    });
    expect(response.statusCode).toBe(204);

    const list = await app.inject({ method: 'GET', url: `/api/v1/events/${eventId}/attendance` });
    expect(list.json().some((a: { user: { id: string } }) => a.user.id === dancer.id)).toBe(false);
  });
});
