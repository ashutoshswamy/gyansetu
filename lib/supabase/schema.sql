-- Gyan Setu — complete Supabase schema
-- Run fresh in Supabase SQL editor (idempotent: uses IF NOT EXISTS / OR REPLACE)
--
-- Roles: enrollee | volunteer | admin | earc_staff | super_admin
-- enrollee: default role on signup (assigned via Clerk publicMetadata, same as any other role).
-- super_admin: all admin access + can reassign any user's role.

-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists "uuid-ossp";

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================
-- TABLES
-- ============================================================

-- Users (synced from Clerk via webhook; role defaults to 'enrollee' on signup)
create table if not exists public.users (
  id          uuid primary key default gen_random_uuid(),
  clerk_id    text unique not null,
  email       text unique not null,
  name        text not null,
  role        text default 'enrollee' check (role in ('enrollee', 'volunteer', 'admin', 'earc_staff', 'super_admin')),
  avatar_url  text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Tours
create table if not exists public.tours (
  id                   uuid primary key default gen_random_uuid(),
  title                text not null,
  description          text not null,
  destination          text not null,
  start_date           date not null,
  end_date             date not null,
  capacity             integer not null check (capacity > 0),
  status               text not null default 'draft' check (status in ('draft', 'open', 'closed', 'completed')),
  eligibility_test_id  uuid,
  created_by           uuid references public.users(id) on delete set null,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

-- Eligibility Tests
create table if not exists public.eligibility_tests (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  description      text,
  tour_id          uuid references public.tours(id) on delete cascade,
  duration_minutes integer not null check (duration_minutes > 0),
  passing_score    integer not null check (passing_score between 0 and 100),
  questions        jsonb not null default '[]',
  status           text not null default 'draft' check (status in ('draft', 'active', 'closed')),
  is_template      boolean not null default false,
  created_by       uuid references public.users(id) on delete set null,
  created_at       timestamptz default now()
);

-- Circular FK: tours → eligibility_tests
alter table public.tours
  drop constraint if exists fk_tours_eligibility_test;
alter table public.tours
  add constraint fk_tours_eligibility_test
  foreign key (eligibility_test_id) references public.eligibility_tests(id) on delete set null;

-- Tour Applications
create table if not exists public.tour_applications (
  id           uuid primary key default gen_random_uuid(),
  tour_id      uuid references public.tours(id) on delete cascade,
  student_id   uuid references public.users(id) on delete cascade,
  status       text not null default 'pending' check (status in ('pending', 'shortlisted', 'selected', 'rejected')),
  test_score   numeric,
  submitted_at timestamptz default now(),
  updated_at   timestamptz default now(),
  unique (tour_id, student_id)
);

-- Test Attempts
create table if not exists public.test_attempts (
  id           uuid primary key default gen_random_uuid(),
  test_id      uuid references public.eligibility_tests(id) on delete cascade,
  student_id   uuid references public.users(id) on delete cascade,
  answers      jsonb not null default '{}',
  score        numeric,
  subjective_marks jsonb not null default '{}',
  status       text not null default 'in_progress' check (status in ('in_progress', 'submitted', 'evaluated', 'pending_approval', 'approved', 'rejected')),
  started_at   timestamptz default now(),
  submitted_at timestamptz,
  unique (test_id, student_id)
);
alter table public.test_attempts add column if not exists subjective_marks jsonb not null default '{}';

-- Dynamic Forms
create table if not exists public.dynamic_forms (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  fields      jsonb not null default '[]',
  tour_id     uuid references public.tours(id) on delete set null,
  target_role text not null default 'all' check (target_role in ('enrollee', 'volunteer', 'admin', 'all')),
  status      text not null default 'draft' check (status in ('draft', 'active', 'closed')),
  is_template boolean not null default false,
  created_by  uuid references public.users(id) on delete set null,
  created_at  timestamptz default now()
);

-- Form Submissions
create table if not exists public.form_submissions (
  id           uuid primary key default gen_random_uuid(),
  form_id      uuid references public.dynamic_forms(id) on delete cascade,
  submitted_by uuid references public.users(id) on delete cascade,
  data         jsonb not null default '{}',
  submitted_at timestamptz default now()
);

-- Volunteer Assignments
create table if not exists public.volunteer_assignments (
  id               uuid primary key default gen_random_uuid(),
  tour_id          uuid references public.tours(id) on delete cascade,
  volunteer_id     uuid references public.users(id) on delete cascade,
  role_description text,
  assigned_at      timestamptz default now(),
  unique (tour_id, volunteer_id)
);

-- Volunteer Profiles (also used by enrollees; promoted users keep same row)
create table if not exists public.volunteer_profiles (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid references public.users(id) on delete cascade unique,
  phone                       text,
  address                     text,
  date_of_birth               date,
  state                       text,
  city                        text,
  institution                 text,
  course_year                 text,
  skills                      text[],
  languages                   text[],
  previous_visits             integer default 0,
  states_visited              text[],
  bio                         text,
  emergency_contact_name      text,
  emergency_contact_phone     text,
  emergency_contact_relation  text,
  medical_notes               text,
  consent_given               boolean not null default false,
  consent_given_at            timestamptz,
  availability_notes          text,
  -- Section 1: personal & contact (volunteer_registration.md)
  first_name                  text,
  middle_name                 text,
  last_name                   text,
  gender                      text,
  blood_group                 text,
  aadhaar_number              text,
  photo_url                   text,
  alternate_phone             text,
  house_no                    text,
  street                      text,
  district                    text,
  pincode                     text,
  permanent_address_same      boolean not null default true,
  permanent_address           text,
  -- Section 2: education / professional background
  current_status              text check (current_status in ('student', 'working_professional', 'both', 'other')),
  student_location             text,
  qualification                text,
  course_name                  text,
  stream                       text,
  edu_course_status            text check (edu_course_status in ('pursuing', 'completed')),
  company_name                 text,
  work_location                text,
  designation                  text,
  work_department              text,
  years_experience             integer,
  -- Section 3: emergency & medical
  emergency_contact_address    text,
  has_allergies                boolean not null default false,
  allergies_detail             text,
  has_medical_conditions       boolean not null default false,
  medical_conditions_detail    text,
  takes_medicines              boolean not null default false,
  medicines_detail             text,
  dietary_restrictions         text[],
  -- Declaration
  certified_true                boolean not null default false,
  signature_name                 text,
  created_at                  timestamptz default now(),
  updated_at                  timestamptz default now()
);

-- Idempotent column additions for already-deployed databases
alter table public.volunteer_profiles add column if not exists first_name text;
alter table public.volunteer_profiles add column if not exists middle_name text;
alter table public.volunteer_profiles add column if not exists last_name text;
alter table public.volunteer_profiles add column if not exists gender text;
alter table public.volunteer_profiles add column if not exists blood_group text;
alter table public.volunteer_profiles add column if not exists aadhaar_number text;
alter table public.volunteer_profiles add column if not exists photo_url text;
alter table public.volunteer_profiles add column if not exists alternate_phone text;
alter table public.volunteer_profiles add column if not exists house_no text;
alter table public.volunteer_profiles add column if not exists street text;
alter table public.volunteer_profiles add column if not exists district text;
alter table public.volunteer_profiles add column if not exists pincode text;
alter table public.volunteer_profiles add column if not exists permanent_address_same boolean not null default true;
alter table public.volunteer_profiles add column if not exists permanent_address text;
alter table public.volunteer_profiles add column if not exists current_status text;
alter table public.volunteer_profiles add column if not exists student_location text;
alter table public.volunteer_profiles add column if not exists qualification text;
alter table public.volunteer_profiles add column if not exists course_name text;
alter table public.volunteer_profiles add column if not exists stream text;
alter table public.volunteer_profiles add column if not exists edu_course_status text;
alter table public.volunteer_profiles add column if not exists company_name text;
alter table public.volunteer_profiles add column if not exists work_location text;
alter table public.volunteer_profiles add column if not exists designation text;
alter table public.volunteer_profiles add column if not exists work_department text;
alter table public.volunteer_profiles add column if not exists years_experience integer;
alter table public.volunteer_profiles add column if not exists emergency_contact_address text;
alter table public.volunteer_profiles add column if not exists has_allergies boolean not null default false;
alter table public.volunteer_profiles add column if not exists allergies_detail text;
alter table public.volunteer_profiles add column if not exists has_medical_conditions boolean not null default false;
alter table public.volunteer_profiles add column if not exists medical_conditions_detail text;
alter table public.volunteer_profiles add column if not exists takes_medicines boolean not null default false;
alter table public.volunteer_profiles add column if not exists medicines_detail text;
alter table public.volunteer_profiles add column if not exists dietary_restrictions text[];
alter table public.volunteer_profiles add column if not exists certified_true boolean not null default false;
alter table public.volunteer_profiles add column if not exists signature_name text;

-- Alumni Profiles
create table if not exists public.alumni_profiles (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid references public.users(id) on delete cascade unique,
  batch_year                integer,
  total_visits              integer default 0,
  states_visited            text[],
  is_mentor                 boolean not null default false,
  mentoring_capacity        integer default 0,
  available_for_training    boolean not null default false,
  available_for_future_visit boolean not null default false,
  expertise_areas           text[],
  current_occupation        text,
  current_city              text,
  linkedin_url              text,
  notes                     text,
  created_at                timestamptz default now(),
  updated_at                timestamptz default now()
);

-- Events
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  event_type  text not null check (event_type in ('katta', 'training', 'workshop', 'meeting', 'demo', 'presentation', 'celebration', 'other')),
  tour_id     uuid references public.tours(id) on delete set null,
  event_date  date not null,
  event_time  text,
  location    text,
  status      text not null default 'upcoming' check (status in ('upcoming', 'ongoing', 'completed', 'cancelled')),
  created_by  uuid references public.users(id) on delete set null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Event Attendees
create table if not exists public.event_attendees (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid references public.events(id) on delete cascade,
  user_id     uuid references public.users(id) on delete cascade,
  rsvp_status text not null default 'pending' check (rsvp_status in ('pending', 'confirmed', 'maybe', 'attended', 'absent')),
  created_at  timestamptz default now(),
  unique (event_id, user_id)
);

-- Tour Groups
create table if not exists public.tour_groups (
  id             uuid primary key default gen_random_uuid(),
  tour_id        uuid references public.tours(id) on delete cascade,
  name           text not null,
  state_allocated text,
  mentor_id      uuid references public.users(id) on delete set null,
  notes          text,
  created_by     uuid references public.users(id) on delete set null,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- Tour Group Members
create table if not exists public.tour_group_members (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid references public.tour_groups(id) on delete cascade,
  user_id       uuid references public.users(id) on delete cascade,
  role_in_group text,
  created_at    timestamptz default now(),
  unique (group_id, user_id)
);

-- Logistics
create table if not exists public.logistics (
  id                    uuid primary key default gen_random_uuid(),
  tour_id               uuid references public.tours(id) on delete cascade unique,
  travel_details        jsonb not null default '{}',
  accommodation_details jsonb not null default '{}',
  kit_details           jsonb not null default '{}',
  itinerary             text,
  notes                 text,
  created_by            uuid references public.users(id) on delete set null,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- Media Gallery
create table if not exists public.media_gallery (
  id          uuid primary key default gen_random_uuid(),
  tour_id     uuid references public.tours(id) on delete cascade,
  uploaded_by uuid references public.users(id) on delete set null,
  file_url    text not null,
  caption     text,
  media_type  text not null default 'photo' check (media_type in ('photo', 'document', 'video')),
  created_at  timestamptz default now()
);

-- Certificates
create table if not exists public.certificates (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references public.users(id) on delete cascade,
  tour_id          uuid references public.tours(id) on delete set null,
  certificate_type text not null check (certificate_type in ('participation', 'excellence', 'leadership', 'mentor')),
  issued_by        uuid references public.users(id) on delete set null,
  notes            text,
  issued_at        timestamptz default now()
);
alter table public.certificates add column if not exists state             text;
alter table public.certificates add column if not exists place             text;
alter table public.certificates add column if not exists duration_of_visit text;
alter table public.certificates add column if not exists volunteer_code    text;

-- Daily Logs
create table if not exists public.daily_logs (
  id           uuid primary key default gen_random_uuid(),
  tour_id      uuid references public.tours(id) on delete cascade,
  volunteer_id uuid references public.users(id) on delete cascade,
  log_date     date not null,
  activities_conducted text,
  key_achievements     text,
  challenges_faced     text,
  biggest_learning     text,
  participant_impact   text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Notifications
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.users(id) on delete cascade,
  title      text not null,
  message    text not null,
  type       text not null default 'info' check (type in ('info', 'success', 'warning', 'error')),
  read       boolean not null default false,
  created_at timestamptz default now()
);

-- Visits (educational site visits)
create table if not exists public.visits (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  destination   text not null,
  state         text,
  start_date    date not null,
  end_date      date not null,
  description   text,
  timetable_url text,
  status        text not null default 'upcoming' check (status in ('upcoming', 'ongoing', 'completed')),
  capacity      integer,
  created_by    uuid references public.users(id) on delete set null,
  created_at    timestamptz default now()
);

-- Gallery Categories
create table if not exists public.gallery_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  created_at  timestamptz default now()
);

-- Gallery Images
create table if not exists public.gallery_images (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid references public.gallery_categories(id) on delete cascade,
  url         text not null,
  caption     text,
  uploaded_by uuid references public.users(id) on delete set null,
  created_at  timestamptz default now()
);

-- Blog Posts
create table if not exists public.blog_posts (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  slug            text unique not null,
  excerpt         text,
  content         text not null,
  cover_image_url text,
  status          text not null default 'draft' check (status in ('draft', 'published')),
  published_at    timestamptz,
  created_by      uuid references public.users(id) on delete set null,
  created_at      timestamptz default now()
);

-- Newsletters
create table if not exists public.newsletters (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  file_url     text,
  issue_number integer,
  status       text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_by   uuid references public.users(id) on delete set null,
  created_at   timestamptz default now()
);

-- ============================================================
-- STORAGE
-- ============================================================
insert into storage.buckets (id, name, public)
  values ('media', 'media', true)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
  values ('blog-covers', 'blog-covers', true)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
  values ('gallery-images', 'gallery-images', true)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
  values ('newsletter-files', 'newsletter-files', true)
  on conflict (id) do nothing;

-- ============================================================
-- UPDATED_AT TRIGGERS (idempotent: drop then recreate)
-- ============================================================
drop trigger if exists users_updated_at              on public.users;
drop trigger if exists tours_updated_at              on public.tours;
drop trigger if exists applications_updated_at       on public.tour_applications;
drop trigger if exists volunteer_profiles_updated_at on public.volunteer_profiles;
drop trigger if exists alumni_profiles_updated_at    on public.alumni_profiles;
drop trigger if exists events_updated_at             on public.events;
drop trigger if exists tour_groups_updated_at        on public.tour_groups;
drop trigger if exists logistics_updated_at          on public.logistics;
drop trigger if exists daily_logs_updated_at         on public.daily_logs;

create trigger users_updated_at              before update on public.users             for each row execute procedure public.handle_updated_at();
create trigger tours_updated_at              before update on public.tours             for each row execute procedure public.handle_updated_at();
create trigger applications_updated_at       before update on public.tour_applications for each row execute procedure public.handle_updated_at();
create trigger volunteer_profiles_updated_at before update on public.volunteer_profiles for each row execute procedure public.handle_updated_at();
create trigger alumni_profiles_updated_at    before update on public.alumni_profiles   for each row execute procedure public.handle_updated_at();
create trigger events_updated_at             before update on public.events            for each row execute procedure public.handle_updated_at();
create trigger tour_groups_updated_at        before update on public.tour_groups       for each row execute procedure public.handle_updated_at();
create trigger logistics_updated_at          before update on public.logistics         for each row execute procedure public.handle_updated_at();
create trigger daily_logs_updated_at         before update on public.daily_logs        for each row execute procedure public.handle_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.users                 enable row level security;
alter table public.tours                 enable row level security;
alter table public.eligibility_tests     enable row level security;
alter table public.tour_applications     enable row level security;
alter table public.test_attempts         enable row level security;
alter table public.dynamic_forms         enable row level security;
alter table public.form_submissions      enable row level security;
alter table public.volunteer_assignments enable row level security;
alter table public.volunteer_profiles    enable row level security;
alter table public.alumni_profiles       enable row level security;
alter table public.events                enable row level security;
alter table public.event_attendees       enable row level security;
alter table public.tour_groups           enable row level security;
alter table public.tour_group_members    enable row level security;
alter table public.logistics             enable row level security;
alter table public.media_gallery         enable row level security;
alter table public.certificates          enable row level security;
alter table public.daily_logs            enable row level security;
alter table public.notifications         enable row level security;
alter table public.visits                enable row level security;
alter table public.gallery_categories    enable row level security;
alter table public.gallery_images        enable row level security;
alter table public.blog_posts            enable row level security;
alter table public.newsletters           enable row level security;

-- Drop all policies before recreating (idempotent)
do $$ declare r record; begin
  for r in (select schemaname, tablename, policyname from pg_policies where schemaname = 'public') loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- users
create policy "users_read_own"       on public.users for select using (clerk_id = auth.uid()::text);
create policy "users_insert_own"     on public.users for insert with check (clerk_id = auth.uid()::text);
create policy "users_update_own"     on public.users for update using (clerk_id = auth.uid()::text);
create policy "admins_read_users"    on public.users for select using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('admin', 'super_admin'))
);

-- tours
create policy "tours_read_open"      on public.tours for select using (status = 'open');
create policy "admins_manage_tours"  on public.tours for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('admin', 'super_admin'))
);

-- eligibility_tests
create policy "tests_read_active"    on public.eligibility_tests for select using (status = 'active');
create policy "admins_manage_tests"  on public.eligibility_tests for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('admin', 'super_admin'))
);

-- tour_applications
create policy "students_manage_own_applications" on public.tour_applications for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.id = student_id)
);
create policy "admins_manage_applications" on public.tour_applications for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('admin', 'super_admin'))
);

-- test_attempts
create policy "students_manage_own_attempts" on public.test_attempts for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.id = student_id)
);
create policy "admins_manage_attempts" on public.test_attempts for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('admin', 'super_admin'))
);

-- dynamic_forms
create policy "forms_read_active"    on public.dynamic_forms for select using (status = 'active');
create policy "admins_manage_forms"  on public.dynamic_forms for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('admin', 'super_admin'))
);

-- form_submissions
create policy "users_manage_own_submissions" on public.form_submissions for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.id = submitted_by)
);
create policy "admins_manage_submissions" on public.form_submissions for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('admin', 'super_admin'))
);

-- volunteer_assignments
create policy "volunteers_read_own_assignments" on public.volunteer_assignments for select using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.id = volunteer_id)
);
create policy "admins_manage_assignments" on public.volunteer_assignments for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('admin', 'super_admin'))
);

-- volunteer_profiles
create policy "volunteer_profiles_own" on public.volunteer_profiles for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.id = user_id)
);
create policy "admins_manage_volunteer_profiles" on public.volunteer_profiles for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('admin', 'super_admin'))
);

-- alumni_profiles
create policy "alumni_profiles_read_all" on public.alumni_profiles for select using (true);
create policy "alumni_profiles_own"      on public.alumni_profiles for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.id = user_id)
);
create policy "admins_manage_alumni_profiles" on public.alumni_profiles for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('admin', 'super_admin'))
);

-- events
create policy "events_read_all"      on public.events for select using (true);
create policy "admins_manage_events" on public.events for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('admin', 'super_admin'))
);

-- event_attendees
create policy "event_attendees_manage_own" on public.event_attendees for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.id = user_id)
);
create policy "admins_manage_event_attendees" on public.event_attendees for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('admin', 'super_admin'))
);

-- tour_groups
create policy "tour_groups_read_all"      on public.tour_groups for select using (true);
create policy "admins_manage_tour_groups" on public.tour_groups for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('admin', 'super_admin'))
);

-- tour_group_members
create policy "group_members_read_all"      on public.tour_group_members for select using (true);
create policy "admins_manage_group_members" on public.tour_group_members for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('admin', 'super_admin'))
);

-- logistics
create policy "logistics_read_all"      on public.logistics for select using (true);
create policy "admins_manage_logistics" on public.logistics for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('admin', 'super_admin'))
);

-- media_gallery
create policy "media_read_all"        on public.media_gallery for select using (true);
create policy "volunteers_insert_media" on public.media_gallery for insert with check (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('volunteer', 'admin', 'super_admin'))
);
create policy "admins_manage_media"   on public.media_gallery for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('admin', 'super_admin'))
);

-- certificates
create policy "certificates_read_own"      on public.certificates for select using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.id = user_id)
);
create policy "admins_manage_certificates" on public.certificates for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('admin', 'super_admin'))
);

-- daily_logs
create policy "daily_logs_own"          on public.daily_logs for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.id = volunteer_id)
);
create policy "admins_manage_daily_logs" on public.daily_logs for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('admin', 'super_admin'))
);

-- notifications
create policy "notifications_own" on public.notifications for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.id = user_id)
);

-- visits
create policy "visits_read_all"      on public.visits for select using (true);
create policy "admins_manage_visits" on public.visits for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('admin', 'super_admin'))
);

-- gallery_categories
create policy "gallery_categories_read_all"      on public.gallery_categories for select using (true);
create policy "admins_manage_gallery_categories" on public.gallery_categories for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('admin', 'super_admin'))
);

-- gallery_images
create policy "gallery_images_read_all"      on public.gallery_images for select using (true);
create policy "admins_manage_gallery_images" on public.gallery_images for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('admin', 'super_admin'))
);

-- blog_posts
create policy "blog_posts_read_published"  on public.blog_posts for select using (status = 'published');
create policy "admins_read_all_blog_posts" on public.blog_posts for select using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('admin', 'super_admin'))
);
create policy "admins_manage_blog_posts"   on public.blog_posts for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('admin', 'super_admin'))
);

-- newsletters
create policy "newsletters_read_published"  on public.newsletters for select using (status = 'published');
create policy "admins_read_all_newsletters" on public.newsletters for select using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('admin', 'super_admin'))
);
create policy "admins_manage_newsletters"   on public.newsletters for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('admin', 'super_admin'))
);

-- ── PUBLIC OUTREACH TABLES ────────────────────────────────────────────────────

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
  -- Section 1: personal information (alumni_registration.md)
  first_name                    text,
  middle_name                   text,
  last_name                     text,
  gender                        text,
  date_of_birth                 date,
  blood_group                   text,
  -- Section 2: visit history, repeatable — [{year, month, location, role}]
  visit_history                 jsonb not null default '[]',
  -- Section 3: professional & educational details
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
  -- Section 4: contact details
  mobile_number                 text,
  alternate_mobile_number       text,
  linkedin_url                  text,
  preferred_communication       text[],
  -- Section 5: engagement with Gyan Setu
  interested_volunteering       text,
  available_network_activities  text,
  preferred_contribution        text[],
  areas_of_interest             text[],
  availability                  text,
  willing_to_mentor_new         text,
  -- Section 6: additional information
  why_stay_connected            text,
  skills_contribute             text,
  suggestions                   text,
  additional_remarks            text,
  -- Admin-only (not shown to alumni)
  last_contacted                timestamptz
);

alter table public.alumni_registrations add column if not exists first_name text;
alter table public.alumni_registrations add column if not exists middle_name text;
alter table public.alumni_registrations add column if not exists last_name text;
alter table public.alumni_registrations add column if not exists gender text;
alter table public.alumni_registrations add column if not exists date_of_birth date;
alter table public.alumni_registrations add column if not exists blood_group text;
alter table public.alumni_registrations add column if not exists visit_history jsonb not null default '[]';
alter table public.alumni_registrations add column if not exists company_name text;
alter table public.alumni_registrations add column if not exists work_location text;
alter table public.alumni_registrations add column if not exists designation text;
alter table public.alumni_registrations add column if not exists work_department text;
alter table public.alumni_registrations add column if not exists years_experience integer;
alter table public.alumni_registrations add column if not exists institution text;
alter table public.alumni_registrations add column if not exists edu_location text;
alter table public.alumni_registrations add column if not exists qualification text;
alter table public.alumni_registrations add column if not exists course_name text;
alter table public.alumni_registrations add column if not exists stream text;
alter table public.alumni_registrations add column if not exists course_status text;
alter table public.alumni_registrations add column if not exists year_semester text;
alter table public.alumni_registrations add column if not exists mobile_number text;
alter table public.alumni_registrations add column if not exists alternate_mobile_number text;
alter table public.alumni_registrations add column if not exists linkedin_url text;
alter table public.alumni_registrations add column if not exists preferred_communication text[];
alter table public.alumni_registrations add column if not exists interested_volunteering text;
alter table public.alumni_registrations add column if not exists available_network_activities text;
alter table public.alumni_registrations add column if not exists preferred_contribution text[];
alter table public.alumni_registrations add column if not exists areas_of_interest text[];
alter table public.alumni_registrations add column if not exists availability text;
alter table public.alumni_registrations add column if not exists willing_to_mentor_new text;
alter table public.alumni_registrations add column if not exists why_stay_connected text;
alter table public.alumni_registrations add column if not exists skills_contribute text;
alter table public.alumni_registrations add column if not exists suggestions text;
alter table public.alumni_registrations add column if not exists additional_remarks text;
alter table public.alumni_registrations add column if not exists last_contacted timestamptz;

create table if not exists public.testimonials (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  batch_year  text,
  role        text,
  message     text        not null,
  status      text        not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  created_at  timestamptz not null default now()
);
alter table public.testimonials add column if not exists status text not null default 'pending' check (status in ('pending', 'approved', 'declined'));
drop policy if exists "testimonials_read_approved" on public.testimonials;
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'testimonials' and column_name = 'is_approved') then
    update public.testimonials set status = 'approved' where is_approved = true and status = 'pending';
    alter table public.testimonials drop column is_approved;
  end if;
end $$;

create table if not exists public.sponsor_inquiries (
  id                uuid        primary key default gen_random_uuid(),
  organization_name text        not null,
  contact_name      text        not null,
  email             text        not null,
  phone             text,
  sponsorship_type  text,
  message           text,
  created_at        timestamptz not null default now()
);

create table if not exists public.career_inquiries (
  id               uuid        primary key default gen_random_uuid(),
  name             text        not null,
  email            text        not null,
  phone            text,
  age              integer,
  standard         text,
  state            text,
  city             text,
  area_of_interest text,
  message          text,
  created_at       timestamptz not null default now()
);

create table if not exists public.institution_inquiries (
  id               uuid        primary key default gen_random_uuid(),
  institution_name text        not null,
  contact_name     text        not null,
  email            text        not null,
  phone            text,
  institution_type text,
  city             text,
  student_count    text,
  message          text,
  created_at       timestamptz not null default now()
);

-- RLS
alter table public.alumni_registrations   enable row level security;
alter table public.testimonials           enable row level security;
alter table public.sponsor_inquiries      enable row level security;
alter table public.career_inquiries       enable row level security;
alter table public.institution_inquiries  enable row level security;

-- alumni_registrations: anyone can insert, only admins read
create policy "alumni_registrations_insert_public" on public.alumni_registrations for insert with check (true);
create policy "admins_manage_alumni_registrations" on public.alumni_registrations for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('admin', 'super_admin'))
);

-- testimonials: anyone can insert (public form), only admins read all / manage
create policy "testimonials_insert_public" on public.testimonials for insert with check (true);
create policy "testimonials_read_approved" on public.testimonials for select using (status = 'approved');
create policy "admins_read_all_testimonials"  on public.testimonials for select using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('admin', 'super_admin'))
);
create policy "admins_manage_testimonials" on public.testimonials for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('admin', 'super_admin'))
);

-- sponsor_inquiries: anyone can insert, only admins read
create policy "sponsor_inquiries_insert_public" on public.sponsor_inquiries for insert with check (true);
create policy "admins_manage_sponsor_inquiries" on public.sponsor_inquiries for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('admin', 'super_admin'))
);

-- career_inquiries: anyone can insert, only admins read
create policy "career_inquiries_insert_public" on public.career_inquiries for insert with check (true);
create policy "admins_manage_career_inquiries" on public.career_inquiries for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('admin', 'super_admin'))
);

-- institution_inquiries: anyone can insert, only admins read
create policy "institution_inquiries_insert_public" on public.institution_inquiries for insert with check (true);
create policy "admins_manage_institution_inquiries" on public.institution_inquiries for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('admin', 'super_admin'))
);

-- ── EARC FILES ────────────────────────────────────────────────────────────────

create table if not exists public.earc_files (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  file_url    text        not null,
  file_type   text        not null,
  category    text        not null check (category in ('student_data', 'programme_data', 'document')),
  description text,
  uploaded_by uuid        references public.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

alter table public.earc_files enable row level security;

-- earc_staff and admin can do everything
create policy "earc_manage_files" on public.earc_files for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('earc_staff', 'admin', 'super_admin'))
);

-- Storage bucket for EARC files (private — access via signed URLs or service key)
insert into storage.buckets (id, name, public)
  values ('earc-files', 'earc-files', true)
  on conflict (id) do nothing;

-- ── VOLUNTEER JOURNEY MODULES ───────────────────────────────────────────────

-- Dynamic forms gain a category so Task Assignment / PPT Submission / Survey /
-- Interesting-Facts Repository / Cultural Activity all route through the
-- existing form builder instead of bespoke tables.
alter table public.dynamic_forms add column if not exists category text not null default 'general'
  check (category in ('general', 'task', 'survey', 'cultural_activity'));

-- Aadhaar verification + additional document uploads on volunteer_profiles
alter table public.volunteer_profiles add column if not exists aadhaar_verified boolean not null default false;
alter table public.volunteer_profiles add column if not exists aadhaar_verified_at timestamptz;
alter table public.volunteer_profiles add column if not exists aadhaar_verified_by uuid references public.users(id) on delete set null;
alter table public.volunteer_profiles add column if not exists parent_consent_url text;
alter table public.volunteer_profiles add column if not exists indemnity_bond_url text;

-- Registration Fee Management
create table if not exists public.registration_fees (
  id                 uuid primary key default gen_random_uuid(),
  volunteer_id       uuid references public.users(id) on delete cascade unique,
  amount             numeric not null,
  status             text not null default 'pending' check (status in ('pending', 'paid', 'waived', 'refunded')),
  payment_reference  text,
  paid_at            timestamptz,
  notes              text,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

-- Workshop Management (Science / Mathematics / Exhibition & Cultural)
create table if not exists public.workshops (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  workshop_type  text not null check (workshop_type in ('science', 'mathematics', 'exhibition_cultural', 'other')),
  workshop_date  date not null,
  workshop_time  text,
  hall_location  text,
  trainer_id     uuid references public.users(id) on delete set null,
  trainer_name   text,
  status         text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  kit_ready      boolean not null default false,
  plan_notes     text,
  created_by     uuid references public.users(id) on delete set null,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

create table if not exists public.workshop_attendees (
  id                 uuid primary key default gen_random_uuid(),
  workshop_id        uuid references public.workshops(id) on delete cascade,
  volunteer_id       uuid references public.users(id) on delete cascade,
  attendance_status  text not null default 'pending' check (attendance_status in ('pending', 'pending_approval', 'present', 'absent', 'excused')),
  missed_summary     text,
  makeup_decision    text check (makeup_decision in ('pending', 'allowed', 'not_allowed')),
  created_at         timestamptz default now(),
  unique (workshop_id, volunteer_id)
);

-- Demo Session: Observer Assessment / Evaluation
create table if not exists public.demo_evaluations (
  id            uuid primary key default gen_random_uuid(),
  volunteer_id  uuid references public.users(id) on delete cascade,
  observer_id   uuid references public.users(id) on delete set null,
  tour_id       uuid references public.tours(id) on delete set null,
  scores        jsonb not null default '{}',
  total_score   numeric,
  remarks       text,
  evaluated_at  timestamptz default now()
);

-- Local Host Management
create table if not exists public.local_hosts (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  phone       text,
  email       text,
  state       text,
  city        text,
  address     text,
  group_id    uuid references public.tour_groups(id) on delete set null,
  notes       text,
  created_by  uuid references public.users(id) on delete set null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Kit Assembly & Inventory
create table if not exists public.kit_items (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  category              text,
  quantity_per_school   integer not null default 1,
  notes                 text,
  created_at            timestamptz default now()
);

create table if not exists public.kit_assignments (
  id               uuid primary key default gen_random_uuid(),
  group_id         uuid references public.tour_groups(id) on delete cascade unique,
  school_count     integer not null default 1,
  packed           boolean not null default false,
  distributed      boolean not null default false,
  distributed_at   timestamptz,
  notes            text,
  created_by       uuid references public.users(id) on delete set null,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ID Card Generation
create table if not exists public.id_cards (
  id            uuid primary key default gen_random_uuid(),
  volunteer_id  uuid references public.users(id) on delete cascade,
  card_number   text unique not null,
  valid_from    date not null,
  valid_to      date not null,
  card_file_url text,
  issued_by     uuid references public.users(id) on delete set null,
  issued_at     timestamptz default now()
);
alter table public.id_cards add column if not exists tour_id  uuid references public.tours(id) on delete set null;
alter table public.id_cards add column if not exists group_id uuid references public.tour_groups(id) on delete set null;
alter table public.id_cards add column if not exists state    text;
alter table public.id_cards add column if not exists place    text;

-- Ticket Management & Travel Planning
create table if not exists public.travel_tickets (
  id                    uuid primary key default gen_random_uuid(),
  group_id              uuid references public.tour_groups(id) on delete cascade,
  train_number          text,
  train_name            text,
  pnr                   text,
  departure_station     text,
  arrival_station       text,
  departure_at          timestamptz,
  arrival_at            timestamptz,
  ticket_file_url       text,
  note                  text,
  confirmation_status   text not null default 'pending' check (confirmation_status in ('pending', 'confirmed', 'cancelled')),
  itinerary_approved    boolean not null default false,
  created_by            uuid references public.users(id) on delete set null,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- Location Updates (optional, during travel)
create table if not exists public.location_updates (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid references public.tour_groups(id) on delete cascade,
  posted_by    uuid references public.users(id) on delete set null,
  from_location text,
  to_location   text,
  note         text,
  status_type  text check (status_type in ('current_location', 'train_delay', 'arrival_estimate', 'other')),
  created_at   timestamptz default now()
);
alter table public.location_updates add column if not exists from_location text;
alter table public.location_updates add column if not exists to_location   text;
alter table public.location_updates drop column if exists latitude;
alter table public.location_updates drop column if exists longitude;

-- Financial Management: advances, expenses, bill approval
create table if not exists public.expense_advances (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid references public.tour_groups(id) on delete cascade,
  amount     numeric not null,
  given_at   timestamptz default now(),
  given_by   uuid references public.users(id) on delete set null,
  notes      text
);

create table if not exists public.expenses (
  id                 uuid primary key default gen_random_uuid(),
  group_id           uuid references public.tour_groups(id) on delete cascade,
  submitted_by       uuid references public.users(id) on delete cascade,
  category           text not null check (category in ('travel', 'accommodation', 'food', 'materials', 'miscellaneous')),
  subcategory        text,
  volunteer_count    integer,
  vendor_name        text,
  expense_date       date not null default current_date,
  amount             numeric not null,
  bill_url           text,
  description        text,
  status             text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  approved_by        uuid references public.users(id) on delete set null,
  approved_at        timestamptz,
  rejection_reason   text,
  created_at         timestamptz default now()
);

-- Final Tour Report — one per location visited (forms/tour-report.md)
create table if not exists public.tour_reports (
  id                          uuid primary key default gen_random_uuid(),
  tour_id                     uuid references public.tours(id) on delete cascade,
  group_id                    uuid references public.tour_groups(id) on delete set null,
  submitted_by                uuid references public.users(id) on delete cascade,
  -- Section 1: Location Details
  location_name               text not null,
  -- Section 2: Local Organisations & Host Details (repeatable entries)
  hosts                       jsonb not null default '[]',
  -- Section 3: Logistics Rating (1-10 each)
  logistics_scores            jsonb not null default '{}',
  -- Section 4: Observations (150-word minimum, enforced client-side on final submit)
  unique_features             text,
  best_practices              text,
  cultural_observations       text,
  challenges_faced            text,
  suggestions_future_teams    text,
  important_contacts          text,
  places_worth_visiting       text,
  -- Section 5: Visit Summary
  overall_recommendation      text check (overall_recommendation in ('Highly Recommended', 'Recommended', 'Can be Considered', 'Not Recommended')),
  suitable_residential_camps  boolean,
  follow_up_required          boolean,
  additional_remarks          text,
  report_file_url             text,
  status           text not null default 'draft' check (status in ('draft', 'submitted', 'approved')),
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- Storage bucket for bills / tickets / id-card photos / reports
insert into storage.buckets (id, name, public)
  values ('documents', 'documents', true)
  on conflict (id) do nothing;

-- updated_at triggers
drop trigger if exists registration_fees_updated_at on public.registration_fees;
drop trigger if exists workshops_updated_at          on public.workshops;
drop trigger if exists local_hosts_updated_at        on public.local_hosts;
drop trigger if exists kit_assignments_updated_at    on public.kit_assignments;
drop trigger if exists travel_tickets_updated_at     on public.travel_tickets;
drop trigger if exists tour_reports_updated_at       on public.tour_reports;

create trigger registration_fees_updated_at before update on public.registration_fees for each row execute procedure public.handle_updated_at();
create trigger workshops_updated_at          before update on public.workshops          for each row execute procedure public.handle_updated_at();
create trigger local_hosts_updated_at        before update on public.local_hosts        for each row execute procedure public.handle_updated_at();
create trigger kit_assignments_updated_at    before update on public.kit_assignments    for each row execute procedure public.handle_updated_at();
create trigger travel_tickets_updated_at     before update on public.travel_tickets     for each row execute procedure public.handle_updated_at();
create trigger tour_reports_updated_at       before update on public.tour_reports       for each row execute procedure public.handle_updated_at();

-- RLS
alter table public.registration_fees   enable row level security;
alter table public.workshops           enable row level security;
alter table public.workshop_attendees  enable row level security;
alter table public.demo_evaluations    enable row level security;
alter table public.local_hosts         enable row level security;
alter table public.kit_items           enable row level security;
alter table public.kit_assignments     enable row level security;
alter table public.id_cards            enable row level security;
alter table public.travel_tickets      enable row level security;
alter table public.location_updates    enable row level security;
alter table public.expense_advances    enable row level security;
alter table public.expenses            enable row level security;
alter table public.tour_reports        enable row level security;

-- registration_fees: volunteer reads own, admin manages all
create policy "registration_fees_read_own" on public.registration_fees for select using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.id = volunteer_id)
);
create policy "admins_manage_registration_fees" on public.registration_fees for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('admin', 'super_admin'))
);

-- workshops: all authenticated read, admin manages
create policy "workshops_read_all" on public.workshops for select using (true);
create policy "admins_manage_workshops" on public.workshops for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('admin', 'super_admin'))
);

-- workshop_attendees: volunteer manages own row, admin manages all
create policy "workshop_attendees_own" on public.workshop_attendees for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.id = volunteer_id)
);
create policy "admins_manage_workshop_attendees" on public.workshop_attendees for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('admin', 'super_admin'))
);

-- demo_evaluations: volunteer reads own, admin/observer manage
create policy "demo_evaluations_read_own" on public.demo_evaluations for select using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.id = volunteer_id)
);
create policy "admins_manage_demo_evaluations" on public.demo_evaluations for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('admin', 'super_admin'))
);

-- local_hosts: all authenticated read, admin manages
create policy "local_hosts_read_all" on public.local_hosts for select using (true);
create policy "admins_manage_local_hosts" on public.local_hosts for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('admin', 'super_admin'))
);

-- kit_items / kit_assignments: all authenticated read, admin manages
create policy "kit_items_read_all" on public.kit_items for select using (true);
create policy "admins_manage_kit_items" on public.kit_items for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('admin', 'super_admin'))
);
create policy "kit_assignments_read_all" on public.kit_assignments for select using (true);
create policy "admins_manage_kit_assignments" on public.kit_assignments for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('admin', 'super_admin'))
);

-- id_cards: volunteer reads own, admin manages
create policy "id_cards_read_own" on public.id_cards for select using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.id = volunteer_id)
);
create policy "admins_manage_id_cards" on public.id_cards for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('admin', 'super_admin'))
);

-- travel_tickets / location_updates: all authenticated read, admin manages; volunteers can post location updates
create policy "travel_tickets_read_all" on public.travel_tickets for select using (true);
create policy "admins_manage_travel_tickets" on public.travel_tickets for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('admin', 'super_admin'))
);
create policy "location_updates_read_all" on public.location_updates for select using (true);
create policy "volunteers_insert_location_updates" on public.location_updates for insert with check (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('volunteer', 'admin', 'super_admin'))
);
create policy "admins_manage_location_updates" on public.location_updates for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('admin', 'super_admin'))
);

-- expense_advances: all authenticated read, admin manages
create policy "expense_advances_read_all" on public.expense_advances for select using (true);
create policy "admins_manage_expense_advances" on public.expense_advances for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('admin', 'super_admin'))
);

-- expenses: volunteer manages own submissions, admin manages all
create policy "expenses_own" on public.expenses for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.id = submitted_by)
);
create policy "admins_manage_expenses" on public.expenses for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('admin', 'super_admin'))
);

-- tour_reports: volunteer manages own, admin manages all
create policy "tour_reports_own" on public.tour_reports for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.id = submitted_by)
);
create policy "admins_manage_tour_reports" on public.tour_reports for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('admin', 'super_admin'))
);


-- ============================================================
-- MIGRATION: allow enrollee/super_admin on existing databases
-- (schema.sql tables use IF NOT EXISTS, so this constraint change
-- must be applied by hand against an already-provisioned DB)
-- ============================================================
alter table public.users drop constraint if exists users_role_check;
alter table public.users add constraint users_role_check
  check (role in ('enrollee', 'volunteer', 'admin', 'earc_staff', 'super_admin'));
alter table public.users alter column role set default 'enrollee';
update public.users set role = 'enrollee' where role is null;

-- ============================================================
-- MIGRATION: volunteer self-reported workshop attendance
-- (adds 'pending_approval' status — volunteer claims "attended",
-- admin approves to 'present' or rejects to 'absent')
-- ============================================================
alter table public.workshop_attendees drop constraint if exists workshop_attendees_attendance_status_check;
alter table public.workshop_attendees add constraint workshop_attendees_attendance_status_check
  check (attendance_status in ('pending', 'pending_approval', 'present', 'absent', 'excused'));

-- ============================================================
-- MIGRATION: add 'maybe' RSVP option for events
-- ============================================================
alter table public.event_attendees drop constraint if exists event_attendees_rsvp_status_check;
alter table public.event_attendees add constraint event_attendees_rsvp_status_check
  check (rsvp_status in ('pending', 'confirmed', 'maybe', 'attended', 'absent'));

-- ============================================================
-- MIGRATION: replace daily_logs questions (activities/observations/challenges)
-- with the 5-question reflection format
-- ============================================================
alter table public.daily_logs add column if not exists activities_conducted text;
alter table public.daily_logs add column if not exists key_achievements     text;
alter table public.daily_logs add column if not exists challenges_faced     text;
alter table public.daily_logs add column if not exists biggest_learning     text;
alter table public.daily_logs add column if not exists participant_impact  text;
update public.daily_logs set activities_conducted = activities where activities_conducted is null;
update public.daily_logs set challenges_faced = challenges where challenges_faced is null and challenges is not null;
alter table public.daily_logs drop column if exists activities;
alter table public.daily_logs drop column if exists observations;
alter table public.daily_logs drop column if exists challenges;
-- new/backfilled columns stay nullable at the DB level (old rows can't be backfilled for
-- questions that didn't exist yet); the 50-word-minimum requirement is enforced by zod
-- (dailyLogSchema) on every new write instead.

-- ============================================================
-- MIGRATION: add train_name + note to travel_tickets
-- ============================================================
alter table public.travel_tickets add column if not exists train_name text;
alter table public.travel_tickets add column if not exists note       text;

-- ============================================================
-- MIGRATION: expense categories -> fixed 5-category list with
-- subcategory / vendor / date / volunteer-count breakdown
-- ============================================================
alter table public.expenses add column if not exists subcategory     text;
alter table public.expenses add column if not exists volunteer_count integer;
alter table public.expenses add column if not exists vendor_name     text;
alter table public.expenses add column if not exists expense_date    date;
update public.expenses set expense_date = created_at::date where expense_date is null;
alter table public.expenses alter column expense_date set default current_date;
alter table public.expenses alter column expense_date set not null;
update public.expenses set category = 'miscellaneous' where category = 'other';
alter table public.expenses drop constraint if exists expenses_category_check;
alter table public.expenses add constraint expenses_category_check
  check (category in ('travel', 'accommodation', 'food', 'materials', 'miscellaneous'));

-- ============================================================
-- School Visit Reports (forms/school-form.md, Sections 1-5 only — no photos)
-- Group-scoped: any member of the group can read every report
-- submitted under that group, not just their own.
-- ============================================================
create table if not exists public.school_reports (
  id                       uuid primary key default gen_random_uuid(),
  group_id                 uuid references public.tour_groups(id) on delete set null,
  submitted_by             uuid references public.users(id) on delete cascade,
  -- Section 1: School Details
  school_name              text not null,
  school_type              text check (school_type in ('Government', 'Government Aided', 'Private', 'Ashram School', 'ZP School', 'Other')),
  location_category        text check (location_category in ('Rural', 'Semi-Urban', 'Urban')),
  medium_of_instruction    text check (medium_of_instruction in ('Marathi', 'Hindi', 'English', 'Assamese', 'Urdu', 'Other')),
  street_area              text,
  village_town             text,
  taluka_tehsil            text,
  district                 text,
  state                    text,
  pincode                  text,
  principal_name           text,
  principal_mobile         text,
  coordinator_name         text,
  coordinator_mobile       text,
  -- Section 2: Visit Details
  visit_date               date,
  arrival_time             text,
  departure_time           text,
  total_duration_minutes   integer,
  volunteers_present_count integer,
  volunteer_names          text[] not null default '{}',
  -- Section 3: Session Details (repeatable rows)
  sessions                 jsonb not null default '[]',
  -- Section 4: Reflection & Observations (250-word minimum, enforced client-side on final submit)
  student_response         text,
  what_went_well           text,
  challenges_faced         text,
  solutions_adopted        text,
  suggestions_improvement  text,
  memorable_moment         text,
  overall_feedback         text,
  -- Section 5: Visit Summary
  overall_rating           text check (overall_rating in ('Excellent', 'Good', 'Satisfactory', 'Needs Improvement')),
  follow_up_required       boolean,
  follow_up_date           date,
  additional_remarks       text,
  status                   text not null default 'draft' check (status in ('draft', 'submitted')),
  created_at               timestamptz default now(),
  updated_at               timestamptz default now()
);

drop trigger if exists school_reports_updated_at on public.school_reports;
create trigger school_reports_updated_at before update on public.school_reports for each row execute procedure public.handle_updated_at();

alter table public.school_reports enable row level security;

-- school_reports: any group member can read the group's reports; only the author can write their own; admins manage all
create policy "school_reports_group_read" on public.school_reports for select using (
  exists (
    select 1 from public.tour_group_members m
    join public.users u on u.id = m.user_id
    where m.group_id = school_reports.group_id and u.clerk_id = auth.uid()::text
  )
);
create policy "school_reports_own_write" on public.school_reports for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.id = submitted_by)
);
create policy "admins_manage_school_reports" on public.school_reports for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('admin', 'super_admin'))
);

-- ============================================================
-- MIGRATION: rebuild tour_reports around forms/tour-report.md
-- (per-location report: host entries, logistics ratings, 7
-- observation fields, visit summary) — replaces the old flat
-- summary/highlights/challenges fields
-- ============================================================
alter table public.tour_reports add column if not exists location_name              text;
alter table public.tour_reports add column if not exists hosts                      jsonb not null default '[]';
alter table public.tour_reports add column if not exists logistics_scores           jsonb not null default '{}';
alter table public.tour_reports add column if not exists unique_features            text;
alter table public.tour_reports add column if not exists best_practices             text;
alter table public.tour_reports add column if not exists cultural_observations      text;
alter table public.tour_reports add column if not exists challenges_faced           text;
alter table public.tour_reports add column if not exists suggestions_future_teams   text;
alter table public.tour_reports add column if not exists important_contacts         text;
alter table public.tour_reports add column if not exists places_worth_visiting      text;
alter table public.tour_reports add column if not exists overall_recommendation     text;
alter table public.tour_reports add column if not exists suitable_residential_camps boolean;
alter table public.tour_reports add column if not exists follow_up_required         boolean;
alter table public.tour_reports add column if not exists additional_remarks         text;
update public.tour_reports set location_name = coalesce(nullif(trim(summary), ''), 'Unspecified') where location_name is null;
update public.tour_reports set challenges_faced = challenges where challenges_faced is null and challenges is not null;
update public.tour_reports set additional_remarks = coalesce(highlights, summary) where additional_remarks is null;
alter table public.tour_reports drop column if exists summary;
alter table public.tour_reports drop column if exists highlights;
alter table public.tour_reports drop column if exists challenges;
alter table public.tour_reports alter column location_name set not null;
alter table public.tour_reports drop constraint if exists tour_reports_overall_recommendation_check;
alter table public.tour_reports add constraint tour_reports_overall_recommendation_check
  check (overall_recommendation in ('Highly Recommended', 'Recommended', 'Can be Considered', 'Not Recommended'));
