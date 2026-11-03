"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestFreeAudit } from "@/app/free-audit/actions";

export function FreeAuditForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const url = (fd.get("url") as string) ?? "";
    const email = (fd.get("email") as string) ?? "";

    startTransition(async () => {
      const result = await requestFreeAudit({ url, email: email || undefined });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/free-audit/${result.requestId}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="url">Website URL</Label>
        <Input
          id="url"
          name="url"
          type="url"
          placeholder="https://example.com"
          required
          disabled={isPending}
          className="h-11"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">
          Email <span className="text-muted-foreground">(optional — get notified when ready)</span>
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          disabled={isPending}
          className="h-11"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" size="lg" className="w-full gap-2" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Starting audit…
          </>
        ) : (
          <>
            Run free audit <ArrowRight className="size-4" />
          </>
        )}
      </Button>
    </form>
  );
}
