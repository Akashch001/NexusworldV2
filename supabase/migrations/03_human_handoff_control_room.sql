-- ==============================================================================
-- NEXUS WORLD — MIGRATION 03: HUMAN HANDOFF & CONTROL ROOM
-- ==============================================================================

-- 1. ENHANCE CONVERSATIONS WITH STATE MACHINE & HANDOFF TIMESTAMPS
alter table public.conversations 
  add column if not exists status text default 'ai' check (status in ('ai', 'human_requested', 'human', 'closed')),
  add column if not exists human_requested_at timestamp with time zone,
  add column if not exists human_accepted_at timestamp with time zone,
  add column if not exists assigned_to uuid references public.profiles(id) on delete set null;

create index if not exists idx_conversations_status on public.conversations(status);
create index if not exists idx_conversations_human_requested_at on public.conversations(human_requested_at);

-- 2. ENHANCE PROFILES WITH OWNER/ADMIN ONLINE PRESENCE
alter table public.profiles
  add column if not exists is_online boolean default false;

-- Policy: Anyone can view presence of admins/owners (so NORA & client can check if Andy is online)
drop policy if exists "Anyone can view admin online presence" on public.profiles;
create policy "Anyone can view admin online presence"
  on public.profiles
  for select
  using (role in ('admin', 'owner'));

-- Policy: Admins can update their own presence
drop policy if exists "Admins can update own presence" on public.profiles;
create policy "Admins can update own presence"
  on public.profiles
  for update
  using (auth.uid() = id and public.is_admin())
  with check (auth.uid() = id and public.is_admin());

-- 3. ENHANCE LEADS TABLE (Indexes & Constraints Check)
create index if not exists idx_leads_updated_at on public.leads(updated_at desc);

-- 4. REALTIME PUBLICATION SETUP
-- Safely add tables to supabase_realtime publication without failing if already added
do $$
begin
  -- conversations
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'conversations'
  ) then
    alter publication supabase_realtime add table public.conversations;
  end if;

  -- messages
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;

  -- leads
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'leads'
  ) then
    alter publication supabase_realtime add table public.leads;
  end if;

  -- profiles
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
end $$;

-- Enable REPLICA IDENTITY FULL on conversations & messages so Realtime provides full row context on changes
alter table public.conversations replica identity full;
alter table public.messages replica identity full;
alter table public.leads replica identity full;
alter table public.profiles replica identity full;
