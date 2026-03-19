-- ============================================================
-- B2B CRM — Supabase Schema
-- Run this entire file in your Supabase SQL Editor
-- ============================================================

-- Profiles table (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  role text default 'agent' check (role in ('agent', 'director', 'upline')),
  director_id uuid references public.profiles(id),
  contract_pct numeric default 75,
  override_pct numeric default 25,
  created_at timestamptz default now()
);

-- Leads table
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  name text default '',
  source text default 'Warm market',
  product text default 'IUL',
  status text default 'new' check (status in ('new','appt','app','closed','lost')),
  ap numeric default 0,
  referred_by text default '',
  next_action text default '',
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Recruits table
create table if not exists public.recruits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  name text default '',
  warm_market_size int default 0,
  status text default 'prospect' check (status in ('prospect','presented','licensed','active','inactive')),
  license_status text default 'Not started',
  training_method text default 'Both',
  next_step text default '',
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Team production entries (one row per agent per month)
create table if not exists public.production (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.profiles(id) on delete cascade,
  director_id uuid references public.profiles(id),
  month_year text, -- e.g. "2025-01"
  ap numeric default 0,
  policies int default 0,
  product text default 'IUL',
  notes text default '',
  created_at timestamptz default now()
);

-- Referral partners
create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  name text default '',
  partner_type text default 'CPA / Accountant',
  contact text default '',
  leads_sent int default 0,
  converted int default 0,
  last_contact date,
  notes text default '',
  created_at timestamptz default now()
);

-- Weekly goals / activity log
create table if not exists public.activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  week_start date,
  reach_outs int default 0,
  conversations int default 0,
  appts_set int default 0,
  appts_held int default 0,
  apps_submitted int default 0,
  field_trainings int default 0,
  referral_asks int default 0,
  partner_visits int default 0,
  recruiting_convos int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, week_start)
);

-- ── Row Level Security ───────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.recruits enable row level security;
alter table public.production enable row level security;
alter table public.partners enable row level security;
alter table public.activity enable row level security;

-- Profiles: users can read their own + their downline, upline reads all
create policy "profiles_select" on public.profiles for select using (
  auth.uid() = id
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('director','upline'))
);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);

-- Leads: own rows + directors see their agents' rows + upline sees all
create policy "leads_select" on public.leads for select using (
  user_id = auth.uid()
  or exists (
    select 1 from public.profiles me
    join public.profiles agent on agent.director_id = me.id
    where me.id = auth.uid() and agent.id = leads.user_id and me.role in ('director','upline')
  )
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'upline')
);
create policy "leads_insert" on public.leads for insert with check (user_id = auth.uid());
create policy "leads_update" on public.leads for update using (user_id = auth.uid());
create policy "leads_delete" on public.leads for delete using (user_id = auth.uid());

-- Recruits: same pattern
create policy "recruits_select" on public.recruits for select using (
  user_id = auth.uid()
  or exists (
    select 1 from public.profiles me
    join public.profiles agent on agent.director_id = me.id
    where me.id = auth.uid() and agent.id = recruits.user_id and me.role in ('director','upline')
  )
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'upline')
);
create policy "recruits_insert" on public.recruits for insert with check (user_id = auth.uid());
create policy "recruits_update" on public.recruits for update using (user_id = auth.uid());
create policy "recruits_delete" on public.recruits for delete using (user_id = auth.uid());

-- Production: agents insert own, directors/upline see team
create policy "production_select" on public.production for select using (
  agent_id = auth.uid()
  or director_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'upline')
);
create policy "production_insert" on public.production for insert with check (agent_id = auth.uid());
create policy "production_update" on public.production for update using (agent_id = auth.uid());
create policy "production_delete" on public.production for delete using (agent_id = auth.uid());

-- Partners: own only
create policy "partners_all" on public.partners for all using (user_id = auth.uid());

-- Activity: own + directors see team
create policy "activity_select" on public.activity for select using (
  user_id = auth.uid()
  or exists (
    select 1 from public.profiles me
    join public.profiles agent on agent.director_id = me.id
    where me.id = auth.uid() and agent.id = activity.user_id and me.role in ('director','upline')
  )
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'upline')
);
create policy "activity_insert" on public.activity for insert with check (user_id = auth.uid());
create policy "activity_update" on public.activity for update using (user_id = auth.uid());

-- ── Auto-create profile on signup ─────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'agent')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
