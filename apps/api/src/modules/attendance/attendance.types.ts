import type { EventAttendance } from '@tribute/database';

export type { EventAttendance };

export type EventAttendanceWithUser = EventAttendance & {
  user: { id: string; username: string; displayName: string; avatarUrl: string | null };
};
