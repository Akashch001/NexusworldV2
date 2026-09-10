-- ==============================================================================
-- NEXUS WORLD — MIGRATION 07: UPSERT LEAD ON BOOKING
-- ==============================================================================

create or replace function public.book_visitor_appointment(
  p_visitor_token text,
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
  v_user_id uuid;
begin
  -- Validate the conversation belongs to this visitor
  select c.user_id into v_user_id
  from public.conversations c
  where c.id = p_conversation_id
    and c.visitor_id = p_visitor_token;

  if not found then
    raise exception 'Unauthorized: Conversation not found for this visitor.';
  end if;

  -- Try to find existing lead
  select l.id into v_actual_lead_id
  from public.leads l
  where l.conversation_id = p_conversation_id
  order by l.created_at desc
  limit 1;

  if v_actual_lead_id is null then
    -- No lead exists yet, so create one from the booking details
    insert into public.leads (
      visitor_id,
      user_id,
      conversation_id,
      name,
      email,
      phone,
      lead_status,
      lead_temperature,
      source
    ) values (
      p_visitor_token,
      v_user_id,
      p_conversation_id,
      nullif(trim(p_name), ''),
      coalesce(nullif(trim(p_email), ''), 'pending_capture@nexusworld.internal'),
      nullif(trim(p_phone), ''),
      'meeting_booked',
      'hot',
      'nora_chat'
    ) returning id into v_actual_lead_id;
  else
    -- Lead exists, UPDATE it with the latest booking info
    update public.leads
    set 
      name = coalesce(nullif(trim(p_name), ''), name),
      email = coalesce(nullif(trim(p_email), ''), email),
      phone = coalesce(nullif(trim(p_phone), ''), phone),
      lead_status = 'meeting_booked',
      lead_temperature = 'hot',
      updated_at = timezone('utc'::text, now())
    where id = v_actual_lead_id;
  end if;

  -- Insert appointment
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
    v_actual_lead_id,
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

  -- Create a lead event
  insert into public.lead_events (
    lead_id,
    conversation_id,
    event_type,
    metadata
  ) values (
    v_actual_lead_id,
    p_conversation_id,
    'appointment_booked',
    jsonb_build_object(
      'appointment_id', v_appointment_id,
      'scheduled_start', p_scheduled_start
    )
  );

  return jsonb_build_object('success', true, 'appointment_id', v_appointment_id, 'lead_id', v_actual_lead_id);
end;
$$ language plpgsql security definer;
