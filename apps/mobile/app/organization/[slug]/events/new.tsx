import { useMutation } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';

import { createEvent } from '../../../../services/events';

export default function NewEventScreen() {
  const { slug, organizationId } = useLocalSearchParams<{ slug: string; organizationId: string }>();

  const [name, setName] = useState('');
  const [eventSlug, setEventSlug] = useState('');
  const [venueName, setVenueName] = useState('');
  const [address, setAddress] = useState('');
  const [timeZone, setTimeZone] = useState('America/Denver');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      createEvent(organizationId, {
        name,
        slug: eventSlug,
        venueName: venueName || undefined,
        address: address || undefined,
        timeZone,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
      }),
    onSuccess: () => router.replace({ pathname: '/organization/[slug]', params: { slug } }),
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>New event</Text>

      <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
      <TextInput
        style={styles.input}
        placeholder="slug-for-urls"
        autoCapitalize="none"
        value={eventSlug}
        onChangeText={setEventSlug}
      />
      <TextInput style={styles.input} placeholder="Venue name (optional)" value={venueName} onChangeText={setVenueName} />
      <TextInput style={styles.input} placeholder="Address (optional)" value={address} onChangeText={setAddress} />
      <TextInput style={styles.input} placeholder="Time zone (e.g. America/Denver)" value={timeZone} onChangeText={setTimeZone} />
      <TextInput
        style={styles.input}
        placeholder="Starts at (e.g. 2027-10-01T18:00)"
        value={startsAt}
        onChangeText={setStartsAt}
      />
      <TextInput
        style={styles.input}
        placeholder="Ends at (e.g. 2027-10-02T02:00)"
        value={endsAt}
        onChangeText={setEndsAt}
      />

      {mutation.isError && <Text style={styles.error}>{(mutation.error as Error).message}</Text>}

      <Pressable
        style={[styles.button, mutation.isPending && styles.buttonDisabled]}
        onPress={() => mutation.mutate()}
        disabled={mutation.isPending || !name || !eventSlug || !timeZone || !startsAt || !endsAt}
      >
        {mutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create event</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 12 },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#208AEF',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  error: { color: '#c00' },
});
