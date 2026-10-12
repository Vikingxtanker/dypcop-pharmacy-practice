-- Health Camp 2026 certificate download tracking.
--
-- Adds a boolean "downloaded" flag to public.certificates2026:
--   false (default) -> no successful certificate PDF download recorded yet
--   true            -> a successful certificate PDF download response /
--                      browser-download initiation has been recorded
--
-- Definition of the tracked event: a certificate is marked downloaded once the
-- server-side tracking endpoint receives a request for an existing certificate
-- after the browser download has been initiated. A website cannot confirm that
-- the user actually saved the file to disk; only the download response is
-- tracked.
--
-- Requirements honored:
-- - Boolean column (not "yes"/"no" text).
-- - NOT NULL DEFAULT FALSE, so existing rows are backfilled to false and newly
--   issued certificates default to false.
-- - The flag is only ever set true by the server-side tracking endpoint using
--   the service role. The application never resets it to false.
-- - Safe to apply to the existing table; it does not delete, recreate, or
--   regenerate any certificate and does not touch other columns or tables.

alter table public.certificates2026
  add column if not exists downloaded boolean not null default false;

comment on column public.certificates2026.downloaded is
  'True once a certificate PDF download has been successfully initiated and recorded server-side. Never reset to false by the application.';
