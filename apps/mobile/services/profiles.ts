import { apiRequest } from './api-client';

export interface PerformerDanceStyleView {
  danceStyleId: string;
  isPrimary: boolean;
  danceStyle: { id: string; name: string; slug: string };
}

export interface PerformerProfile {
  id: string;
  userId: string;
  performerType: string;
  journey: string | null;
  region: string | null;
  community: string | null;
  danceStyles: PerformerDanceStyleView[];
}

export interface PerformerProfileView extends PerformerProfile {
  user: { id: string; username: string; displayName: string; avatarUrl: string | null; bio: string | null };
}

export interface UpsertPerformerProfileInput {
  performerType: string;
  journey?: string;
  region?: string;
  community?: string;
  danceStyles?: { danceStyleId: string; isPrimary: boolean }[];
}

export function getPerformerProfile(userId: string): Promise<PerformerProfileView> {
  return apiRequest<PerformerProfileView>(`/api/v1/profiles/${userId}`, { authenticated: false });
}

export function upsertMyPerformerProfile(input: UpsertPerformerProfileInput): Promise<PerformerProfile> {
  return apiRequest<PerformerProfile>('/api/v1/profiles/me', { method: 'PUT', body: input });
}

export function deactivateMyPerformerProfile(): Promise<void> {
  return apiRequest<void>('/api/v1/profiles/me', { method: 'DELETE' });
}
