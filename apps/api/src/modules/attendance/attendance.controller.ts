import type { FastifyReply, FastifyRequest } from 'fastify';

import { requireUser } from '../auth/auth.plugin.js';
import {
  attendanceMemberParamsSchema,
  eventIdParamsSchema,
  listAttendanceQuerySchema,
  setVerificationSchema,
  upsertAttendanceSchema,
} from './attendance.schema.js';
import { attendanceService } from './attendance.service.js';

export async function setMyAttendance(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const user = requireUser(request);
  const { eventId } = eventIdParamsSchema.parse(request.params);
  const input = upsertAttendanceSchema.parse(request.body);
  const attendance = await attendanceService.setMyAttendance(user, eventId, input);
  reply.send(attendance);
}

export async function removeMyAttendance(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const user = requireUser(request);
  const { eventId } = eventIdParamsSchema.parse(request.params);
  await attendanceService.removeMyAttendance(user, eventId);
  reply.status(204).send();
}

export async function listAttendance(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { eventId } = eventIdParamsSchema.parse(request.params);
  const query = listAttendanceQuerySchema.parse(request.query);
  const attendees = await attendanceService.list(eventId, query, request.user?.id);
  reply.send(attendees);
}

export async function setAttendanceVerification(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const actingUser = requireUser(request);
  const { eventId, userId } = attendanceMemberParamsSchema.parse(request.params);
  const { verified } = setVerificationSchema.parse(request.body);
  const attendance = await attendanceService.setVerification(actingUser, eventId, userId, verified);
  reply.send(attendance);
}
