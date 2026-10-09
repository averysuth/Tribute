import { prisma, type OrganizationRole } from '@tribute/database';

import type { CreateOrganizationInput, UpdateOrganizationInput } from './organization.schema.js';
import type { Organization, OrganizationMemberWithUser } from './organization.types.js';

const memberWithUser = {
  user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
} as const;

export const organizationRepository = {
  findBySlug(slug: string): Promise<Organization | null> {
    return prisma.organization.findUnique({ where: { slug } });
  },

  findById(id: string): Promise<Organization | null> {
    return prisma.organization.findUnique({ where: { id } });
  },

  create(data: CreateOrganizationInput & { createdBy: string }): Promise<Organization> {
    return prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: data.name,
          slug: data.slug,
          createdBy: data.createdBy,
          ...(data.description !== undefined && { description: data.description }),
        },
      });
      await tx.organizationMember.create({
        data: { organizationId: organization.id, userId: data.createdBy, role: 'OWNER' },
      });
      return organization;
    });
  },

  update(id: string, data: UpdateOrganizationInput): Promise<Organization> {
    return prisma.organization.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
      },
    });
  },

  listMembers(organizationId: string): Promise<OrganizationMemberWithUser[]> {
    return prisma.organizationMember.findMany({
      where: { organizationId },
      include: memberWithUser,
      orderBy: { createdAt: 'asc' },
    });
  },

  findMembership(organizationId: string, userId: string) {
    return prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
    });
  },

  countOwners(organizationId: string): Promise<number> {
    return prisma.organizationMember.count({ where: { organizationId, role: 'OWNER' } });
  },

  addMember(
    organizationId: string,
    userId: string,
    role: OrganizationRole,
  ): Promise<OrganizationMemberWithUser> {
    return prisma.organizationMember.create({
      data: { organizationId, userId, role },
      include: memberWithUser,
    });
  },

  updateMemberRole(
    organizationId: string,
    userId: string,
    role: OrganizationRole,
  ): Promise<OrganizationMemberWithUser> {
    return prisma.organizationMember.update({
      where: { organizationId_userId: { organizationId, userId } },
      data: { role },
      include: memberWithUser,
    });
  },

  removeMember(organizationId: string, userId: string): Promise<{ count: number }> {
    return prisma.organizationMember.deleteMany({ where: { organizationId, userId } });
  },
};
