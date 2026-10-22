import { Prisma, prisma } from '@tribute/database';

import { ConflictError, NotFoundError, ValidationError } from '../../lib/errors.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { followRepository } from './follow.repository.js';
import type { FollowedOrganizationSummary, FollowedUserSummary } from './follow.types.js';

async function requireUserExists(userId: string): Promise<void> {
  const exists = await prisma.userProfile.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!exists) {
    throw new NotFoundError('User not found');
  }
}

async function requireOrganizationExists(organizationId: string): Promise<void> {
  const exists = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true },
  });
  if (!exists) {
    throw new NotFoundError('Organization not found');
  }
}

export const followService = {
  async followUser(actingUser: AuthenticatedUser, targetUserId: string): Promise<void> {
    if (actingUser.id === targetUserId) {
      throw new ValidationError('You cannot follow yourself');
    }
    await requireUserExists(targetUserId);

    try {
      await followRepository.followUser(actingUser.id, targetUserId);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictError('Already following this user');
      }
      throw error;
    }
  },

  async unfollowUser(actingUser: AuthenticatedUser, targetUserId: string): Promise<void> {
    const result = await followRepository.unfollowUser(actingUser.id, targetUserId);
    if (result.count === 0) {
      throw new NotFoundError('You are not following this user');
    }
  },

  async listFollowers(userId: string): Promise<FollowedUserSummary[]> {
    await requireUserExists(userId);
    return followRepository.listFollowers(userId);
  },

  async listFollowing(userId: string): Promise<FollowedUserSummary[]> {
    await requireUserExists(userId);
    return followRepository.listFollowing(userId);
  },

  async followOrganization(actingUser: AuthenticatedUser, organizationId: string): Promise<void> {
    await requireOrganizationExists(organizationId);

    try {
      await followRepository.followOrganization(actingUser.id, organizationId);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictError('Already following this organization');
      }
      throw error;
    }
  },

  async unfollowOrganization(actingUser: AuthenticatedUser, organizationId: string): Promise<void> {
    const result = await followRepository.unfollowOrganization(actingUser.id, organizationId);
    if (result.count === 0) {
      throw new NotFoundError('You are not following this organization');
    }
  },

  async listOrganizationFollowers(organizationId: string): Promise<FollowedUserSummary[]> {
    await requireOrganizationExists(organizationId);
    return followRepository.listOrganizationFollowers(organizationId);
  },

  async listFollowedOrganizations(userId: string): Promise<FollowedOrganizationSummary[]> {
    await requireUserExists(userId);
    return followRepository.listFollowedOrganizations(userId);
  },
};
