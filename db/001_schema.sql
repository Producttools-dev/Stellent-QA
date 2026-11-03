-- ============================================================
-- Stellent QA — core schema
-- Run once in the Supabase SQL editor. Safe to re-run.
-- ============================================================

-- Sites being monitored ----------------------------------------
create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  url text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_sites_user on public.sites (user_id, created_at desc);

-- One row per audit run ----------------------------------------
create table if not exists public.audit_runs (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'running', 'complete', 'failed')),
  triggered_by text not null default 'manual'
    check (triggered_by in ('manual', 'scheduled', 'free_public')),
  verdict text,
  score int check (score between 0 and 100),
  pdf_url text,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_audit_runs_site on public.audit_runs (site_id, created_at desc);
create index if not exists idx_audit_runs_status on public.audit_runs (status);

-- Individual findings per run ----------------------------------
create table if not exists public.findings (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.audit_runs(id) on delete cascade,
  test_id text,
  module text,
  title text,
  severity int check (severity between 0 and 4),   -- 0 = critical … 4 = minor
  status text check (status in ('pass', 'fail', 'warning')),
  detail text,
  how_to_fix text,
  created_at timestamptz not null default now()
);

create index if not exists idx_findings_run on public.findings (run_id, severity);

-- Free public audit requests (no auth required) ----------------
create table if not exists public.free_audit_requests (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  email text,
  status text not null default 'pending'
    check (status in ('pending', 'running', 'complete', 'failed')),
  result jsonb,
  created_at timestamptz not null default now()
);
