"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { appUrl } from "@/lib/env";

const createSiteSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  url: z.string().trim().url("Enter a valid URL (including https://)").max(2000),
});

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; error: string };

/**
 * Create a monitored site for the signed-in user. RLS guarantees the row is
 * owned by auth.uid(); we pass user_id explicitly to satisfy the insert policy.
 */
export async function createSite(input: {
  name: string;
  url: string;
}): Promise<ActionResult<{ id: string }>> {
  const parsed = createSiteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in." };

  const { data, error } = await supabase
    .from("sites")
    .insert({ user_id: user.id, name: parsed.data.name, url: parsed.data.url })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[createSite] insert failed:", error);
    return { ok: false, error: "Could not add that site. Please try again." };
  }

  revalidatePath("/dashboard");
  return { ok: true, data: { id: data.id } };
}

/**
 * Trigger a manual audit: create the run row, then fire the job at the VPS.
 *
 * Fire-and-forget (mirrors CMA): the VPS returns quickly and the finished
 * result arrives later at /api/audit/receive-result. If the VPS rejects the
 * job up front, we mark the run failed so the UI never hangs on "running".
 */
export async function triggerAudit(siteId: string): Promise<ActionResult<{ runId: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in." };

  // RLS scopes this to the user's own sites.
  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select("id, url")
    .eq("id", siteId)
    .single();
  if (siteError || !site) return { ok: false, error: "Site not found." };

  const { data: run, error: runError } = await supabase
    .from("audit_runs")
    .insert({ site_id: site.id, status: "running", triggered_by: "manual" })
    .select("id")
    .single();
  if (runError || !run) {
    console.error("[triggerAudit] run insert failed:", runError);
    return { ok: false, error: "Could not start the audit. Please try again." };
  }

  const { sendAuditJob } = await import("@/lib/vps.server");
  const result = await sendAuditJob({
    runId: run.id,
    siteUrl: site.url,
    callbackUrl: `${appUrl()}/api/audit/receive-result`,
    auditType: "full",
  });

  if (!result.ok) {
    await supabase
      .from("audit_runs")
      .update({
        status: "failed",
        error_message: result.error,
        completed_at: new Date().toISOString(),
      })
      .eq("id", run.id);
    revalidatePath(`/dashboard/sites/${siteId}`);
    return { ok: false, error: result.error };
  }

  revalidatePath(`/dashboard/sites/${siteId}`);
  return { ok: true, data: { runId: run.id } };
}
