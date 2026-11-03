import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

/**
 * Server-only admin client (service-role key) — bypasses RLS.
 *
 * SECURITY: only ever import this from server-only modules (Route Handlers,
 * Server Actions, *.server.ts). It must never reach the browser bundle.
 * Use it for trusted operations like writing audit results from the VPS
 * callback, where there is no signed-in user to carry RLS.
 *
 * Mirrors CMA's src/lib/supabase-admin.server.ts: lazy, cached, env-guarded.
 */
let cached: SupabaseClient<Database> | undefined;

export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (cached) return cached;

  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"] ?? process.env["SUPABASE_URL"];
  const serviceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

  if (!url || !serviceRoleKey) {
    const missing = [
      ...(!url ? ["NEXT_PUBLIC_SUPABASE_URL"] : []),
      ...(!serviceRoleKey ? ["SUPABASE_SERVICE_ROLE_KEY"] : []),
    ];
    throw new Error(`[supabase-admin] Missing env var(s): ${missing.join(", ")}`);
  }

  cached = createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return cached;
}
