-- Business rule: one patient + one IST calendar day = one screening, with each
-- screening test recorded at most once per day.
--
-- Enforced via a functional unique index. PostgreSQL UNIQUE table constraints
-- cannot use derived expressions, so we use a UNIQUE INDEX on the IST calendar
-- day expression of the stored timestamptz `created_at`.
--
-- Blood Pressure is stored as three closely-related rows in this schema
-- (test_type IN ('Systolic', 'Diastolic', 'BP')). Because those three rows have
-- distinct test_type values, one full BP trio per patient per IST day is allowed
-- by the index, while a second BP measurement on the same day is rejected on the
-- first conflicting member (Systolic/Diastolic/BP).

-- 1) Pre-flight duplicate check. Reports existing duplicate same-day rows and
--    aborts the migration if any are found. It never deletes or modifies data;
--    the operator must reconcile duplicates manually before re-applying.
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
      'Existing duplicate rows found: % rows across % (patient_id, IST-day, test_type) group(s). '
      'No data was modified. Review and reconcile duplicates manually, then re-run this migration. '
      'Diagnostic: SELECT patient_id, (created_at AT TIME ZONE ''Asia/Kolkata'')::date AS ist_day, test_type, COUNT(*) '
      'FROM patient_tests GROUP BY 1,2,3 HAVING COUNT(*) > 1;',
      total_dup_rows, dup_groups;
  END IF;
END
$$;

-- 2) Functional unique index: at most one row per (patient, IST calendar day, test_type).
CREATE UNIQUE INDEX IF NOT EXISTS patient_tests_patient_ist_day_test_type_key
  ON public.patient_tests (patient_id, ((created_at AT TIME ZONE 'Asia/Kolkata')::date), test_type);

-- 3) Supporting index for date-wise report/session range queries on a patient.
CREATE INDEX IF NOT EXISTS patient_tests_patient_created_at_idx
  ON public.patient_tests (patient_id, created_at);