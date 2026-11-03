import type { AuditRun, AuditStatus, Finding, FindingStatus } from "@/lib/types/database";

/**
 * Domain helpers for audit presentation. No secrets — safe on the client.
 */

/** Matches the variant union of the Badge component. */
export type BadgeTone =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning"
  | "muted";

export const SEVERITY_META: Record<0 | 1 | 2 | 3 | 4, { label: string; tone: BadgeTone }> = {
  0: { label: "Critical", tone: "destructive" },
  1: { label: "High", tone: "destructive" },
  2: { label: "Medium", tone: "warning" },
  3: { label: "Low", tone: "muted" },
  4: { label: "Minor", tone: "muted" },
};

export function severityLabel(severity: number | null): string {
  if (severity == null) return "Unknown";
  const meta = SEVERITY_META[severity as 0 | 1 | 2 | 3 | 4];
  return meta?.label ?? "Unknown";
}

export const FINDING_STATUS_META: Record<FindingStatus, { label: string; tone: BadgeTone }> = {
  pass: { label: "Pass", tone: "success" },
  fail: { label: "Fail", tone: "destructive" },
  warning: { label: "Warning", tone: "warning" },
};

export const RUN_STATUS_META: Record<AuditStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: "Pending", tone: "muted" },
  running: { label: "Running", tone: "warning" },
  complete: { label: "Complete", tone: "success" },
  failed: { label: "Failed", tone: "destructive" },
};

export function isActiveRun(status: AuditStatus): boolean {
  return status === "pending" || status === "running";
}

export function scoreTone(score: number | null): BadgeTone {
  if (score == null) return "muted";
  if (score >= 85) return "success";
  if (score >= 60) return "warning";
  return "destructive";
}

/**
 * Plain-English verdict for a run, mirroring the brief's example copy.
 * Uses the VPS-provided verdict when present, otherwise derives one from the
 * findings (critical/high counts) or the score.
 */
export function deriveVerdict(run: Pick<AuditRun, "verdict" | "score" | "status">, findings: Finding[]): string {
  if (run.verdict) return run.verdict;
  if (run.status === "failed") return "This audit could not be completed.";
  if (run.status !== "complete") return "Audit in progress…";

  const critical = findings.filter((f) => f.status === "fail" && (f.severity ?? 4) <= 1).length;
  const failing = findings.filter((f) => f.status === "fail").length;

  if (critical > 0) {
    return `${critical} critical issue${critical === 1 ? "" : "s"} found — action needed.`;
  }
  if (failing > 0) {
    return `${failing} issue${failing === 1 ? "" : "s"} found across your site.`;
  }
  if ((run.score ?? 0) >= 85) return "Your site is in good shape.";
  return "Your site passed with a few things to watch.";
}

export function countBySeverity(findings: Finding[]): { critical: number; warnings: number; passed: number } {
  return {
    critical: findings.filter((f) => f.status === "fail" && (f.severity ?? 4) <= 1).length,
    warnings: findings.filter((f) => f.status === "warning" || (f.status === "fail" && (f.severity ?? 4) > 1)).length,
    passed: findings.filter((f) => f.status === "pass").length,
  };
}
