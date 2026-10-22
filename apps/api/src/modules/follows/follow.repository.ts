import { prisma } from '@tribute/database';

import type { FollowedOrganizationSummary, FollowedUserSummary } from './follow.types.js';

const userSummarySelect = { id: true, username: true, displayName: true, avatarUrl: true } as const;
const organizationSummarySelect = { id: true, name: true, slug: true } as const;

export const followRepository = {
  followUser(followerId: string, followingId: string) {
    return prisma.userFollow.create({ data: { followerId, followingId } });
  },

  unfollowUser(followerId: string, followingId: string): Promise<{ count: number }> {
    return prisma.userFollow.deleteMany({ where: { followerId, followingId } });
  },

  async listFollowers(userId: string): Promise<FollowedUserSummary[]> {
    const rows = await prisma.userFollow.findMany({
      where: { followingId: userId },
      include: { follower: { select: userSummarySelect } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => row.follower);
  },

  async listFollowing(userId: string): Promise<FollowedUserSummary[]> {
    const rows = await prisma.userFollow.findMany({
      where: { followerId: userId },
      include: { following: { select: userSummarySelect } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => row.following);
  },

  followOrganization(userId: string, organizationId: string) {
    return prisma.organizationFollow.create({ data: { userId, organizationId } });
  },

  unfollowOrganization(userId: string, organizationId: string): Promise<{ count: number }> {
    return prisma.organizationFollow.deleteMany({ where: { userId, organizationId } });
  },

  async listOrganizationFollowers(organizationId: string): Promise<FollowedUserSummary[]> {
    const rows = await prisma.organizationFollow.findMany({
      where: { organizationId },
      include: { user: { select: userSummarySelect } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => row.user);
  },

  async listFollowedOrganizations(userId: string): Promise<FollowedOrganizationSummary[]> {
    const rows = await prisma.organizationFollow.findMany({
      where: { userId },
      include: { organization: { select: organizationSummarySelect } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => row.organization);
  },
};
