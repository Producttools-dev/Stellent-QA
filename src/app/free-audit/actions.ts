"use server";

import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { appUrl } from "@/lib/env";

const schema = z.object({
  url: z.string().trim().url("Enter a valid URL (including https://)").max(2000),
  email: z.string().trim().email("Enter a valid email address").max(320).optional().or(z.literal("")),
});

export type FreeAuditResult =
  | { ok: true; requestId: string }
  | { ok: false; error: string };

export async function requestFreeAudit(input: {
  url: string;
  email?: string;
}): Promise<FreeAuditResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = getSupabaseAdmin();

  // Insert the free_audit_request row (service-role only, no RLS policy for authed users).
  const { data: request, error: insertError } = await supabase
    .from("free_audit_requests")
    .insert({
      url: parsed.data.url,
      email: parsed.data.email || null,
      status: "running",
    })
    .select("id")
    .single();

  if (insertError || !request) {
    console.error("[requestFreeAudit] insert failed:", insertError);
    return { ok: false, error: "Could not start the audit. Please try again." };
  }

  const { sendAuditJob } = await import("@/lib/vps.server");
  const result = await sendAuditJob({
    runId: request.id,
    siteUrl: parsed.data.url,
    callbackUrl: `${appUrl()}/api/audit/receive-result`,
    auditType: "free",
  });

  if (!result.ok) {
    await supabase
      .from("free_audit_requests")
      .update({ status: "failed" })
      .eq("id", request.id);
    return { ok: false, error: result.error };
  }

  return { ok: true, requestId: request.id };
}
