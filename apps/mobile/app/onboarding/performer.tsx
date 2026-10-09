import { useMutation, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';

import { listDanceStyles } from '../../services/dance-styles';
import { upsertMyPerformerProfile } from '../../services/profiles';

export default function PerformerOnboardingScreen() {
  const [performerType, setPerformerType] = useState('dancer');
  const [journey, setJourney] = useState('');
  const [region, setRegion] = useState('');
  const [selectedStyleIds, setSelectedStyleIds] = useState<string[]>([]);
  const [primaryStyleId, setPrimaryStyleId] = useState<string | null>(null);

  const danceStylesQuery = useQuery({ queryKey: ['dance-styles'], queryFn: listDanceStyles });

  const mutation = useMutation({
    mutationFn: upsertMyPerformerProfile,
    onSuccess: () => router.replace('/(tabs)'),
  });

  function toggleStyle(id: string) {
    setSelectedStyleIds((current) => {
      const next = current.includes(id) ? current.filter((styleId) => styleId !== id) : [...current, id];
      if (!next.includes(id) && primaryStyleId === id) {
        setPrimaryStyleId(next[0] ?? null);
      }
      if (!current.includes(id) && !primaryStyleId) {
        setPrimaryStyleId(id);
      }
      return next;
    });
  }

  function handleSubmit() {
    mutation.mutate({
      performerType,
      journey: journey || undefined,
      region: region || undefined,
      danceStyles: selectedStyleIds.map((danceStyleId) => ({
        danceStyleId,
        isPrimary: danceStyleId === primaryStyleId,
      })),
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Tell us about your performing</Text>

      <TextInput
        style={styles.input}
        placeholder="Performer type (e.g. dancer)"
        value={performerType}
        onChangeText={setPerformerType}
      />
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Your journey (optional)"
        multiline
        value={journey}
        onChangeText={setJourney}
      />
      <TextInput style={styles.input} placeholder="Region (optional)" value={region} onChangeText={setRegion} />

      <Text style={styles.sectionLabel}>Dance styles</Text>
      {danceStylesQuery.isPending && <ActivityIndicator />}
      {danceStylesQuery.data?.map((style) => {
        const selected = selectedStyleIds.includes(style.id);
        return (
          <Pressable
            key={style.id}
            style={[styles.styleRow, selected && styles.styleRowSelected]}
            onPress={() => toggleStyle(style.id)}
          >
            <Text>{style.name}</Text>
            {selected && primaryStyleId === style.id && <Text style={styles.primaryBadge}>Primary</Text>}
          </Pressable>
        );
      })}

      {mutation.isError && <Text style={styles.error}>{(mutation.error as Error).message}</Text>}

      <Pressable
        style={[styles.button, mutation.isPending && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={mutation.isPending || !performerType}
      >
        {mutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Finish</Text>}
      </Pressable>

      <Pressable onPress={() => router.replace('/(tabs)')}>
        <Text style={styles.skip}>Skip for now</Text>
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
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  sectionLabel: { fontSize: 16, fontWeight: '600', marginTop: 12 },
  styleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  styleRowSelected: { borderColor: '#208AEF', backgroundColor: '#E6F4FE' },
  primaryBadge: { color: '#208AEF', fontWeight: '600', fontSize: 12 },
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
  skip: { textAlign: 'center', color: '#666', marginTop: 8 },
});
