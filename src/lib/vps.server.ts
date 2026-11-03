/**
 * Server-only client for the Stellent QA audit engine (VPS).
 *
 * Fire-and-forget job trigger, mirroring CMA's src/lib/vps.server.ts: the VPS
 * accepts the job, returns 202 quickly, and POSTs the finished result back to
 * our callback URL later. All env reads happen inside the function so Vercel's
 * per-request env injection works.
 */

const DEFAULT_VPS_URL = "https://qa-intake.stellent.work/run-audit";
const TIMEOUT_MS = 20_000;

export type AuditType = "full" | "free";

export type AuditJobRequest = {
  runId: string;
  siteUrl: string;
  callbackUrl: string;
  auditType: AuditType;
};

export type AuditJobResult =
  | { ok: true; estimatedWaitMinutes: number | null; queueCount: number | null }
  | { ok: false; error: string };

export async function sendAuditJob(job: AuditJobRequest): Promise<AuditJobResult> {
  const url = process.env["VPS_AUDIT_URL"] ?? DEFAULT_VPS_URL;
  const secret = process.env["WEBHOOK_SECRET"];

  if (!secret) {
    console.error("[vps] WEBHOOK_SECRET is not configured");
    return { ok: false, error: "Audit service is not configured." };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": secret,
      },
      body: JSON.stringify({
        run_id: job.runId,
        site_url: job.siteUrl,
        callback_url: job.callbackUrl,
        audit_type: job.auditType,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`[vps] job request failed [${response.status}]: ${body}`);
      return { ok: false, error: `Audit service responded ${response.status}` };
    }

    let parsed: Record<string, unknown> = {};
    try {
      parsed = (await response.json()) as Record<string, unknown>;
    } catch {
      // A 2xx with a non-JSON body still counts as accepted.
    }

    const wait = parsed["estimated_wait_minutes"] ?? parsed["estimatedWaitMinutes"];
    const queue = parsed["queue_count"] ?? parsed["queueCount"];

    return {
      ok: true,
      estimatedWaitMinutes: typeof wait === "number" ? wait : null,
      queueCount: typeof queue === "number" ? queue : null,
    };
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    console.error("[vps] job request error:", error);
    return { ok: false, error: aborted ? "Audit request timed out" : "Audit request failed" };
  } finally {
    clearTimeout(timer);
  }
}
