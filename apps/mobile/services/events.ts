import { apiRequest } from './api-client';

export interface Event {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  description: string | null;
  posterUrl: string | null;
  venueName: string | null;
  address: string | null;
  mapUrl: string | null;
  timeZone: string;
  startsAt: string;
  endsAt: string;
  registrationUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EventWithOrganization extends Event {
  organization: { id: string; name: string; slug: string };
}

export interface CreateEventInput {
  name: string;
  slug: string;
  description?: string;
  posterUrl?: string;
  venueName?: string;
  address?: string;
  mapUrl?: string;
  registrationUrl?: string;
  timeZone: string;
  startsAt: string;
  endsAt: string;
}

export function listOrganizationEvents(organizationId: string): Promise<Event[]> {
  return apiRequest<Event[]>(`/api/v1/organizations/${organizationId}/events`, { authenticated: false });
}

export function createEvent(organizationId: string, input: CreateEventInput): Promise<Event> {
  return apiRequest<Event>(`/api/v1/organizations/${organizationId}/events`, {
    method: 'POST',
    body: input,
  });
}

export function getEvent(eventId: string): Promise<EventWithOrganization> {
  return apiRequest<EventWithOrganization>(`/api/v1/events/${eventId}`, { authenticated: false });
}
