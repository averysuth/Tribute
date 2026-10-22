import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../../providers/auth-provider';
import { listOrganizationEvents } from '../../services/events';
import {
  followOrganization,
  listFollowedOrganizations,
  unfollowOrganization,
} from '../../services/follows';
import { getMyOrganizationRole, getOrganizationBySlug } from '../../services/organizations';

export default function OrganizationScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { session } = useAuth();
  const myId = session?.user.id;
  const queryClient = useQueryClient();

  const organizationQuery = useQuery({
    queryKey: ['organization', slug],
    queryFn: () => getOrganizationBySlug(slug),
  });

  const eventsQuery = useQuery({
    queryKey: ['organization-events', organizationQuery.data?.id],
    queryFn: () => listOrganizationEvents(organizationQuery.data!.id),
    enabled: !!organizationQuery.data,
  });

  const followedOrgsQuery = useQuery({
    queryKey: ['followed-organizations', myId],
    queryFn: () => listFollowedOrganizations(myId!),
    enabled: !!myId,
  });

  const organizationId = organizationQuery.data?.id;
  const isFollowing = followedOrgsQuery.data?.some((org) => org.id === organizationId) ?? false;

  const myRoleQuery = useQuery({
    queryKey: ['organization-role', organizationId, myId],
    queryFn: () => getMyOrganizationRole(organizationId!),
    enabled: !!organizationId && !!myId,
  });
  const canManage = myRoleQuery.data?.role === 'OWNER' || myRoleQuery.data?.role === 'ADMIN';

  const followMutation = useMutation({
    mutationFn: () => followOrganization(organizationId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['followed-organizations', myId] }),
  });

  const unfollowMutation = useMutation({
    mutationFn: () => unfollowOrganization(organizationId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['followed-organizations', myId] }),
  });

  if (organizationQuery.isPending) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }

  if (organizationQuery.isError || !organizationQuery.data) {
    return (
      <View style={styles.container}>
        <Text>Organization not found.</Text>
      </View>
    );
  }

  const organization = organizationQuery.data;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{organization.name}</Text>
      {organization.description && (
        <Text style={styles.description}>{organization.description}</Text>
      )}

      {myId && (
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

      {canManage && (
        <Pressable
          style={styles.secondaryButton}
          onPress={() =>
            router.push({
              pathname: '/organization/[slug]/events/new',
              params: { slug: organization.slug, organizationId: organization.id },
            })
          }
        >
          <Text style={styles.secondaryButtonText}>+ Add event</Text>
        </Pressable>
      )}

      <Text style={styles.sectionTitle}>Events</Text>
      <FlatList
        data={eventsQuery.data ?? []}
        keyExtractor={(event) => event.id}
        ListEmptyComponent={<Text style={styles.empty}>No events yet.</Text>}
        renderItem={({ item }) => (
          <Link href={{ pathname: '/event/[id]', params: { id: item.id } }} asChild>
            <Pressable style={styles.eventRow}>
              <Text style={styles.eventName}>{item.name}</Text>
              <Text style={styles.eventDate}>{new Date(item.startsAt).toLocaleDateString()}</Text>
            </Pressable>
          </Link>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12 },
  title: { fontSize: 24, fontWeight: '600' },
  description: { fontSize: 14, color: '#666' },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginTop: 16 },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#208AEF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  secondaryButtonText: { color: '#208AEF', fontWeight: '600' },
  button: {
    backgroundColor: '#208AEF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  buttonFollowing: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#208AEF' },
  buttonFollowingText: { color: '#208AEF', fontWeight: '600' },
  eventRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  eventName: { fontSize: 16 },
  eventDate: { color: '#666' },
  empty: { color: '#666' },
});
