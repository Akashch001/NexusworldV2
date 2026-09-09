import React, { useState, useEffect } from 'react';
import {
  Radio,
  Laptop,
  Smartphone,
  Tablet,
  X,
  MessageSquare,
  UserCheck,
  ExternalLink,
} from 'lucide-react';
import type { VisitorSession, VisitorEvent, ConversationRecord, LeadRecord } from '../types';
import { supabase } from '../../../../lib/supabaseClient';

interface LiveVisitorsViewProps {
  sessions: VisitorSession[];
  selectedVisitor: VisitorSession | null;
  onSelectVisitor: (visitor: VisitorSession | null) => void;
  onNavigateToConversation?: (convId: string) => void;
  onNavigateToLead?: (leadId: string) => void;
}

export const LiveVisitorsView: React.FC<LiveVisitorsViewProps> = ({
  sessions,
  selectedVisitor,
  onSelectVisitor,
  onNavigateToConversation,
  onNavigateToLead,
}) => {
  const [visitorEvents, setVisitorEvents] = useState<VisitorEvent[]>([]);
  const [visitorConversation, setVisitorConversation] = useState<ConversationRecord | null>(null);
  const [visitorLead, setVisitorLead] = useState<LeadRecord | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);

  // Fetch chronological journey events, conversations, and leads for selected visitor
  useEffect(() => {
    if (!selectedVisitor) {
      setVisitorEvents([]);
      setVisitorConversation(null);
      setVisitorLead(null);
      return;
    }

    const currentVisitor = selectedVisitor;
    let isMounted = true;
    setIsLoadingDetails(true);

    async function loadVisitorStory() {
      try {
        const token = currentVisitor.visitor_token;

        // 1. Fetch real events for this session
        const { data: events } = await supabase
          .from('visitor_events')
          .select('*')
          .eq('visitor_token', token)
          .order('created_at', { ascending: true });

        // 2. Check if this visitor initiated a conversation
        const { data: conv } = await supabase
          .from('conversations')
          .select('*')
          .eq('visitor_id', token)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // 3. Check if this visitor converted into a lead
        const { data: lead } = await supabase
          .from('leads')
          .select('*')
          .eq('visitor_id', token)
          .limit(1)
          .maybeSingle();

        if (isMounted) {
          setVisitorEvents((events as VisitorEvent[]) || []);
          setVisitorConversation((conv as ConversationRecord) || null);
          setVisitorLead((lead as LeadRecord) || null);
        }
      } catch {
        // Fallback
      } finally {
        if (isMounted) setIsLoadingDetails(false);
      }
    }

    loadVisitorStory();

    return () => {
      isMounted = false;
    };
  }, [selectedVisitor]);

  const getDeviceIcon = (device: string) => {
    if (device === 'mobile') return <Smartphone className="w-3.5 h-3.5 text-zinc-400" />;
    if (device === 'tablet') return <Tablet className="w-3.5 h-3.5 text-zinc-400" />;
    return <Laptop className="w-3.5 h-3.5 text-zinc-400" />;
  };

  return (
    <div className="space-y-4 font-mono">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#0A0A0F] border border-white/[0.08]">
        <div>
          <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>AUTHENTIC VISITOR TELEMETRY</span>
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5">
            Real anonymous sessions captured via lightweight client beacons. Masked privacy preserving.
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{sessions.filter(s => s.is_active).length} Active Sessions</span>
          </div>
        </div>
      </div>

      {/* Main Content Area: Session Roster Table */}
      {sessions.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0A0A0F] border border-white/[0.08] space-y-3">
          <Radio className="w-8 h-8 text-zinc-600 mx-auto" />
          <div className="text-sm font-bold text-white">NO ACTIVE VISITORS</div>
          <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
            There are currently no active website sessions. Visitor telemetry will appear immediately when someone arrives on nexusworld.in.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-[#0A0A0F] border border-white/[0.08] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[10px] uppercase text-zinc-400 tracking-wider">
                  <th className="py-3 px-4">Location / IP</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Current Page</th>
                  <th className="py-3 px-4">Device & OS</th>
                  <th className="py-3 px-4">Referrer</th>
                  <th className="py-3 px-4">Last Seen</th>
                  <th className="py-3 px-4 text-right">Story</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {sessions.map((session) => {
                  const isSelected = selectedVisitor?.id === session.id;

                  return (
                    <tr
                      key={session.id}
                      onClick={() => onSelectVisitor(session)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#2563EB]/15 text-white'
                          : 'hover:bg-white/[0.02] text-zinc-300'
                      }`}
                    >
                      {/* Location / IP */}
                      <td className="py-3 px-4 flex flex-col gap-0.5 min-w-[180px]">
                        <div className="flex items-center gap-2 font-mono font-bold text-white text-xs">
                          <span className={`w-1.5 h-1.5 rounded-full ${session.is_active ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                          <span>{session.ip_masked !== 'Unknown' && session.ip_masked !== '•••.•••.•••' ? session.ip_masked : session.visitor_token.slice(-8).toUpperCase()}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 pl-3.5">
                          {(() => {
                            if (!session.country && !session.city) return <span>Location unavailable</span>;
                            
                            const parts = (session.country || '').split('|');
                            const code = parts[0];
                            const name = parts[1] || parts[0];
                            
                            // Generate flag emoji from ISO country code if valid length
                            const flag = code && code.length === 2 
                              ? String.fromCodePoint(...[...code.toUpperCase()].map(c => c.charCodeAt(0) + 127397)) 
                              : '';

                            return (
                              <>
                                {flag && <span className="text-[11px]">{flag}</span>}
                                <span className="truncate max-w-[130px]">
                                  {session.city ? `${session.city}, ` : ''}{name || 'Unknown Country'}
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold border ${
                            session.is_active
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                          }`}
                        >
                          {session.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Current Page */}
                      <td className="py-3 px-4 text-zinc-300 max-w-[200px] truncate">
                        {session.current_url || session.entry_url || '/'}
                      </td>

                      {/* Device & OS */}
                      <td className="py-3 px-4 text-zinc-400">
                        <div className="flex items-center gap-1.5">
                          {getDeviceIcon(session.device_type)}
                          <span>{session.browser || 'Web'} on {session.os || session.device_type}</span>
                        </div>
                      </td>

                      {/* Referrer */}
                      <td className="py-3 px-4 text-zinc-400 max-w-[150px] truncate">
                        {session.referrer ? (
                          <span className="text-zinc-300">{session.referrer.replace(/^https?:\/\//, '')}</span>
                        ) : (
                          <span className="text-zinc-400">Direct Entry</span>
                        )}
                      </td>

                      {/* Last Seen */}
                      <td className="py-3 px-4 text-zinc-400 text-[11px]">
                        {new Date(session.last_seen_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          className="px-2.5 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-xs font-mono text-[#3B82F6] hover:text-white transition-colors border border-white/[0.06]"
                        >
                          View Journey →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SIGNATURE EXPERIENCE: "MAKE THE VISITOR A STORY" SLIDE-OVER DRAWER */}
      {selectedVisitor && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg bg-[#0A0A0F] border-l border-white/[0.1] h-full flex flex-col shadow-2xl shadow-black overflow-hidden font-mono"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>VISITOR STORY // {selectedVisitor.ip_masked !== 'Unknown' && selectedVisitor.ip_masked !== '•••.•••.•••' ? selectedVisitor.ip_masked : `#${selectedVisitor.visitor_token.slice(-8).toUpperCase()}`}</span>
                </div>
                <div className="text-[11px] text-zinc-400 mt-1">
                  Chronological journey reconstructed from real telemetry events.
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectVisitor(null)}
                className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors"
                aria-label="Close Story"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Session Metadata Summary Card */}
            <div className="p-4 m-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs space-y-2">
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-zinc-400">ENTRY PAGE:</span>{' '}
                  <span className="text-zinc-200 font-medium">{selectedVisitor.entry_url || '/'}</span>
                </div>
                <div>
                  <span className="text-zinc-400">CURRENT:</span>{' '}
                  <span className="text-zinc-200 font-medium">{selectedVisitor.current_url || '/'}</span>
                </div>
                <div>
                  <span className="text-zinc-400">DEVICE:</span>{' '}
                  <span className="text-zinc-200 font-medium">{selectedVisitor.device_type} ({selectedVisitor.browser})</span>
                </div>
                <div>
                  <span className="text-zinc-400">FIRST SEEN:</span>{' '}
                  <span className="text-zinc-200 font-medium">
                    {new Date(selectedVisitor.created_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Connected Journey Milestones (Conversation / Lead Status) */}
            <div className="px-4 space-y-2">
              {visitorConversation && (
                <div className="p-3 rounded-xl bg-[#2563EB]/10 border border-[#2563EB]/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-[#3B82F6]">
                    <MessageSquare className="w-4 h-4 shrink-0" />
                    <span>Conversation Active (Status: {visitorConversation.status})</span>
                  </div>
                  {onNavigateToConversation && (
                    <button
                      type="button"
                      onClick={() => {
                        onNavigateToConversation(visitorConversation.id);
                        onSelectVisitor(null);
                      }}
                      className="text-[10px] text-white hover:underline flex items-center gap-1"
                    >
                      <span>Open Inbox</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}

              {visitorLead && (
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-purple-400">
                    <UserCheck className="w-4 h-4 shrink-0" />
                    <span>Converted to Lead: {visitorLead.name} ({visitorLead.email})</span>
                  </div>
                  {onNavigateToLead && (
                    <button
                      type="button"
                      onClick={() => {
                        onNavigateToLead(visitorLead.id);
                        onSelectVisitor(null);
                      }}
                      className="text-[10px] text-white hover:underline flex items-center gap-1"
                    >
                      <span>View Lead</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Timeline Stream */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                VISITOR CHRONOLOGICAL STORY
              </div>

              {isLoadingDetails ? (
                <div className="py-12 text-center text-xs text-zinc-500">
                  Reconstructing journey timeline...
                </div>
              ) : visitorEvents.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <div className="text-xs text-zinc-300">Session Registered</div>
                  <p className="text-[11px] text-zinc-500">
                    No discrete sub-events recorded yet for this session.
                  </p>
                </div>
              ) : (
                <div className="relative pl-6 border-l border-white/[0.08] space-y-6">
                  {visitorEvents.map((ev, idx) => {
                    const isLast = idx === visitorEvents.length - 1;

                    return (
                      <div key={ev.id} className="relative group">
                        {/* Timeline Node Point */}
                        <div
                          className={`absolute -left-[31px] top-1 w-3 h-3 rounded-full border-2 border-[#0A0A0F] ${
                            isLast
                              ? 'bg-[#2563EB] shadow-[0_0_10px_#2563EB]'
                              : ev.event_name.includes('nora') || ev.event_name.includes('handoff')
                              ? 'bg-amber-400'
                              : 'bg-zinc-600'
                          }`}
                        />

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-white uppercase text-[11px] tracking-wide">
                              {ev.event_name.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[10px] text-zinc-500">
                              {new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </div>

                          <div className="text-[11px] text-zinc-400 leading-relaxed">
                            {ev.metadata?.url ? (
                              <span>Visited <span className="text-zinc-300">{ev.metadata.url}</span></span>
                            ) : ev.metadata?.districtIndex !== undefined ? (
                              <span>Explored 3D Spatial District #{ev.metadata.districtIndex}</span>
                            ) : (
                              <span>Event Category: {ev.event_type}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-white/[0.08] bg-black/40 flex items-center justify-between text-xs">
              <span className="text-zinc-500 text-[10px]">REAL TELEMETRY VERIFIED</span>
              <button
                type="button"
                onClick={() => onSelectVisitor(null)}
                className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white text-xs transition-colors"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
