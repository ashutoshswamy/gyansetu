-- Adds a free-text trainer name to workshops, independent of the linked users.trainer_id.
alter table public.workshops add column if not exists trainer_name text;
