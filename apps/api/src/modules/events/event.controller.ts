import type { FastifyReply, FastifyRequest } from 'fastify';

import { requireUser } from '../auth/auth.plugin.js';
import {
  createEventSchema,
  eventIdParamsSchema,
  organizationEventsParamsSchema,
  updateEventSchema,
} from './event.schema.js';
import { eventService } from './event.service.js';

export async function listOrganizationEvents(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { organizationId } = organizationEventsParamsSchema.parse(request.params);
  const events = await eventService.listByOrganization(organizationId);
  reply.send(events);
}

export async function createEvent(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const user = requireUser(request);
  const { organizationId } = organizationEventsParamsSchema.parse(request.params);
  const input = createEventSchema.parse(request.body);
  const event = await eventService.create(user, organizationId, input);
  reply.status(201).send(event);
}

export async function getEvent(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { eventId } = eventIdParamsSchema.parse(request.params);
  const event = await eventService.getById(eventId);
  reply.send(event);
}

export async function updateEvent(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const user = requireUser(request);
  const { eventId } = eventIdParamsSchema.parse(request.params);
  const input = updateEventSchema.parse(request.body);
  const event = await eventService.update(user, eventId, input);
  reply.send(event);
}

export async function deleteEvent(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const user = requireUser(request);
  const { eventId } = eventIdParamsSchema.parse(request.params);
  await eventService.remove(user, eventId);
  reply.status(204).send();
}
