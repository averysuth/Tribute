import { prisma, type AttendanceType } from '@tribute/database';

import type { EventAttendance, EventAttendanceWithUser } from './attendance.types.js';

const withUser = {
  user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
} as const;

export const attendanceRepository = {
  findByEventAndUser(eventId: string, userId: string): Promise<EventAttendance | null> {
    return prisma.eventAttendance.findUnique({ where: { eventId_userId: { eventId, userId } } });
  },

  upsert(
    eventId: string,
    userId: string,
    attendanceType: AttendanceType,
  ): Promise<EventAttendance> {
    return prisma.eventAttendance.upsert({
      where: { eventId_userId: { eventId, userId } },
      create: { eventId, userId, attendanceType },
      update: { attendanceType },
    });
  },

  remove(eventId: string, userId: string): Promise<{ count: number }> {
    return prisma.eventAttendance.deleteMany({ where: { eventId, userId } });
  },

  list(
    eventId: string,
    filters: { danceStyleId?: string; followerId?: string },
  ): Promise<EventAttendanceWithUser[]> {
    return prisma.eventAttendance.findMany({
      where: {
        eventId,
        ...(filters.danceStyleId && {
          user: {
            performerProfile: { danceStyles: { some: { danceStyleId: filters.danceStyleId } } },
          },
        }),
        ...(filters.followerId && {
          user: { followedBy: { some: { followerId: filters.followerId } } },
        }),
      },
      include: withUser,
      orderBy: { createdAt: 'asc' },
    });
  },

  setVerification(eventId: string, userId: string, verified: boolean): Promise<EventAttendance> {
    return prisma.eventAttendance.update({
      where: { eventId_userId: { eventId, userId } },
      data: { verified, verifiedAt: verified ? new Date() : null },
    });
  },
};
