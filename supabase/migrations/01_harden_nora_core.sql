-- ==============================================================================
-- NEXUS WORLD — MIGRATION 01: HARDEN NORA CORE & MEMORY ARCHITECTURE
-- ==============================================================================

-- 1. UPDATED_AT TRIGGER
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
create trigger set_conversations_updated_at before update on public.conversations for each row execute procedure public.set_updated_at();
create trigger set_projects_updated_at before update on public.projects for each row execute procedure public.set_updated_at();

-- 2. HARDEN PROFILES ROLE
create or replace function public.protect_profile_role()
returns trigger as $$
begin
  -- Prevent non-service_role from changing the role
  if current_setting('request.jwt.claims', true)::jsonb->>'role' != 'service_role' then
    new.role = old.role;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger protect_profile_role_trigger
  before update on public.profiles
  for each row execute procedure public.protect_profile_role();


-- 3. CONVERSATIONS UPDATE (Project-Aware)
alter table public.conversations add column if not exists project_id uuid references public.projects(id) on delete cascade;

create or replace function public.check_resource_project_ownership()
returns trigger as $$
begin
  if new.project_id is not null then
    if not exists (select 1 from public.projects where id = new.project_id and user_id = new.user_id) then
      raise exception 'Project does not belong to user';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger check_conversations_project_trigger
  before insert or update on public.conversations
  for each row execute procedure public.check_resource_project_ownership();


-- 4. MEMORIES TABLE
create table if not exists public.memories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade,
  memory_type text not null,
  content text not null,
  importance numeric(3,2) default 0.5,
  source text default 'system',
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create trigger set_memories_updated_at before update on public.memories for each row execute procedure public.set_updated_at();
create trigger check_memories_project_trigger before insert or update on public.memories for each row execute procedure public.check_resource_project_ownership();

alter table public.memories enable row level security;
create policy "Users can manage own memories" on public.memories for all using (auth.uid() = user_id);


-- 5. INDEXES
create index if not exists idx_conversations_user_id on public.conversations(user_id);
create index if not exists idx_conversations_project_id on public.conversations(project_id);
create index if not exists idx_messages_conversation_id on public.messages(conversation_id);
create index if not exists idx_messages_conversation_id_created_at on public.messages(conversation_id, created_at);
create index if not exists idx_projects_user_id on public.projects(user_id);
create index if not exists idx_project_context_project_id on public.project_context(project_id);
create index if not exists idx_memories_user_id on public.memories(user_id);
create index if not exists idx_memories_project_id on public.memories(project_id);
create index if not exists idx_memories_user_id_project_id on public.memories(user_id, project_id);
