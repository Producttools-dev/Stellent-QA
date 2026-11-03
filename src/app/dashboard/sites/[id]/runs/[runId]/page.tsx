import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RunStatusPoller } from "@/components/dashboard/run-status-poller";
import { FindingItem } from "@/components/dashboard/finding-item";
import {
  RUN_STATUS_META,
  countBySeverity,
  deriveVerdict,
  isActiveRun,
  scoreTone,
} from "@/lib/audit";
import type { AuditRun, Finding } from "@/lib/types/database";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ id: string; runId: string }>;
}) {
  const { id, runId } = await params;
  const supabase = await createClient();

  const { data: runRow } = await supabase
    .from("audit_runs")
    .select("*")
    .eq("id", runId)
    .eq("site_id", id)
    .maybeSingle();
  if (!runRow) notFound();
  const run: AuditRun = runRow;

  const { data: site } = await supabase.from("sites").select("name, url").eq("id", id).maybeSingle();

  const { data: findingsData } = await supabase
    .from("findings")
    .select("*")
    .eq("run_id", runId)
    .order("severity", { ascending: true, nullsFirst: false });
  const findings: Finding[] = findingsData ?? [];

  const statusMeta = RUN_STATUS_META[run.status];
  const counts = countBySeverity(findings);
  const verdict = deriveVerdict(run, findings);
  const active = isActiveRun(run.status);

  return (
    <div className="space-y-6">
      <Link
        href={`/dashboard/sites/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> {site?.name ?? "Site"}
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Audit result</h1>
            <Badge variant={statusMeta.tone}>{statusMeta.label}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{formatDate(run.created_at)}</p>
        </div>
        <RunStatusPoller active={active} />
      </div>

      {/* Verdict / score summary */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-6 pt-6">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Verdict</p>
            <p className="text-lg font-semibold">{verdict}</p>
            {run.status === "complete" && (
              <div className="flex gap-4 pt-1 text-sm text-muted-foreground">
                <span>
                  <strong className="text-destructive">{counts.critical}</strong> critical
                </span>
                <span>
                  <strong className="text-warning">{counts.warnings}</strong> warnings
                </span>
                <span>
                  <strong className="text-success">{counts.passed}</strong> passed
                </span>
              </div>
            )}
          </div>
          {run.score != null && (
            <div className="text-center">
              <div
                className={cnScore(scoreTone(run.score))}
              >
                {run.score}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Health score</p>
            </div>
          )}
        </CardContent>
      </Card>

      {run.pdf_url && (
        <Button asChild variant="outline">
          <a href={run.pdf_url} target="_blank" rel="noopener noreferrer">
            <FileText className="size-4" /> Download PDF report
          </a>
        </Button>
      )}

      {/* Findings */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          Findings {findings.length > 0 && <span className="text-muted-foreground">({findings.length})</span>}
        </h2>
        {active ? (
          <p className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
            The audit is still running. Findings will appear here as soon as it finishes.
          </p>
        ) : findings.length === 0 ? (
          <p className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
            {run.status === "failed"
              ? run.error_message ?? "This audit failed before producing findings."
              : "No findings were reported for this run."}
          </p>
        ) : (
          <div className="space-y-2">
            {findings.map((finding) => (
              <FindingItem key={finding.id} finding={finding} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function cnScore(tone: string): string {
  const color =
    tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-warning"
        : tone === "destructive"
          ? "text-destructive"
          : "text-muted-foreground";
  return `text-5xl font-bold tabular-nums ${color}`;
}
