import type { FastifyPluginAsync } from 'fastify';

import {
  listAttendance,
  removeMyAttendance,
  setAttendanceVerification,
  setMyAttendance,
} from './attendance.controller.js';

export const attendanceRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/:eventId/attendance', { preHandler: fastify.tryAuthenticate }, listAttendance);
  fastify.put('/:eventId/attendance/me', { preHandler: fastify.authenticate }, setMyAttendance);
  fastify.delete(
    '/:eventId/attendance/me',
    { preHandler: fastify.authenticate },
    removeMyAttendance,
  );
  fastify.patch(
    '/:eventId/attendance/:userId/verification',
    { preHandler: fastify.authenticate },
    setAttendanceVerification,
  );
};
