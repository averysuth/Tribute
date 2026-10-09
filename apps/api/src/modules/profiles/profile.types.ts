import type {
  PerformerProfile,
  PerformerDanceStyle,
  DanceStyle,
  UserProfile,
} from '@tribute/database';

export type PerformerProfileWithStyles = PerformerProfile & {
  danceStyles: (PerformerDanceStyle & { danceStyle: DanceStyle })[];
};

export type PerformerProfileView = PerformerProfileWithStyles & {
  user: Pick<UserProfile, 'id' | 'username' | 'displayName' | 'avatarUrl' | 'bio'>;
};
