import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { FreeAuditResults } from "@/components/free-audit/free-audit-results";
import type { AuditStatus } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export default async function FreeAuditResultPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;
  const supabase = getSupabaseAdmin();

  const { data } = await supabase
    .from("free_audit_requests")
    .select("id, status, url")
    .eq("id", requestId)
    .maybeSingle();

  if (!data) notFound();

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-6 py-12">
      <Link
        href="/free-audit"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> New audit
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Audit results</h1>
        <p className="text-sm text-muted-foreground break-all">{data.url}</p>
      </div>

      <div className="mt-8">
        <FreeAuditResults requestId={data.id} initialStatus={data.status as AuditStatus} />
      </div>
    </div>
  );
}
