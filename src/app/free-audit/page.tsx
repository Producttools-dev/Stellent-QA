import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { FreeAuditForm } from "@/components/free-audit/free-audit-form";

export const metadata = { title: "Free Website Audit — Stellent QA" };

export default function FreeAuditPage() {
  return (
    <div className="mx-auto min-h-screen max-w-lg px-6 py-12">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back
      </Link>

      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Free website audit</h1>
        <p className="text-muted-foreground">
          Enter your URL and we&apos;ll audit it for SEO, performance, and quality issues — no account needed.
        </p>
      </div>

      <Card className="mt-8">
        <CardContent className="pt-6">
          <FreeAuditForm />
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Want to track multiple sites and schedule weekly audits?{" "}
        <Link href="/signup" className="text-primary hover:underline">
          Create a free account.
        </Link>
      </p>
    </div>
  );
}
