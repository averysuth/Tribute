import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../../providers/auth-provider';
import { followUser, listFollowing, unfollowUser } from '../../services/follows';
import { getPerformerProfile } from '../../services/profiles';
import { getUserById } from '../../services/users';

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { session } = useAuth();
  const myId = session?.user.id;
  const queryClient = useQueryClient();

  const userQuery = useQuery({ queryKey: ['user', userId], queryFn: () => getUserById(userId) });

  const performerQuery = useQuery({
    queryKey: ['performer-profile', userId],
    queryFn: () => getPerformerProfile(userId),
    retry: false,
  });

  const isOwnProfile = myId === userId;

  const followingQuery = useQuery({
    queryKey: ['following', myId],
    queryFn: () => listFollowing(myId!),
    enabled: !!myId && !isOwnProfile,
  });

  const isFollowing = followingQuery.data?.some((u) => u.id === userId) ?? false;

  // event-attendance lists can be filtered by "only dancers I follow," so any
  // change to the follow graph has to invalidate them too, not just the
  // ['following', myId] list this screen reads from itself.
  function invalidateFollowDependentQueries() {
    queryClient.invalidateQueries({ queryKey: ['following', myId] });
    queryClient.invalidateQueries({ queryKey: ['event-attendance'] });
  }

  const followMutation = useMutation({
    mutationFn: () => followUser(userId),
    onSuccess: invalidateFollowDependentQueries,
  });

  const unfollowMutation = useMutation({
    mutationFn: () => unfollowUser(userId),
    onSuccess: invalidateFollowDependentQueries,
  });

  if (userQuery.isPending) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }

  if (userQuery.isError || !userQuery.data) {
    return (
      <View style={styles.container}>
        <Text>User not found.</Text>
      </View>
    );
  }

  const user = userQuery.data;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.displayName}>{user.displayName}</Text>
      <Text style={styles.username}>@{user.username}</Text>
      {user.bio && <Text style={styles.bio}>{user.bio}</Text>}

      {!isOwnProfile && myId && (
        <Pressable
          style={[styles.button, isFollowing && styles.buttonFollowing]}
          onPress={() => (isFollowing ? unfollowMutation.mutate() : followMutation.mutate())}
          disabled={followMutation.isPending || unfollowMutation.isPending}
        >
          <Text style={isFollowing ? styles.buttonFollowingText : styles.buttonText}>
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </Pressable>
      )}

      {performerQuery.data && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performer profile</Text>
          <Text>Type: {performerQuery.data.performerType}</Text>
          {performerQuery.data.journey && <Text>{performerQuery.data.journey}</Text>}
          {performerQuery.data.danceStyles.length > 0 && (
            <Text>
              Styles: {performerQuery.data.danceStyles.map((s) => s.danceStyle.name).join(', ')}
            </Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, gap: 8 },
  displayName: { fontSize: 24, fontWeight: '600' },
  username: { fontSize: 14, color: '#666' },
  bio: { fontSize: 14, marginTop: 8 },
  section: { marginTop: 24, gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  button: {
    backgroundColor: '#208AEF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  buttonFollowing: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#208AEF' },
  buttonFollowingText: { color: '#208AEF', fontWeight: '600' },
});
