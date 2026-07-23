-- Links id_cards to the tour and group they were issued for, so card numbers
-- can be auto-generated from tour/group instead of typed in by hand.
alter table public.id_cards add column if not exists tour_id  uuid references public.tours(id) on delete set null;
alter table public.id_cards add column if not exists group_id uuid references public.tour_groups(id) on delete set null;
