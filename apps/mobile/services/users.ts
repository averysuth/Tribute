import { ApiError, apiRequest } from './api-client';

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SyncUserProfileInput {
  username: string;
  displayName: string;
}

export function syncMyUserProfile(input: SyncUserProfileInput): Promise<UserProfile> {
  return apiRequest<UserProfile>('/api/v1/users/me', { method: 'POST', body: input });
}

export async function getMyUserProfile(): Promise<UserProfile | null> {
  try {
    return await apiRequest<UserProfile>('/api/v1/users/me');
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      return null;
    }
    throw error;
  }
}
