import { prisma } from '@tribute/database';

import { AuthenticationError, NotFoundError } from '../../lib/errors.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { requireOrgRole } from '../organizations/organization.authorization.js';
import { attendanceRepository } from './attendance.repository.js';
import type { ListAttendanceQuery, UpsertAttendanceInput } from './attendance.schema.js';
import type { EventAttendance, EventAttendanceWithUser } from './attendance.types.js';

const MANAGE_ROLES = ['OWNER', 'ADMIN'] as const;

async function getEventOrThrow(eventId: string): Promise<{ id: string; organizationId: string }> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, organizationId: true },
  });
  if (!event) {
    throw new NotFoundError('Event not found');
  }
  return event;
}

export const attendanceService = {
  async setMyAttendance(
    user: AuthenticatedUser,
    eventId: string,
    input: UpsertAttendanceInput,
  ): Promise<EventAttendance> {
    await getEventOrThrow(eventId);
    return attendanceRepository.upsert(eventId, user.id, input.attendanceType);
  },

  async removeMyAttendance(user: AuthenticatedUser, eventId: string): Promise<void> {
    await getEventOrThrow(eventId);
    const result = await attendanceRepository.remove(eventId, user.id);
    if (result.count === 0) {
      throw new NotFoundError('Attendance not found');
    }
  },

  async list(
    eventId: string,
    query: ListAttendanceQuery,
    requestingUserId: string | undefined,
  ): Promise<EventAttendanceWithUser[]> {
    await getEventOrThrow(eventId);

    if (query.followedOnly && !requestingUserId) {
      throw new AuthenticationError('Authentication required to filter by followed dancers');
    }

    return attendanceRepository.list(eventId, {
      ...(query.danceStyleId !== undefined && { danceStyleId: query.danceStyleId }),
      ...(query.followedOnly && requestingUserId !== undefined && { followerId: requestingUserId }),
    });
  },

  async setVerification(
    actingUser: AuthenticatedUser,
    eventId: string,
    targetUserId: string,
    verified: boolean,
  ): Promise<EventAttendance> {
    const event = await getEventOrThrow(eventId);
    await requireOrgRole(actingUser.id, event.organizationId, [...MANAGE_ROLES]);

    const existing = await attendanceRepository.findByEventAndUser(eventId, targetUserId);
    if (!existing) {
      throw new NotFoundError('Attendance not found');
    }

    return attendanceRepository.setVerification(eventId, targetUserId, verified);
  },
};
