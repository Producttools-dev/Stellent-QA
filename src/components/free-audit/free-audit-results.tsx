"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle, Loader2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SEVERITY_META, FINDING_STATUS_META, scoreTone } from "@/lib/audit";
import type { AuditStatus, FindingStatus } from "@/lib/types/database";

type Severity = 0 | 1 | 2 | 3 | 4;

interface FreeFinding {
  test_id?: string | null;
  module?: string | null;
  title?: string | null;
  severity?: number | null;
  status?: FindingStatus | null;
  detail?: string | null;
  how_to_fix?: string | null;
}

interface FreeResult {
  verdict?: string | null;
  score?: number | null;
  pdf_url?: string | null;
  completed_at?: string | null;
  findings?: FreeFinding[];
}

interface FreeAuditStatus {
  id: string;
  status: AuditStatus;
  result: FreeResult | null;
}

const POLL_INTERVAL = 4000;

export function FreeAuditResults({ requestId, initialStatus }: { requestId: string; initialStatus: AuditStatus }) {
  const [state, setState] = useState<FreeAuditStatus>({ id: requestId, status: initialStatus, result: null });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const active = state.status === "pending" || state.status === "running";

  useEffect(() => {
    if (!active) return;

    async function poll() {
      try {
        const res = await fetch(`/api/free-audit/${requestId}`);
        if (res.ok) {
          const data = (await res.json()) as FreeAuditStatus;
          setState(data);
          if (data.status === "pending" || data.status === "running") {
            timerRef.current = setTimeout(poll, POLL_INTERVAL);
          }
        } else {
          timerRef.current = setTimeout(poll, POLL_INTERVAL);
        }
      } catch {
        timerRef.current = setTimeout(poll, POLL_INTERVAL);
      }
    }

    timerRef.current = setTimeout(poll, POLL_INTERVAL);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active, requestId]);

  if (active) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <Loader2 className="size-10 animate-spin text-primary" />
        <p className="text-lg font-medium">Auditing your site…</p>
        <p className="text-sm text-muted-foreground">This usually takes 1–3 minutes. Hang tight.</p>
      </div>
    );
  }

  if (state.status === "failed" || !state.result) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <XCircle className="size-10 text-destructive" />
        <p className="text-lg font-medium">Audit failed</p>
        <p className="text-sm text-muted-foreground">We couldn&apos;t complete the audit. Please try again.</p>
        <Button asChild variant="outline">
          <Link href="/free-audit">Try again</Link>
        </Button>
      </div>
    );
  }

  const { verdict, score, findings = [] } = state.result;
  const tone = scoreTone(score ?? null);
  const scoreColor =
    tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-destructive";

  return (
    <div className="space-y-6">
      {/* Summary card */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-6 pt-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle className="size-4 text-success" />
              <p className="text-sm text-muted-foreground">Audit complete</p>
            </div>
            <p className="text-lg font-semibold">{verdict ?? "Audit complete."}</p>
            {findings.length > 0 && (
              <p className="text-sm text-muted-foreground">{findings.length} finding{findings.length === 1 ? "" : "s"} found</p>
            )}
          </div>
          {score != null && (
            <div className="text-center">
              <div className={`text-5xl font-bold tabular-nums ${scoreColor}`}>{score}</div>
              <p className="mt-1 text-xs text-muted-foreground">Health score</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Findings preview — top 5 */}
      {findings.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">
            Findings preview <span className="text-sm font-normal text-muted-foreground">(showing up to 5)</span>
          </h2>
          <div className="space-y-2">
            {findings.slice(0, 5).map((f, i) => (
              <FindingRow key={i} finding={f} />
            ))}
          </div>
          {findings.length > 5 && (
            <p className="text-sm text-muted-foreground">
              + {findings.length - 5} more finding{findings.length - 5 === 1 ? "" : "s"}.{" "}
              <Link href="/signup" className="text-primary hover:underline">Sign up for the full report.</Link>
            </p>
          )}
        </section>
      )}

      {/* Sign-up CTA */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="space-y-3 pt-6">
          <p className="font-semibold">Get the full report — free</p>
          <p className="text-sm text-muted-foreground">
            Sign up to see all findings with detailed fix guidance, download a PDF, and schedule weekly audits.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="gap-2">
              <Link href="/signup">
                Create free account <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/free-audit">Audit another site</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FindingRow({ finding }: { finding: FreeFinding }) {
  const [open, setOpen] = useState(false);
  const sev = (finding.severity ?? 4) as Severity;
  const severityMeta = SEVERITY_META[sev];
  const statusMeta = finding.status ? FINDING_STATUS_META[finding.status] : null;

  return (
    <div className="rounded-lg border bg-card p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 text-left"
      >
        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={severityMeta.tone}>{severityMeta.label}</Badge>
            {statusMeta && <Badge variant={statusMeta.tone}>{statusMeta.label}</Badge>}
            {finding.module && (
              <span className="text-xs text-muted-foreground">{finding.module}</span>
            )}
          </div>
          <p className="text-sm font-medium">{finding.title ?? "Untitled finding"}</p>
        </div>
        <span className="mt-0.5 text-xs text-muted-foreground">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-2 border-t pt-3">
          {finding.detail && <p className="text-sm text-muted-foreground">{finding.detail}</p>}
          {finding.how_to_fix && (
            <div className="rounded-md bg-muted/60 p-3 text-sm">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                How to fix
              </p>
              <p>{finding.how_to_fix}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
