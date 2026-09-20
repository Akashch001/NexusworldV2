-- ==============================================================================
-- NEXUS WORLD — MIGRATION 08: REALTIME AVAILABILITY & APPOINTMENT MODERNIZATION
-- ==============================================================================

-- 1. EXTEND CONVERSATIONS STATE MACHINE & METADATA
-- Allow all modern states:
-- ai, human_requested, availability_checking, representative_available,
-- waiting, retrying_availability, next_slot_search, human_notified,
-- appointment_pending, appointment_confirmed, no_representative_available,
-- follow_up_requested, human, closed

alter table public.conversations 
  drop constraint if exists conversations_status_check;

alter table public.conversations 
  add constraint conversations_status_check 
  check (status in (
    'ai',
    'human_requested',
    'availability_checking',
    'representative_available',
    'waiting',
    'retrying_availability',
    'next_slot_search',
    'human_notified',
    'appointment_pending',
    'appointment_confirmed',
    'no_representative_available',
    'follow_up_requested',
    'human',
    'closed'
  ));

alter table public.conversations 
  add column if not exists representative_role text default 'sales_discovery',
  add column if not exists retry_count integer default 0,
  add column if not exists next_retry_at timestamp with time zone,
  add column if not exists handoff_reason text,
  add column if not exists user_timezone text default 'UTC';

create index if not exists idx_conversations_next_retry_at on public.conversations(next_retry_at) where status = 'retrying_availability';

-- 2. EXTEND AVAILABILITY SETTINGS FOR REPRESENTATIVE ROLES
alter table public.availability_settings 
  add column if not exists representative_role text default 'sales_discovery',
  add column if not exists representative_name text default 'Nexus Specialist',
  add column if not exists is_escalation_only boolean default false,
  add column if not exists direct_booking boolean default true;

-- Ensure default availability entries exist for key disciplines:
-- Sales Discovery, Technical Consultation, Design & Visual Systems, AI Engineering, Founder Escalation
insert into public.availability_settings (
  representative_role,
  representative_name,
  available_days,
  start_time,
  end_time,
  meeting_duration_minutes,
  buffer_time_minutes,
  timezone,
  disabled_dates,
  is_active,
  is_escalation_only,
  direct_booking
)
select 
  'sales_discovery',
  'Nexus Strategy & Sales',
  '[1,2,3,4,5]'::jsonb,
  '09:00',
  '18:00',
  30,
  15,
  'America/New_York',
  '[]'::jsonb,
  true,
  false,
  true
where not exists (
  select 1 from public.availability_settings where representative_role = 'sales_discovery'
);

insert into public.availability_settings (
  representative_role,
  representative_name,
  available_days,
  start_time,
  end_time,
  meeting_duration_minutes,
  buffer_time_minutes,
  timezone,
  disabled_dates,
  is_active,
  is_escalation_only,
  direct_booking
)
select 
  'technical_consultation',
  'Nexus Engineering Lead',
  '[1,2,3,4,5]'::jsonb,
  '10:00',
  '18:00',
  30,
  15,
  'America/New_York',
  '[]'::jsonb,
  true,
  false,
  true
where not exists (
  select 1 from public.availability_settings where representative_role = 'technical_consultation'
);

insert into public.availability_settings (
  representative_role,
  representative_name,
  available_days,
  start_time,
  end_time,
  meeting_duration_minutes,
  buffer_time_minutes,
  timezone,
  disabled_dates,
  is_active,
  is_escalation_only,
  direct_booking
)
select 
  'founder_escalation',
  'Andy Watson',
  '[2,3,4]'::jsonb, -- Tuesday, Wednesday, Thursday only
  '14:00',
  '17:00',
  30,
  30,
  'America/New_York',
  '[]'::jsonb,
  true,
  true, -- Escalation only!
  false -- Not direct booking
where not exists (
  select 1 from public.availability_settings where representative_role = 'founder_escalation'
);

-- 3. EXTEND APPOINTMENTS TABLE
alter table public.appointments 
  add column if not exists representative_role text default 'sales_discovery',
  add column if not exists representative_name text default 'Nexus Specialist',
  add column if not exists user_timezone text default 'UTC';

-- 4. SERVER-AUTHORITATIVE FUNCTION: GET AVAILABLE SLOTS
-- Calculates dynamic candidate slots respecting working hours, existing appointments, buffer times, and minimum notice.
create or replace function public.get_available_slots(
  p_role text default 'sales_discovery',
  p_timezone text default 'America/New_York',
  p_days_ahead integer default 7,
  p_duration_minutes integer default 30
)
returns table (
  slot_id text,
  start_utc timestamp with time zone,
  end_utc timestamp with time zone,
  representative_role text,
  representative_name text,
  is_available boolean
) as $$
declare
  v_setting record;
  v_current_day date;
  v_day_of_week integer;
  v_start_time time;
  v_end_time time;
  v_slot_start timestamp with time zone;
  v_slot_end timestamp with time zone;
  v_now timestamp with time zone := timezone('utc'::text, now());
  v_min_notice interval := interval '30 minutes';
  v_step_interval interval;
  v_day_offset integer;
begin
  -- Fetch availability settings for this role
  select * into v_setting
  from public.availability_settings
  where public.availability_settings.representative_role = p_role
    and is_active = true
  limit 1;

  -- Fallback to any active setting if role not found
  if v_setting is null then
    select * into v_setting
    from public.availability_settings
    where is_active = true
    limit 1;
  end if;

  if v_setting is null then
    return;
  end if;

  v_start_time := v_setting.start_time::time;
  v_end_time := v_setting.end_time::time;
  v_step_interval := ((coalesce(p_duration_minutes, v_setting.meeting_duration_minutes) + v_setting.buffer_time_minutes) || ' minutes')::interval;

  -- Loop through next p_days_ahead days in the representative's timezone
  for v_day_offset in 0..(p_days_ahead - 1) loop
    v_current_day := (v_now at time zone v_setting.timezone)::date + v_day_offset;
    -- In PostgreSQL, 1 is Monday ... 7 is Sunday.
    v_day_of_week := extract(isodow from v_current_day);

    -- Check if day is enabled in settings
    if v_setting.available_days @> to_jsonb(v_day_of_week) and 
       not (v_setting.disabled_dates @> to_jsonb(to_char(v_current_day, 'YYYY-MM-DD'))) then
      
      -- Start iterating slots from start_time
      v_slot_start := (v_current_day || ' ' || v_start_time)::timestamp at time zone v_setting.timezone;

      while (v_slot_start + (p_duration_minutes || ' minutes')::interval) <= ((v_current_day || ' ' || v_end_time)::timestamp at time zone v_setting.timezone) loop
        v_slot_end := v_slot_start + (p_duration_minutes || ' minutes')::interval;

        -- Enforce minimum booking notice from current moment
        if v_slot_start >= (v_now + v_min_notice) then
          -- Check conflict with existing pending or confirmed appointments
          if not exists (
            select 1 from public.appointments a
            where a.status in ('pending', 'confirmed')
              and tstzrange(a.scheduled_start, a.scheduled_end) && tstzrange(v_slot_start, v_slot_end)
          ) then
            slot_id := 'slot_' || to_char(v_slot_start at time zone 'UTC', 'YYYYMMDD_HH24MI');
            start_utc := v_slot_start;
            end_utc := v_slot_end;
            representative_role := v_setting.representative_role;
            representative_name := v_setting.representative_name;
            is_available := true;
            return next;
          end if;
        end if;

        v_slot_start := v_slot_start + v_step_interval;
      end loop;

    end if;
  end loop;

  return;
end;
$$ language plpgsql security definer;

-- 5. UPDATE ATOMIC BOOKING FUNCTION: BOOK_VISITOR_APPOINTMENT
create or replace function public.book_visitor_appointment(
  p_visitor_token text,
  p_conversation_id uuid,
  p_name text,
  p_email text,
  p_phone text,
  p_meeting_type text,
  p_scheduled_start timestamp with time zone,
  p_scheduled_end timestamp with time zone,
  p_timezone text,
  p_representative_role text default 'sales_discovery'
)
returns jsonb as $$
declare
  v_appointment_id uuid;
  v_actual_lead_id uuid;
  v_user_id uuid;
  v_rep_name text;
begin
  -- 1. Validate the conversation belongs to this visitor
  select c.user_id into v_user_id
  from public.conversations c
  where c.id = p_conversation_id
    and c.visitor_id = p_visitor_token;

  if not found then
    raise exception 'Unauthorized: Conversation not found for this visitor.';
  end if;

  -- 2. Validate timing sanity
  if p_scheduled_end <= p_scheduled_start then
    raise exception 'Invalid appointment window: end time must be after start time.';
  end if;

  if p_scheduled_start < (timezone('utc'::text, now()) + interval '5 minutes') then
    raise exception 'Cannot book appointments in the past or without minimum notice.';
  end if;

  -- 3. Atomic conflict check (in addition to PostgreSQL exclusion constraint)
  if exists (
    select 1 from public.appointments a
    where a.status in ('pending', 'confirmed')
      and tstzrange(a.scheduled_start, a.scheduled_end) && tstzrange(p_scheduled_start, p_scheduled_end)
  ) then
    return jsonb_build_object(
      'success', false,
      'error', 'SLOT_ALREADY_TAKEN',
      'message', 'That appointment time was just reserved. Let me find the next available option for you.'
    );
  end if;

  -- 4. Lookup representative name
  select representative_name into v_rep_name
  from public.availability_settings
  where availability_settings.representative_role = p_representative_role
  limit 1;

  if v_rep_name is null then
    v_rep_name := 'Nexus Specialist';
  end if;

  -- 5. Upsert Lead
  select l.id into v_actual_lead_id
  from public.leads l
  where l.conversation_id = p_conversation_id
  order by l.created_at desc
  limit 1;

  if v_actual_lead_id is null then
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
      coalesce(nullif(trim(p_name), ''), 'Prospective Client'),
      coalesce(nullif(trim(p_email), ''), 'pending_capture@nexusworld.internal'),
      nullif(trim(p_phone), ''),
      'meeting_booked',
      'hot',
      'nora_chat'
    ) returning id into v_actual_lead_id;
  else
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

  -- 6. Insert Appointment atomically
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
    representative_role,
    representative_name,
    user_timezone,
    status
  ) values (
    v_actual_lead_id,
    p_conversation_id,
    coalesce(nullif(trim(p_name), ''), 'Prospective Client'),
    coalesce(nullif(trim(p_email), ''), 'pending_capture@nexusworld.internal'),
    p_phone,
    p_meeting_type,
    p_scheduled_start,
    p_scheduled_end,
    p_timezone,
    p_representative_role,
    v_rep_name,
    p_timezone,
    'confirmed'
  ) returning id into v_appointment_id;

  -- 7. Update conversation state machine to appointment_confirmed
  update public.conversations
  set status = 'appointment_confirmed',
      representative_role = p_representative_role,
      user_timezone = p_timezone,
      updated_at = timezone('utc'::text, now())
  where id = p_conversation_id;

  -- 8. Record audit event (ONLY after successful commit)
  insert into public.lead_events (
    lead_id,
    conversation_id,
    event_type,
    metadata
  ) values (
    v_actual_lead_id,
    p_conversation_id,
    'appointment_confirmed',
    jsonb_build_object(
      'appointment_id', v_appointment_id,
      'scheduled_start', p_scheduled_start,
      'scheduled_end', p_scheduled_end,
      'timezone', p_timezone,
      'representative_role', p_representative_role,
      'representative_name', v_rep_name
    )
  );

  return jsonb_build_object(
    'success', true,
    'appointment_id', v_appointment_id,
    'lead_id', v_actual_lead_id,
    'representative_name', v_rep_name,
    'status', 'appointment_confirmed'
  );
exception
  when exclusion_violation then
    return jsonb_build_object(
      'success', false,
      'error', 'SLOT_ALREADY_TAKEN',
      'message', 'That slot was just booked by another user. Please choose another time.'
    );
end;
$$ language plpgsql security definer;
