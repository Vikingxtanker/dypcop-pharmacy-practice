-- Health Camp 2026 participant certificates (/certificate-2026).
--
-- Mirrors the public lookup model of the existing /certificate participant
-- table: the page reads the full list of registered participants (name, phone,
-- prefix) and matches the visitor's input client-side, exactly like the 2025
-- flow. The table is read-only for the public site so no visitor can alter or
-- add records through the app.
--
-- id is a UUID generated server-side for every participant (gen_random_uuid is
-- built in on modern PostgreSQL/Supabase); the app never supplies it.
--
-- No candidate-scan indexes are added: the certificate page fetches the whole
-- table and filters in JavaScript (same as /certificate), so a btree on name or
-- phone would never be used. If lookups later move into SQL, add targeted
-- indexes (e.g. lower(name), phone) at that point.

create extension if not exists pgcrypto;

create table if not exists public.participants2026 (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  prefix text
);

alter table public.participants2026 enable row level security;

drop policy if exists "participants2026 public read" on public.participants2026;

-- The public certificate page runs as the anon role (browser supabase client)
-- and only ever SELECTs; keep writes unavailable to the public site.
create policy "participants2026 public read"
  on public.participants2026
  for select
  to anon, authenticated
  using (true);

grant select on public.participants2026 to anon, authenticated;