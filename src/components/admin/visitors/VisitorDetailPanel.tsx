import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Laptop,
  Smartphone,
  Tablet,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import type { VisitorSession, VisitorEvent, ConversationRecord } from '../warm-theme/tokens';
import { supabase } from '../../../lib/supabaseClient';

interface VisitorDetailPanelProps {
  visitor: VisitorSession | null;
  onClose: () => void;
  onOpenConversation?: (conversationId: string) => void;
}

export const VisitorDetailPanel: React.FC<VisitorDetailPanelProps> = ({
  visitor,
  onClose,
  onOpenConversation,
}) => {
  const [events, setEvents] = useState<VisitorEvent[]>([]);
  const [conversation, setConversation] = useState<ConversationRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!visitor) {
      setEvents([]);
      setConversation(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    async function loadDetails() {
      try {
        const token = visitor!.visitor_token;

        // Fetch real journey events
        const { data: eventData } = await supabase
          .from('visitor_events')
          .select('*')
          .eq('visitor_token', token)
          .order('created_at', { ascending: true })
          .limit(50);

        // Fetch associated conversation if exists
        const { data: convData } = await supabase
          .from('conversations')
          .select('*')
          .eq('visitor_id', token)
          .maybeSingle();

        if (isMounted) {
          setEvents((eventData as VisitorEvent[]) || []);
          setConversation((convData as ConversationRecord) || null);
        }
      } catch {
        // Fallback
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDetails();

    return () => {
      isMounted = false;
    };
  }, [visitor]);

  if (!visitor) return null;

  // Format times
  const startTime = new Date(visitor.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const lastSeenTime = new Date(visitor.last_seen_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Check active state (within last 90s)
  const isCurrentlyActive =
    visitor.is_active &&
    Date.now() - new Date(visitor.last_seen_at).getTime() < 90000;

  // Country and City labels
  const countryParts = (visitor.country || '').split('|');
  const countryName = countryParts[1] || countryParts[0] || 'Unknown Region';

  const DeviceIcon =
    visitor.device_type === 'mobile'
      ? Smartphone
      : visitor.device_type === 'tablet'
      ? Tablet
      : Laptop;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#FBF9F4] border-l border-[#D9D4CA] shadow-2xl flex flex-col antialiased text-[#242321] select-none animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-[#D9D4CA] flex items-center justify-between bg-[#F5F1E8]/50">
        <div>
          <div className="flex items-center gap-2 font-mono font-semibold text-sm text-[#242321]">
            <span
              className={`w-2 h-2 rounded-full ${
                isCurrentlyActive ? 'bg-[#4F8A5B]' : 'bg-[#7C766C]'
              }`}
            />
            <span>{visitor.ip_masked || 'Visitor'}</span>
          </div>
          <div className="text-[11px] text-[#716D65] flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" />
            <span>
              {visitor.city ? `${visitor.city}, ` : ''}
              {countryName}
            </span>
            <span className="text-[10px] text-[#7C766C] italic">(Approximate)</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-[#716D65] hover:text-[#242321] hover:bg-[#EEEAE1] transition-colors"
          aria-label="Close panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body Scroll Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Core Telemetry Grid */}
        <div>
          <div className="text-[10px] font-mono tracking-widest text-[#716D65] uppercase mb-2">
            TELEMETRY & ATTRIBUTES
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-[#F5F1E8] border border-[#D9D4CA]">
              <div className="text-[10px] text-[#716D65] uppercase font-mono">Current Page</div>
              <div className="font-mono text-[11px] text-[#242321] truncate mt-0.5">
                {visitor.current_url || '/'}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[#F5F1E8] border border-[#D9D4CA]">
              <div className="text-[10px] text-[#716D65] uppercase font-mono">Session Status</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isCurrentlyActive ? 'bg-[#4F8A5B]' : 'bg-[#7C766C]'
                  }`}
                />
                <span className="text-[11px] font-medium text-[#242321]">
                  {isCurrentlyActive ? 'Active Now' : 'Recently Inactive'}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[#F5F1E8] border border-[#D9D4CA]">
              <div className="text-[10px] text-[#716D65] uppercase font-mono">Started</div>
              <div className="text-[11px] text-[#242321] mt-0.5">{startTime}</div>
            </div>

            <div className="p-2.5 rounded-lg bg-[#F5F1E8] border border-[#D9D4CA]">
              <div className="text-[10px] text-[#716D65] uppercase font-mono">Last Activity</div>
              <div className="text-[11px] text-[#242321] mt-0.5">{lastSeenTime}</div>
            </div>

            <div className="p-2.5 rounded-lg bg-[#F5F1E8] border border-[#D9D4CA]">
              <div className="text-[10px] text-[#716D65] uppercase font-mono">Device</div>
              <div className="flex items-center gap-1 text-[11px] text-[#242321] capitalize mt-0.5">
                <DeviceIcon className="w-3.5 h-3.5 text-[#716D65]" />
                <span>{visitor.device_type || 'Desktop'}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[#F5F1E8] border border-[#D9D4CA]">
              <div className="text-[10px] text-[#716D65] uppercase font-mono">Browser & OS</div>
              <div className="text-[11px] text-[#242321] truncate mt-0.5">
                {visitor.browser || 'Browser'} · {visitor.os || 'OS'}
              </div>
            </div>
          </div>
        </div>

        {/* Associated Conversation State */}
        <div>
          <div className="text-[10px] font-mono tracking-widest text-[#716D65] uppercase mb-2">
            CONVERSATION & HUMAN HANDOFF
          </div>
          {conversation ? (
            <div className="p-3 rounded-lg bg-[#F5F1E8] border border-[#D9D4CA] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#716D65]" />
                  <span className="text-xs font-semibold text-[#242321]">
                    NORA Conversation
                  </span>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                    conversation.status === 'human_requested'
                      ? 'bg-[#B56A45] text-white'
                      : conversation.status === 'human'
                      ? 'bg-[#4F8A5B] text-white'
                      : conversation.status === 'closed'
                      ? 'bg-[#EEEAE1] text-[#716D65]'
                      : 'bg-[#EEEAE1] text-[#242321]'
                  }`}
                >
                  {conversation.status === 'human_requested'
                    ? 'HUMAN REQUESTED'
                    : conversation.status === 'human'
                    ? 'HUMAN ACTIVE'
                    : conversation.status === 'closed'
                    ? 'CLOSED'
                    : 'AI ACTIVE'}
                </span>
              </div>

              {conversation.handoff_reason && (
                <div className="text-[11px] text-[#716D65] bg-[#FBF9F4] p-2 rounded border border-[#D9D4CA]">
                  Reason: <span className="text-[#242321]">{conversation.handoff_reason}</span>
                </div>
              )}

              {onOpenConversation && (
                <button
                  onClick={() => {
                    onOpenConversation(conversation.id);
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md bg-[#242321] text-[#F5F1E8] text-xs font-medium hover:bg-[#383633] transition-colors mt-2"
                >
                  <span>Open Conversation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-[#F5F1E8] border border-[#D9D4CA] text-xs text-[#716D65]">
              No conversation initiated by this visitor yet.
            </div>
          )}
        </div>

        {/* Visitor Chronological Journey */}
        <div>
          <div className="text-[10px] font-mono tracking-widest text-[#716D65] uppercase mb-2">
            VISITOR JOURNEY ({events.length} EVENTS)
          </div>

          {events.length > 0 ? (
            <div className="relative pl-4 border-l border-[#D9D4CA] space-y-3.5">
              {events.map((evt, idx) => {
                const eventTime = new Date(evt.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });
                const isHumanReq = evt.event_name?.includes('handoff') || evt.event_name?.includes('human');

                return (
                  <div key={evt.id || idx} className="relative group">
                    {/* Timeline Node */}
                    <div
                      className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-[#FBF9F4] ${
                        isHumanReq
                          ? 'bg-[#B56A45]'
                          : evt.event_type === 'concierge'
                          ? 'bg-[#4F8A5B]'
                          : 'bg-[#7C766C]'
                      }`}
                    />

                    <div className="text-xs">
                      <div className="flex items-center justify-between text-[11px] text-[#716D65]">
                        <span className="font-mono text-[10px]">{eventTime}</span>
                        <span className="capitalize">{evt.event_type}</span>
                      </div>
                      <div className="font-medium text-[#242321] mt-0.5">
                        {evt.event_name.replace(/_/g, ' ')}
                      </div>
                      {evt.metadata?.url && (
                        <div className="text-[10px] font-mono text-[#716D65]">
                          Path: <span className="text-[#242321]">{evt.metadata.url}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-[#F5F1E8] border border-[#D9D4CA] text-xs text-[#716D65]">
              {isLoading ? 'Loading visitor timeline...' : 'No historical journey events recorded for this session.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
