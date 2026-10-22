export interface FollowedUserSummary {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface FollowedOrganizationSummary {
  id: string;
  name: string;
  slug: string;
}
