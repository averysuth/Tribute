import { Stack } from 'expo-router';

import { AuthProvider } from '../providers/auth-provider';
import { QueryProvider } from '../providers/query-provider';

export default function RootLayout() {
  return (
    <QueryProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerBackTitle: 'Back' }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth/sign-in" options={{ title: 'Sign In' }} />
          <Stack.Screen name="auth/sign-up" options={{ title: 'Create Account' }} />
          <Stack.Screen name="onboarding/index" options={{ title: 'Welcome', headerBackVisible: false }} />
          <Stack.Screen name="onboarding/performer" options={{ title: 'Performer Profile' }} />
          <Stack.Screen name="organization/new" options={{ title: 'New Organization' }} />
          <Stack.Screen name="organization/[slug]" options={{ title: 'Organization' }} />
          <Stack.Screen name="organization/[slug]/events/new" options={{ title: 'New Event' }} />
          <Stack.Screen name="event/[id]" options={{ title: 'Event' }} />
        </Stack>
      </AuthProvider>
    </QueryProvider>
  );
}
