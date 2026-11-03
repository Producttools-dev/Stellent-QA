import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Exchanges the `code` from a Supabase email confirmation / magic link for a
 * session cookie, then sends the user to the dashboard.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin));
    }
    console.error("[auth/callback] exchange failed:", error.message);
  }

  return NextResponse.redirect(new URL("/login?error=auth", url.origin));
}
