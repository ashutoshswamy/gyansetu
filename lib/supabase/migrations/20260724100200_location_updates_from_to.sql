-- Volunteer location updates now record a from/to place name pair instead of
-- raw GPS latitude/longitude.
alter table public.location_updates add column if not exists from_location text;
alter table public.location_updates add column if not exists to_location   text;
alter table public.location_updates drop column if exists latitude;
alter table public.location_updates drop column if exists longitude;
