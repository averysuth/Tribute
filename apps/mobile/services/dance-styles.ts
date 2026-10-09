import { apiRequest } from './api-client';

export interface DanceStyle {
  id: string;
  name: string;
  slug: string;
}

export function listDanceStyles(): Promise<DanceStyle[]> {
  return apiRequest<DanceStyle[]>('/api/v1/dance-styles', { authenticated: false });
}
