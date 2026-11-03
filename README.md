# Stellent QA

A website auditing tool with a public landing page and a client dashboard.
Users add sites they own, trigger audits that run on the external audit engine
(VPS), and view scored, plain-English results with per-finding fix guidance.

Built with **Next.js (App Router) + shadcn/ui + Tailwind CSS v4 + Supabase**,
mirroring the architecture of the CMA product (webhook job + callback,
idempotent result handling, RLS, service-role split).

## Status — core vertical slice

This is the first reviewable slice. It includes the full end-to-end audit path:

- Scaffold: Next.js App Router, Tailwind v4, hand-written shadcn/ui components.
- Supabase: browser / server / admin client split, cookie-based auth, middleware session refresh + route protection.
- SQL migrations: all four tables + RLS policies + service-role grants (`db/`).
- Auth: email/password login & signup.
- Dashboard: site list + quick stats, add-site form.
- Trigger audit → VPS (fire-and-forget) with live status polling.
- `/api/audit/receive-result`: secret-validated, idempotent callback that writes runs + findings.
- Findings display: verdict + score summary and per-finding how-to-fix breakdown.

**Not yet built** (next steps): full marketing landing page, free public audit
flow, weekly `pg_cron` scheduling, and Resend email notifications.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill in your values
npm run dev
```

### 1. Supabase

1. Create a Supabase project (or use an existing one).
2. In the SQL editor, run the migrations in order:
   - `db/001_schema.sql`
   - `db/002_policies.sql`
3. Enable **Email** auth under Authentication → Providers. For local testing you
   can turn off "Confirm email" so signup logs you straight in.
4. Put the project URL + anon key and the service-role key in `.env.local`
   (see `.env.local.example`). The service-role key is server-only — it never
   ships to the browser.

### 2. Webhook secret

Set `WEBHOOK_SECRET` to a long random string, shared with the VPS. It
authenticates both the outgoing job trigger and the incoming result callback.
See `docs/VPS-Webhook-Spec.md` for the full contract.

## Project structure

```
src/
  app/
    page.tsx                         landing (slice stub)
    login/ signup/                   email/password auth
    auth/callback/route.ts           email-confirmation exchange
    dashboard/
      layout.tsx                     protected shell
      page.tsx                       site list + quick stats
      actions.ts                     createSite / triggerAudit (server actions)
      sites/new/                     add-site form
      sites/[id]/                    site detail + audit history
      sites/[id]/runs/[runId]/       findings breakdown
    api/audit/receive-result/        VPS → app callback (idempotent)
  components/
    ui/                              shadcn/ui primitives
    auth/ dashboard/                 feature components
  lib/
    supabase/{client,server,admin,middleware}.ts
    vps.server.ts                    job trigger (server-only)
    webhook.ts                       x-webhook-secret validation
    audit.ts                         severity/verdict helpers
    types/database.ts                schema types
  middleware.ts                      session refresh + /dashboard guard
db/                                  SQL migrations
docs/VPS-Webhook-Spec.md             webhook contract
```

## Mirrored CMA patterns

- **Webhook secret** (`x-webhook-secret`) validated constant-time on every inbound request.
- **Job + callback**: trigger returns fast; the result arrives asynchronously.
- **Idempotency** on `run_id`: a terminal run is never processed twice.
- **RLS**: users only ever see their own sites/runs/findings; the VPS callback uses the service-role key.
- **Client split**: anon browser/server clients for user queries, a separate admin client for trusted writes.
- **Status polling** while a run is active.

## Deploy (Vercel)

Import the repo, set the environment variables from `.env.local.example`
(Production + Preview), and deploy. Point the VPS's `callback_url` /
`NEXT_PUBLIC_APP_URL` at the deployed domain (e.g. `https://qa.stellent.ai`).
