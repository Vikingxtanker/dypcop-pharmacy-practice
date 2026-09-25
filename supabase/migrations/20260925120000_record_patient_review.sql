-- Registration-time "Patient Information Review / Update" for returning patients.
--
-- Atomicity: the registration update writes to two tables (dated measurements in
-- patient_tests and current fields on patients). A single Postgres function wraps
-- them in one transaction so a failure can never leave the data in a partially
-- updated state.
--
-- Dated measurements: reuse the existing canonical dated-clinical table
-- public.patient_tests. Height/Weight/BMI for a review are stored as rows with
-- test_type 'Height' (cm), 'Weight' (kg) and 'BMI' (kg/m2). The existing
-- functional unique index patient_tests_patient_ist_day_test_type_key already
-- allows at most one of each per patient per IST calendar day; the ON CONFLICT
-- clause updates the same-day row instead of erroring, keeping re-saves
-- idempotent while never touching historical (prior-day) rows.
--
-- Current fields: public.patients.height/weight/bmi are refreshed only when a new
-- measured value is provided (coalesce keeps the last known value otherwise), and
-- public.patients.past_medical / past_medication carry the current history, which
-- registration staff edits in place (the existing canonical model for history).
--
-- Security: SECURITY INVOKER + RLS is applied on every statement, so the function
-- runs with the privileges of the calling Postgres role (the anon key in this
-- app). A patient hidden from the calling role is not visible to the EXISTS guard
-- and the UPDATE touches zero rows, preserving organization isolation.

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
declare
  v_now timestamptz := now();
begin
  -- Refuse to operate on a patient the calling role cannot already access.
  if not exists (select 1 from public.patients where id = p_patient_id) then
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
  update public.patients
     set height = coalesce(p_height_cm, height),
         weight = coalesce(p_weight_kg, weight),
         bmi = coalesce(p_bmi, bmi),
         past_medical = coalesce(p_past_medical, past_medical),
         past_medication = coalesce(p_past_medication, past_medication)
   where id = p_patient_id;

  return query
    select
      p_patient_id::text,
      v_now,
      coalesce(p_height_cm, (select height from public.patients where id = p_patient_id)),
      coalesce(p_weight_kg, (select weight from public.patients where id = p_patient_id)),
      coalesce(p_bmi, (select bmi from public.patients where id = p_patient_id));
end;
$$;

grant execute on function public.record_patient_review(text, numeric, numeric, numeric, text, text) to anon, authenticated;