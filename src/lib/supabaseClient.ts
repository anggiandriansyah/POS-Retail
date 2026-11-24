import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isPlaceholder = (value: string | undefined): boolean =>
  !value ||
  value.includes('your-project-id') ||
  value.includes('your-anon-public-key');

export const isSupabaseConfigured: boolean =
  !isPlaceholder(supabaseUrl) && !isPlaceholder(supabaseAnonKey);

export const supabase: SupabaseClient | null =
  isSupabaseConfigured && supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

/**
 * Create a non-persisted Supabase client for admin actions (e.g. creating a
 * cashier account) without overwriting the active Owner session.
 */
export function createEphemeralSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured || !supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
