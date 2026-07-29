-- ============================================================
-- MIGRATION: add 'group_core_member' role
-- Run this directly in the Supabase SQL Editor against an existing
-- database. Also folded into lib/supabase/schema.sql for fresh installs.
-- ============================================================
alter table public.users drop constraint if exists users_role_check;
alter table public.users add constraint users_role_check
  check (role in ('enrollee', 'volunteer', 'admin', 'earc_staff', 'group_core_member', 'super_admin'));
