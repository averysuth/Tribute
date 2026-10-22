import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { useAuth } from '../../providers/auth-provider';
import {
  listAttendance,
  removeMyAttendance,
  setMyAttendance,
  type AttendanceType,
} from '../../services/attendance';
import { listDanceStyles } from '../../services/dance-styles';
import { getEvent } from '../../services/events';

const ATTENDANCE_OPTIONS: { type: AttendanceType; label: string }[] = [
  { type: 'INTERESTED', label: 'Interested' },
  { type: 'ATTENDING', label: 'Attending' },
  { type: 'COMPETING', label: 'Competing' },
];

export default function EventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const myId = session?.user.id;
  const queryClient = useQueryClient();

  const [danceStyleId, setDanceStyleId] = useState<string | null>(null);
  const [followedOnly, setFollowedOnly] = useState(false);

  const eventQuery = useQuery({ queryKey: ['event', id], queryFn: () => getEvent(id) });
  const danceStylesQuery = useQuery({ queryKey: ['dance-styles'], queryFn: listDanceStyles });

  const attendanceQuery = useQuery({
    queryKey: ['event-attendance', id, danceStyleId, followedOnly],
    queryFn: () =>
      listAttendance(id, {
        ...(danceStyleId ? { danceStyleId } : {}),
        followedOnly,
      }),
  });

  // Deliberately unfiltered: the attendee-list filters (dance style, followed-only)
  // scope who shows up in the list, but must never affect whether your own
  // attendance button looks active — you don't follow yourself, so a
  // followed-only filter would otherwise make your own status disappear.
  const myAttendanceQuery = useQuery({
    queryKey: ['event-attendance', id, 'me'],
    queryFn: () => listAttendance(id, {}),
    enabled: !!myId,
  });
  const myAttendance = myAttendanceQuery.data?.find((a) => a.user.id === myId);

  const setAttendanceMutation = useMutation({
    mutationFn: (attendanceType: AttendanceType) => setMyAttendance(id, attendanceType),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['event-attendance', id], exact: false }),
  });

  const removeAttendanceMutation = useMutation({
    mutationFn: () => removeMyAttendance(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['event-attendance', id], exact: false }),
  });

  if (eventQuery.isPending) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }

  if (eventQuery.isError || !eventQuery.data) {
    return (
      <View style={styles.container}>
        <Text>Event not found.</Text>
      </View>
    );
  }

  const event = eventQuery.data;

  return (
    <FlatList
      contentContainerStyle={styles.container}
      data={attendanceQuery.data ?? []}
      keyExtractor={(a) => a.user.id}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>{event.name}</Text>
          <Text style={styles.organization}>Hosted by {event.organization.name}</Text>

          <Text style={styles.detail}>
            {new Date(event.startsAt).toLocaleString()} – {new Date(event.endsAt).toLocaleString()}{' '}
            ({event.timeZone})
          </Text>
          {event.venueName && <Text style={styles.detail}>{event.venueName}</Text>}
          {event.address && <Text style={styles.detail}>{event.address}</Text>}
          {event.description && <Text style={styles.description}>{event.description}</Text>}

          {myId && (
            <>
              <View style={styles.attendanceRow}>
                {ATTENDANCE_OPTIONS.map((option) => {
                  const active = myAttendance?.attendanceType === option.type;
                  const isPending =
                    setAttendanceMutation.isPending || removeAttendanceMutation.isPending;
                  return (
                    <Pressable
                      key={option.type}
                      style={[
                        styles.attendanceButton,
                        active && styles.attendanceButtonActive,
                        isPending && styles.attendanceButtonDisabled,
                      ]}
                      disabled={isPending}
                      onPress={() =>
                        active
                          ? removeAttendanceMutation.mutate()
                          : setAttendanceMutation.mutate(option.type)
                      }
                    >
                      <Text
                        style={
                          active ? styles.attendanceButtonActiveText : styles.attendanceButtonText
                        }
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {(setAttendanceMutation.isError || removeAttendanceMutation.isError) && (
                <Text style={styles.error}>
                  {((setAttendanceMutation.error ?? removeAttendanceMutation.error) as Error)
                    .message}
                </Text>
              )}
            </>
          )}

          <Text style={styles.sectionTitle}>Who&apos;s going</Text>

          {danceStylesQuery.data && danceStylesQuery.data.length > 0 && (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={danceStylesQuery.data}
              keyExtractor={(style) => style.id}
              style={styles.styleFilterList}
              renderItem={({ item }) => {
                const active = danceStyleId === item.id;
                return (
                  <Pressable
                    style={[styles.styleChip, active && styles.styleChipActive]}
                    onPress={() => setDanceStyleId(active ? null : item.id)}
                  >
                    <Text style={active ? styles.styleChipActiveText : styles.styleChipText}>
                      {item.name}
                    </Text>
                  </Pressable>
                );
              }}
            />
          )}

          {myId && (
            <View style={styles.followedOnlyRow}>
              <Text>Only dancers I follow</Text>
              <Switch
                testID="followed-only-switch"
                value={followedOnly}
                onValueChange={setFollowedOnly}
              />
            </View>
          )}
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>No one has marked attendance yet.</Text>}
      renderItem={({ item }) => (
        <Link href={{ pathname: '/profile/[userId]', params: { userId: item.user.id } }} asChild>
          <Pressable style={styles.attendeeRow}>
            <Text style={styles.attendeeName}>{item.user.displayName}</Text>
            <Text style={styles.attendeeType}>
              {item.attendanceType}
              {item.verified ? ' ✓' : ''}
            </Text>
          </Pressable>
        </Link>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 8 },
  header: { gap: 8, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '600' },
  organization: { fontSize: 14, color: '#666' },
  detail: { fontSize: 14, marginTop: 4 },
  description: { fontSize: 14, marginTop: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginTop: 16 },
  attendanceRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  attendanceButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#208AEF',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  attendanceButtonActive: { backgroundColor: '#208AEF' },
  attendanceButtonDisabled: { opacity: 0.6 },
  attendanceButtonText: { color: '#208AEF', fontWeight: '600', fontSize: 13 },
  attendanceButtonActiveText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  error: { color: '#c00', fontSize: 13 },
  styleFilterList: { marginTop: 8 },
  styleChip: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  styleChipActive: { backgroundColor: '#E6F4FE', borderColor: '#208AEF' },
  styleChipText: { fontSize: 13, color: '#333' },
  styleChipActiveText: { fontSize: 13, color: '#208AEF', fontWeight: '600' },
  followedOnlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  attendeeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  attendeeName: { fontSize: 16 },
  attendeeType: { color: '#666', fontSize: 12 },
  empty: { color: '#666' },
});
