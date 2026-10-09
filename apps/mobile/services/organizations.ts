import { apiRequest } from './api-client';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  description?: string;
}

export function createOrganization(input: CreateOrganizationInput): Promise<Organization> {
  return apiRequest<Organization>('/api/v1/organizations', { method: 'POST', body: input });
}

export function getOrganizationBySlug(slug: string): Promise<Organization> {
  return apiRequest<Organization>(`/api/v1/organizations/${slug}`, { authenticated: false });
}
