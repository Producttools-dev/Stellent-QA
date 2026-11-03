-- ============================================================
-- Stellent QA — Row Level Security
-- Run after 001_schema.sql. Safe to re-run.
--
-- Model (mirrors CMA): users only ever see and change their own sites,
-- runs, and findings. The service-role key (used by the VPS callback)
-- bypasses RLS entirely, so no policy is needed for it — only grants.
-- ============================================================

alter table public.sites enable row level security;
alter table public.audit_runs enable row level security;
alter table public.findings enable row level security;
alter table public.free_audit_requests enable row level security;

-- Sites: owner-only CRUD --------------------------------------
drop policy if exists "sites_select_own" on public.sites;
create policy "sites_select_own" on public.sites
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "sites_insert_own" on public.sites;
create policy "sites_insert_own" on public.sites
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "sites_update_own" on public.sites;
create policy "sites_update_own" on public.sites
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "sites_delete_own" on public.sites;
create policy "sites_delete_own" on public.sites
  for delete to authenticated using (user_id = auth.uid());

-- Audit runs: scoped through the owning site ------------------
drop policy if exists "audit_runs_select_own" on public.audit_runs;
create policy "audit_runs_select_own" on public.audit_runs
  for select to authenticated using (
    exists (
      select 1 from public.sites s
      where s.id = audit_runs.site_id and s.user_id = auth.uid()
    )
  );

drop policy if exists "audit_runs_insert_own" on public.audit_runs;
create policy "audit_runs_insert_own" on public.audit_runs
  for insert to authenticated with check (
    exists (
      select 1 from public.sites s
      where s.id = audit_runs.site_id and s.user_id = auth.uid()
    )
  );

-- Findings: read-only for owners (writes come from the VPS callback
-- via the service-role key, which bypasses RLS) ----------------
drop policy if exists "findings_select_own" on public.findings;
create policy "findings_select_own" on public.findings
  for select to authenticated using (
    exists (
      select 1
      from public.audit_runs r
      join public.sites s on s.id = r.site_id
      where r.id = findings.run_id and s.user_id = auth.uid()
    )
  );

-- free_audit_requests has no authenticated policies: it is written and read
-- only by the service role (public free-audit flow runs server-side).

-- Service-role grants (service role still needs table privileges) ----
grant usage on schema public to service_role;
grant select, insert, update, delete on public.sites to service_role;
grant select, insert, update, delete on public.audit_runs to service_role;
grant select, insert, update, delete on public.findings to service_role;
grant select, insert, update, delete on public.free_audit_requests to service_role;
