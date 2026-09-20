/**
 * Nexus World — Availability & Appointment Service
 * Authoritative availability calculation, dynamic candidate slot retrieval,
 * atomic reservation with double-booking prevention, and async retry scheduling.
 */

import { supabase } from './supabaseClient';
import { formatSlotForDisplay, detectUserTimezone } from './dateTimeService';
import type { AvailableTimeSlot, RepresentativeRole } from '../data/conciergeData';

export interface BookingResult {
  success: boolean;
  appointmentId?: string;
  leadId?: string;
  representativeName?: string;
  error?: string;
  message?: string;
}

export interface AvailabilityCheckResult {
  available: boolean;
  representativeRole: RepresentativeRole;
  representativeName: string;
  candidateSlots: AvailableTimeSlot[];
  reason?: string;
}

/**
 * Maps user intent to appropriate Nexus World representative role.
 * Andy Watson is reserved exclusively for Founder / Strategic Escalation.
 */
export function mapIntentToRepresentativeRole(
  intent?: string,
  userMessage?: string
): { role: RepresentativeRole; name: string; isAndy: boolean } {
  const text = `${intent || ''} ${userMessage || ''}`.toLowerCase();


  // Founder / Strategic Escalation check
  const isExplicitAndyRequest =
    text.includes('talk to andy') ||
    text.includes('speak with andy') ||
    text.includes('andy watson') ||
    text.includes('founder') ||
    text.includes('co-founder') ||
    text.includes('strategic partnership') ||
    text.includes('board level');

  if (isExplicitAndyRequest) {
    return {
      role: 'founder_escalation',
      name: 'Andy Watson',
      isAndy: true,
    };
  }

  // Technical & Engineering
  if (
    text.includes('frontend') ||
    text.includes('code') ||
    text.includes('architecture') ||
    text.includes('api') ||
    text.includes('performance') ||
    text.includes('stack') ||
    text.includes('database') ||
    text.includes('next.js')
  ) {
    return {
      role: 'technical_consultation',
      name: 'Nexus Engineering Lead',
      isAndy: false,
    };
  }

  // AI & Autonomous Agents
  if (
    text.includes('ai') ||
    text.includes('llm') ||
    text.includes('agent') ||
    text.includes('automation') ||
    text.includes('rag') ||
    text.includes('groq')
  ) {
    return {
      role: 'ai_automation',
      name: 'Nexus AI Systems Specialist',
      isAndy: false,
    };
  }

  // UI/UX & Design Systems
  if (
    text.includes('design') ||
    text.includes('ui') ||
    text.includes('ux') ||
    text.includes('visual') ||
    text.includes('branding') ||
    text.includes('redesign')
  ) {
    return {
      role: 'design_discussion',
      name: 'Nexus Design Systems Lead',
      isAndy: false,
    };
  }

  // Default: Strategic Sales Discovery
  return {
    role: 'sales_discovery',
    name: 'Nexus Discovery Lead',
    isAndy: false,
  };
}

/**
 * Calculates dynamic candidate slots from the server-authoritative function or fallback schedule.
 * Converts slots to user's IANA timezone and validates availability.
 */
export async function fetchAvailableSlots(
  role: RepresentativeRole = 'sales_discovery',
  userTimezone: string = detectUserTimezone(),
  daysAhead: number = 7,
  durationMinutes: number = 30
): Promise<AvailableTimeSlot[]> {
  try {
    // 1. Try invoking server-side RPC get_available_slots
    const { data, error } = await supabase.rpc('get_available_slots', {
      p_role: role,
      p_timezone: userTimezone,
      p_days_ahead: daysAhead,
      p_duration_minutes: durationMinutes,
    });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((item: any) => {
        const display = formatSlotForDisplay(item.start_utc, userTimezone);
        return {
          id: item.slot_id,
          startUtc: item.start_utc,
          endUtc: item.end_utc,
          representativeRole: item.representative_role,
          representativeName: item.representative_name || 'Nexus Specialist',
          dayName: display.dayName,
          formattedDate: display.formattedDate,
          formattedTime: display.formattedTime,
          fullDisplay: display.fullDisplay,
        };
      });
    }
  } catch (rpcErr) {
    console.warn('RPC get_available_slots call note:', rpcErr);
  }

  // 2. Fallback: Query availability_settings & conflicting appointments dynamically
  return generateDynamicFallbackSlots(role, userTimezone, daysAhead, durationMinutes);
}

/**
 * Generates dynamic slots strictly in runtime memory using actual current timestamp
 * and database appointments to prevent static date hallucinations.
 */
async function generateDynamicFallbackSlots(
  role: RepresentativeRole,
  userTimezone: string,
  daysAhead: number,
  durationMinutes: number
): Promise<AvailableTimeSlot[]> {
  const now = new Date();
  const minNoticeMs = 30 * 60 * 1000; // 30 minutes minimum notice
  const slots: AvailableTimeSlot[] = [];

  // Fetch booked appointments in the target window to check conflicts
  const windowEnd = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  const { data: bookedAppointments } = await supabase
    .from('appointments')
    .select('scheduled_start, scheduled_end')
    .in('status', ['pending', 'confirmed'])
    .gte('scheduled_end', now.toISOString())
    .lte('scheduled_start', windowEnd.toISOString());

  const bookedRanges = (bookedAppointments || []).map((a: any) => ({
    start: new Date(a.scheduled_start).getTime(),
    end: new Date(a.scheduled_end).getTime(),
  }));

  // Define representative working windows in America/New_York
  const isFounder = role === 'founder_escalation';
  const startHour = isFounder ? 14 : 9; // 2 PM for Andy, 9 AM for team
  const endHour = isFounder ? 17 : 17;   // 5 PM
  const allowedDays = isFounder ? [2, 3, 4] : [1, 2, 3, 4, 5]; // Tuesday-Thursday for Andy, Mon-Fri for team
  const repName = isFounder ? 'Andy Watson' : 'Nexus Specialist';

  for (let d = 1; d <= daysAhead; d++) {
    const candidateDate = new Date(now.getTime() + d * 24 * 60 * 60 * 1000);
    const dayOfWeek = candidateDate.getUTCDay(); // 0 is Sunday, 1 is Monday ...

    if (allowedDays.includes(dayOfWeek)) {
      for (let h = startHour; h < endHour; h++) {
        // Slot 1: On the hour
        const slotStart = new Date(candidateDate);
        slotStart.setUTCHours(h + 4, 0, 0, 0); // rough UTC alignment (EDT is UTC-4)
        const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60 * 1000);

        if (slotStart.getTime() > now.getTime() + minNoticeMs) {
          const isConflict = bookedRanges.some(
            (b) => slotStart.getTime() < b.end && slotEnd.getTime() > b.start
          );

          if (!isConflict) {
            const display = formatSlotForDisplay(slotStart, userTimezone);
            slots.push({
              id: `slot_${slotStart.getTime()}`,
              startUtc: slotStart.toISOString(),
              endUtc: slotEnd.toISOString(),
              representativeRole: role,
              representativeName: repName,
              dayName: display.dayName,
              formattedDate: display.formattedDate,
              formattedTime: display.formattedTime,
              fullDisplay: display.fullDisplay,
            });
          }
        }
      }
    }
  }

  return slots;
}

/**
 * Atomically reserves candidate slot with double-booking prevention.
 */
export async function bookAppointment(params: {
  visitorToken: string;
  conversationId: string;
  name: string;
  email: string;
  phone?: string;
  meetingType: string;
  scheduledStart: string;
  scheduledEnd: string;
  timezone: string;
  representativeRole?: string;
}): Promise<BookingResult> {
  try {
    const { data, error } = await supabase.rpc('book_visitor_appointment', {
      p_visitor_token: params.visitorToken,
      p_conversation_id: params.conversationId,
      p_name: params.name || 'Prospective Partner',
      p_email: params.email,
      p_phone: params.phone || '',
      p_meeting_type: params.meetingType || 'Technical Consultation',
      p_scheduled_start: params.scheduledStart,
      p_scheduled_end: params.scheduledEnd,
      p_timezone: params.timezone,
      p_representative_role: params.representativeRole || 'sales_discovery',
    });

    if (error) {
      console.error('Booking RPC Error:', error);
      if (error.message?.includes('SLOT_ALREADY_TAKEN') || error.message?.includes('exclusion')) {
        return {
          success: false,
          error: 'SLOT_ALREADY_TAKEN',
          message: 'That appointment time was just taken by another client. Let me check the next available option for you.',
        };
      }
      return {
        success: false,
        error: 'BOOKING_FAILED',
        message: error.message || 'Unable to book consultation at this moment.',
      };
    }

    if (data?.error === 'SLOT_ALREADY_TAKEN') {
      return {
        success: false,
        error: 'SLOT_ALREADY_TAKEN',
        message: data.message || 'That appointment time was just taken. Let me find another slot.',
      };
    }

    return {
      success: true,
      appointmentId: data?.appointment_id,
      leadId: data?.lead_id,
      representativeName: data?.representative_name,
    };
  } catch (err: any) {
    return {
      success: false,
      error: 'UNEXPECTED_ERROR',
      message: err.message || 'A network error occurred while booking.',
    };
  }
}

/**
 * Schedules an asynchronous availability retry without blocking the conversation.
 */
export async function scheduleAvailabilityRetry(
  conversationId: string,
  visitorToken: string,
  role: RepresentativeRole,
  currentRetryCount = 0
): Promise<{ nextRetryAt: string; retryCount: number }> {
  const retryCount = currentRetryCount + 1;
  // Delay by 5 minutes
  const nextRetryDate = new Date(Date.now() + 5 * 60 * 1000);
  const nextRetryAt = nextRetryDate.toISOString();

  try {
    await supabase
      .from('conversations')
      .update({
        status: 'retrying_availability',
        representative_role: role,
        retry_count: retryCount,
        next_retry_at: nextRetryAt,
      })
      .eq('id', conversationId);

    // Record audit event
    await supabase.from('lead_events').insert({
      conversation_id: conversationId,
      event_type: 'availability_retry_scheduled',
      metadata: {
        role,
        retry_count: retryCount,
        next_retry_at: nextRetryAt,
        visitor_token: visitorToken,
      },
    });
  } catch (err) {
    console.warn('Failed to schedule availability retry:', err);
  }

  return { nextRetryAt, retryCount };
}
