-- ==============================================================================
-- NEXUS WORLD — MIGRATION 06: APPOINTMENT RPC FIX
-- ==============================================================================

-- Drop the old one if the signature changes (which it does, we remove p_lead_id)
drop function if exists public.book_visitor_appointment;

-- Book Visitor Appointment RPC
-- Safely allows an anonymous visitor (using their visitor_token) to book an appointment
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
begin
  -- Validate the conversation belongs to this visitor and find the lead
  select l.id into v_actual_lead_id
  from public.leads l
  join public.conversations c on l.conversation_id = c.id
  where c.id = p_conversation_id
    and c.visitor_id = p_visitor_token
  order by l.created_at desc
  limit 1;

  if v_actual_lead_id is null then
    raise exception 'Unauthorized or Lead not found for this visitor.';
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

  -- Update lead status
  update public.leads
  set lead_status = 'meeting_booked',
      updated_at = timezone('utc'::text, now())
  where id = v_actual_lead_id;

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

  return jsonb_build_object('success', true, 'appointment_id', v_appointment_id);
end;
$$ language plpgsql security definer;
