import { prisma, type OrganizationRole } from '@tribute/database';

import { AuthorizationError } from '../../lib/errors.js';

/**
 * Loads the caller's membership for an organization and throws unless their role
 * is one of `allowedRoles`. Always reads membership from the database — never
 * trust a client-supplied role/organizationId pairing.
 */
export async function requireOrgRole(
  userId: string,
  organizationId: string,
  allowedRoles: OrganizationRole[],
): Promise<OrganizationRole> {
  const membership = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId } },
  });

  if (!membership || !allowedRoles.includes(membership.role)) {
    throw new AuthorizationError('You do not have permission to manage this organization');
  }

  return membership.role;
}
