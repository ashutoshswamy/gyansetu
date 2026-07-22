-- Run once in Supabase SQL editor.
-- public.alumni_registrations does not exist in this database (confirmed via
-- PostgREST error PGRST205 "Could not find the table 'public.alumni_registrations'
-- in the schema cache") even though schema.sql has always defined it — it was
-- never actually applied. Every alumni form submission has been failing at the
-- DB insert step because of this.
create table if not exists public.alumni_registrations (
  id               uuid        primary key default gen_random_uuid(),
  name             text        not null,
  email            text        not null,
  batch_year       text,
  tour_destination text,
  role_during_tour text,
  highlights       text,
  willing_to_mentor boolean    not null default false,
  created_at       timestamptz not null default now(),
  first_name                    text,
  middle_name                   text,
  last_name                     text,
  gender                        text,
  date_of_birth                 date,
  blood_group                   text,
  visit_history                 jsonb not null default '[]',
  company_name                  text,
  work_location                 text,
  designation                   text,
  work_department               text,
  years_experience              integer,
  institution                   text,
  edu_location                  text,
  qualification                 text,
  course_name                   text,
  stream                        text,
  course_status                 text,
  year_semester                 text,
  mobile_number                 text,
  alternate_mobile_number       text,
  linkedin_url                  text,
  preferred_communication       text[],
  interested_volunteering       text,
  available_network_activities  text,
  preferred_contribution        text[],
  areas_of_interest             text[],
  availability                  text,
  willing_to_mentor_new         text,
  why_stay_connected            text,
  skills_contribute             text,
  suggestions                   text,
  additional_remarks            text,
  last_contacted                timestamptz
);

alter table public.alumni_registrations enable row level security;

drop policy if exists "alumni_registrations_insert_public" on public.alumni_registrations;
create policy "alumni_registrations_insert_public" on public.alumni_registrations for insert with check (true);

drop policy if exists "admins_manage_alumni_registrations" on public.alumni_registrations;
create policy "admins_manage_alumni_registrations" on public.alumni_registrations for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('admin', 'super_admin'))
);
