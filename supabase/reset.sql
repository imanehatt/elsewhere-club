-- ⚠️  ONLY run this if you ran an OLDER version of schema.sql before and want to start fresh.
-- It permanently deletes all trips, bookings, signed agreements, inquiries, flight requests, members and messages.
drop table if exists public.booking_events cascade;
drop table if exists public.booking_payments cascade;
drop table if exists public.booking_agreements cascade;
drop table if exists public.bookings cascade;
drop table if exists public.bank_settings cascade;
drop table if exists public.organizer_settings cascade;
drop table if exists public.trip_departures cascade;
drop table if exists public.flight_quote_requests cascade;
drop table if exists public.trip_inquiries cascade;
drop table if exists public.trips cascade;
-- Then run schema.sql and seed.sql again.
