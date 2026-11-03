"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * While an audit is pending/running, refresh the server component on an
 * interval so the finished result (posted to our callback by the VPS) shows up
 * without a manual reload. The CMA dashboard polls the same way.
 */
export function RunStatusPoller({
  active,
  intervalMs = 5000,
}: {
  active: boolean;
  intervalMs?: number;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs, router]);

  if (!active) return null;

  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
      <Loader2 className="size-3.5 animate-spin" />
      Auditing in progress…
    </span>
  );
}
