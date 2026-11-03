import Link from "next/link";
import { ArrowRight, CheckCircle, Clock, FileText, Gauge, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground text-sm">
              Q
            </span>
            Stellent QA
          </Link>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Get started free</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-5xl px-6 pb-16 pt-20 text-center">
          <Badge variant="outline" className="mb-6 gap-1.5">
            <Sparkles className="size-3.5" /> AI-powered website quality audits
          </Badge>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Know exactly what&apos;s wrong with your website —{" "}
            <span className="text-primary">in plain English.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
            Stellent QA audits your site for SEO, performance, accessibility, and content quality issues,
            then gives you a scored report with step-by-step fix guidance. No jargon. No guesswork.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" className="gap-2">
              <Link href="/free-audit">
                Run a free audit <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/signup">Create an account</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">No credit card required · Results in minutes</p>
        </section>

        {/* How it works */}
        <section className="border-y bg-muted/30 py-20">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
              <p className="mt-3 text-muted-foreground">From URL to actionable report in three steps.</p>
            </div>
            <div className="grid gap-8 sm:grid-cols-3">
              {STEPS.map((step, i) => (
                <div key={step.title} className="flex flex-col items-center gap-4 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                    {i + 1}
                  </div>
                  <step.icon className="size-6 text-primary" />
                  <div>
                    <h3 className="font-semibold">{step.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sample report preview */}
        <section className="mx-auto max-w-5xl px-6 py-20">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold tracking-tight">What you&apos;ll get</h2>
            <p className="mt-3 text-muted-foreground">
              Each audit delivers a scored summary and per-issue fix guidance.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Score card mock */}
            <Card className="overflow-hidden">
              <div className="border-b bg-muted/40 px-5 py-3 text-sm font-medium">Audit summary</div>
              <CardContent className="space-y-4 pt-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Verdict</p>
                    <p className="mt-0.5 font-semibold">2 critical issues found — action needed.</p>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-destructive">62</div>
                    <p className="mt-0.5 text-xs text-muted-foreground">Health score</p>
                  </div>
                </div>
                <div className="flex gap-6 text-sm text-muted-foreground">
                  <span><strong className="text-destructive">2</strong> critical</span>
                  <span><strong className="text-warning">5</strong> warnings</span>
                  <span><strong className="text-success">11</strong> passed</span>
                </div>
              </CardContent>
            </Card>

            {/* Sample finding mock */}
            <Card className="overflow-hidden">
              <div className="border-b bg-muted/40 px-5 py-3 text-sm font-medium">Sample finding</div>
              <CardContent className="space-y-3 pt-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="text-xs">Critical</Badge>
                      <Badge variant="outline" className="text-xs">SEO</Badge>
                    </div>
                    <p className="font-medium">Missing meta description on 4 pages</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Search engines use the meta description as the page snippet in results.
                  Missing descriptions reduce click-through rates and signal thin content.
                </p>
                <div className="rounded-md bg-muted/60 p-3 text-sm">
                  <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-1">How to fix</p>
                  Add a unique 150–160 character{" "}
                  <code className="rounded bg-muted px-1 font-mono text-xs">&lt;meta name=&quot;description&quot;&gt;</code>{" "}
                  tag to each page&apos;s{" "}
                  <code className="rounded bg-muted px-1 font-mono text-xs">&lt;head&gt;</code>.
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Features */}
        <section className="border-t bg-muted/30 py-20">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold tracking-tight">Everything you need</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, body }) => (
                <Card key={title} className="border-0 bg-card shadow-sm">
                  <CardContent className="space-y-2 pt-6">
                    <Icon className="size-5 text-primary" />
                    <h3 className="font-semibold">{title}</h3>
                    <p className="text-sm text-muted-foreground">{body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-5xl px-6 py-20 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Ready to see your score?</h2>
          <p className="mt-3 text-muted-foreground">
            Run a free audit right now — no account needed.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" className="gap-2">
              <Link href="/free-audit">
                Run a free audit <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/signup">Sign up for full access</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-5xl px-6 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="grid size-5 place-items-center rounded bg-primary text-primary-foreground text-xs font-bold">Q</span>
            Stellent QA
          </div>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-foreground">Sign in</Link>
            <Link href="/signup" className="hover:text-foreground">Sign up</Link>
            <Link href="/free-audit" className="hover:text-foreground">Free audit</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

const STEPS = [
  {
    icon: Zap,
    title: "Enter your URL",
    body: "Paste your website URL. We'll start the audit immediately — no setup or configuration needed.",
  },
  {
    icon: Gauge,
    title: "We audit your site",
    body: "Our engine checks SEO, performance, accessibility, and content quality across your pages.",
  },
  {
    icon: FileText,
    title: "Get your scored report",
    body: "Receive a 0–100 health score, a plain-English verdict, and a full list of issues with how-to-fix steps.",
  },
];

const FEATURES = [
  {
    icon: Gauge,
    title: "Health score",
    body: "Every run produces a 0–100 score with a plain-English verdict so you know where you stand at a glance.",
  },
  {
    icon: ShieldCheck,
    title: "Actionable findings",
    body: "Each issue comes with a title, severity level, and step-by-step instructions to fix it.",
  },
  {
    icon: CheckCircle,
    title: "Pass/fail tracking",
    body: "See exactly which checks passed, which warned, and which failed — with no noise.",
  },
  {
    icon: Clock,
    title: "Audit history",
    body: "Track every audit run in your dashboard. Spot regressions before your users do.",
  },
  {
    icon: Sparkles,
    title: "Scheduled audits",
    body: "Set weekly automated audits and get notified the moment something breaks.",
  },
  {
    icon: FileText,
    title: "PDF reports",
    body: "Download a shareable PDF report for each audit run — perfect for clients and stakeholders.",
  },
];
