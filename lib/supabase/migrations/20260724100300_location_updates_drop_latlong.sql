-- Drop the now-unused raw GPS columns; superseded by from_location/to_location.
alter table public.location_updates drop column if exists latitude;
alter table public.location_updates drop column if exists longitude;
