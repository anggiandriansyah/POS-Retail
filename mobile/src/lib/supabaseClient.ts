import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

export const DEV_SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://tcbhaiyhtndnqgatysmh.supabase.co';
export const DEV_SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_35zznB6Q6kZ8N5QU0PFX5Q_DsnEvNIO';
export const DEV_RECEIPT_ORIGIN =
  process.env.EXPO_PUBLIC_RECEIPT_BASE_URL ||
  'https://pos-retail-git-develop-anggiandriansyah.vercel.app';

export const isSupabaseConfigured = Boolean(
  DEV_SUPABASE_URL && !DEV_SUPABASE_URL.includes('your-project-id') && DEV_SUPABASE_ANON_KEY
);

export const supabase = createClient(DEV_SUPABASE_URL, DEV_SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
