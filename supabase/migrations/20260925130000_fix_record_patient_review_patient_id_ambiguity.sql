-- Corrective migration for record_patient_review (PostgreSQL error 42702).
--
-- HISTORY
--  20260925120000_record_patient_review.sql introduced the SECURITY INVOKER RPC
--  and was applied to production. In production every call fails with:
--
--    patient-review: record_patient_review failed {
--      code: '42702',
--      details: 'It could refer to either a PL/pgSQL variable or a table column.',
--      message: 'column reference "patient_id" is ambiguous'
--    }
--
-- ROOT CAUSE
--  The function is declared with RETURNS TABLE (patient_id text, ...). PL/pgSQL
--  turns each RETURNS TABLE output column name into a variable that is in scope
--  for the entire function body. The three upsert statements then write:
--
--    insert into public.patient_tests (patient_id, test_type, value_numeric, unit, created_at)
--    values (p_patient_id, ...)
--    on conflict (patient_id, ((created_at at time zone 'Asia/Kolkata')::date), test_type)
--
--  In both the INSERT column list and the ON CONFLICT conflict-target list the
--  identifier `patient_id` is syntactically a column of public.patient_tests, but
--  it is ALSO the name of a PL/pgSQL variable. PostgreSQL refuses to guess
--  between the two and raises error 42702 ("column reference is ambiguous").
--
-- FIX
--  1. A `#variable_conflict use_column` pragma at the top of the body tells
--     PL/pgSQL to resolve colliding identifiers in favour of table columns.
--     This is semantically lossless here: every bare `patient_id` occurrence is
--     a mandatory column reference, never a use of the output variable. It is
--     the one place aliases cannot help, because PostgreSQL does not allow the
--     INSERT column list or the ON CONFLICT target to be table-qualified.
--  2. Every other column reference is table-qualified (p.height, p.id, ...) so
--     no other identifier can be mistaken for a variable.
--
-- The signature, return type, output column names, security INVOKER behaviour,
-- `set search_path = public`, all grants, IST-day idempotency and the rest of
-- the intended behaviour are unchanged from the original migration.

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
    do update set value_numeric = excluded.value_numeric, unit = excluded.unit, created_at = excluded.created_at;
  end if;

  if p_weight_kg is not null then
    insert into public.patient_tests (patient_id, test_type, value_numeric, unit, created_at)
    values (p_patient_id, 'Weight', p_weight_kg, 'kg', v_now)
    on conflict (patient_id, ((created_at at time zone 'Asia/Kolkata')::date), test_type)
    do update set value_numeric = excluded.value_numeric, unit = excluded.unit, created_at = excluded.created_at;
  end if;

  if p_bmi is not null then
    insert into public.patient_tests (patient_id, test_type, value_numeric, unit, created_at)
    values (p_patient_id, 'BMI', p_bmi, 'kg/m²', v_now)
    on conflict (patient_id, ((created_at at time zone 'Asia/Kolkata')::date), test_type)
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