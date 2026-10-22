import { apiRequest } from './api-client';

export interface FollowedUserSummary {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface FollowedOrganizationSummary {
  id: string;
  name: string;
  slug: string;
}

export function followUser(userId: string): Promise<void> {
  return apiRequest<void>(`/api/v1/users/${userId}/follow`, { method: 'POST' });
}

export function unfollowUser(userId: string): Promise<void> {
  return apiRequest<void>(`/api/v1/users/${userId}/follow`, { method: 'DELETE' });
}

export function listFollowers(userId: string): Promise<FollowedUserSummary[]> {
  return apiRequest<FollowedUserSummary[]>(`/api/v1/users/${userId}/followers`, {
    authenticated: false,
  });
}

export function listFollowing(userId: string): Promise<FollowedUserSummary[]> {
  return apiRequest<FollowedUserSummary[]>(`/api/v1/users/${userId}/following`, {
    authenticated: false,
  });
}

export function followOrganization(organizationId: string): Promise<void> {
  return apiRequest<void>(`/api/v1/organizations/${organizationId}/follow`, { method: 'POST' });
}

export function unfollowOrganization(organizationId: string): Promise<void> {
  return apiRequest<void>(`/api/v1/organizations/${organizationId}/follow`, { method: 'DELETE' });
}

export function listOrganizationFollowers(organizationId: string): Promise<FollowedUserSummary[]> {
  return apiRequest<FollowedUserSummary[]>(`/api/v1/organizations/${organizationId}/followers`, {
    authenticated: false,
  });
}

export function listFollowedOrganizations(userId: string): Promise<FollowedOrganizationSummary[]> {
  return apiRequest<FollowedOrganizationSummary[]>(
    `/api/v1/users/${userId}/followed-organizations`,
    {
      authenticated: false,
    },
  );
}
