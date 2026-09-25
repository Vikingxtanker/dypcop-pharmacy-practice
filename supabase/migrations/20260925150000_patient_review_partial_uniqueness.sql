-- Patient Information Review persistence: replace the invalid global IST-day
-- uniqueness assumption with a partial unique index scoped to the three dated
-- measurements Patient Information Review actually writes.
--
-- HISTORY
--  The original design tried to enforce
--      UNIQUE (patient_id, IST calendar day, test_type)
--  across the whole patient_tests table. Live production data (Sep 2026)
--  contains 928 patient_tests rows with 31 same-day duplicate groups:
--    - 20 EXACT_DUPLICATE groups / 57 rows   (machine/operator re-saves)
--    - 10 MULTIPLE_MEASUREMENTS groups / 20 rows
--         (legitimate repeated clinical measurements: RBG, FEV, BP,
--          Temperature, SpO2 taken minutes/hours apart)
--    -  1 CONFLICTING_VALUES group / 2 rows  (kum413 Hemoglobin 8.4 -> 9.5)
--  A global uniqueness assumption is therefore semantically invalid: the same
--  patient can legitimately have several same-day rows for one clinical
--  test_type. Migration 20260925140000_... (which attempted the global index)
--  aborted in production on its pre-flight duplicate guard and was never
--  applied; it is kept as historical evidence only.
--
--  The only same-day idempotency requirement is for Patient Information
--  Review's OWN dated measurements: Height, Weight, BMI. Live investigation
--  confirmed the table currently holds zero such rows, so scoping uniqueness
--  to these three types is safe without touching any historical data.
--
-- WHAT THIS MIGRATION DOES
--  1. Drops the historical global index if an older migration ever created it
--     in some environment (a no-op in production, where it does not exist).
--     DROP INDEX IF EXISTS is idempotent and never touches rows. Dropping it
--     here is what guarantees "the global uniqueness assumption is NOT
--     enforced" in every environment, including fresh ones where the old
--     pre-production files first run on an empty table.
--  2. Runs a pre-flight guard that aborts (raises) if duplicates already exist
--     among the review types. Expected result is zero groups. If it ever
--     fires, the migration refuses to proceed and nothing is modified.
--  3. Creates the partial unique index
--       patient_tests_review_ist_day_test_type_key
--     on (patient_id, IST calendar day, test_type)
--     WHERE test_type IN ('Height', 'Weight', 'BMI').
--  4. Re-declares public.record_patient_review so each ON CONFLICT target
--     carries the same predicate as the partial index. PostgreSQL requires the
--     ON CONFLICT target to match the partial unique index; without the
--     predicate the upserts would fail with 42P10 ("no unique or exclusion
--     constraint matching the ON CONFLICT specification").
--
-- The function signature, parameter names, return columns, SECURITY INVOKER
-- mode, `set search_path = public`, every grant, server-side now(), server-side
-- BMI, RLS behaviour, the patient state update and the preserve-medical/history
-- semantics are unchanged from the corrected 20260925130000 body. No
-- patient_tests rows are inserted, deleted or merged by this migration, and
-- kum413's historical Hemoglobin values are deliberately left untouched.

-- 1. Abandon the invalid global unique index wherever an earlier migration may
--    have created it. Production currently does NOT have this index (verified
--    live: record_patient_review fails with 42P10 "no matching constraint").
drop index if exists public.patient_tests_patient_ist_day_test_type_key;

-- 2. Pre-flight guard: refuse to proceed unless review-type measurements are
--    duplicate-free. Expected result is zero groups; if this ever fires, the
--    migration aborts before touching anything and the duplicates must be
--    reviewed manually (nothing is deleted or modified automatically).
do $$
begin
  if exists (
    select 1
      from public.patient_tests pt
     where pt.test_type in ('Height', 'Weight', 'BMI')
     group by pt.patient_id, (pt.created_at at time zone 'Asia/Kolkata')::date, pt.test_type
    having count(*) > 1
  ) then
    raise exception 'aborting: same-day duplicates exist among review types Height/Weight/BMI; refusing to create the partial unique index (no rows were modified)';
  end if;
end;
$$;

-- 3. Partial unique index covering ONLY the Patient Information Review
--    measurement types. Other clinical test_types (RBG, FEV, BP, Temperature,
--    SpO2, Hemoglobin, ...) remain free to record multiple legitimate
--    same-day measurements.
create unique index if not exists patient_tests_review_ist_day_test_type_key
  on public.patient_tests (
    patient_id,
    ((created_at at time zone 'Asia/Kolkata')::date),
    test_type
  )
  where test_type in ('Height', 'Weight', 'BMI');

-- 4. Corrected RPC body: identical to the 20260925130000 corrective body except
--    that every ON CONFLICT target now includes the partial-index predicate so
--    the upserts resolve against patient_tests_review_ist_day_test_type_key.
create or replace function public.record_patient_review(
  p_patient_id text,
  p_height_cm numeric,
  p_weight_kg numeric,
  p_bmi numeric,
  p_past_medical text,
  p_past_medication text
) returns table (
  patient_id text,
  updated_at timestamptz,
  current_height numeric,
  current_weight numeric,
  current_bmi numeric
)
language plpgsql
security invoker
set search_path = public
as $$
-- RETURNS TABLE output columns (patient_id ...) are PL/pgSQL variables in scope
-- for the whole body. The INSERT column lists and ON CONFLICT targets below must
-- reference public.patient_tests columns named patient_id/test_type/created_at;
-- without this pragma PostgreSQL would raise 42702 "column reference is
-- ambiguous" on those statements. use_column is correct here: every such bare
-- name is syntactically a table column, never the output variable itself.
#variable_conflict use_column
declare
  v_now timestamptz := now();
begin
  -- Refuse to operate on a patient the calling role cannot already access.
  if not exists (select 1 from public.patients p where p.id = p_patient_id) then
    return query
      select
        p_patient_id::text,
        null::timestamptz,
        null::numeric,
        null::numeric,
        null::numeric;
    return;
  end if;

  -- Append (or refresh today's) dated measurements. No created_at is accepted from
  -- the caller; the server timestamp v_now is authoritative for the whole review.
  if p_height_cm is not null then
    insert into public.patient_tests (patient_id, test_type, value_numeric, unit, created_at)
    values (p_patient_id, 'Height', p_height_cm, 'cm', v_now)
    on conflict (patient_id, ((created_at at time zone 'Asia/Kolkata')::date), test_type)
    where test_type in ('Height', 'Weight', 'BMI')
    do update set value_numeric = excluded.value_numeric, unit = excluded.unit, created_at = excluded.created_at;
  end if;

  if p_weight_kg is not null then
    insert into public.patient_tests (patient_id, test_type, value_numeric, unit, created_at)
    values (p_patient_id, 'Weight', p_weight_kg, 'kg', v_now)
    on conflict (patient_id, ((created_at at time zone 'Asia/Kolkata')::date), test_type)
    where test_type in ('Height', 'Weight', 'BMI')
    do update set value_numeric = excluded.value_numeric, unit = excluded.unit, created_at = excluded.created_at;
  end if;

  if p_bmi is not null then
    insert into public.patient_tests (patient_id, test_type, value_numeric, unit, created_at)
    values (p_patient_id, 'BMI', p_bmi, 'kg/m²', v_now)
    on conflict (patient_id, ((created_at at time zone 'Asia/Kolkata')::date), test_type)
    where test_type in ('Height', 'Weight', 'BMI')
    do update set value_numeric = excluded.value_numeric, unit = excluded.unit, created_at = excluded.created_at;
  end if;

  -- Refresh the patient's current state. Historical measurements already appended
  -- above; coalesce keeps the last known value for measurements not taken today.
  -- Columns are table-qualified (p.*) so no name can be mistaken for a variable.
  update public.patients p
     set height = coalesce(p_height_cm, p.height),
         weight = coalesce(p_weight_kg, p.weight),
         bmi = coalesce(p_bmi, p.bmi),
         past_medical = coalesce(p_past_medical, p.past_medical),
         past_medication = coalesce(p_past_medication, p.past_medication)
   where p.id = p_patient_id;

  return query
    select
      p_patient_id::text,
      v_now,
      coalesce(p_height_cm, (select p.height from public.patients p where p.id = p_patient_id)),
      coalesce(p_weight_kg, (select p.weight from public.patients p where p.id = p_patient_id)),
      coalesce(p_bmi, (select p.bmi from public.patients p where p.id = p_patient_id));
end;
$$;

grant execute on function public.record_patient_review(text, numeric, numeric, numeric, text, text) to anon, authenticated;