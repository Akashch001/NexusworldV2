-- ==============================================================================
-- NEXUS WORLD — MIGRATION 02: LEAD INTELLIGENCE & APPOINTMENT SYSTEM
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists btree_gist;

-- 2. ENHANCE CONVERSATIONS & MESSAGES FOR VISITOR SESSIONS
-- Allow anonymous visitors to have session-based conversations without breaking existing FK or RLS
alter table public.conversations alter column user_id drop not null;
alter table public.conversations add column if not exists visitor_id text;

alter table public.messages alter column user_id drop not null;
alter table public.messages add column if not exists visitor_id text;

create index if not exists idx_conversations_visitor_id on public.conversations(visitor_id);
create index if not exists idx_messages_visitor_id on public.messages(visitor_id);

-- 3. ADMIN HELPER FUNCTION
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role in ('admin', 'owner')
  );
end;
$$ language plpgsql security definer;

-- 4. LEADS TABLE
create table if not exists public.leads (
  id uuid default gen_random_uuid() primary key,
  visitor_id text,
  user_id uuid references public.profiles(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  company_name text,
  website text,
  location text,
  service_interest text,
  project_description text,
  pain_points text,
  budget_range text,
  timeline text,
  lead_score integer default 0 check (lead_score >= 0 and lead_score <= 100),
  lead_temperature text default 'cold' check (lead_temperature in ('cold', 'warm', 'hot')),
  lead_status text default 'new' check (lead_status in ('new', 'contacted', 'qualified', 'meeting_booked', 'proposal', 'won', 'lost', 'archived')),
  source text default 'nora_chat',
  consent_to_contact boolean default false,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_leads_email on public.leads(email);
create index if not exists idx_leads_visitor_id on public.leads(visitor_id);
create index if not exists idx_leads_conversation_id on public.leads(conversation_id);
create index if not exists idx_leads_status on public.leads(lead_status);
create index if not exists idx_leads_temperature on public.leads(lead_temperature);
create index if not exists idx_leads_created_at on public.leads(created_at desc);

create trigger set_leads_updated_at
  before update on public.leads
  for each row execute procedure public.set_updated_at();

-- 5. APPOINTMENTS TABLE WITH DOUBLE-BOOKING EXCLUSION CONSTRAINT
create table if not exists public.appointments (
  id uuid default gen_random_uuid() primary key,
  lead_id uuid references public.leads(id) on delete cascade not null,
  conversation_id uuid references public.conversations(id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  meeting_type text default 'Discovery Call' not null,
  scheduled_start timestamp with time zone not null,
  scheduled_end timestamp with time zone not null,
  timezone text default 'UTC' not null,
  status text default 'confirmed' check (status in ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  meeting_link text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  check (scheduled_end > scheduled_start)
);

-- PostgreSQL Exclusion Constraint to atomically prevent overlapping active appointments
alter table public.appointments
  drop constraint if exists no_overlapping_active_appointments;

alter table public.appointments
  add constraint no_overlapping_active_appointments
  exclude using gist (
    tstzrange(scheduled_start, scheduled_end) with &&
  )
  where (status in ('pending', 'confirmed'));

create index if not exists idx_appointments_lead_id on public.appointments(lead_id);
create index if not exists idx_appointments_scheduled_start on public.appointments(scheduled_start);
create index if not exists idx_appointments_status on public.appointments(status);

create trigger set_appointments_updated_at
  before update on public.appointments
  for each row execute procedure public.set_updated_at();

-- 6. AVAILABILITY SETTINGS TABLE
create table if not exists public.availability_settings (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references public.profiles(id) on delete cascade,
  available_days jsonb default '[1,2,3,4,5]'::jsonb, -- 1=Monday ... 5=Friday
  start_time text default '09:00' not null,
  end_time text default '17:00' not null,
  meeting_duration_minutes integer default 30 not null,
  buffer_time_minutes integer default 15 not null,
  timezone text default 'America/New_York' not null,
  disabled_dates jsonb default '[]'::jsonb, -- ['2026-12-25', ...]
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create trigger set_availability_settings_updated_at
  before update on public.availability_settings
  for each row execute procedure public.set_updated_at();

-- Insert default active availability if table is empty
insert into public.availability_settings (
  available_days,
  start_time,
  end_time,
  meeting_duration_minutes,
  buffer_time_minutes,
  timezone,
  disabled_dates,
  is_active
)
select
  '[1,2,3,4,5]'::jsonb,
  '09:00',
  '17:00',
  30,
  15,
  'America/New_York',
  '[]'::jsonb,
  true
where not exists (select 1 from public.availability_settings);

-- 7. LEAD EVENTS TABLE (AUDIT TRAIL)
create table if not exists public.lead_events (
  id uuid default gen_random_uuid() primary key,
  lead_id uuid references public.leads(id) on delete cascade not null,
  conversation_id uuid references public.conversations(id) on delete set null,
  event_type text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_lead_events_lead_id on public.lead_events(lead_id);
create index if not exists idx_lead_events_event_type on public.lead_events(event_type);
create index if not exists idx_lead_events_created_at on public.lead_events(created_at desc);

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
alter table public.leads enable row level security;
alter table public.appointments enable row level security;
alter table public.availability_settings enable row level security;
alter table public.lead_events enable row level security;

-- Leads RLS:
-- Visitors cannot arbitrarily read or write leads directly.
-- Authenticated users can read their own lead if tied to user_id.
-- Admins/owners can select and update.
create policy "Admins can manage all leads"
  on public.leads
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Users can view own lead"
  on public.leads
  for select
  using (auth.uid() is not null and auth.uid() = user_id);

-- Appointments RLS:
-- Admins can manage all appointments.
-- Users can view their own appointments linked to their lead.
create policy "Admins can manage all appointments"
  on public.appointments
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Users can view own appointments"
  on public.appointments
  for select
  using (
    exists (
      select 1 from public.leads
      where leads.id = appointments.lead_id
      and leads.user_id = auth.uid()
    )
  );

-- Availability Settings RLS:
-- Active settings can be viewed by anyone (for slot calculation).
-- Only admins can manage settings.
create policy "Anyone can view active availability settings"
  on public.availability_settings
  for select
  using (is_active = true);

create policy "Admins can manage availability settings"
  on public.availability_settings
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Lead Events RLS:
-- Only admins can view audit events. No public write access.
create policy "Admins can view lead events"
  on public.lead_events
  for select
  using (public.is_admin());

-- Conversations & Messages Admin Visibility:
-- Ensure admins can view all conversations and messages for CRM transcript inspection
create policy "Admins can view all conversations"
  on public.conversations
  for select
  using (public.is_admin());

create policy "Admins can view all messages"
  on public.messages
  for select
  using (public.is_admin());
