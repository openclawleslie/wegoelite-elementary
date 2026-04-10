/**
 * Server-only Supabase client using service role key.
 * Bypasses RLS — use only in API routes and server-side lib code.
 *
 * Uses lazy initialization so the module can be imported at build time
 * without crashing when env vars are not yet available.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
      );
    }
    _client = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _client;
}

export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getClient() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
