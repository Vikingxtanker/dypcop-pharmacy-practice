-- Appointment status workflow for the health-camp appointment campaign.
--
-- Adds a `status` column to the canonical public.appointments table so that
-- /admin/appointments can track each booking (Pending / Confirmed / Cancelled).
-- New bookings default to 'Pending'; existing rows receive the default too.
-- No data is destroyed; the column is added with a non-null default so the
-- public /appointment insert does not need to be aware of it.

alter table public.appointments
  add column if not exists status text not null default 'Pending';