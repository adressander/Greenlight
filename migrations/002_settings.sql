-- Run this in the Supabase SQL editor. Safe to run once on an existing
-- database that was set up with the original schema.sql.

alter table profiles
  add column if not exists business_name text,
  add column if not exists business_address text,
  add column if not exists business_phone text,
  add column if not exists alert_thresholds text,
  add column if not exists daily_alert_threshold int,
  add column if not exists stripe_customer_id text,
  add column if not exists subscription_status text;

create table if not exists alert_phones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  phone text not null,
  label text,
  created_at timestamptz default now()
);

alter table alert_phones enable row level security;

drop policy if exists "own alert phones" on alert_phones;
create policy "own alert phones" on alert_phones
  for all using (auth.uid() = user_id);

-- Carry over any existing opted-in phone number into the new table.
insert into alert_phones (user_id, phone)
select id, phone from profiles
where phone is not null and sms_opt_in = true
on conflict do nothing;

alter table profiles
  drop column if exists phone,
  drop column if exists sms_opt_in;
