import Link from "next/link";
import { Plus, Globe, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RUN_STATUS_META, scoreTone } from "@/lib/audit";
import type { AuditRun, Site } from "@/lib/types/database";

export const metadata = { title: "Dashboard — Stellent QA" };

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: sites } = await supabase
    .from("sites")
    .select("*")
    .order("created_at", { ascending: false });

  const siteList: Site[] = sites ?? [];
  const siteIds = siteList.map((s) => s.id);

  let runs: AuditRun[] = [];
  if (siteIds.length > 0) {
    const { data } = await supabase
      .from("audit_runs")
      .select("*")
      .in("site_id", siteIds)
      .order("created_at", { ascending: false });
    runs = data ?? [];
  }

  const latestBySite = new Map<string, AuditRun>();
  for (const run of runs) {
    if (!latestBySite.has(run.site_id)) latestBySite.set(run.site_id, run);
  }

  const completed = runs.filter((r) => r.status === "complete" && r.score != null);
  const avgScore =
    completed.length > 0
      ? Math.round(completed.reduce((sum, r) => sum + (r.score ?? 0), 0) / completed.length)
      : null;

  const stats = [
    { label: "Sites monitored", value: siteList.length },
    { label: "Total audits", value: runs.length },
    { label: "Avg. score", value: avgScore == null ? "—" : `${avgScore}` },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your sites</h1>
          <p className="text-sm text-muted-foreground">Monitor and audit the sites you own.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/sites/new">
            <Plus className="size-4" /> Add site
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">{s.label}</div>
              <div className="mt-1 text-3xl font-bold tabular-nums">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {siteList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="grid size-12 place-items-center rounded-full bg-muted">
              <Globe className="size-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">No sites yet</p>
              <p className="text-sm text-muted-foreground">
                Add your first site to run an audit.
              </p>
            </div>
            <Button asChild>
              <Link href="/dashboard/sites/new">
                <Plus className="size-4" /> Add your first site
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {siteList.map((site) => {
            const latest = latestBySite.get(site.id);
            const statusMeta = latest ? RUN_STATUS_META[latest.status] : null;
            return (
              <Link key={site.id} href={`/dashboard/sites/${site.id}`} className="group">
                <Card className="h-full transition-colors group-hover:border-primary/40">
                  <CardHeader className="flex-row items-start justify-between space-y-0">
                    <div className="min-w-0">
                      <CardTitle className="truncate">{site.name}</CardTitle>
                      <p className="mt-1 truncate text-sm text-muted-foreground">{site.url}</p>
                    </div>
                    {latest?.score != null && (
                      <Badge variant={scoreTone(latest.score)}>{latest.score}</Badge>
                    )}
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    {statusMeta ? (
                      <Badge variant={statusMeta.tone}>{statusMeta.label}</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">No audits yet</span>
                    )}
                    <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
