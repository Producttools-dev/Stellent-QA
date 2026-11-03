"use client";

import { useState } from "react";
import { ChevronDown, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { FINDING_STATUS_META, SEVERITY_META } from "@/lib/audit";
import type { Finding } from "@/lib/types/database";

export function FindingItem({ finding }: { finding: Finding }) {
  const [open, setOpen] = useState(false);

  const statusMeta = finding.status ? FINDING_STATUS_META[finding.status] : null;
  const sevMeta =
    finding.severity != null
      ? SEVERITY_META[finding.severity as 0 | 1 | 2 | 3 | 4]
      : undefined;
  const hasFix = Boolean(finding.how_to_fix);

  return (
    <div className="rounded-lg border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start justify-between gap-3 p-4 text-left"
        aria-expanded={open}
      >
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            {statusMeta && <Badge variant={statusMeta.tone}>{statusMeta.label}</Badge>}
            {sevMeta && finding.status !== "pass" && (
              <Badge variant={sevMeta.tone}>{sevMeta.label}</Badge>
            )}
            {finding.module && (
              <span className="text-xs text-muted-foreground">{finding.module}</span>
            )}
            {finding.test_id && (
              <span className="text-xs text-muted-foreground">· {finding.test_id}</span>
            )}
          </div>
          <p className="font-medium">{finding.title ?? "Untitled finding"}</p>
          {finding.detail && (
            <p className="text-sm text-muted-foreground">{finding.detail}</p>
          )}
        </div>
        {hasFix && (
          <ChevronDown
            className={cn(
              "mt-1 size-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        )}
      </button>

      {hasFix && open && (
        <div className="border-t bg-muted/30 p-4">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <Lightbulb className="size-4 text-warning" /> How to fix
          </div>
          <p className="mt-1.5 whitespace-pre-line text-sm text-muted-foreground">
            {finding.how_to_fix}
          </p>
        </div>
      )}
    </div>
  );
}
