import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on all paths except static assets and the VPS callback route
     * (which authenticates itself with the webhook secret, not a user session).
     */
    "/((?!_next/static|_next/image|favicon.ico|api/audit|api/free-audit|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
