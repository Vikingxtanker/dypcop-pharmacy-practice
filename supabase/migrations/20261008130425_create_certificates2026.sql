-- Create certificates2026 table for Health Camp 2026 certificate verification
-- 
-- Requirements:
-- - Unique secure Certificate ID HC26-XXXXXXXX (server-generated, not sequential/timestamp/name/phone)
-- - One persistent certificate per participant (reuse existing certificate_id on re-generation)
-- - Linked to participants2026.id via FK
-- - RLS enabled, public read for anon/authenticated
-- - Browser must never supply certificate_id/status/issued_at/name

create extension if not exists pgcrypto;

create table if not exists public.certificates2026 (
  id uuid primary key default gen_random_uuid(),
  certificate_id text unique not null,
  participant_id uuid not null references public.participants2026(id) on delete restrict,
  issued_at timestamptz not null default now(),
  status text not null default 'valid'
);

create unique index if not exists certificates2026_participant_id_unique
  on public.certificates2026(participant_id);

alter table public.certificates2026 enable row level security;

drop policy if exists "certificates2026 public read" on public.certificates2026;
drop policy if exists "certificates2026 public write" on public.certificates2026;

-- Public can read certificates for verification only
create policy "certificates2026 public read"
  on public.certificates2026
  for select
  to anon, authenticated
  using (true);

-- Only service role can insert/update certificates (server-side issuance)
-- No policies for insert/update for anon/authenticated
create policy "certificates2026 service write"
  on public.certificates2026
  for insert
  to service_role
  with check (true);

create policy "certificates2026 service update"
  on public.certificates2026
  for update
  to service_role
  using (true);

grant select on public.certificates2026 to anon, authenticated;
grant insert, update on public.certificates2026 to service_role;