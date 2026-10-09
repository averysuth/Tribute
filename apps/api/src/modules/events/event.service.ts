import { Prisma } from '@tribute/database';

import { ConflictError, NotFoundError, ValidationError } from '../../lib/errors.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { requireOrgRole } from '../organizations/organization.authorization.js';
import { eventRepository } from './event.repository.js';
import type { CreateEventInput, UpdateEventInput } from './event.schema.js';
import type { Event, EventWithOrganization } from './event.types.js';

const MANAGE_ROLES = ['OWNER', 'ADMIN'] as const;

async function getEventOrThrow(eventId: string): Promise<EventWithOrganization> {
  const event = await eventRepository.findById(eventId);
  if (!event) {
    throw new NotFoundError('Event not found');
  }
  return event;
}

export const eventService = {
  listByOrganization(organizationId: string): Promise<Event[]> {
    return eventRepository.listByOrganization(organizationId);
  },

  async getById(eventId: string): Promise<EventWithOrganization> {
    return getEventOrThrow(eventId);
  },

  async create(
    user: AuthenticatedUser,
    organizationId: string,
    input: CreateEventInput,
  ): Promise<Event> {
    await requireOrgRole(user.id, organizationId, [...MANAGE_ROLES]);

    try {
      return await eventRepository.create(organizationId, input);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictError('An event with this slug already exists for this organization');
      }
      throw error;
    }
  },

  async update(user: AuthenticatedUser, eventId: string, input: UpdateEventInput): Promise<Event> {
    const event = await getEventOrThrow(eventId);
    await requireOrgRole(user.id, event.organizationId, [...MANAGE_ROLES]);

    const startsAt = input.startsAt ?? event.startsAt;
    const endsAt = input.endsAt ?? event.endsAt;
    if (endsAt < startsAt) {
      throw new ValidationError('endsAt must be on or after startsAt');
    }

    return eventRepository.update(eventId, input);
  },

  async remove(user: AuthenticatedUser, eventId: string): Promise<void> {
    const event = await getEventOrThrow(eventId);
    await requireOrgRole(user.id, event.organizationId, [...MANAGE_ROLES]);
    await eventRepository.delete(eventId);
  },
};
