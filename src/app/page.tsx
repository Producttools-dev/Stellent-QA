import Link from "next/link";
import { ArrowRight, Gauge, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Landing page (slice stub). The full marketing page — hero, how-it-works,
 * sample report, pricing, and the free-audit flow — is the next build step.
 */
export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6">
      <header className="flex items-center justify-between py-6">
        <div className="flex items-center gap-2 font-semibold">
          <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">
            Q
          </span>
          Stellent QA
        </div>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
        </nav>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center gap-6 py-16 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="size-3.5" /> Automated website quality audits
        </span>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Know what&apos;s wrong with your website — in plain English.
        </h1>
        <p className="max-w-xl text-balance text-muted-foreground">
          Stellent QA audits your site for SEO, performance, and quality issues, then tells you
          exactly what to fix and why it matters.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/free-audit">
              Run a free audit <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/signup">Create an account</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 pb-20 sm:grid-cols-3">
        {[
          { icon: Gauge, title: "Scored audits", body: "Every run gets a 0–100 health score and a clear verdict." },
          { icon: ShieldCheck, title: "Actionable findings", body: "Each issue ships with how-to-fix guidance." },
          { icon: Sparkles, title: "Always watching", body: "Schedule weekly audits and get notified on regressions." },
        ].map(({ icon: Icon, title, body }) => (
          <Card key={title}>
            <CardContent className="space-y-2 pt-6">
              <Icon className="size-5 text-primary" />
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{body}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
