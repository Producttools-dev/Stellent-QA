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
 * Handles both authenticated audit_runs (full audits) and free_audit_requests.
 * Mirrors CMA's receive-report: shared-secret auth, idempotent on run_id.
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

  // Try audit_runs first (full authenticated audits).
  const { data: run, error: runLookupError } = await supabase
    .from("audit_runs")
    .select("id, status")
    .eq("id", parsed.run_id)
    .maybeSingle();

  if (runLookupError) {
    console.error("[receive-result] run lookup failed:", runLookupError);
    return new Response("Lookup failed", { status: 500 });
  }

  if (run) {
    return handleAuditRun({ supabase, run, parsed, now, succeeded });
  }

  // Fall back: check free_audit_requests.
  const { data: freeReq, error: freeLookupError } = await supabase
    .from("free_audit_requests")
    .select("id, status")
    .eq("id", parsed.run_id)
    .maybeSingle();

  if (freeLookupError) {
    console.error("[receive-result] free_audit_requests lookup failed:", freeLookupError);
    return new Response("Lookup failed", { status: 500 });
  }
  if (!freeReq) {
    console.error(`[receive-result] no row for ${parsed.run_id}`);
    return new Response("Not found", { status: 404 });
  }

  return handleFreeAuditRequest({ supabase, freeReq, parsed, now, succeeded });
}

// ── Authenticated run handler ────────────────────────────────────────────────

async function handleAuditRun({
  supabase,
  run,
  parsed,
  now,
  succeeded,
}: {
  supabase: ReturnType<typeof getSupabaseAdmin>;
  run: { id: string; status: string };
  parsed: z.infer<typeof bodySchema>;
  now: string;
  succeeded: boolean;
}) {
  if (run.status === "complete" || run.status === "failed") {
    console.log(`[receive-result] run ${run.id} already ${run.status} — ignoring`);
    return new Response("Already processed", { status: 200 });
  }

  if (!succeeded) {
    await supabase
      .from("audit_runs")
      .update({ status: "failed", error_message: parsed.error_message ?? "Audit failed", completed_at: now })
      .eq("id", run.id);
    return Response.json({ ok: true, run_id: run.id, status: "failed" });
  }

  const { error: updateError } = await supabase
    .from("audit_runs")
    .update({ status: "complete", verdict: parsed.verdict ?? null, score: parsed.score ?? null, pdf_url: parsed.pdf_url ?? null, completed_at: now })
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
    if (findingsError) console.error("[receive-result] findings insert error:", findingsError);
  }

  return Response.json({ ok: true, run_id: run.id, status: "complete", findings: findings.length });
}

// ── Free audit request handler ───────────────────────────────────────────────

async function handleFreeAuditRequest({
  supabase,
  freeReq,
  parsed,
  now,
  succeeded,
}: {
  supabase: ReturnType<typeof getSupabaseAdmin>;
  freeReq: { id: string; status: string };
  parsed: z.infer<typeof bodySchema>;
  now: string;
  succeeded: boolean;
}) {
  if (freeReq.status === "complete" || freeReq.status === "failed") {
    console.log(`[receive-result] free_audit_request ${freeReq.id} already ${freeReq.status} — ignoring`);
    return new Response("Already processed", { status: 200 });
  }

  if (!succeeded) {
    await supabase
      .from("free_audit_requests")
      .update({ status: "failed" })
      .eq("id", freeReq.id);
    return Response.json({ ok: true, run_id: freeReq.id, status: "failed" });
  }

  const result = {
    verdict: parsed.verdict ?? null,
    score: parsed.score ?? null,
    pdf_url: parsed.pdf_url ?? null,
    completed_at: now,
    findings: (parsed.findings ?? []).slice(0, 20), // cap preview at 20
  };

  const { error } = await supabase
    .from("free_audit_requests")
    .update({ status: "complete", result })
    .eq("id", freeReq.id);
  if (error) {
    console.error("[receive-result] free req update error:", error);
    return new Response("Update failed", { status: 500 });
  }

  return Response.json({ ok: true, run_id: freeReq.id, status: "complete" });
}
