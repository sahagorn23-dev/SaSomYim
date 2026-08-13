import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase admin client (service_role key).
 * Bypasses RLS — use ONLY inside API routes / Server Actions.
 * NEVER import this file in components marked "use client".
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/** Singleton for server-side usage */
let adminClient: ReturnType<typeof createAdminClient> | null = null;

export function getSupabaseAdmin() {
  if (!adminClient) {
    adminClient = createAdminClient();
  }
  return adminClient;
}
