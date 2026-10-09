import type { Organization, OrganizationMember, OrganizationRole } from '@tribute/database';

export type { Organization, OrganizationMember, OrganizationRole };

export type OrganizationMemberWithUser = OrganizationMember & {
  user: { id: string; username: string; displayName: string; avatarUrl: string | null };
};
