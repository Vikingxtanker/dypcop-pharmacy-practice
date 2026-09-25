-- Corrective migration: restore the IST-day uniqueness index that
-- public.record_patient_review depends on for its ON CONFLICT upsert.
--
-- HISTORY
--  20260918120000_add_patient_daily_test_uniqueness.sql declared a functional
--  UNIQUE INDEX on public.patient_tests so that each patient has at most one
--  recorded value per (patient, IST calendar day, test_type). record_patient_review
--  (also security-invoker RPC) performs its idempotent same-day writes through
--  the exact matching ON CONFLICT specification:
--
--    on conflict (patient_id, ((created_at at time zone 'Asia/Kolkata')::date), test_type)
--
--  LIVE DIAGNOSIS (verified against the deployed database, not guessed)
--  After the 42702 ambiguity fix (20260925130000) was applied, calling the RPC on
--  a real visible patient produced:
--
--    ERROR 42P10: there is no unique or exclusion constraint matching
--    the ON CONFLICT specification
--
--  i.e. the unique index created by 20260918120000_... is NOT present in the
--  deployed PostgreSQL instance (or, equivalently, nothing matching the conflict
--  target exists). The RPC's conflict target parses and resolves now, so it
--  reaches the planner's inference step, which finds no matching unique index and
--  aborts. The station flow only inserts fresh rows, so its lack was invisible
--  until the review feature was production traffic.
--
-- FIX
--  Recreate the exact intended functional unique index if missing. The pre-flight
--  duplicate check mirrors the original migration: if production already contains
--  same-day duplicate patient_tests rows, the UNIQUE index cannot be built and the
--  operator must reconcile them first (nothing is deleted or modified here).
--
-- This migration is safe when 20260918120000 already applies (IF NOT EXISTS) and
-- does not touch tables, functions, grants, RLS, or any other object.

DO $$
DECLARE
  total_dup_rows bigint := 0;
  dup_groups integer := 0;
BEGIN
  WITH dup AS (
    SELECT patient_id,
           (created_at AT TIME ZONE 'Asia/Kolkata')::date AS ist_day,
           test_type,
           COUNT(*) AS n
    FROM public.patient_tests
    WHERE created_at IS NOT NULL
    GROUP BY patient_id, ist_day, test_type
    HAVING COUNT(*) > 1
  )
  SELECT COALESCE(SUM(n), 0), COUNT(*) INTO total_dup_rows, dup_groups FROM dup;

  IF total_dup_rows > 0 THEN
    RAISE EXCEPTION
      'Existing duplicate rows found before creating the unique index: % rows across % (patient_id, IST-day, test_type) group(s). '
      'No data was modified. Reconcile duplicates manually, then re-run this migration. '
      'Diagnostic: SELECT patient_id, (created_at AT TIME ZONE ''Asia/Kolkata'')::date AS ist_day, test_type, COUNT(*) '
      'FROM patient_tests GROUP BY 1,2,3 HAVING COUNT(*) > 1;',
      total_dup_rows, dup_groups;
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS patient_tests_patient_ist_day_test_type_key
  ON public.patient_tests (patient_id, ((created_at AT TIME ZONE 'Asia/Kolkata')::date), test_type);

-- Supporting index for patient/day range queries, restored alongside the unique
-- index from the base migration that this corrects.
CREATE INDEX IF NOT EXISTS patient_tests_patient_created_at_idx
  ON public.patient_tests (patient_id, created_at);