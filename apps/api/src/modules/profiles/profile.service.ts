import { NotFoundError } from '../../lib/errors.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { profileRepository } from './profile.repository.js';
import type { UpsertPerformerProfileInput } from './profile.schema.js';
import type { PerformerProfileView, PerformerProfileWithStyles } from './profile.types.js';

export const profileService = {
  async getByUserId(userId: string): Promise<PerformerProfileView> {
    const profile = await profileRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundError('Performer profile not found');
    }
    return profile;
  },

  activateOrUpdate(
    user: AuthenticatedUser,
    input: UpsertPerformerProfileInput,
  ): Promise<PerformerProfileWithStyles> {
    return profileRepository.upsert(user.id, input);
  },

  async deactivate(user: AuthenticatedUser): Promise<void> {
    const result = await profileRepository.deleteByUserId(user.id);
    if (result.count === 0) {
      throw new NotFoundError('Performer profile not found');
    }
  },
};
