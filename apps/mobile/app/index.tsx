import { useQuery } from '@tanstack/react-query';
import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../providers/auth-provider';
import { getMyUserProfile } from '../services/users';

export default function Index() {
  const { session, loading: authLoading } = useAuth();

  const profileQuery = useQuery({
    queryKey: ['me'],
    queryFn: getMyUserProfile,
    enabled: !!session,
  });

  if (authLoading || (session && profileQuery.isPending)) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/auth/sign-in" />;
  }

  if (profileQuery.isError) {
    return (
      <View style={styles.container}>
        <Text>Something went wrong loading your account. Please try again.</Text>
      </View>
    );
  }

  if (profileQuery.data === null) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
