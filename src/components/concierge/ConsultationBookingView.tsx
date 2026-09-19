import React, { useState } from 'react';
import {
  MOCK_CALENDAR_SLOTS,
  type MockTimeSlot,
  type ProjectIntelligence,
} from '../../data/conciergeData';
import { PrivacyDisclosure } from './PrivacyDisclosure';
import { Calendar, CheckCircle2, ArrowRight, ShieldAlert, ArrowLeft } from 'lucide-react';

import { supabase } from '../../lib/supabaseClient';
import { getOrCreateSessionToken } from '../../hooks/useVisitorTelemetry';

interface ConsultationBookingViewProps {
  intelligence: ProjectIntelligence;
  conversationId?: string | null;
  onConfirmBooking: (slot: MockTimeSlot) => void;
  onBackToChat: () => void;
}

export const ConsultationBookingView: React.FC<ConsultationBookingViewProps> = ({
  intelligence,
  conversationId,
  onConfirmBooking,
  onBackToChat,
}) => {
  const [selectedSlot, setSelectedSlot] = useState<MockTimeSlot | null>(MOCK_CALENDAR_SLOTS[0]);
  const [timezone, setTimezone] = useState<string>('EST (Eastern Standard Time)');
  const [confirmedState, setConfirmedState] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!selectedSlot) {
      setErrorMsg("Please select a consultation slot.");
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    
    try {
      const token = getOrCreateSessionToken();
      let activeConvId = conversationId;

      if (!activeConvId) {
        const { data: convData } = await supabase.functions.invoke('nexus-intelligence', {
          body: {
            action: 'save_lead',
            context: intelligence,
            visitorId: token,
          }
        });
        if (convData?.conversationId) {
          activeConvId = convData.conversationId;
        }
      }

      if (!activeConvId) {
        throw new Error("Unable to establish secure booking session. Please refresh and retry.");
      }
      
      // We will parse the slot string into a rough timestamp
      // "02:30 PM EST"
      const now = new Date();
      now.setDate(now.getDate() + 2); // just simulate a future date
      const scheduledStart = now.toISOString();
      now.setHours(now.getHours() + 1);
      const scheduledEnd = now.toISOString();

      const { error } = await supabase.rpc('book_visitor_appointment', {
        p_visitor_token: token,
        p_conversation_id: activeConvId,
        p_name: intelligence.contact.fullName || 'Unknown Visitor',
        p_email: intelligence.contact.email || '',
        p_phone: intelligence.contact.phoneNumber || '',
        p_meeting_type: 'founder_consultation',
        p_scheduled_start: scheduledStart,
        p_scheduled_end: scheduledEnd,
        p_timezone: timezone
      });

      if (error) {
        console.error("Booking Error:", error);
        throw new Error(error.message || "Failed to book appointment");
      }

      setConfirmedState(true);
      setTimeout(() => {
        onConfirmBooking(selectedSlot);
      }, 1000);
      
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-void-card border border-white/[0.08] rounded-xl overflow-hidden p-6 lg:p-8 shadow-2xl relative">
      
      {/* Top Banner: Prominent MOCK/DEMO Marker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="telemetry-tag px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
              NEXUS // DEMO MODE (SIMULATED CALENDAR)
            </span>
            <span className="text-[10px] font-mono text-zinc-500">FRONTEND PROTOTYPE</span>
          </div>
          <h3 className="font-display font-bold text-2xl text-white tracking-tight">
            Schedule Founder Consultation
          </h3>
          <p className="text-zinc-400 text-xs mt-0.5">
            Direct 30-minute technical roadmap & strategy session with Andy Watson.
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
        
        {/* Left: Time Slots */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-signal" />
              <span>Select Available Window:</span>
            </span>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="bg-void-surface border border-white/10 rounded px-2 py-0.5 text-[11px] text-zinc-300 focus:outline-none focus:border-signal"
            >
              <option value="EST (Eastern Standard Time)">EST (UTC-5)</option>
              <option value="PST (Pacific Standard Time)">PST (UTC-8)</option>
              <option value="GMT / UTC">GMT (UTC+0)</option>
              <option value="IST (Indian Standard Time)">IST (UTC+5:30)</option>
            </select>
          </div>

          {/* Time Slot Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {MOCK_CALENDAR_SLOTS.map((slot) => {
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
                    <span>{slot.day}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-signal-bright" />}
                  </div>
                  <div className="font-semibold text-xs text-zinc-200">
                    {slot.date}
                  </div>
                  <div className="text-signal-bright font-mono text-xs font-bold mt-1">
                    {slot.time}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-3 rounded bg-void-surface border border-white/[0.04] text-[11px] font-mono text-zinc-500 flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>This is a prototype demonstration. No actual calendar events or external calendar invites are generated.</span>
          </div>

          <PrivacyDisclosure />
        </div>

        {/* Right: Confirmation Review */}
        <div className="lg:col-span-5 flex flex-col justify-between p-5 rounded-xl bg-void-surface/60 border border-white/[0.06]">
          <div>
            <div className="telemetry-tag text-signal mb-3">CONSULTATION SUMMARY</div>
            
            <div className="space-y-3 text-xs font-mono">
              <div className="pb-2 border-b border-white/[0.04]">
                <span className="text-zinc-500 block text-[10px]">CONSULTANT:</span>
                <span className="text-white font-semibold">Andy Watson (Co-Founder, 2026)</span>
              </div>

              <div className="pb-2 border-b border-white/[0.04]">
                <span className="text-zinc-500 block text-[10px]">CLIENT / CONTACT:</span>
                <span className="text-zinc-200">{intelligence.contact.fullName || 'Prospective Partner'}</span>
                <span className="text-zinc-500 block text-[10px] mt-0.5">{intelligence.contact.email || 'Email not provided'}</span>
                {intelligence.contact.phoneNumber && (
                  <span className="text-zinc-500 block text-[10px]">{intelligence.contact.phoneNumber}</span>
                )}
              </div>

              <div className="pb-2 border-b border-white/[0.04]">
                <span className="text-zinc-500 block text-[10px]">COMPANY & NEED:</span>
                <span className="text-zinc-200">{intelligence.business.companyName || 'Undisclosed Entity'}</span>
                <span className="text-zinc-400 block text-[10px] mt-0.5 line-clamp-2">
                  {intelligence.project.need || 'Digital product architecture'}
                </span>
              </div>

              <div className="p-3 rounded bg-void-deep border border-signal/30">
                <span className="text-signal-bright block text-[10px] uppercase font-bold">RESERVED TIME:</span>
                <span className="text-white font-bold text-xs">{selectedSlot?.date}</span>
                <span className="text-signal block text-xs mt-0.5">{selectedSlot?.time}</span>
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
                 <span>Confirming...</span>
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
