import React, { useMemo } from 'react';
import {
  Users,
  MessageSquare,
  AlertCircle,
  ArrowUpRight,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import type {
  VisitorSession,
  ConversationRecord,
  AdminSection,
} from '../warm-theme/tokens';
import { GlobalVisitorMap } from '../visitors/GlobalVisitorMap';

interface OverviewViewProps {
  sessions: VisitorSession[];
  conversations: ConversationRecord[];
  onNavigate: (section: AdminSection) => void;
  onSelectVisitor: (session: VisitorSession) => void;
  onOpenConversation: (conversationId: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  sessions,
  conversations,
  onNavigate,
  onSelectVisitor,
  onOpenConversation,
}) => {
  const now = Date.now();

  // 1. Visitors now (active in last 90s)
  const visitorsNow = useMemo(() => {
    return sessions.filter(
      (s) => s.is_active && now - new Date(s.last_seen_at).getTime() < 90000
    ).length;
  }, [sessions, now]);

  // 2. Visitors today (UTC day)
  const visitorsToday = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return sessions.filter((s) => s.created_at?.startsWith(todayStr)).length;
  }, [sessions]);

  // 3. Conversations count
  const conversationsCount = conversations.length;

  // 4. Human requests count (active waiting)
  const urgentHumanRequests = useMemo(() => {
    return conversations.filter((c) => c.status === 'human_requested');
  }, [conversations]);

  const humanRequestsCount = urgentHumanRequests.length;

  // Set of tokens with human requests for map attention coloring
  const humanRequestVisitorTokens = useMemo(() => {
    return new Set(
      urgentHumanRequests.map((c) => c.visitor_id).filter((id): id is string => Boolean(id))
    );
  }, [urgentHumanRequests]);

  // Active sessions for the map
  const activeSessions = useMemo(() => {
    return sessions.filter(
      (s) => s.is_active && now - new Date(s.last_seen_at).getTime() < 90000
    );
  }, [sessions, now]);

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 space-y-6 antialiased text-[#242321] select-none max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D9D4CA] pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-[#242321]">
            Command Center
          </h1>
          <p className="text-xs text-[#716D65] mt-0.5">
            Live operations, real-time visitor presence, and urgent communication queue
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#FBF9F4] border border-[#D9D4CA] text-xs font-mono text-[#716D65]">
            <span className="w-2 h-2 rounded-full bg-[#4F8A5B] animate-pulse" />
            <span>Telemetry Active</span>
          </div>
        </div>
      </div>

      {/* 4 Core Top-Level Metrics (Strictly Real Data) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Visitors now */}
        <div className="p-4 rounded-xl bg-[#FBF9F4] border border-[#D9D4CA] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#716D65]">
            <span className="text-xs font-medium">Visitors now</span>
            <span className="w-2 h-2 rounded-full bg-[#4F8A5B]" />
          </div>
          <div className="text-2xl md:text-3xl font-semibold font-mono text-[#242321] mt-2">
            {visitorsNow}
          </div>
          <div className="text-[11px] text-[#716D65] mt-1">Active within last 90s</div>
        </div>

        {/* Visitors today */}
        <div className="p-4 rounded-xl bg-[#FBF9F4] border border-[#D9D4CA] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#716D65]">
            <span className="text-xs font-medium">Visitors today</span>
            <Users className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl md:text-3xl font-semibold font-mono text-[#242321] mt-2">
            {visitorsToday}
          </div>
          <div className="text-[11px] text-[#716D65] mt-1">Unique daily sessions</div>
        </div>

        {/* Conversations */}
        <div className="p-4 rounded-xl bg-[#FBF9F4] border border-[#D9D4CA] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#716D65]">
            <span className="text-xs font-medium">Conversations</span>
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl md:text-3xl font-semibold font-mono text-[#242321] mt-2">
            {conversationsCount}
          </div>
          <div className="text-[11px] text-[#716D65] mt-1">Total recorded threads</div>
        </div>

        {/* Human requests */}
        <div
          className={`p-4 rounded-xl border flex flex-col justify-between transition-colors ${
            humanRequestsCount > 0
              ? 'bg-[#F8F1EC] border-[#B56A45]/40 text-[#B56A45]'
              : 'bg-[#FBF9F4] border-[#D9D4CA] text-[#716D65]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Human requests</span>
            <AlertCircle
              className={`w-3.5 h-3.5 ${
                humanRequestsCount > 0 ? 'text-[#B56A45] animate-pulse' : 'text-[#716D65]'
              }`}
            />
          </div>
          <div
            className={`text-2xl md:text-3xl font-semibold font-mono mt-2 ${
              humanRequestsCount > 0 ? 'text-[#B56A45]' : 'text-[#242321]'
            }`}
          >
            {humanRequestsCount}
          </div>
          <div className="text-[11px] mt-1">
            {humanRequestsCount > 0 ? 'Pending operator pickup' : 'Queue clear'}
          </div>
        </div>
      </div>

      {/* Urgent Attention Queue (When Human Request is Pending) */}
      {urgentHumanRequests.length > 0 && (
        <div className="p-4 rounded-xl bg-[#F8F1EC] border border-[#B56A45]/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#B56A45]">
              <AlertCircle className="w-4 h-4 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider font-mono">
                URGENT ATTENTION REQUIRED ({urgentHumanRequests.length})
              </span>
            </div>
            <button
              onClick={() => onNavigate('handoffs')}
              className="text-xs font-medium text-[#B56A45] hover:underline flex items-center gap-1"
            >
              <span>View All Requests</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {urgentHumanRequests.slice(0, 4).map((conv) => {
              const matchedSession = sessions.find((s) => s.visitor_token === conv.visitor_id);
              const ipDisplay = matchedSession?.ip_masked || 'Visitor';
              const locationDisplay = matchedSession?.city
                ? `${matchedSession.city}, ${matchedSession.country?.split('|')[1] || matchedSession.country}`
                : matchedSession?.country?.split('|')[1] || 'Global';

              return (
                <div
                  key={conv.id}
                  className="p-3 bg-[#FBF9F4] rounded-lg border border-[#D9D4CA] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-mono font-semibold text-[#242321]">{ipDisplay}</div>
                    <div className="text-[#716D65] text-[11px] truncate mt-0.5">
                      {locationDisplay} · {conv.handoff_reason || 'Visitor requested human operator'}
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenConversation(conv.id)}
                    className="px-3 py-1.5 rounded-md bg-[#B56A45] text-white font-medium text-xs hover:bg-[#A35936] transition-colors shrink-0"
                  >
                    Hand Off
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Global Visitor Map Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-tight text-[#242321]">
              Global Visitor Map
            </h2>
            <span className="text-[11px] text-[#716D65]">
              Real-time active visitors across world regions
            </span>
          </div>

          <button
            onClick={() => onNavigate('visitors')}
            className="text-xs text-[#716D65] hover:text-[#242321] flex items-center gap-1 font-medium"
          >
            <span>Live List</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <GlobalVisitorMap
          visitors={activeSessions}
          humanRequestTokens={humanRequestVisitorTokens}
          onSelectVisitor={onSelectVisitor}
          height={380}
        />
      </div>

      {/* Recent Live Visitors Snippet */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight text-[#242321]">
            Recent Active Visitors
          </h2>
          <button
            onClick={() => onNavigate('visitors')}
            className="text-xs text-[#716D65] hover:text-[#242321] flex items-center gap-1 font-medium"
          >
            <span>View All ({sessions.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {sessions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sessions.slice(0, 6).map((session) => {
              const isOnline =
                session.is_active && now - new Date(session.last_seen_at).getTime() < 90000;
              const isHumanReq = humanRequestVisitorTokens.has(session.visitor_token);
              const country = session.country?.split('|')[1] || session.country || 'Global';

              return (
                <div
                  key={session.id}
                  onClick={() => onSelectVisitor(session)}
                  className="p-3.5 rounded-lg bg-[#FBF9F4] border border-[#D9D4CA] hover:border-[#7C766C] transition-all cursor-pointer flex flex-col justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-mono font-medium text-[#242321]">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isHumanReq
                              ? 'bg-[#B56A45]'
                              : isOnline
                              ? 'bg-[#4F8A5B]'
                              : 'bg-[#7C766C]'
                          }`}
                        />
                        <span>{session.ip_masked || 'Visitor'}</span>
                      </div>
                      <span className="text-[10px] text-[#716D65] font-mono">
                        {session.device_type}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[#716D65] text-[11px] mt-1.5">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">
                        {session.city ? `${session.city}, ` : ''}
                        {country}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#D9D4CA]/60 pt-2 mt-2.5 text-[10px] text-[#716D65]">
                    <span className="truncate max-w-[140px] font-mono">
                      {session.current_url || '/'}
                    </span>
                    <span className="font-medium text-[#242321]">Inspect</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center rounded-xl bg-[#FBF9F4] border border-[#D9D4CA] text-xs text-[#716D65]">
            No visitor activity tracked yet today.
          </div>
        )}
      </div>
    </div>
  );
};
