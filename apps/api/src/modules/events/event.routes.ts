import type { FastifyPluginAsync } from 'fastify';

import {
  createEvent,
  deleteEvent,
  getEvent,
  listOrganizationEvents,
  updateEvent,
} from './event.controller.js';

export const organizationEventRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/:organizationId/events', listOrganizationEvents);
  fastify.post('/:organizationId/events', { preHandler: fastify.authenticate }, createEvent);
};

export const eventRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/:eventId', getEvent);
  fastify.patch('/:eventId', { preHandler: fastify.authenticate }, updateEvent);
  fastify.delete('/:eventId', { preHandler: fastify.authenticate }, deleteEvent);
};
