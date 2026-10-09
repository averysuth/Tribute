import { prisma } from '@tribute/database';

import type { UpsertPerformerProfileInput } from './profile.schema.js';
import type { PerformerProfileView, PerformerProfileWithStyles } from './profile.types.js';

const withStyles = {
  danceStyles: { include: { danceStyle: true } },
} as const;

const withStylesAndUser = {
  ...withStyles,
  user: {
    select: { id: true, username: true, displayName: true, avatarUrl: true, bio: true },
  },
} as const;

export const profileRepository = {
  findByUserId(userId: string): Promise<PerformerProfileView | null> {
    return prisma.performerProfile.findUnique({
      where: { userId },
      include: withStylesAndUser,
    });
  },

  async upsert(
    userId: string,
    data: UpsertPerformerProfileInput,
  ): Promise<PerformerProfileWithStyles> {
    return prisma.$transaction(async (tx) => {
      const profile = await tx.performerProfile.upsert({
        where: { userId },
        create: {
          userId,
          performerType: data.performerType,
          ...(data.journey !== undefined && { journey: data.journey }),
          ...(data.region !== undefined && { region: data.region }),
          ...(data.community !== undefined && { community: data.community }),
        },
        update: {
          performerType: data.performerType,
          ...(data.journey !== undefined && { journey: data.journey }),
          ...(data.region !== undefined && { region: data.region }),
          ...(data.community !== undefined && { community: data.community }),
        },
      });

      if (data.danceStyles) {
        await tx.performerDanceStyle.deleteMany({ where: { performerId: profile.id } });
        if (data.danceStyles.length > 0) {
          await tx.performerDanceStyle.createMany({
            data: data.danceStyles.map((entry) => ({
              performerId: profile.id,
              danceStyleId: entry.danceStyleId,
              isPrimary: entry.isPrimary,
            })),
          });
        }
      }

      return tx.performerProfile.findUniqueOrThrow({
        where: { id: profile.id },
        include: withStyles,
      });
    });
  },

  deleteByUserId(userId: string): Promise<{ count: number }> {
    return prisma.performerProfile.deleteMany({ where: { userId } });
  },
};
