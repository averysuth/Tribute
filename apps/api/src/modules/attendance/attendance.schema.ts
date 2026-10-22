import { z } from '@tribute/validation';

export const attendanceTypeSchema = z.enum(['INTERESTED', 'ATTENDING', 'COMPETING']);

export const upsertAttendanceSchema = z
  .object({
    attendanceType: attendanceTypeSchema,
  })
  .strict();

export const setVerificationSchema = z
  .object({
    verified: z.boolean(),
  })
  .strict();

export const eventIdParamsSchema = z.object({
  eventId: z.string().uuid(),
});

export const attendanceMemberParamsSchema = eventIdParamsSchema.extend({
  userId: z.string().uuid(),
});

export const listAttendanceQuerySchema = z.object({
  danceStyleId: z.string().uuid().optional(),
  followedOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
});

export type UpsertAttendanceInput = z.infer<typeof upsertAttendanceSchema>;
export type SetVerificationInput = z.infer<typeof setVerificationSchema>;
export type ListAttendanceQuery = z.infer<typeof listAttendanceQuerySchema>;
