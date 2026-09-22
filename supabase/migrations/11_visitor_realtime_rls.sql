-- ==============================================================================
-- NEXUS WORLD — MIGRATION 11: VISITOR REALTIME CHAT RLS POLICIES
-- ==============================================================================

-- 1. MESSAGES TABLE POLICIES
-- Enable SELECT for all clients so Supabase Realtime CDC can deliver messages to anonymous visitors
drop policy if exists "Anyone can read messages" on public.messages;
create policy "Anyone can read messages"
  on public.messages
  for select
  using (true);

-- Enable INSERT for all clients so visitors, agents, and system events can insert messages
drop policy if exists "Visitors and users can insert messages" on public.messages;
drop policy if exists "Anyone can insert messages" on public.messages;
create policy "Anyone can insert messages"
  on public.messages
  for insert
  with check (true);

-- 2. CONVERSATIONS TABLE POLICIES
-- Enable SELECT for all clients so Supabase Realtime CDC can deliver conversation updates
drop policy if exists "Anyone can read conversations" on public.conversations;
create policy "Anyone can read conversations"
  on public.conversations
  for select
  using (true);

-- Enable INSERT for conversation creation
drop policy if exists "Visitors can create conversations" on public.conversations;
drop policy if exists "Anyone can insert conversations" on public.conversations;
create policy "Anyone can insert conversations"
  on public.conversations
  for insert
  with check (true);
