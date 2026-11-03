import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AddSiteForm } from "@/components/dashboard/add-site-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Add site — Stellent QA" };

export default function NewSitePage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to dashboard
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Add a site</CardTitle>
          <CardDescription>Add a website you own to start auditing it.</CardDescription>
        </CardHeader>
        <CardContent>
          <AddSiteForm />
        </CardContent>
      </Card>
    </div>
  );
}
