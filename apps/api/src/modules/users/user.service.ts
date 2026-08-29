import { Prisma } from '@tribute/database';

import { ConflictError } from '../../lib/errors.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { userRepository } from './user.repository.js';
import type { SyncUserProfileInput } from './user.schema.js';
import type { UserProfile } from './user.types.js';

export const userService = {
  async syncProfile(
    user: AuthenticatedUser,
    input: SyncUserProfileInput,
  ): Promise<{ profile: UserProfile; created: boolean }> {
    const existing = await userRepository.findById(user.id);
    if (existing) {
      return { profile: existing, created: false };
    }

    try {
      const profile = await userRepository.create({
        id: user.id,
        username: input.username,
        displayName: input.displayName,
      });
      return { profile, created: true };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictError('Username is already taken');
      }
      throw error;
    }
  },
};
