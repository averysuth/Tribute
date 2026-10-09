import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/auth-provider';
import { getPerformerProfile } from '../../services/profiles';
import { getMyUserProfile } from '../../services/users';

export default function ProfileScreen() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({ queryKey: ['me'], queryFn: getMyUserProfile, enabled: !!session });

  const performerQuery = useQuery({
    queryKey: ['performer-profile', profileQuery.data?.id],
    queryFn: () => getPerformerProfile(profileQuery.data!.id),
    enabled: !!profileQuery.data,
    retry: false,
  });

  async function handleSignOut() {
    await supabase.auth.signOut();
    queryClient.clear();
    router.replace('/auth/sign-in');
  }

  if (profileQuery.isPending) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }

  const profile = profileQuery.data;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.displayName}>{profile?.displayName}</Text>
      <Text style={styles.username}>@{profile?.username}</Text>
      {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performer profile</Text>
        {performerQuery.data ? (
          <>
            <Text>Type: {performerQuery.data.performerType}</Text>
            {performerQuery.data.journey && <Text>{performerQuery.data.journey}</Text>}
            {performerQuery.data.danceStyles.length > 0 && (
              <Text>Styles: {performerQuery.data.danceStyles.map((s) => s.danceStyle.name).join(', ')}</Text>
            )}
          </>
        ) : (
          <Pressable style={styles.secondaryButton} onPress={() => router.push('/onboarding/performer')}>
            <Text style={styles.secondaryButtonText}>Activate a performer profile</Text>
          </Pressable>
        )}
      </View>

      <Pressable style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
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
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#208AEF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  secondaryButtonText: { color: '#208AEF', fontWeight: '600' },
  signOutButton: { marginTop: 32, alignItems: 'center', padding: 12 },
  signOutText: { color: '#c00', fontWeight: '600' },
});
