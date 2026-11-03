import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TriggerAuditButton } from "@/components/dashboard/trigger-audit-button";
import { RunStatusPoller } from "@/components/dashboard/run-status-poller";
import { RUN_STATUS_META, isActiveRun, scoreTone } from "@/lib/audit";
import type { AuditRun } from "@/lib/types/database";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function SiteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: site } = await supabase.from("sites").select("*").eq("id", id).maybeSingle();
  if (!site) notFound();

  const { data: runsData } = await supabase
    .from("audit_runs")
    .select("*")
    .eq("site_id", id)
    .order("created_at", { ascending: false });
  const runs: AuditRun[] = runsData ?? [];

  const hasActive = runs.some((r) => isActiveRun(r.status));

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to dashboard
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">{site.name}</h1>
          <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            {site.url} <ExternalLink className="size-3.5" />
          </a>
        </div>
        <div className="flex items-center gap-3">
          <RunStatusPoller active={hasActive} />
          <TriggerAuditButton siteId={site.id} disabled={hasActive} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audit history</CardTitle>
        </CardHeader>
        <CardContent>
          {runs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No audits yet. Run your first audit above.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Verdict</TableHead>
                  <TableHead className="w-0" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((run) => {
                  const meta = RUN_STATUS_META[run.status];
                  return (
                    <TableRow key={run.id}>
                      <TableCell className="whitespace-nowrap">{formatDate(run.created_at)}</TableCell>
                      <TableCell>
                        <Badge variant={meta.tone}>{meta.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {run.score == null ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <Badge variant={scoreTone(run.score)}>{run.score}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">
                        {run.verdict ?? (run.status === "failed" ? run.error_message : "—")}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/dashboard/sites/${site.id}/runs/${run.id}`}
                          className="text-sm text-primary underline-offset-4 hover:underline"
                        >
                          View
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
