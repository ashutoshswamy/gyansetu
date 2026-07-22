-- Run once in Supabase SQL editor against an existing database.
-- Adds per-question subjective marks storage for admin test evaluation.
alter table public.test_attempts add column if not exists subjective_marks jsonb not null default '{}';
