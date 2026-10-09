import { prisma } from '@tribute/database';

import type { CreateEventInput, UpdateEventInput } from './event.schema.js';
import type { Event, EventWithOrganization } from './event.types.js';

const withOrganization = {
  organization: { select: { id: true, name: true, slug: true } },
} as const;

export const eventRepository = {
  findById(eventId: string): Promise<EventWithOrganization | null> {
    return prisma.event.findUnique({ where: { id: eventId }, include: withOrganization });
  },

  listByOrganization(organizationId: string): Promise<Event[]> {
    return prisma.event.findMany({
      where: { organizationId },
      orderBy: { startsAt: 'asc' },
    });
  },

  create(organizationId: string, data: CreateEventInput): Promise<Event> {
    return prisma.event.create({
      data: {
        organizationId,
        name: data.name,
        slug: data.slug,
        timeZone: data.timeZone,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        ...(data.description !== undefined && { description: data.description }),
        ...(data.posterUrl !== undefined && { posterUrl: data.posterUrl }),
        ...(data.venueName !== undefined && { venueName: data.venueName }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.mapUrl !== undefined && { mapUrl: data.mapUrl }),
        ...(data.registrationUrl !== undefined && { registrationUrl: data.registrationUrl }),
      },
    });
  },

  update(eventId: string, data: UpdateEventInput): Promise<Event> {
    return prisma.event.update({
      where: { id: eventId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.posterUrl !== undefined && { posterUrl: data.posterUrl }),
        ...(data.venueName !== undefined && { venueName: data.venueName }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.mapUrl !== undefined && { mapUrl: data.mapUrl }),
        ...(data.registrationUrl !== undefined && { registrationUrl: data.registrationUrl }),
        ...(data.timeZone !== undefined && { timeZone: data.timeZone }),
        ...(data.startsAt !== undefined && { startsAt: data.startsAt }),
        ...(data.endsAt !== undefined && { endsAt: data.endsAt }),
      },
    });
  },

  delete(eventId: string): Promise<{ count: number }> {
    return prisma.event.deleteMany({ where: { id: eventId } });
  },
};
