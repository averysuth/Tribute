import { Prisma, type OrganizationRole } from '@tribute/database';

import { AuthorizationError, ConflictError, NotFoundError } from '../../lib/errors.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { requireOrgRole } from './organization.authorization.js';
import { organizationRepository } from './organization.repository.js';
import type {
  AddMemberInput,
  CreateOrganizationInput,
  UpdateOrganizationInput,
} from './organization.schema.js';
import type { Organization, OrganizationMemberWithUser } from './organization.types.js';

const MANAGE_ROLES: OrganizationRole[] = ['OWNER', 'ADMIN'];

async function getOrganizationOrThrow(organizationId: string): Promise<Organization> {
  const organization = await organizationRepository.findById(organizationId);
  if (!organization) {
    throw new NotFoundError('Organization not found');
  }
  return organization;
}

export const organizationService = {
  async create(user: AuthenticatedUser, input: CreateOrganizationInput): Promise<Organization> {
    try {
      return await organizationRepository.create({ ...input, createdBy: user.id });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictError('An organization with this slug already exists');
      }
      throw error;
    }
  },

  async getBySlug(slug: string): Promise<Organization> {
    const organization = await organizationRepository.findBySlug(slug);
    if (!organization) {
      throw new NotFoundError('Organization not found');
    }
    return organization;
  },

  async update(
    user: AuthenticatedUser,
    organizationId: string,
    input: UpdateOrganizationInput,
  ): Promise<Organization> {
    await getOrganizationOrThrow(organizationId);
    await requireOrgRole(user.id, organizationId, MANAGE_ROLES);
    return organizationRepository.update(organizationId, input);
  },

  async listMembers(
    user: AuthenticatedUser,
    organizationId: string,
  ): Promise<OrganizationMemberWithUser[]> {
    await getOrganizationOrThrow(organizationId);
    await requireOrgRole(user.id, organizationId, ['OWNER', 'ADMIN', 'MEMBER']);
    return organizationRepository.listMembers(organizationId);
  },

  async addMember(
    user: AuthenticatedUser,
    organizationId: string,
    input: AddMemberInput,
  ): Promise<OrganizationMemberWithUser> {
    await getOrganizationOrThrow(organizationId);
    const actorRole = await requireOrgRole(user.id, organizationId, MANAGE_ROLES);

    if (input.role === 'OWNER' && actorRole !== 'OWNER') {
      throw new AuthorizationError('Only an owner can grant owner permissions');
    }

    try {
      return await organizationRepository.addMember(organizationId, input.userId, input.role);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictError('User is already a member of this organization');
      }
      throw error;
    }
  },

  async updateMemberRole(
    user: AuthenticatedUser,
    organizationId: string,
    targetUserId: string,
    role: OrganizationRole,
  ): Promise<OrganizationMemberWithUser> {
    await getOrganizationOrThrow(organizationId);
    await requireOrgRole(user.id, organizationId, ['OWNER']);

    const target = await organizationRepository.findMembership(organizationId, targetUserId);
    if (!target) {
      throw new NotFoundError('Membership not found');
    }

    if (target.role === 'OWNER' && role !== 'OWNER') {
      const ownerCount = await organizationRepository.countOwners(organizationId);
      if (ownerCount <= 1) {
        throw new ConflictError('An organization must have at least one owner');
      }
    }

    return organizationRepository.updateMemberRole(organizationId, targetUserId, role);
  },

  async removeMember(
    user: AuthenticatedUser,
    organizationId: string,
    targetUserId: string,
  ): Promise<void> {
    await getOrganizationOrThrow(organizationId);
    const actorRole = await requireOrgRole(user.id, organizationId, MANAGE_ROLES);

    const target = await organizationRepository.findMembership(organizationId, targetUserId);
    if (!target) {
      throw new NotFoundError('Membership not found');
    }

    if (target.role === 'OWNER') {
      if (actorRole !== 'OWNER') {
        throw new AuthorizationError('Only an owner can remove another owner');
      }
      const ownerCount = await organizationRepository.countOwners(organizationId);
      if (ownerCount <= 1) {
        throw new ConflictError('An organization must have at least one owner');
      }
    }

    await organizationRepository.removeMember(organizationId, targetUserId);
  },
};
