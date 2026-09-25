import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseClientInstance: SupabaseClient | null = null;

/**
 * Returns a server-side Supabase client using the Service Role Key.
 * Bypasses RLS strictly on the server. Never exposed to browser.
 */
export function getSupabaseClient(): SupabaseClient | null {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  if (!supabaseClientInstance) {
    supabaseClientInstance = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return supabaseClientInstance;
}
