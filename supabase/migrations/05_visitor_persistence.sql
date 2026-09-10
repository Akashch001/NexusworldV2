-- ==============================================================================
-- NEXUS WORLD — MIGRATION 05: VISITOR PERSISTENCE & DECOUPLED DATA
-- ==============================================================================

-- 1. Get Visitor Conversation RPC
-- Safely fetches the most recent conversation and its messages for a given visitor token,
-- bypassing RLS to avoid exposing all conversations to the public anon role.
create or replace function public.get_visitor_conversation(p_visitor_token text)
returns jsonb as $$
declare
  v_conv_id uuid;
  v_status text;
  v_messages jsonb;
begin
  -- Find the most recent conversation for this visitor
  select id, status into v_conv_id, v_status
  from public.conversations
  where visitor_id = p_visitor_token
  order by created_at desc
  limit 1;

  if v_conv_id is null then
    return null;
  end if;

  -- Fetch messages for this conversation
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', id,
      'role', role,
      'content', content,
      'created_at', created_at,
      'metadata', metadata
    ) order by created_at asc
  ), '[]'::jsonb)
  into v_messages
  from public.messages
  where conversation_id = v_conv_id;

  return jsonb_build_object(
    'conversation_id', v_conv_id,
    'status', v_status,
    'messages', v_messages
  );
end;
$$ language plpgsql security definer;

-- 2. Book Visitor Appointment RPC
-- Safely allows an anonymous visitor (using their visitor_token) to book an appointment
create or replace function public.book_visitor_appointment(
  p_visitor_token text,
  p_lead_id uuid,
  p_conversation_id uuid,
  p_name text,
  p_email text,
  p_phone text,
  p_meeting_type text,
  p_scheduled_start timestamp with time zone,
  p_scheduled_end timestamp with time zone,
  p_timezone text
)
returns jsonb as $$
declare
  v_appointment_id uuid;
  v_actual_lead_id uuid;
begin
  -- Validate the lead belongs to this visitor (to prevent hijacking other leads)
  select id into v_actual_lead_id
  from public.leads
  where id = p_lead_id
    and visitor_id = p_visitor_token;

  if v_actual_lead_id is null then
    -- It's possible the lead was created by edge function with a slightly different context
    -- Let's fallback to checking if the conversation_id matches the lead's conversation_id
    -- and that conversation belongs to the visitor.
    select l.id into v_actual_lead_id
    from public.leads l
    join public.conversations c on l.conversation_id = c.id
    where l.id = p_lead_id
      and c.visitor_id = p_visitor_token;

    if v_actual_lead_id is null then
       raise exception 'Unauthorized or Lead not found for this visitor.';
    end if;
  end if;

  insert into public.appointments (
    lead_id,
    conversation_id,
    name,
    email,
    phone,
    meeting_type,
    scheduled_start,
    scheduled_end,
    timezone,
    status
  ) values (
    p_lead_id,
    p_conversation_id,
    p_name,
    p_email,
    p_phone,
    p_meeting_type,
    p_scheduled_start,
    p_scheduled_end,
    p_timezone,
    'confirmed'
  ) returning id into v_appointment_id;

  -- Update lead status
  update public.leads
  set lead_status = 'meeting_booked',
      updated_at = timezone('utc'::text, now())
  where id = p_lead_id;

  -- Create a lead event
  insert into public.lead_events (
    lead_id,
    conversation_id,
    event_type,
    metadata
  ) values (
    p_lead_id,
    p_conversation_id,
    'appointment_booked',
    jsonb_build_object(
      'appointment_id', v_appointment_id,
      'scheduled_start', p_scheduled_start
    )
  );

  return jsonb_build_object('success', true, 'appointment_id', v_appointment_id);
end;
$$ language plpgsql security definer;
