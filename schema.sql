-- Run this in the Supabase SQL editor for your project.

create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  business_name text,
  business_address text,
  business_phone text,
  -- Reminder schedule overrides. Null means "use the app defaults"
  -- (90/60/30/15 day one-time alerts, daily reminders from 5 days out).
  alert_thresholds text,
  daily_alert_threshold int,
  -- Billing (Stripe).
  stripe_customer_id text,
  subscription_status text,
  created_at timestamptz default now()
);

create table if not exists alert_phones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  phone text not null,
  label text,
  created_at timestamptz default now()
);

create table if not exists trucks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  nickname text not null,
  mc_number text,
  created_at timestamptz default now()
);

create table if not exists deadlines (
  id uuid primary key default gen_random_uuid(),
  truck_id uuid references trucks on delete cascade not null,
  kind text not null check (kind in ('UCR','IFTA','IRP','INSURANCE','MEDICAL')),
  due_date date not null,
  -- comma-separated thresholds (30,14,7,1) that have already triggered an alert
  -- for the CURRENT due_date, so renewing resets it automatically.
  alerted_thresholds text default '',
  created_at timestamptz default now()
);

-- Row Level Security: users only ever see their own data.
alter table profiles enable row level security;
alter table alert_phones enable row level security;
alter table trucks enable row level security;
alter table deadlines enable row level security;

create policy "own profile" on profiles
  for all using (auth.uid() = id);

create policy "own alert phones" on alert_phones
  for all using (auth.uid() = user_id);

create policy "own trucks" on trucks
  for all using (auth.uid() = user_id);

create policy "own deadlines" on deadlines
  for all using (
    truck_id in (select id from trucks where user_id = auth.uid())
  );
