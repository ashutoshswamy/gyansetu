-- ============================================================
-- MIGRATION: End Tour feature — demotion tracking + reactivate visibility
-- Run this directly in the Supabase SQL Editor against an existing
-- database. Also folded into lib/supabase/schema.sql for fresh installs.
-- ============================================================

-- Tracks volunteers auto-demoted to enrollee because their tour ended, so
-- "Reactivate for everyone" can restore exactly the people this caused, and
-- nobody else (e.g. someone demoted for an unrelated reason).
create table if not exists public.tour_end_demotions (
  id         uuid primary key default gen_random_uuid(),
  tour_id    uuid not null references public.tours(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  demoted_at timestamptz not null default now(),
  unique(tour_id, user_id)
);
alter table public.tour_end_demotions enable row level security;
create policy "admins_manage_tour_end_demotions" on public.tour_end_demotions for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('admin', 'super_admin'))
);

-- Lets "reactivate for admin only" reopen a tour (status back to 'open', editable,
-- capacity checks work) while keeping it out of volunteer/enrollee-facing lists,
-- as distinct from "reactivate for everyone" which also flips this back to true.
alter table public.tours add column if not exists participant_visible boolean not null default true;
