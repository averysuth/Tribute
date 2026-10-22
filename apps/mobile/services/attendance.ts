import { apiRequest } from './api-client';

export type AttendanceType = 'INTERESTED' | 'ATTENDING' | 'COMPETING';

export interface Attendance {
  eventId: string;
  userId: string;
  attendanceType: AttendanceType;
  verified: boolean;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceWithUser extends Attendance {
  user: { id: string; username: string; displayName: string; avatarUrl: string | null };
}

export function setMyAttendance(
  eventId: string,
  attendanceType: AttendanceType,
): Promise<Attendance> {
  return apiRequest<Attendance>(`/api/v1/events/${eventId}/attendance/me`, {
    method: 'PUT',
    body: { attendanceType },
  });
}

export function removeMyAttendance(eventId: string): Promise<void> {
  return apiRequest<void>(`/api/v1/events/${eventId}/attendance/me`, { method: 'DELETE' });
}

export function listAttendance(
  eventId: string,
  options: { danceStyleId?: string; followedOnly?: boolean } = {},
): Promise<AttendanceWithUser[]> {
  const params = new URLSearchParams();
  if (options.danceStyleId) {
    params.set('danceStyleId', options.danceStyleId);
  }
  if (options.followedOnly) {
    params.set('followedOnly', 'true');
  }
  const query = params.toString();

  return apiRequest<AttendanceWithUser[]>(
    `/api/v1/events/${eventId}/attendance${query ? `?${query}` : ''}`,
    {
      authenticated: !!options.followedOnly,
    },
  );
}
