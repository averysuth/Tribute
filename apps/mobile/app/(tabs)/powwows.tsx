import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function PowwowsScreen() {
  const [slug, setSlug] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Powwows</Text>
      <Text style={styles.subtitle}>
        Upcoming, followed, and nearby events are coming soon. For now, look up an organization by slug or create
        your own.
      </Text>

      <View style={styles.lookupRow}>
        <TextInput
          style={styles.input}
          placeholder="organization-slug"
          autoCapitalize="none"
          value={slug}
          onChangeText={setSlug}
        />
        <Pressable
          style={styles.button}
          disabled={!slug}
          onPress={() => router.push({ pathname: '/organization/[slug]', params: { slug } })}
        >
          <Text style={styles.buttonText}>View</Text>
        </Pressable>
      </View>

      <Pressable style={styles.secondaryButton} onPress={() => router.push('/organization/new')}>
        <Text style={styles.secondaryButtonText}>Create an organization</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12 },
  title: { fontSize: 24, fontWeight: '600' },
  subtitle: { fontSize: 14, color: '#666' },
  lookupRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  button: { backgroundColor: '#208AEF', borderRadius: 8, padding: 12, justifyContent: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#208AEF',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryButtonText: { color: '#208AEF', fontWeight: '600' },
});
