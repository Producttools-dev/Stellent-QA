import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * Unauthenticated status endpoint for free audit results.
 * Returns status + result (findings/score/verdict). Never returns email.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ requestId: string }> },
) {
  const { requestId } = await params;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("free_audit_requests")
    .select("id, status, result")
    .eq("id", requestId)
    .maybeSingle();

  if (error) {
    console.error("[free-audit-status] lookup failed:", error);
    return Response.json({ error: "Lookup failed" }, { status: 500 });
  }
  if (!data) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({
    id: data.id,
    status: data.status,
    result: data.result ?? null,
  });
}
