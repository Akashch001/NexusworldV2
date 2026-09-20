import React, { useState, useEffect } from 'react';
import type {
  AvailableTimeSlot,
  ProjectIntelligence,
  RepresentativeRole,
} from '../../data/conciergeData';
import { PrivacyDisclosure } from './PrivacyDisclosure';
import { Calendar, CheckCircle2, ArrowRight, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import {
  detectUserTimezone,
  getAvailableTimezones,
  formatSlotForDisplay,
} from '../../lib/dateTimeService';
import {
  fetchAvailableSlots,
  bookAppointment,
  mapIntentToRepresentativeRole,
} from '../../lib/availabilityService';
import { getOrCreateSessionToken } from '../../hooks/useVisitorTelemetry';

interface ConsultationBookingViewProps {
  intelligence: ProjectIntelligence;
  conversationId?: string | null;
  targetRole?: RepresentativeRole;
  onConfirmBooking: (slot: AvailableTimeSlot) => void;
  onBackToChat: () => void;
}

export const ConsultationBookingView: React.FC<ConsultationBookingViewProps> = ({
  intelligence,
  conversationId,
  targetRole,
  onConfirmBooking,
  onBackToChat,
}) => {
  const [timezone, setTimezone] = useState<string>(() => detectUserTimezone());
  const [slots, setSlots] = useState<AvailableTimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableTimeSlot | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmedState, setConfirmedState] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Determine representative configuration
  const repInfo = mapIntentToRepresentativeRole(
    intelligence.intent,
    targetRole || intelligence.project.need || intelligence.project.problem
  );

  const timezoneOptions = getAvailableTimezones(timezone);

  // Fetch real-time available candidate slots
  const loadSlots = async (tz: string) => {
    setIsLoadingSlots(true);
    setErrorMsg(null);
    try {
      const activeRole = targetRole || repInfo.role;
      const available = await fetchAvailableSlots(activeRole, tz, 7, 30);
      setSlots(available);
      if (available.length > 0) {
        setSelectedSlot(available[0]);
      } else {
        setSelectedSlot(null);
      }
    } catch (err: any) {
      console.error('Failed to load slots:', err);
      setErrorMsg('Could not fetch open availability slots. Please try again or return to chat.');
    } finally {
      setIsLoadingSlots(false);
    }
  };

  useEffect(() => {
    loadSlots(timezone);
  }, [timezone, targetRole]);

  const handleTimezoneChange = (newTz: string) => {
    setTimezone(newTz);
    // If we have existing slots, recalculate display quickly while fetching
    if (selectedSlot) {
      const updatedDisplay = formatSlotForDisplay(selectedSlot.startUtc, newTz);
      setSelectedSlot((prev) =>
        prev
          ? {
              ...prev,
              dayName: updatedDisplay.dayName,
              formattedDate: updatedDisplay.formattedDate,
              formattedTime: updatedDisplay.formattedTime,
              fullDisplay: updatedDisplay.fullDisplay,
            }
          : null
      );
    }
  };

  const handleConfirm = async () => {
    if (!selectedSlot) {
      setErrorMsg('Please select an available consultation slot.');
      return;
    }

    if (!conversationId) {
      setErrorMsg('Active conversation session required. Please return to chat.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const token = getOrCreateSessionToken();
      const result = await bookAppointment({
        visitorToken: token,
        conversationId: conversationId,
        name: intelligence.contact.fullName || 'Prospective Client',
        email: intelligence.contact.email,
        phone: intelligence.contact.phoneNumber,
        meetingType: repInfo.isAndy ? 'Founder Strategic Consultation' : 'Discovery Consultation',
        scheduledStart: selectedSlot.startUtc,
        scheduledEnd: selectedSlot.endUtc,
        timezone: timezone,
        representativeRole: targetRole || repInfo.role,
      });

      if (!result.success) {
        if (result.error === 'SLOT_ALREADY_TAKEN') {
          setErrorMsg(result.message || 'That slot was just booked by another visitor. Refreshing open slots...');
          await loadSlots(timezone);
          return;
        }
        throw new Error(result.message || 'Failed to book consultation');
      }

      setConfirmedState(true);
      setTimeout(() => {
        onConfirmBooking(selectedSlot);
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred while confirming booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-void-card border border-white/[0.08] rounded-xl overflow-hidden p-6 lg:p-8 shadow-2xl relative">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="telemetry-tag px-2 py-0.5 rounded bg-signal/15 text-signal-bright border border-signal/30">
              NEXUS REAL-TIME AVAILABILITY
            </span>
            <span className="text-[10px] font-mono text-zinc-500">SERVER AUTHORITATIVE</span>
          </div>
          <h3 className="font-display font-bold text-2xl text-white tracking-tight">
            {repInfo.isAndy ? 'Schedule Founder Strategic Session' : 'Schedule Discovery Consultation'}
          </h3>
          <p className="text-zinc-400 text-xs mt-0.5">
            {repInfo.isAndy
              ? 'High-level architectural, partnership, or founder escalation call with Andy Watson.'
              : `Direct 30-minute technical roadmap & scope session with ${repInfo.name}.`}
          </p>
        </div>

        <button
          onClick={onBackToChat}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-white px-3 py-1.5 rounded bg-void-surface border border-white/[0.04] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Chat</span>
        </button>
      </div>

      {/* Main Grid: Slot Picker & Project Summary */}
      <div className="flex-1 overflow-y-auto py-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Real-time Time Slots */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-signal" />
              <span>Available Windows (Verified):</span>
            </span>

            <div className="flex items-center gap-2">
              <select
                value={timezone}
                onChange={(e) => handleTimezoneChange(e.target.value)}
                className="bg-void-surface border border-white/10 rounded px-2.5 py-1 text-[11px] text-zinc-300 focus:outline-none focus:border-signal"
              >
                {timezoneOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <button
                onClick={() => loadSlots(timezone)}
                title="Refresh real-time availability"
                className="p-1 rounded bg-void-surface border border-white/[0.06] text-zinc-400 hover:text-white"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingSlots ? 'animate-spin text-signal' : ''}`} />
              </button>
            </div>
          </div>

          {/* Time Slot Grid */}
          {isLoadingSlots ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3 bg-void-surface/30 rounded-lg border border-white/[0.04]">
              <Loader2 className="w-6 h-6 text-signal animate-spin" />
              <span className="text-xs font-mono text-zinc-400">Querying live representative availability...</span>
            </div>
          ) : slots.length === 0 ? (
            <div className="p-6 rounded-lg bg-void-surface/50 border border-white/[0.06] text-center space-y-3">
              <p className="text-xs font-mono text-amber-300">
                No immediate slots open within this window for {repInfo.name}.
              </p>
              <p className="text-[11px] text-zinc-400">
                Our team is currently tied up with client builds. You can leave your project brief in the chat for prompt human follow-up.
              </p>
              <button
                onClick={onBackToChat}
                className="px-4 py-2 rounded bg-void-surface border border-white/10 text-xs font-mono text-zinc-200 hover:text-white"
              >
                Return to Chat & Submit Project Brief
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {slots.map((slot) => {
                const isSelected = selectedSlot?.id === slot.id;
                return (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-3.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-signal/15 border-signal text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]'
                        : 'bg-void-surface/50 border-white/[0.04] text-zinc-400 hover:text-zinc-200 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 mb-1">
                      <span>{slot.dayName}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-signal-bright" />}
                    </div>
                    <div className="font-semibold text-xs text-zinc-200">{slot.formattedDate}</div>
                    <div className="text-signal-bright font-mono text-xs font-bold mt-1">
                      {slot.formattedTime}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <PrivacyDisclosure />
        </div>

        {/* Right: Confirmation Review */}
        <div className="lg:col-span-5 flex flex-col justify-between p-5 rounded-xl bg-void-surface/60 border border-white/[0.06]">
          <div>
            <div className="telemetry-tag text-signal mb-3">CONSULTATION SUMMARY</div>

            <div className="space-y-3 text-xs font-mono">
              <div className="pb-2 border-b border-white/[0.04]">
                <span className="text-zinc-500 block text-[10px]">REPRESENTATIVE:</span>
                <span className="text-white font-semibold">{repInfo.name}</span>
                <span className="text-zinc-500 block text-[10px] mt-0.5">
                  {repInfo.isAndy ? 'Co-Founder · Strategic Escalation' : 'Nexus Digital Systems Lead'}
                </span>
              </div>

              <div className="pb-2 border-b border-white/[0.04]">
                <span className="text-zinc-500 block text-[10px]">CLIENT / CONTACT:</span>
                <span className="text-zinc-200">{intelligence.contact.fullName || 'Prospective Partner'}</span>
                <span className="text-zinc-500 block text-[10px] mt-0.5">
                  {intelligence.contact.email || 'Email captured upon confirmation'}
                </span>
                {intelligence.contact.phoneNumber && (
                  <span className="text-zinc-500 block text-[10px]">{intelligence.contact.phoneNumber}</span>
                )}
              </div>

              <div className="pb-2 border-b border-white/[0.04]">
                <span className="text-zinc-500 block text-[10px]">COMPANY & NEED:</span>
                <span className="text-zinc-200">{intelligence.business.companyName || 'Undisclosed Entity'}</span>
                <span className="text-zinc-400 block text-[10px] mt-0.5 line-clamp-2">
                  {intelligence.project.need || 'Digital product architecture & roadmap'}
                </span>
              </div>

              <div className="p-3 rounded bg-void-deep border border-signal/30">
                <span className="text-signal-bright block text-[10px] uppercase font-bold">RESERVED LOCAL TIME:</span>
                <span className="text-white font-bold text-xs">
                  {selectedSlot?.formattedDate || 'Select a slot'}
                </span>
                <span className="text-signal block text-xs mt-0.5">
                  {selectedSlot?.formattedTime || 'Time window'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            {errorMsg && (
              <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center font-mono">
                {errorMsg}
              </div>
            )}
            <button
              onClick={handleConfirm}
              disabled={!selectedSlot || confirmedState || isSubmitting || !conversationId}
              className="w-full py-3.5 px-4 rounded-lg bg-signal hover:bg-signal-bright disabled:opacity-50 text-white text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.4)]"
            >
              {isSubmitting ? (
                <span>Confirming Slot...</span>
              ) : confirmedState ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-lime-400" />
                  <span>Consultation Confirmed!</span>
                </>
              ) : (
                <>
                  <span>Confirm Consultation</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
