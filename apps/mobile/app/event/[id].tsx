import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { getEvent } from '../../services/events';

export default function EventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const eventQuery = useQuery({ queryKey: ['event', id], queryFn: () => getEvent(id) });

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
    <View style={styles.container}>
      <Text style={styles.title}>{event.name}</Text>
      <Text style={styles.organization}>Hosted by {event.organization.name}</Text>

      <Text style={styles.detail}>
        {new Date(event.startsAt).toLocaleString()} – {new Date(event.endsAt).toLocaleString()} ({event.timeZone})
      </Text>
      {event.venueName && <Text style={styles.detail}>{event.venueName}</Text>}
      {event.address && <Text style={styles.detail}>{event.address}</Text>}
      {event.description && <Text style={styles.description}>{event.description}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 8 },
  title: { fontSize: 24, fontWeight: '600' },
  organization: { fontSize: 14, color: '#666' },
  detail: { fontSize: 14, marginTop: 4 },
  description: { fontSize: 14, marginTop: 12 },
});
