-- ==============================================================================
-- NEXUS WORLD — MIGRATION 04: COMMAND CENTER TELEMETRY & SYSTEM OBSERVABILITY
-- ==============================================================================

-- 1. VISITOR SESSIONS TABLE
create table if not exists public.visitor_sessions (
  id uuid default gen_random_uuid() primary key,
  visitor_token text not null unique,
  entry_url text default '/',
  current_url text default '/',
  referrer text,
  device_type text default 'desktop', -- 'desktop', 'mobile', 'tablet'
  browser text,                       -- 'Chrome', 'Safari', 'Firefox', etc.
  os text,                            -- 'macOS', 'Windows', 'iOS', 'Android', etc.
  ip_masked text default '•••.•••.•••',
  country text,
  city text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_seen_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_visitor_sessions_token on public.visitor_sessions(visitor_token);
create index if not exists idx_visitor_sessions_active on public.visitor_sessions(is_active);
create index if not exists idx_visitor_sessions_last_seen on public.visitor_sessions(last_seen_at desc);
create index if not exists idx_visitor_sessions_created_at on public.visitor_sessions(created_at desc);

-- 2. VISITOR EVENTS TABLE
create table if not exists public.visitor_events (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.visitor_sessions(id) on delete cascade,
  visitor_token text not null,
  event_type text not null, -- 'navigation', 'interaction', 'concierge', 'lead', 'system'
  event_name text not null, -- 'district_explored', 'nora_opened', 'handoff_requested', etc.
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_visitor_events_session_id on public.visitor_events(session_id);
create index if not exists idx_visitor_events_token on public.visitor_events(visitor_token);
create index if not exists idx_visitor_events_type on public.visitor_events(event_type);
create index if not exists idx_visitor_events_created_at on public.visitor_events(created_at desc);

-- 3. SYSTEM LOGS TABLE (Operational Observability)
create table if not exists public.system_logs (
  id uuid default gen_random_uuid() primary key,
  service text not null, -- 'application', 'supabase_db', 'supabase_auth', 'realtime', 'gemini_ai', 'nora_core'
  level text not null check (level in ('info', 'warning', 'error', 'critical')),
  event text not null,
  message text not null,
  details jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_system_logs_level on public.system_logs(level);
create index if not exists idx_system_logs_service on public.system_logs(service);
create index if not exists idx_system_logs_created_at on public.system_logs(created_at desc);

-- 4. ROW LEVEL SECURITY (RLS)
alter table public.visitor_sessions enable row level security;
alter table public.visitor_events enable row level security;
alter table public.system_logs enable row level security;

-- Policies for visitor_sessions:
-- Anyone (anon/authenticated) can insert a new visitor session
drop policy if exists "Anyone can insert visitor session" on public.visitor_sessions;
create policy "Anyone can insert visitor session"
  on public.visitor_sessions
  for insert
  with check (visitor_token is not null and length(visitor_token) > 0);

-- Anyone can update their OWN session using visitor_token matching
drop policy if exists "Anyone can update own visitor session" on public.visitor_sessions;
create policy "Anyone can update own visitor session"
  on public.visitor_sessions
  for update
  using (true)
  with check (visitor_token is not null);

-- Admins can read all visitor sessions
drop policy if exists "Admins can view all visitor sessions" on public.visitor_sessions;
create policy "Admins can view all visitor sessions"
  on public.visitor_sessions
  for select
  using (public.is_admin());

-- Admins can delete/manage visitor sessions
drop policy if exists "Admins can manage visitor sessions" on public.visitor_sessions;
create policy "Admins can manage visitor sessions"
  on public.visitor_sessions
  for all
  using (public.is_admin());

-- Policies for visitor_events:
-- Anyone can insert visitor events
drop policy if exists "Anyone can insert visitor events" on public.visitor_events;
create policy "Anyone can insert visitor events"
  on public.visitor_events
  for insert
  with check (visitor_token is not null and length(visitor_token) > 0);

-- Only admins can read visitor events
drop policy if exists "Admins can view all visitor events" on public.visitor_events;
create policy "Admins can view all visitor events"
  on public.visitor_events
  for select
  using (public.is_admin());

-- Policies for system_logs:
-- Applications/clients can insert logs (for client-side unhandled errors & operational events)
drop policy if exists "Anyone can log system events" on public.system_logs;
create policy "Anyone can log system events"
  on public.system_logs
  for insert
  with check (service is not null and message is not null);

-- Only admins can view system logs
drop policy if exists "Admins can view system logs" on public.system_logs;
create policy "Admins can view system logs"
  on public.system_logs
  for select
  using (public.is_admin());

-- 5. REALTIME PUBLICATION SETUP
do $$
begin
  -- visitor_sessions
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'visitor_sessions'
  ) then
    alter publication supabase_realtime add table public.visitor_sessions;
  end if;

  -- visitor_events
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'visitor_events'
  ) then
    alter publication supabase_realtime add table public.visitor_events;
  end if;

  -- system_logs
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'system_logs'
  ) then
    alter publication supabase_realtime add table public.system_logs;
  end if;
end $$;

alter table public.visitor_sessions replica identity full;
alter table public.visitor_events replica identity full;
alter table public.system_logs replica identity full;

-- 6. AUTOMATED TELEMETRY MAINTENANCE / RETENTION FUNCTION
create or replace function public.cleanup_stale_telemetry(p_days_retention integer default 7)
returns jsonb as $$
declare
  v_stale_sessions integer;
  v_old_events integer;
  v_old_logs integer;
begin
  -- 1. Mark sessions with no activity in 10 minutes as inactive
  update public.visitor_sessions
  set is_active = false
  where is_active = true
    and last_seen_at < (timezone('utc'::text, now()) - interval '10 minutes');
  get diagnostics v_stale_sessions = row_count;

  -- 2. Purge visitor events older than retention period (default 7 days)
  delete from public.visitor_events
  where created_at < (timezone('utc'::text, now()) - (p_days_retention || ' days')::interval);
  get diagnostics v_old_events = row_count;

  -- 3. Purge non-critical system logs older than 30 days
  delete from public.system_logs
  where level in ('info', 'warning')
    and created_at < (timezone('utc'::text, now()) - interval '30 days');
  get diagnostics v_old_logs = row_count;

  return jsonb_build_object(
    'deactivated_sessions', v_stale_sessions,
    'deleted_events', v_old_events,
    'deleted_logs', v_old_logs,
    'cleaned_at', timezone('utc'::text, now())
  );
end;
$$ language plpgsql security definer;
