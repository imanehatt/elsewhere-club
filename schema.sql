-- =====================================================================
-- THE ELSEWHERE CLUB — database schema
-- Run this ONCE in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Safe to re-run: it uses "if not exists" / "or replace" where possible.
-- =====================================================================

-- gen_random_uuid() is built into Postgres 13+ (Supabase), no extension needed.

-- ---------------------------------------------------------------------
-- Admin users: only people listed here can use the dashboard.
-- (Add yourself after creating your login — see README, Step 3.)
-- ---------------------------------------------------------------------
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

-- ---------------------------------------------------------------------
-- Trips: complete, curated group trips with ONE fixed destination,
-- dates, price and itinerary. Empty dates/price = "to be announced/confirmed".
-- ---------------------------------------------------------------------
create table if not exists public.trips (
  id                      uuid primary key default gen_random_uuid(),
  slug                    text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title                   text not null check (char_length(title) between 2 and 120),
  destination             text not null,
  country                 text not null default '',
  arrival_airport         text not null default '',
  trip_type               text not null default 'Curated group travel',
  start_date              date,
  end_date                date,
  duration_days           int check (duration_days between 1 and 60),
  duration_nights         int check (duration_nights between 0 and 60),
  price                   numeric(10,2) check (price >= 0),
  currency                text not null default 'USD',
  status                  text not null default 'interest'
                            check (status in ('interest','waitlist','open','few_spots','sold_out')),
  inquiry_only            boolean not null default true,
  group_size_min          int check (group_size_min > 0),
  group_size_max          int check (group_size_max > 0),
  spots_available         int check (spots_available >= 0),
  tagline                 text not null default '',
  short_description       text not null default '',
  description             text not null default '',
  audience                text not null default '',
  group_note              text not null default '',
  stays                   jsonb not null default '[]',   -- [{ "name", "start", "end", "nights", "summary", "image" }]
  highlights              jsonb not null default '[]',
  itinerary               jsonb not null default '[]',   -- [{ "date","location","title","emoji","image","summary","overnight","timeline":[{ "time","title","items":[], "optional" }] }]
  itinerary_confirmed     boolean not null default false,
  accommodation           text not null default '',
  accommodation_confirmed boolean not null default false,
  included                jsonb not null default '[]',
  inclusions_confirmed    boolean not null default false,
  excluded                jsonb not null default '[]',
  excluded_note           text not null default '',
  faqs                    jsonb not null default '[]',   -- [{ "q": "...", "a": "..." }]
  cover_image             text,
  gallery                 jsonb not null default '[]',
  published               boolean not null default false,
  featured                boolean not null default false,
  sort_order              int not null default 100,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date)
);
-- Columns added in later versions (safe to re-run on an existing database).
alter table public.trips add column if not exists short_description text not null default '';
alter table public.trips add column if not exists audience text not null default '';
alter table public.trips add column if not exists group_note text not null default '';
alter table public.trips add column if not exists stays jsonb not null default '[]';
alter table public.trips add column if not exists excluded jsonb not null default '[]';
alter table public.trips add column if not exists excluded_note text not null default '';
alter table public.trips add column if not exists deposit_amount numeric(10,2) check (deposit_amount >= 0);
alter table public.trips add column if not exists balance_due_date date;
alter table public.trips add column if not exists deposit_due_date date;

drop trigger if exists trips_touch on public.trips;
create trigger trips_touch before update on public.trips for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- Booking inquiries (requests to book / interest — NOT confirmed reservations)
-- ---------------------------------------------------------------------
create table if not exists public.trip_inquiries (
  id                 uuid primary key default gen_random_uuid(),
  trip_id            uuid references public.trips(id) on delete set null,
  trip_title         text not null,
  trip_dates         text,
  inquiry_type       text not null default 'Request Your Spot' check (char_length(inquiry_type) <= 40),
  full_name          text not null check (char_length(full_name) <= 120),
  email              text not null check (char_length(email) <= 254),
  whatsapp           text not null check (char_length(whatsapp) <= 30),
  country            text not null check (char_length(country) <= 80),
  travellers         int  not null check (travellers between 1 and 12),
  special_requests   text check (char_length(special_requests) <= 2000),
  wants_flight_quote boolean not null default false,
  -- Pipeline status, managed by the admin. Ready for future payments.
  status             text not null default 'new'
                       check (status in ('new','contacted','offer_sent','confirmed','declined','cancelled')),
  admin_notes        text,
  created_at         timestamptz not null default now()
);
create index if not exists trip_inquiries_created_idx on public.trip_inquiries(created_at desc);

-- ---------------------------------------------------------------------
-- Flight quote requests (stand-alone OR from a trip inquiry)
-- ---------------------------------------------------------------------
create table if not exists public.flight_quote_requests (
  id                uuid primary key default gen_random_uuid(),
  source            text not null default 'flights_page' check (source in ('flights_page','trip_inquiry')),
  trip_inquiry_id   uuid references public.trip_inquiries(id) on delete set null,
  trip_id           uuid references public.trips(id) on delete set null,
  trip_type         text not null check (trip_type in ('round_trip','one_way')),
  origin            text not null check (char_length(origin) <= 120),
  destination       text not null check (char_length(destination) <= 120),
  depart_date       date,
  return_date       date,
  adults            int not null check (adults between 1 and 12),
  children          int not null default 0 check (children between 0 and 9),
  cabin_class       text not null check (cabin_class in ('economy','premium_economy','business','first')),
  preferred_airline text check (char_length(preferred_airline) <= 80),
  flexible_dates    boolean not null default false,
  full_name         text not null check (char_length(full_name) <= 120),
  email             text not null check (char_length(email) <= 254),
  whatsapp          text not null check (char_length(whatsapp) <= 30),
  special_requests  text check (char_length(special_requests) <= 2000),
  status            text not null default 'new' check (status in ('new','researching','quoted','booked','closed')),
  admin_notes       text,
  created_at        timestamptz not null default now()
);
create index if not exists flight_quotes_created_idx on public.flight_quote_requests(created_at desc);

-- ---------------------------------------------------------------------
-- Waitlist / club members
-- ---------------------------------------------------------------------
create table if not exists public.waitlist_subscribers (
  id               uuid primary key default gen_random_uuid(),
  first_name       text not null check (char_length(first_name) <= 60),
  email            text not null unique check (char_length(email) <= 254),
  country          text check (char_length(country) <= 80),
  destinations     text[] not null default '{}',
  trip_styles      text[] not null default '{}',
  travel_months    text[] not null default '{}',
  instagram        text check (char_length(instagram) <= 31),
  marketing_opt_in boolean not null default true,
  source           text not null default 'join_page' check (char_length(source) <= 40),
  created_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Contact messages
-- ---------------------------------------------------------------------
create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) <= 120),
  email      text not null check (char_length(email) <= 254),
  subject    text not null check (char_length(subject) <= 160),
  message    text not null check (char_length(message) <= 4000),
  handled    boolean not null default false,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- ROW LEVEL SECURITY
-- The public (anon) key can: read published trips, and INSERT form
-- submissions. It can never read customer data. Admins can do everything.
-- =====================================================================
alter table public.admin_users           enable row level security;
alter table public.trips                 enable row level security;
alter table public.trip_inquiries        enable row level security;
alter table public.flight_quote_requests enable row level security;
alter table public.waitlist_subscribers  enable row level security;
alter table public.contact_messages      enable row level security;

-- admin_users: admins can see the list; changes only via SQL editor.
drop policy if exists "admins read admin_users" on public.admin_users;
create policy "admins read admin_users" on public.admin_users for select to authenticated using (public.is_admin());

-- trips
drop policy if exists "public reads published trips" on public.trips;
create policy "public reads published trips" on public.trips for select to anon, authenticated using (published or public.is_admin());
drop policy if exists "admins manage trips" on public.trips;
create policy "admins manage trips" on public.trips for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Form tables: anyone may submit (insert) a NEW row; only admins can read/update/delete.
do $$
declare t text;
begin
  foreach t in array array['trip_inquiries','flight_quote_requests'] loop
    execute format('drop policy if exists "public submits" on public.%I', t);
    execute format('create policy "public submits" on public.%I for insert to anon, authenticated with check (status = ''new'' and admin_notes is null)', t);
  end loop;
  foreach t in array array['waitlist_subscribers','contact_messages'] loop
    execute format('drop policy if exists "public submits" on public.%I', t);
  end loop;
  foreach t in array array['trip_inquiries','flight_quote_requests','waitlist_subscribers','contact_messages'] loop
    execute format('drop policy if exists "admins read" on public.%I', t);
    execute format('create policy "admins read" on public.%I for select to authenticated using (public.is_admin())', t);
    execute format('drop policy if exists "admins update" on public.%I', t);
    execute format('create policy "admins update" on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin())', t);
    execute format('drop policy if exists "admins delete" on public.%I', t);
    execute format('create policy "admins delete" on public.%I for delete to authenticated using (public.is_admin())', t);
  end loop;
end $$;
create policy "public submits" on public.waitlist_subscribers for insert to anon, authenticated with check (true);
create policy "public submits" on public.contact_messages for insert to anon, authenticated with check (handled = false);

-- =====================================================================
-- STORAGE: public bucket for trip photos; only admins can upload/delete.
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('trip-images', 'trip-images', true, 8388608, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do nothing;

drop policy if exists "admins upload trip images" on storage.objects;
create policy "admins upload trip images" on storage.objects for insert to authenticated
  with check (bucket_id = 'trip-images' and public.is_admin());
drop policy if exists "admins update trip images" on storage.objects;
create policy "admins update trip images" on storage.objects for update to authenticated
  using (bucket_id = 'trip-images' and public.is_admin());
drop policy if exists "admins delete trip images" on storage.objects;
create policy "admins delete trip images" on storage.objects for delete to authenticated
  using (bucket_id = 'trip-images' and public.is_admin());

-- =====================================================================
-- BOOKINGS
-- Request Your Spot → admin approval → personalised agreement (e-signed)
-- → bank transfer → admin verifies funds → confirmation.
-- Travelers never log in: they use a secret, expiring link. The website
-- server reads/writes these tables with the SERVICE ROLE key (server only).
-- The public (anon) key has NO access to any of these tables.
-- =====================================================================

-- Organizer + legal settings (one row). Public pages may read it — it holds
-- no private data. Bank details are kept separately below (admins only).
create table if not exists public.organizer_settings (
  id                   smallint primary key default 1 check (id = 1),
  company_legal_name   text not null default '' check (char_length(company_legal_name) <= 200),
  company_address      text not null default '' check (char_length(company_address) <= 400),
  registration_number  text not null default '' check (char_length(registration_number) <= 120),
  company_email        text not null default '' check (char_length(company_email) <= 254),
  support_email        text not null default '' check (char_length(support_email) <= 254),
  website_url          text not null default '' check (char_length(website_url) <= 200),
  governing_law        text not null default '' check (char_length(governing_law) <= 200),
  refund_days          int check (refund_days between 1 and 365),
  -- [{ "period": "On or before 1 September 2026", "refund": "..." }] — in the order shown in the agreement
  cancellation_tiers   jsonb not null default '[{"period":"","refund":""},{"period":"","refund":""},{"period":"","refund":""}]',
  agreement_version    text not null default 'v1.0' check (char_length(agreement_version) between 1 and 40),
  link_validity_days   int not null default 14 check (link_validity_days between 1 and 90),
  terms_text           text not null default '' check (char_length(terms_text) <= 60000),
  privacy_text         text not null default '' check (char_length(privacy_text) <= 60000),
  -- Live mode stays OFF until the owner approves the final configuration.
  live_mode            boolean not null default false,
  live_approved_by     text,
  live_approved_at     timestamptz,
  updated_at           timestamptz not null default now()
);
alter table public.organizer_settings add column if not exists whatsapp_number text not null default '' check (char_length(whatsapp_number) <= 30);
insert into public.organizer_settings (id) values (1) on conflict (id) do nothing;
drop trigger if exists organizer_settings_touch on public.organizer_settings;
create trigger organizer_settings_touch before update on public.organizer_settings for each row execute function public.touch_updated_at();

create table if not exists public.bank_settings (
  id                 smallint primary key default 1 check (id = 1),
  account_holder     text not null default '' check (char_length(account_holder) <= 200),
  bank_name          text not null default '' check (char_length(bank_name) <= 200),
  iban               text not null default '' check (char_length(iban) <= 60),
  swift_bic          text not null default '' check (char_length(swift_bic) <= 20),
  extra_instructions text not null default '' check (char_length(extra_instructions) <= 1000),
  updated_at         timestamptz not null default now()
);
insert into public.bank_settings (id) values (1) on conflict (id) do nothing;
drop trigger if exists bank_settings_touch on public.bank_settings;
create trigger bank_settings_touch before update on public.bank_settings for each row execute function public.touch_updated_at();

create table if not exists public.bookings (
  id                    uuid primary key default gen_random_uuid(),
  reference             text unique check (reference ~ '^[A-Z0-9][A-Z0-9-]{2,30}$'),
  trip_id               uuid references public.trips(id) on delete restrict,
  trip_slug             text not null,
  trip_title            text not null,
  trip_start            date,
  trip_end              date,
  full_name             text not null check (char_length(full_name) between 2 and 120),
  email                 text not null check (char_length(email) <= 254),
  phone                 text not null check (char_length(phone) <= 30),
  country               text not null check (char_length(country) <= 80),
  nationality           text not null check (char_length(nationality) <= 80),
  date_of_birth         date not null,
  travelers             int  not null check (travelers between 1 and 12),
  special_requests      text check (char_length(special_requests) <= 2000),
  wants_flight_quote    boolean not null default false,
  status                text not null default 'inquiry_received' check (status in (
                          'inquiry_received','approved','agreement_pending','agreement_signed',
                          'awaiting_payment','payment_under_review','confirmed','cancelled')),
  declined              boolean not null default false,
  cancel_reason         text check (char_length(cancel_reason) <= 1000),
  -- Price snapshot, fixed when the request is approved
  currency              text check (char_length(currency) = 3),
  price_per_person      numeric(10,2) check (price_per_person >= 0),
  deposit_per_person    numeric(10,2) check (deposit_per_person >= 0),
  total_amount          numeric(10,2) check (total_amount >= 0),
  deposit_amount        numeric(10,2) check (deposit_amount >= 0),
  balance_amount        numeric(10,2) check (balance_amount >= 0),
  deposit_deadline      date,
  balance_deadline      date,
  -- Secure link: only a SHA-256 hash of the secret is stored
  token_hash            text unique,
  token_expires_at      timestamptz,
  approved_at           timestamptz,
  approved_by           text,
  link_sent_at          timestamptz,
  agreement_viewed_at   timestamptz,
  signed_at             timestamptz,
  confirmed_at          timestamptz,
  confirmation_sent_at  timestamptz,
  cancelled_at          timestamptz,
  is_test               boolean not null default false,
  admin_notes           text check (char_length(admin_notes) <= 4000),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  check (deposit_amount is null or total_amount is null or deposit_amount <= total_amount)
);
create index if not exists bookings_created_idx on public.bookings(created_at desc);
create index if not exists bookings_email_trip_idx on public.bookings(lower(email), trip_id);
drop trigger if exists bookings_touch on public.bookings;
create trigger bookings_touch before update on public.bookings for each row execute function public.touch_updated_at();

alter table public.flight_quote_requests add column if not exists booking_id uuid references public.bookings(id) on delete set null;

-- Signed agreements: one per booking, never edited afterwards.
create table if not exists public.booking_agreements (
  id             uuid primary key default gen_random_uuid(),
  booking_id     uuid not null unique references public.bookings(id) on delete restrict,
  version        text not null,
  content_hash   text not null,               -- SHA-256 of the exact text that was signed
  content        jsonb not null,              -- snapshot of the agreement as shown and signed
  signer_name    text not null check (char_length(signer_name) between 2 and 120),
  signature_png  text not null check (char_length(signature_png) < 400000),
  agreed         boolean not null check (agreed),
  signed_at      timestamptz not null default now(),
  ip             text,
  user_agent     text check (char_length(user_agent) <= 500)
);

-- Proofs of payment and admin verification. Deposit and balance are tracked separately.
create table if not exists public.booking_payments (
  id                uuid primary key default gen_random_uuid(),
  booking_id        uuid not null references public.bookings(id) on delete restrict,
  kind              text not null check (kind in ('deposit','balance')),
  expected_amount   numeric(10,2) not null check (expected_amount >= 0),
  proof_path        text,
  proof_name        text check (char_length(proof_name) <= 200),
  proof_uploaded_at timestamptz,
  status            text not null default 'under_review' check (status in ('under_review','verified','rejected')),
  received_amount   numeric(10,2) check (received_amount >= 0),
  received_on       date,
  verified_at       timestamptz,
  verified_by       text,
  review_note       text check (char_length(review_note) <= 1000),
  receipt_number    text unique,
  created_at        timestamptz not null default now()
);
-- No duplicate payments: at most one proof under review and one verified payment per booking + kind.
create unique index if not exists booking_payments_one_verified on public.booking_payments(booking_id, kind) where status = 'verified';
create unique index if not exists booking_payments_one_pending  on public.booking_payments(booking_id, kind) where status = 'under_review';

-- Audit history (append-only).
create table if not exists public.booking_events (
  id          bigint generated always as identity primary key,
  booking_id  uuid references public.bookings(id) on delete cascade,
  at          timestamptz not null default now(),
  actor       text not null check (char_length(actor) <= 254),
  action      text not null check (char_length(action) <= 80),
  details     jsonb not null default '{}'
);
create index if not exists booking_events_booking_idx on public.booking_events(booking_id, at);

-- Signed agreements and the audit history can't be changed or deleted.
create or replace function public.forbid_change()
returns trigger language plpgsql as $$
begin raise exception '% rows are permanent and cannot be changed', tg_table_name; end; $$;
drop trigger if exists booking_agreements_immutable on public.booking_agreements;
create trigger booking_agreements_immutable before update or delete on public.booking_agreements for each row execute function public.forbid_change();
drop trigger if exists booking_events_immutable on public.booking_events;
create trigger booking_events_immutable before update on public.booking_events for each row execute function public.forbid_change();

alter table public.organizer_settings enable row level security;
alter table public.bank_settings      enable row level security;
alter table public.bookings           enable row level security;
alter table public.booking_agreements enable row level security;
alter table public.booking_payments   enable row level security;
alter table public.booking_events     enable row level security;

drop policy if exists "public reads organizer settings" on public.organizer_settings;
create policy "public reads organizer settings" on public.organizer_settings for select to anon, authenticated using (true);
drop policy if exists "admins update organizer settings" on public.organizer_settings;
create policy "admins update organizer settings" on public.organizer_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins read bank settings" on public.bank_settings;
create policy "admins read bank settings" on public.bank_settings for select to authenticated using (public.is_admin());
drop policy if exists "admins update bank settings" on public.bank_settings;
create policy "admins update bank settings" on public.bank_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins read bookings" on public.bookings;
create policy "admins read bookings" on public.bookings for select to authenticated using (public.is_admin());
drop policy if exists "admins update bookings" on public.bookings;
create policy "admins update bookings" on public.bookings for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins delete bookings" on public.bookings;
create policy "admins delete bookings" on public.bookings for delete to authenticated using (public.is_admin());

drop policy if exists "admins read agreements" on public.booking_agreements;
create policy "admins read agreements" on public.booking_agreements for select to authenticated using (public.is_admin());

drop policy if exists "admins read payments" on public.booking_payments;
create policy "admins read payments" on public.booking_payments for select to authenticated using (public.is_admin());
drop policy if exists "admins record payments" on public.booking_payments;
create policy "admins record payments" on public.booking_payments for insert to authenticated with check (public.is_admin() and status = 'verified');
drop policy if exists "admins update payments" on public.booking_payments;
create policy "admins update payments" on public.booking_payments for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins read events" on public.booking_events;
create policy "admins read events" on public.booking_events for select to authenticated using (public.is_admin());
drop policy if exists "admins add events" on public.booking_events;
create policy "admins add events" on public.booking_events for insert to authenticated with check (public.is_admin());

-- Private bucket for proofs of payment (never public). Uploaded by the server;
-- admins can view them through short-lived signed links.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', false, 4194304, array['application/pdf','image/jpeg','image/png','image/webp','image/heic'])
on conflict (id) do nothing;
drop policy if exists "admins read payment proofs" on storage.objects;
create policy "admins read payment proofs" on storage.objects for select to authenticated
  using (bucket_id = 'payment-proofs' and public.is_admin());
