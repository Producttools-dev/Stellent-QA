import { z } from "zod";
import { assertWebhookSecret } from "@/lib/webhook";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * Callback the Stellent QA audit engine (VPS) POSTs to when a run finishes.
 *
 *   POST /api/audit/receive-result
 *   header: x-webhook-secret: <WEBHOOK_SECRET>
 *   body:   { run_id, status, verdict?, score?, findings?, pdf_url?, error_message? }
 *
 * Mirrors CMA's receive-report: shared-secret auth, idempotent on run_id, and
 * tolerant of retries. Lives outside the auth middleware (see middleware
 * matcher) because the secret is the authentication.
 */

const findingSchema = z.object({
  test_id: z.string().max(64).optional().nullable(),
  module: z.string().max(120).optional().nullable(),
  title: z.string().max(500).optional().nullable(),
  severity: z.number().int().min(0).max(4).optional().nullable(),
  status: z.enum(["pass", "fail", "warning"]).optional().nullable(),
  detail: z.string().max(5000).optional().nullable(),
  how_to_fix: z.string().max(5000).optional().nullable(),
});

const bodySchema = z.object({
  run_id: z.string().uuid(),
  status: z.enum(["complete", "completed", "failed"]),
  verdict: z.string().max(1000).optional().nullable(),
  score: z.number().int().min(0).max(100).optional().nullable(),
  pdf_url: z.string().url().max(1000).optional().nullable(),
  error_message: z.string().max(1000).optional().nullable(),
  findings: z.array(findingSchema).max(500).optional(),
});

export async function POST(request: Request) {
  const rejection = assertWebhookSecret(request);
  if (rejection) return rejection;

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch (error) {
    console.error("[receive-result] invalid body:", error);
    return new Response("Invalid body", { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const succeeded = parsed.status === "complete" || parsed.status === "completed";

  const { data: run, error: lookupError } = await supabase
    .from("audit_runs")
    .select("id, status")
    .eq("id", parsed.run_id)
    .maybeSingle();

  if (lookupError) {
    console.error("[receive-result] run lookup failed:", lookupError);
    return new Response("Lookup failed", { status: 500 });
  }
  if (!run) {
    console.error(`[receive-result] no run row for ${parsed.run_id}`);
    return new Response("Not found", { status: 404 });
  }

  // Idempotency — a duplicate terminal callback must not be processed twice.
  if (run.status === "complete" || run.status === "failed") {
    console.log(`[receive-result] run ${run.id} already ${run.status} — ignoring`);
    return new Response("Already processed", { status: 200 });
  }

  if (!succeeded) {
    const { error: failError } = await supabase
      .from("audit_runs")
      .update({
        status: "failed",
        error_message: parsed.error_message ?? "Audit failed",
        completed_at: now,
      })
      .eq("id", run.id);
    if (failError) {
      console.error("[receive-result] fail update error:", failError);
      return new Response("Update failed", { status: 500 });
    }
    return Response.json({ ok: true, run_id: run.id, status: "failed" });
  }

  const { error: updateError } = await supabase
    .from("audit_runs")
    .update({
      status: "complete",
      verdict: parsed.verdict ?? null,
      score: parsed.score ?? null,
      pdf_url: parsed.pdf_url ?? null,
      completed_at: now,
    })
    .eq("id", run.id);
  if (updateError) {
    console.error("[receive-result] complete update error:", updateError);
    return new Response("Update failed", { status: 500 });
  }

  const findings = parsed.findings ?? [];
  if (findings.length > 0) {
    const rows = findings.map((f) => ({
      run_id: run.id,
      test_id: f.test_id ?? null,
      module: f.module ?? null,
      title: f.title ?? null,
      severity: f.severity ?? null,
      status: f.status ?? null,
      detail: f.detail ?? null,
      how_to_fix: f.how_to_fix ?? null,
    }));
    const { error: findingsError } = await supabase.from("findings").insert(rows);
    if (findingsError) {
      // The run is already marked complete; log but don't fail the callback,
      // otherwise the VPS retries and we'd double-insert findings.
      console.error("[receive-result] findings insert error:", findingsError);
    }
  }

  return Response.json({ ok: true, run_id: run.id, status: "complete", findings: findings.length });
}
