-- Run once in Supabase SQL editor against an existing database.
-- Replaces the boolean is_approved flag with a tri-state status
-- (pending / approved / declined) so declined testimonials are kept, not deleted.
alter table public.testimonials add column if not exists status text not null default 'pending' check (status in ('pending', 'approved', 'declined'));

drop policy if exists "testimonials_read_approved" on public.testimonials;

do $$ begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'testimonials' and column_name = 'is_approved') then
    update public.testimonials set status = 'approved' where is_approved = true and status = 'pending';
    alter table public.testimonials drop column is_approved;
  end if;
end $$;

create policy "testimonials_read_approved" on public.testimonials for select using (status = 'approved');
