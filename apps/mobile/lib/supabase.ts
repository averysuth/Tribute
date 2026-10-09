import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

import { LargeSecureStore } from './large-secure-store';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY must be set');
}

// Mobile only ever holds the public anon key — login/session management goes
// through Supabase Auth directly; all other business operations go through the
// Tribute API, which verifies the resulting JWT itself.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: new LargeSecureStore(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
