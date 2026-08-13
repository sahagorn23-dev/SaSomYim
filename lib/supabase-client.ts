import { createClient } from "@supabase/supabase-js";

/**
 * Browser-safe Supabase client (anon key).
 * Use ONLY for reading public data (e.g. active promotions).
 * Never use for writes — all mutations must go through API routes.
 */
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return createClient(url, anonKey);
}

/** Singleton for client components */
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseClient() {
  if (!browserClient) {
    browserClient = createBrowserClient();
  }
  return browserClient;
}
