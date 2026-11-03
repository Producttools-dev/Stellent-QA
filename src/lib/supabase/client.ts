"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database";

/**
 * Browser Supabase client (anon key only) for client components.
 *
 * Used for auth and read queries that run under the signed-in user's RLS.
 * Never holds the service-role key — that stays server-side (see admin.ts).
 */
export function createClient() {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const anonKey = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. See .env.local.example.",
    );
  }

  return createBrowserClient<Database>(url, anonKey);
}
