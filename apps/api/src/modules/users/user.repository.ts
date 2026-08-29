import { prisma } from '@tribute/database';

import type { UserProfile } from './user.types.js';

export const userRepository = {
  findById(id: string): Promise<UserProfile | null> {
    return prisma.userProfile.findUnique({ where: { id } });
  },

  create(data: { id: string; username: string; displayName: string }): Promise<UserProfile> {
    return prisma.userProfile.create({ data });
  },
};
