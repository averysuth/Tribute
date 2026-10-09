import type { Event } from '@tribute/database';

export type { Event };

export type EventWithOrganization = Event & {
  organization: { id: string; name: string; slug: string };
};
