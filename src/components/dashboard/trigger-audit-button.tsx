"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import { triggerAudit } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";

export function TriggerAuditButton({
  siteId,
  disabled,
}: {
  siteId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      const result = await triggerAudit(siteId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Audit started — results will appear here when ready.");
      router.refresh();
    });
  }

  return (
    <Button onClick={run} disabled={pending || disabled}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
      Run audit
    </Button>
  );
}
