import React, { useState, useMemo, useEffect } from 'react';
import {
  Radio,
  Search,
  MapPin,
  Laptop,
  Smartphone,
  Tablet,
  ChevronRight,
  Clock,
} from 'lucide-react';
import type { VisitorSession, ConversationRecord } from '../warm-theme/tokens';
import { VisitorDetailPanel } from './VisitorDetailPanel';

interface LiveVisitorsViewProps {
  sessions: VisitorSession[];
  conversations: ConversationRecord[];
  initialSelectedVisitor?: VisitorSession | null;
  onOpenConversation?: (conversationId: string) => void;
}

function timeAgo(dateString: string): string {
  const diffSec = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diffSec < 5) return 'Just now';
  if (diffSec < 60) return `Active ${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Active ${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Active ${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

export const LiveVisitorsView: React.FC<LiveVisitorsViewProps> = ({
  sessions,
  conversations,
  initialSelectedVisitor,
  onOpenConversation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'human_request' | 'recent'>('all');
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorSession | null>(
    initialSelectedVisitor || null
  );

  // Sync if initialSelectedVisitor changes
  useEffect(() => {
    if (initialSelectedVisitor) {
      setSelectedVisitor(initialSelectedVisitor);
    }
  }, [initialSelectedVisitor]);

  // Map human request visitor IDs
  const humanRequestVisitorTokens = useMemo(() => {
    const tokens = new Set<string>();
    conversations.forEach((c) => {
      if (c.status === 'human_requested' && c.visitor_id) {
        tokens.add(c.visitor_id);
      }
    });
    return tokens;
  }, [conversations]);

  // Map active conversations
  const convByVisitorToken = useMemo(() => {
    const map = new Map<string, ConversationRecord>();
    conversations.forEach((c) => {
      if (c.visitor_id) map.set(c.visitor_id, c);
    });
    return map;
  }, [conversations]);

  // Filter sessions
  const filteredSessions = useMemo(() => {
    const now = Date.now();

    return sessions.filter((s) => {
      const isOnline = s.is_active && now - new Date(s.last_seen_at).getTime() < 90000;
      const isHumanReq = humanRequestVisitorTokens.has(s.visitor_token);

      // Status filter
      if (statusFilter === 'active' && !isOnline) return false;
      if (statusFilter === 'human_request' && !isHumanReq) return false;
      if (statusFilter === 'recent' && isOnline) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const ip = (s.ip_masked || '').toLowerCase();
        const city = (s.city || '').toLowerCase();
        const country = (s.country || '').toLowerCase();
        const url = (s.current_url || '').toLowerCase();
        const browser = (s.browser || '').toLowerCase();
        if (!ip.includes(q) && !city.includes(q) && !country.includes(q) && !url.includes(q) && !browser.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [sessions, statusFilter, searchQuery, humanRequestVisitorTokens]);

  const activeNowCount = useMemo(() => {
    const now = Date.now();
    return sessions.filter((s) => s.is_active && now - new Date(s.last_seen_at).getTime() < 90000).length;
  }, [sessions]);

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 space-y-6 antialiased text-[#242321] select-none max-w-7xl mx-auto w-full">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9D4CA] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-[#242321]">
              Live Visitors
            </h1>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EEF5F0] border border-[#4F8A5B]/20 text-[#4F8A5B] text-xs font-mono font-medium">
              <span className="w-2 h-2 rounded-full bg-[#4F8A5B] animate-pulse" />
              <span>{activeNowCount} ONLINE</span>
            </div>
          </div>
          <p className="text-xs text-[#716D65] mt-1">
            Real-time telemetry and page navigation across nexusworld.in
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#FBF9F4] border border-[#D9D4CA] rounded-lg text-xs self-start sm:self-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-md transition-colors ${
              statusFilter === 'all'
                ? 'bg-[#EEEAE1] text-[#242321] font-semibold'
                : 'text-[#716D65] hover:text-[#242321]'
            }`}
          >
            All ({sessions.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
              statusFilter === 'active'
                ? 'bg-[#EEEAE1] text-[#242321] font-semibold'
                : 'text-[#716D65] hover:text-[#242321]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#4F8A5B]" />
            <span>Active Now ({activeNowCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter('human_request')}
            className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
              statusFilter === 'human_request'
                ? 'bg-[#EEEAE1] text-[#242321] font-semibold'
                : 'text-[#716D65] hover:text-[#242321]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#B56A45]" />
            <span>Human Requests ({humanRequestVisitorTokens.size})</span>
          </button>
          <button
            onClick={() => setStatusFilter('recent')}
            className={`px-3 py-1 rounded-md transition-colors ${
              statusFilter === 'recent'
                ? 'bg-[#EEEAE1] text-[#242321] font-semibold'
                : 'text-[#716D65] hover:text-[#242321]'
            }`}
          >
            Recent
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#716D65]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by IP address, country, city, URL, browser..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#FBF9F4] border border-[#D9D4CA] text-xs text-[#242321] placeholder-[#716D65] focus:outline-none focus:border-[#242321] transition-colors"
        />
      </div>

      {/* Visitors List Grid */}
      {filteredSessions.length > 0 ? (
        <div className="space-y-2.5">
          {filteredSessions.map((session) => {
            const isOnline =
              session.is_active &&
              Date.now() - new Date(session.last_seen_at).getTime() < 90000;
            const isHumanReq = humanRequestVisitorTokens.has(session.visitor_token);
            const conv = convByVisitorToken.get(session.visitor_token);

            const countryParts = (session.country || '').split('|');
            const countryName = countryParts[1] || countryParts[0] || 'Unknown Country';

            const DeviceIcon =
              session.device_type === 'mobile'
                ? Smartphone
                : session.device_type === 'tablet'
                ? Tablet
                : Laptop;

            return (
              <div
                key={session.id}
                onClick={() => setSelectedVisitor(session)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isHumanReq
                    ? 'bg-[#F8F1EC] border-[#B56A45]/40 hover:border-[#B56A45]'
                    : isOnline
                    ? 'bg-[#FBF9F4] border-[#D9D4CA] hover:border-[#7C766C]'
                    : 'bg-[#F5F1E8]/80 border-[#D9D4CA] opacity-85 hover:opacity-100'
                }`}
              >
                {/* Left: Identifier & Location */}
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <span
                      className={`block w-2.5 h-2.5 rounded-full ${
                        isHumanReq
                          ? 'bg-[#B56A45] animate-pulse ring-2 ring-[#B56A45]/30'
                          : isOnline
                          ? 'bg-[#4F8A5B] ring-2 ring-[#4F8A5B]/20'
                          : 'bg-[#7C766C]'
                      }`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-[#242321]">
                        {session.ip_masked || 'Unknown IP'}
                      </span>

                      {isHumanReq && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#B56A45] text-white font-medium">
                          HUMAN REQUESTED
                        </span>
                      )}

                      {conv && conv.status === 'human' && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#4F8A5B] text-white font-medium">
                          HUMAN ACTIVE
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-[#716D65] mt-1">
                      <MapPin className="w-3.5 h-3.5 text-[#716D65]" />
                      <span>
                        {session.city ? `${session.city}, ` : ''}
                        {countryName}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-[#716D65] mt-1">
                      Current: <span className="text-[#242321]">{session.current_url || '/'}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Device & Timestamp */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-[#D9D4CA]/60 text-xs text-[#716D65] gap-1">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <DeviceIcon className="w-3.5 h-3.5" />
                    <span>
                      {session.device_type} · {session.browser}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-mono">
                    <Clock className="w-3 h-3" />
                    <span>{timeAgo(session.last_seen_at)}</span>
                  </div>

                  <div className="hidden sm:flex items-center gap-1 text-[11px] text-[#242321] font-medium mt-1">
                    <span>Inspect</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Honest Empty State */
        <div className="p-12 text-center rounded-xl bg-[#FBF9F4] border border-[#D9D4CA]">
          <div className="w-10 h-10 rounded-full bg-[#EEEAE1] text-[#716D65] flex items-center justify-center mx-auto mb-3">
            <Radio className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-[#242321]">
            {searchQuery ? 'No matching visitors' : 'No visitors online'}
          </h3>
          <p className="text-xs text-[#716D65] max-w-sm mx-auto mt-1">
            {searchQuery
              ? `No visitor sessions match "${searchQuery}". Try clearing your search query.`
              : 'Live visitors will appear here when people are actively browsing nexusworld.in.'}
          </p>
        </div>
      )}

      {/* Slide-over Visitor Detail Panel */}
      <VisitorDetailPanel
        visitor={selectedVisitor}
        onClose={() => setSelectedVisitor(null)}
        onOpenConversation={onOpenConversation}
      />
    </div>
  );
};
