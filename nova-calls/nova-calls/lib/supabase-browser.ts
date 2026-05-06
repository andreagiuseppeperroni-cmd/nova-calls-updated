import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let browserSupabase: SupabaseClient | null = null;

export function createBrowserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Missing Supabase browser environment variables.');
  }

  if (!browserSupabase) {
    browserSupabase = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'nova-supabase-auth',
      },
    });
  }

  return browserSupabase;
}
