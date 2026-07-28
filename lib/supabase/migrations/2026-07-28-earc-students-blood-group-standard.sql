-- ============================================================
-- MIGRATION: earc_students -> blood_group dropdown + standard field
-- Run this directly in the Supabase SQL Editor against an existing
-- database. Also folded into lib/supabase/schema.sql for fresh installs.
-- ============================================================
alter table public.earc_students drop constraint if exists earc_students_blood_group_check;
alter table public.earc_students add constraint earc_students_blood_group_check
  check (blood_group in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Don''t Know'));
alter table public.earc_students add column if not exists standard text;
alter table public.earc_students drop constraint if exists earc_students_standard_check;
alter table public.earc_students add constraint earc_students_standard_check
  check (standard is null or standard in ('1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'));
