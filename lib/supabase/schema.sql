-- Gyan Setu — complete Supabase schema
-- Run fresh in Supabase SQL editor (idempotent: uses IF NOT EXISTS / OR REPLACE)
--
-- Roles: volunteer | admin | earc_staff  (null = new signup / enrollee)
-- No super_admin, no enrollment_user.

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

-- Users (synced from Clerk via webhook; role null = new signup / enrollee)
create table if not exists public.users (
  id          uuid primary key default gen_random_uuid(),
  clerk_id    text unique not null,
  email       text unique not null,
  name        text not null,
  role        text check (role in ('volunteer', 'admin', 'earc_staff')),
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
  status       text not null default 'in_progress' check (status in ('in_progress', 'submitted', 'evaluated', 'pending_approval', 'approved', 'rejected')),
  started_at   timestamptz default now(),
  submitted_at timestamptz,
  unique (test_id, student_id)
);

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
  rsvp_status text not null default 'pending' check (rsvp_status in ('pending', 'confirmed', 'attended', 'absent')),
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

-- Daily Logs
create table if not exists public.daily_logs (
  id           uuid primary key default gen_random_uuid(),
  tour_id      uuid references public.tours(id) on delete cascade,
  volunteer_id uuid references public.users(id) on delete cascade,
  log_date     date not null,
  activities   text not null,
  observations text,
  challenges   text,
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
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role = 'admin')
);

-- tours
create policy "tours_read_open"      on public.tours for select using (status = 'open');
create policy "admins_manage_tours"  on public.tours for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role = 'admin')
);

-- eligibility_tests
create policy "tests_read_active"    on public.eligibility_tests for select using (status = 'active');
create policy "admins_manage_tests"  on public.eligibility_tests for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role = 'admin')
);

-- tour_applications
create policy "students_manage_own_applications" on public.tour_applications for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.id = student_id)
);
create policy "admins_manage_applications" on public.tour_applications for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role = 'admin')
);

-- test_attempts
create policy "students_manage_own_attempts" on public.test_attempts for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.id = student_id)
);
create policy "admins_manage_attempts" on public.test_attempts for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role = 'admin')
);

-- dynamic_forms
create policy "forms_read_active"    on public.dynamic_forms for select using (status = 'active');
create policy "admins_manage_forms"  on public.dynamic_forms for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role = 'admin')
);

-- form_submissions
create policy "users_manage_own_submissions" on public.form_submissions for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.id = submitted_by)
);
create policy "admins_manage_submissions" on public.form_submissions for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role = 'admin')
);

-- volunteer_assignments
create policy "volunteers_read_own_assignments" on public.volunteer_assignments for select using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.id = volunteer_id)
);
create policy "admins_manage_assignments" on public.volunteer_assignments for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role = 'admin')
);

-- volunteer_profiles
create policy "volunteer_profiles_own" on public.volunteer_profiles for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.id = user_id)
);
create policy "admins_manage_volunteer_profiles" on public.volunteer_profiles for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role = 'admin')
);

-- alumni_profiles
create policy "alumni_profiles_read_all" on public.alumni_profiles for select using (true);
create policy "alumni_profiles_own"      on public.alumni_profiles for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.id = user_id)
);
create policy "admins_manage_alumni_profiles" on public.alumni_profiles for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role = 'admin')
);

-- events
create policy "events_read_all"      on public.events for select using (true);
create policy "admins_manage_events" on public.events for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role = 'admin')
);

-- event_attendees
create policy "event_attendees_manage_own" on public.event_attendees for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.id = user_id)
);
create policy "admins_manage_event_attendees" on public.event_attendees for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role = 'admin')
);

-- tour_groups
create policy "tour_groups_read_all"      on public.tour_groups for select using (true);
create policy "admins_manage_tour_groups" on public.tour_groups for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role = 'admin')
);

-- tour_group_members
create policy "group_members_read_all"      on public.tour_group_members for select using (true);
create policy "admins_manage_group_members" on public.tour_group_members for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role = 'admin')
);

-- logistics
create policy "logistics_read_all"      on public.logistics for select using (true);
create policy "admins_manage_logistics" on public.logistics for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role = 'admin')
);

-- media_gallery
create policy "media_read_all"        on public.media_gallery for select using (true);
create policy "volunteers_insert_media" on public.media_gallery for insert with check (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('volunteer', 'admin'))
);
create policy "admins_manage_media"   on public.media_gallery for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role = 'admin')
);

-- certificates
create policy "certificates_read_own"      on public.certificates for select using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.id = user_id)
);
create policy "admins_manage_certificates" on public.certificates for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role = 'admin')
);

-- daily_logs
create policy "daily_logs_own"          on public.daily_logs for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.id = volunteer_id)
);
create policy "admins_manage_daily_logs" on public.daily_logs for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role = 'admin')
);

-- notifications
create policy "notifications_own" on public.notifications for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.id = user_id)
);

-- visits
create policy "visits_read_all"      on public.visits for select using (true);
create policy "admins_manage_visits" on public.visits for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role = 'admin')
);

-- gallery_categories
create policy "gallery_categories_read_all"      on public.gallery_categories for select using (true);
create policy "admins_manage_gallery_categories" on public.gallery_categories for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role = 'admin')
);

-- gallery_images
create policy "gallery_images_read_all"      on public.gallery_images for select using (true);
create policy "admins_manage_gallery_images" on public.gallery_images for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role = 'admin')
);

-- blog_posts
create policy "blog_posts_read_published"  on public.blog_posts for select using (status = 'published');
create policy "admins_read_all_blog_posts" on public.blog_posts for select using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role = 'admin')
);
create policy "admins_manage_blog_posts"   on public.blog_posts for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role = 'admin')
);

-- newsletters
create policy "newsletters_read_published"  on public.newsletters for select using (status = 'published');
create policy "admins_read_all_newsletters" on public.newsletters for select using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role = 'admin')
);
create policy "admins_manage_newsletters"   on public.newsletters for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role = 'admin')
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
  is_approved boolean     not null default false,
  created_at  timestamptz not null default now()
);

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
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role = 'admin')
);

-- testimonials: anyone can insert (public form), only admins read all / manage
create policy "testimonials_insert_public" on public.testimonials for insert with check (true);
create policy "testimonials_read_approved" on public.testimonials for select using (is_approved = true);
create policy "admins_read_all_testimonials"  on public.testimonials for select using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role = 'admin')
);
create policy "admins_manage_testimonials" on public.testimonials for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role = 'admin')
);

-- sponsor_inquiries: anyone can insert, only admins read
create policy "sponsor_inquiries_insert_public" on public.sponsor_inquiries for insert with check (true);
create policy "admins_manage_sponsor_inquiries" on public.sponsor_inquiries for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role = 'admin')
);

-- career_inquiries: anyone can insert, only admins read
create policy "career_inquiries_insert_public" on public.career_inquiries for insert with check (true);
create policy "admins_manage_career_inquiries" on public.career_inquiries for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role = 'admin')
);

-- institution_inquiries: anyone can insert, only admins read
create policy "institution_inquiries_insert_public" on public.institution_inquiries for insert with check (true);
create policy "admins_manage_institution_inquiries" on public.institution_inquiries for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role = 'admin')
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
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('earc_staff', 'admin'))
);

-- Storage bucket for EARC files (private — access via signed URLs or service key)
insert into storage.buckets (id, name, public)
  values ('earc-files', 'earc-files', true)
  on conflict (id) do nothing;

