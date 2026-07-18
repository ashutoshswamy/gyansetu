-- Gyan Setu — RESET SCHEMA
-- WARNING: Drops ALL tables and data. Run in Supabase SQL editor.
-- After this, run schema.sql to recreate everything.

-- ============================================================
-- DROP POLICIES (must drop before tables)
-- ============================================================
do $$ declare
  r record;
begin
  for r in (
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
  ) loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- ============================================================
-- DROP TRIGGERS
-- ============================================================
do $$ declare
  r record;
begin
  for r in (
    select trigger_name, event_object_table
    from information_schema.triggers
    where trigger_schema = 'public'
  ) loop
    execute format('drop trigger if exists %I on public.%I', r.trigger_name, r.event_object_table);
  end loop;
end $$;

-- ============================================================
-- DROP TABLES (cascade handles FK order)
-- ============================================================
drop table if exists public.tour_reports            cascade;
drop table if exists public.expenses                cascade;
drop table if exists public.expense_advances        cascade;
drop table if exists public.location_updates        cascade;
drop table if exists public.travel_tickets          cascade;
drop table if exists public.id_cards                cascade;
drop table if exists public.kit_assignments         cascade;
drop table if exists public.kit_items               cascade;
drop table if exists public.local_hosts             cascade;
drop table if exists public.demo_evaluations        cascade;
drop table if exists public.workshop_attendees      cascade;
drop table if exists public.workshops               cascade;
drop table if exists public.registration_fees       cascade;
drop table if exists public.earc_files              cascade;
drop table if exists public.institution_inquiries   cascade;
drop table if exists public.alumni_registrations    cascade;
drop table if exists public.career_inquiries        cascade;
drop table if exists public.sponsor_inquiries       cascade;
drop table if exists public.testimonials            cascade;
drop table if exists public.newsletters          cascade;
drop table if exists public.blog_posts           cascade;
drop table if exists public.gallery_images       cascade;
drop table if exists public.gallery_categories   cascade;
drop table if exists public.visits               cascade;
drop table if exists public.notifications        cascade;
drop table if exists public.daily_logs           cascade;
drop table if exists public.certificates         cascade;
drop table if exists public.media_gallery        cascade;
drop table if exists public.logistics            cascade;
drop table if exists public.tour_group_members   cascade;
drop table if exists public.tour_groups          cascade;
drop table if exists public.event_attendees      cascade;
drop table if exists public.events               cascade;
drop table if exists public.alumni_profiles      cascade;
drop table if exists public.volunteer_profiles   cascade;
drop table if exists public.volunteer_assignments cascade;
drop table if exists public.form_submissions     cascade;
drop table if exists public.dynamic_forms        cascade;
drop table if exists public.test_attempts        cascade;
drop table if exists public.tour_applications    cascade;
drop table if exists public.eligibility_tests    cascade;
drop table if exists public.tours                cascade;
drop table if exists public.users                cascade;

-- ============================================================
-- DROP FUNCTIONS
-- ============================================================
drop function if exists public.handle_updated_at() cascade;

-- ============================================================
-- DROP STORAGE BUCKETS (optional — comment out to keep files)
-- ============================================================
-- delete from storage.objects where bucket_id = 'media';
-- delete from storage.buckets where id = 'media';
-- delete from storage.objects where bucket_id = 'blog-covers';
-- delete from storage.buckets where id = 'blog-covers';
-- delete from storage.objects where bucket_id = 'gallery-images';
-- delete from storage.buckets where id = 'gallery-images';
-- delete from storage.objects where bucket_id = 'newsletter-files';
-- delete from storage.buckets where id = 'newsletter-files';
-- delete from storage.objects where bucket_id = 'earc-files';
-- delete from storage.buckets where id = 'earc-files';
-- delete from storage.objects where bucket_id = 'documents';
-- delete from storage.buckets where id = 'documents';
