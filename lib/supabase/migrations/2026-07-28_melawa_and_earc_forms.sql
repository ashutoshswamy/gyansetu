-- Migration: add 'melawa' event type + EARC School Profile / Student Profile forms
-- Run this once against an existing database that predates these changes.
-- (schema.sql already contains this in full — this file is just the delta to
-- apply without re-running the whole schema.)


-- ============================================================
-- MIGRATION: EARC data-collection forms — School Profile and Student Profile
-- (per forms/Backend Form 1.md). Replaces the old free-form earc_files
-- upload sections; earc_files table is left in place, unused.
-- ============================================================
create table if not exists public.earc_school_profiles (
  id                       uuid        primary key default gen_random_uuid(),
  academic_year            text        not null check (academic_year in ('2024-25', '2025-26', '2026-27', '2027-28', '2028-29', '2029-30')),
  project                  text        not null check (project in ('Chhote Scientists', 'Vikas Mitra', 'Pradnya Vikas', 'Anubha Shala', 'LearEng', 'Padhai Se Dosti', 'Others')),
  school_name              text        not null,
  state                    text        not null,
  district                 text        not null,
  taluka_block             text        not null,
  village_city             text        not null,
  school_type              text        not null check (school_type in ('Government', 'Private', 'Ashram School', 'Other')),
  module                   text        not null check (module in ('Facilitator', 'Teacher Training')),
  mode                     text        not null check (mode in ('Online', 'Offline')),
  contact_number           text,
  student_strength         jsonb       not null default '[]',
  num_teachers_involved    integer     not null,
  location_type            text        not null check (location_type in ('Urban', 'Rural', 'Tribal', 'Semi-Urban')),
  medium_of_instruction    text        not null check (medium_of_instruction in ('English', 'Marathi', 'Hindi', 'Other')),
  duration_per_session     text        not null check (duration_per_session in ('0.5 hr', '1 hr', '1.5 hrs', '2 hrs', '2.5 hrs', '3 hrs')),
  num_sessions_conducted   integer     not null,
  total_input_hours        numeric,
  total_students           integer,
  created_by               uuid        references public.users(id) on delete set null,
  created_at               timestamptz not null default now()
);

alter table public.earc_school_profiles enable row level security;
create policy "earc_manage_school_profiles" on public.earc_school_profiles for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('earc_staff', 'admin', 'super_admin'))
);

create table if not exists public.earc_students (
  id              uuid        primary key default gen_random_uuid(),
  first_name      text        not null,
  middle_name     text,
  last_name       text        not null,
  mobile_number   text,
  date_of_birth   date,
  gender          text        not null check (gender in ('Male', 'Female', 'Other')),
  blood_group     text,
  apaar_id        text,
  aadhaar_number  text,
  created_by      uuid        references public.users(id) on delete set null,
  created_at      timestamptz not null default now()
);

alter table public.earc_students enable row level security;
create policy "earc_manage_students" on public.earc_students for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('earc_staff', 'admin', 'super_admin'))
);
