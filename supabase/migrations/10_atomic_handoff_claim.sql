-- ==============================================================================
-- NEXUS WORLD — MIGRATION 10: ATOMIC HANDOFF CLAIM & LIFECYCLE MANAGEMENT
-- ==============================================================================

-- 1. EXTEND ADMIN HELPER TO COVER ALL AUTHORIZED AGENT ROLES
-- Ensures owner, super_admin, admin, and agent roles have administrative privileges
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role in ('owner', 'super_admin', 'admin', 'agent')
  );
end;
$$ language plpgsql security definer set search_path = public;

-- 2. ENSURE ADMINS CAN UPDATE CONVERSATIONS
drop policy if exists "Admins can update conversations" on public.conversations;
create policy "Admins can update conversations"
  on public.conversations
  for update
  using (public.is_admin())
  with check (public.is_admin());

-- 3. ATOMIC HANDOFF CLAIM FUNCTION
-- Transactionally claims a conversation for the authenticated agent
create or replace function public.claim_conversation(p_conversation_id uuid)
returns jsonb as $$
declare
  v_agent_id uuid;
  v_agent_profile record;
  v_conv record;
  v_result jsonb;
begin
  -- Step 1: Identify caller
  v_agent_id := auth.uid();
  if v_agent_id is null then
    raise exception 'Unauthorized: Authentication required to claim conversations'
      using errcode = '42501';
  end if;

  -- Step 2: Verify caller has an allowed agent role
  select id, email, full_name, display_name, role into v_agent_profile
  from public.profiles
  where id = v_agent_id;

  if v_agent_profile.id is null or v_agent_profile.role not in ('owner', 'super_admin', 'admin', 'agent') then
    raise exception 'Forbidden: Only authorized agents can claim conversations'
      using errcode = '42501';
  end if;

  -- Step 3: Fetch and lock conversation row for atomic update
  select id, status, assigned_to, visitor_id, human_accepted_at into v_conv
  from public.conversations
  where id = p_conversation_id
  for update;

  if v_conv.id is null then
    raise exception 'Conversation not found'
      using errcode = 'P0002';
  end if;

  -- Step 4: Check if conversation is closed
  if v_conv.status = 'closed' then
    raise exception 'Cannot claim a closed conversation'
      using errcode = '22000';
  end if;

  -- Step 5: Prevent race condition / double-claiming
  if v_conv.status = 'human' and v_conv.assigned_to is not null and v_conv.assigned_to <> v_agent_id then
    raise exception 'This conversation has already been claimed by another agent'
      using errcode = '23505';
  end if;

  -- Step 6: Atomically update conversation status to 'human'
  update public.conversations
  set
    status = 'human',
    assigned_to = v_agent_id,
    human_accepted_at = coalesce(human_accepted_at, now()),
    updated_at = now()
  where id = p_conversation_id;

  -- Step 7: Insert system notification message for visitor & agent chat
  insert into public.messages (
    conversation_id,
    user_id,
    visitor_id,
    role,
    content,
    metadata
  ) values (
    p_conversation_id,
    v_agent_id,
    v_conv.visitor_id,
    'system',
    'A member of the Nexus team has joined the conversation.',
    jsonb_build_object(
      'sender', 'system',
      'sender_name', 'Nexus Team',
      'event', 'human_joined',
      'agent_id', v_agent_id,
      'agent_name', coalesce(v_agent_profile.full_name, v_agent_profile.display_name, 'Nexus Team')
    )
  );

  -- Step 8: Log audit event to system_logs if table exists
  begin
    insert into public.system_logs (
      service,
      level,
      event,
      message,
      details
    ) values (
      'application',
      'info',
      'human_handoff_accepted',
      'Agent ' || coalesce(v_agent_profile.full_name, v_agent_profile.email, v_agent_id::text) || ' took handoff for conversation ' || p_conversation_id::text,
      jsonb_build_object(
        'conversation_id', p_conversation_id,
        'agent_id', v_agent_id,
        'visitor_id', v_conv.visitor_id
      )
    );
  exception when undefined_table then
    -- Table system_logs may not exist in some environments, ignore
  end;

  -- Step 9: Return updated conversation row as jsonb
  select to_jsonb(c.*) into v_result
  from public.conversations c
  where c.id = p_conversation_id;

  return jsonb_build_object(
    'success', true,
    'conversation', v_result
  );
end;
$$ language plpgsql security definer set search_path = public;

-- 4. ATOMIC END CONVERSATION FUNCTION
create or replace function public.end_conversation(p_conversation_id uuid)
returns jsonb as $$
declare
  v_agent_id uuid;
  v_agent_profile record;
  v_conv record;
  v_result jsonb;
begin
  -- Step 1: Identify caller
  v_agent_id := auth.uid();
  if v_agent_id is null then
    raise exception 'Unauthorized: Authentication required to end conversations'
      using errcode = '42501';
  end if;

  -- Step 2: Verify caller has an allowed agent role
  select id, email, full_name, display_name, role into v_agent_profile
  from public.profiles
  where id = v_agent_id;

  if v_agent_profile.id is null or v_agent_profile.role not in ('owner', 'super_admin', 'admin', 'agent') then
    raise exception 'Forbidden: Only authorized agents can end conversations'
      using errcode = '42501';
  end if;

  -- Step 3: Fetch and lock conversation row
  select id, status, assigned_to, visitor_id into v_conv
  from public.conversations
  where id = p_conversation_id
  for update;

  if v_conv.id is null then
    raise exception 'Conversation not found'
      using errcode = 'P0002';
  end if;

  -- Step 4: Atomically update conversation status to 'closed'
  update public.conversations
  set
    status = 'closed',
    updated_at = now()
  where id = p_conversation_id;

  -- Step 5: Insert system notification message
  insert into public.messages (
    conversation_id,
    user_id,
    visitor_id,
    role,
    content,
    metadata
  ) values (
    p_conversation_id,
    v_agent_id,
    v_conv.visitor_id,
    'system',
    'This conversation has been closed by the Nexus team. Thank you for connecting with us.',
    jsonb_build_object(
      'sender', 'system',
      'sender_name', 'Nexus Team',
      'event', 'conversation_closed',
      'closed_by', v_agent_id
    )
  );

  -- Step 6: Log audit event to system_logs if table exists
  begin
    insert into public.system_logs (
      service,
      level,
      event,
      message,
      details
    ) values (
      'application',
      'info',
      'conversation_closed',
      'Agent ' || coalesce(v_agent_profile.full_name, v_agent_profile.email, v_agent_id::text) || ' closed conversation ' || p_conversation_id::text,
      jsonb_build_object(
        'conversation_id', p_conversation_id,
        'agent_id', v_agent_id,
        'visitor_id', v_conv.visitor_id
      )
    );
  exception when undefined_table then
    null;
  end;

  -- Step 7: Return updated conversation
  select to_jsonb(c.*) into v_result
  from public.conversations c
  where c.id = p_conversation_id;

  return jsonb_build_object(
    'success', true,
    'conversation', v_result
  );
end;
$$ language plpgsql security definer set search_path = public;

-- Grant execution permissions to authenticated users
grant execute on function public.claim_conversation(uuid) to authenticated;
grant execute on function public.end_conversation(uuid) to authenticated;
