-- ============================================================
-- MIGRATION: kit_items.material_type + per-group packing checklist
-- Run this directly in the Supabase SQL Editor against an existing
-- database. Also folded into lib/supabase/schema.sql for fresh installs.
-- ============================================================
alter table public.kit_items add column if not exists material_type text not null default 'consumable';
alter table public.kit_items drop constraint if exists kit_items_material_type_check;
alter table public.kit_items add constraint kit_items_material_type_check
  check (material_type in ('reusable', 'consumable'));

create table if not exists public.kit_packing_checks (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid references public.tour_groups(id) on delete cascade,
  kit_item_id  uuid references public.kit_items(id) on delete cascade,
  checked      boolean not null default false,
  checked_at   timestamptz,
  unique (group_id, kit_item_id)
);

alter table public.kit_packing_checks enable row level security;

drop policy if exists "kit_packing_checks_read_all" on public.kit_packing_checks;
create policy "kit_packing_checks_read_all" on public.kit_packing_checks for select using (true);

drop policy if exists "volunteers_manage_kit_packing_checks" on public.kit_packing_checks;
create policy "volunteers_manage_kit_packing_checks" on public.kit_packing_checks for all using (
  exists (select 1 from public.users u where u.clerk_id = auth.uid()::text and u.role in ('volunteer', 'admin', 'super_admin'))
);
