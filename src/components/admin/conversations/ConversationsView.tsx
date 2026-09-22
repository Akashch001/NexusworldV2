import React, { useState, useMemo, useEffect } from 'react';
import {
  MessageSquare,
  Search,
} from 'lucide-react';
import type { ConversationRecord, VisitorSession, AdminUser } from '../warm-theme/tokens';
import { ChatWindow } from './ChatWindow';

interface ConversationsViewProps {
  conversations: ConversationRecord[];
  sessions: VisitorSession[];
  currentUser: AdminUser;
  initialSelectedId?: string;
  defaultFilter?: 'all' | 'handoffs';
  onRefresh?: () => void;
}

function timeAgo(dateString: string): string {
  const diffSec = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diffSec < 10) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

export const ConversationsView: React.FC<ConversationsViewProps> = ({
  conversations,
  sessions,
  currentUser,
  initialSelectedId,
  defaultFilter = 'all',
  onRefresh,
}) => {
  const [selectedConvId, setSelectedConvId] = useState<string | null>(
    initialSelectedId || (conversations[0]?.id ?? null)
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'human_requested' | 'human' | 'closed'>(
    defaultFilter === 'handoffs' ? 'human_requested' : 'all'
  );

  // Sync if initialSelectedId changes externally
  useEffect(() => {
    if (initialSelectedId) {
      setSelectedConvId(initialSelectedId);
    }
  }, [initialSelectedId]);

  // Map visitor sessions by token
  const sessionByVisitorToken = useMemo(() => {
    const map = new Map<string, VisitorSession>();
    sessions.forEach((s) => {
      map.set(s.visitor_token, s);
    });
    return map;
  }, [sessions]);

  // Counts
  const humanRequestedCount = useMemo(
    () => conversations.filter((c) => c.status === 'human_requested').length,
    [conversations]
  );
  const humanActiveCount = useMemo(
    () => conversations.filter((c) => c.status === 'human').length,
    [conversations]
  );

  // Filtered list
  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      // Status filter
      if (statusFilter === 'human_requested' && conv.status !== 'human_requested') return false;
      if (statusFilter === 'human' && conv.status !== 'human') return false;
      if (statusFilter === 'closed' && conv.status !== 'closed') return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchedSession = conv.visitor_id ? sessionByVisitorToken.get(conv.visitor_id) : null;
        const ip = (matchedSession?.ip_masked || '').toLowerCase();
        const city = (matchedSession?.city || '').toLowerCase();
        const country = (matchedSession?.country || '').toLowerCase();
        const reason = (conv.handoff_reason || '').toLowerCase();
        const id = conv.id.toLowerCase();

        if (!ip.includes(q) && !city.includes(q) && !country.includes(q) && !reason.includes(q) && !id.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [conversations, statusFilter, searchQuery, sessionByVisitorToken]);

  // Selected conversation object
  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === selectedConvId) || null;
  }, [conversations, selectedConvId]);

  const activeVisitorSession = useMemo(() => {
    if (!activeConversation?.visitor_id) return undefined;
    return sessionByVisitorToken.get(activeConversation.visitor_id);
  }, [activeConversation, sessionByVisitorToken]);

  return (
    <div className="flex-1 flex h-full min-h-0 bg-[#F5F1E8] antialiased select-none text-[#242321]">
      {/* 1. Left Conversation List Column */}
      <div
        className={`w-full md:w-80 lg:w-96 flex flex-col shrink-0 bg-[#FBF9F4] border-r border-[#D9D4CA] h-full ${
          activeConversation ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Inbox Header */}
        <div className="p-4 border-b border-[#D9D4CA] space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-base font-semibold tracking-tight text-[#242321]">
              Conversations
            </h1>
            <div className="flex items-center gap-1.5">
              {humanRequestedCount > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#B56A45] text-white animate-pulse">
                  {humanRequestedCount} REQUESTS
                </span>
              )}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#716D65]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by IP, city, or reason..."
              className="w-full pl-8 pr-3 py-1.5 rounded-md bg-[#F5F1E8] border border-[#D9D4CA] text-xs text-[#242321] placeholder-[#716D65] focus:outline-none focus:border-[#242321] transition-colors"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 p-0.5 bg-[#F5F1E8] border border-[#D9D4CA] rounded-md text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`flex-1 py-1 text-center rounded transition-colors text-[11px] ${
                statusFilter === 'all'
                  ? 'bg-[#FBF9F4] font-semibold text-[#242321] shadow-2xs'
                  : 'text-[#716D65] hover:text-[#242321]'
              }`}
            >
              All ({conversations.length})
            </button>
            <button
              onClick={() => setStatusFilter('human_requested')}
              className={`flex-1 py-1 text-center rounded transition-colors text-[11px] ${
                statusFilter === 'human_requested'
                  ? 'bg-[#FBF9F4] font-semibold text-[#B56A45] shadow-2xs'
                  : 'text-[#716D65] hover:text-[#B56A45]'
              }`}
            >
              Requests ({humanRequestedCount})
            </button>
            <button
              onClick={() => setStatusFilter('human')}
              className={`flex-1 py-1 text-center rounded transition-colors text-[11px] ${
                statusFilter === 'human'
                  ? 'bg-[#FBF9F4] font-semibold text-[#4F8A5B] shadow-2xs'
                  : 'text-[#716D65] hover:text-[#4F8A5B]'
              }`}
            >
              Active ({humanActiveCount})
            </button>
            <button
              onClick={() => setStatusFilter('closed')}
              className={`flex-1 py-1 text-center rounded transition-colors text-[11px] ${
                statusFilter === 'closed'
                  ? 'bg-[#FBF9F4] font-semibold text-[#242321] shadow-2xs'
                  : 'text-[#716D65] hover:text-[#242321]'
              }`}
            >
              Closed
            </button>
          </div>
        </div>

        {/* Conversation List Stream */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#D9D4CA]/60">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => {
              const matchedSession = conv.visitor_id
                ? sessionByVisitorToken.get(conv.visitor_id)
                : null;
              const ip = matchedSession?.ip_masked || 'Visitor';
              const location = matchedSession?.city
                ? `${matchedSession.city}, ${matchedSession.country?.split('|')[1] || matchedSession.country}`
                : matchedSession?.country?.split('|')[1] || 'Global Location';

              const isSelected = selectedConvId === conv.id;
              const isHumanReq = conv.status === 'human_requested';
              const isHumanActive = conv.status === 'human';
              const isClosed = conv.status === 'closed';

              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  className={`p-3.5 transition-colors cursor-pointer text-xs ${
                    isSelected
                      ? 'bg-[#EEEAE1]'
                      : isHumanReq
                      ? 'bg-[#F8F1EC] hover:bg-[#F3E7DF]'
                      : 'hover:bg-[#F5F1E8]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5 font-mono font-semibold text-[#242321]">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isHumanReq
                            ? 'bg-[#B56A45] animate-pulse'
                            : isHumanActive
                            ? 'bg-[#4F8A5B]'
                            : isClosed
                            ? 'bg-[#7C766C]'
                            : 'bg-[#EEEAE1] border border-[#7C766C]'
                        }`}
                      />
                      <span className="truncate">{ip}</span>
                    </div>

                    <span className="text-[10px] text-[#716D65] font-mono shrink-0">
                      {timeAgo(conv.updated_at || conv.created_at)}
                    </span>
                  </div>

                  <div className="text-[11px] text-[#716D65] truncate">
                    {location}
                  </div>

                  {conv.handoff_reason && (
                    <div className="mt-1 text-[11px] text-[#B56A45] font-medium truncate">
                      {conv.handoff_reason}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#D9D4CA]/40 text-[10px] font-mono">
                    <span
                      className={`px-1.5 py-0.2 rounded font-medium ${
                        isHumanReq
                          ? 'bg-[#B56A45] text-white'
                          : isHumanActive
                          ? 'bg-[#4F8A5B] text-white'
                          : isClosed
                          ? 'bg-[#EEEAE1] text-[#716D65]'
                          : 'bg-[#EEEAE1] text-[#242321]'
                      }`}
                    >
                      {isHumanReq
                        ? 'HUMAN REQUESTED'
                        : isHumanActive
                        ? 'HUMAN ACTIVE'
                        : isClosed
                        ? 'CLOSED'
                        : 'AI ACTIVE'}
                    </span>

                    {matchedSession?.current_url && (
                      <span className="text-[#716D65] truncate max-w-[120px]">
                        {matchedSession.current_url}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-[#716D65]">
              {searchQuery
                ? `No conversations matching "${searchQuery}"`
                : statusFilter === 'human_requested'
                ? 'No human requests in queue.'
                : 'No conversations found.'}
            </div>
          )}
        </div>
      </div>

      {/* 2. Right Active Chat Stage */}
      <div
        className={`flex-1 flex flex-col h-full ${
          !activeConversation ? 'hidden md:flex' : 'flex'
        }`}
      >
        {activeConversation ? (
          <ChatWindow
            conversation={activeConversation}
            visitorSession={activeVisitorSession}
            currentUser={currentUser}
            onBack={() => setSelectedConvId(null)}
            onStatusChange={() => {
              if (onRefresh) onRefresh();
            }}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#716D65]">
            <div className="w-12 h-12 rounded-full bg-[#EEEAE1] flex items-center justify-center mb-3">
              <MessageSquare className="w-6 h-6 text-[#716D65]" />
            </div>
            <h3 className="text-sm font-semibold text-[#242321]">
              Select a conversation
            </h3>
            <p className="text-xs text-[#716D65] max-w-xs mt-1">
              Choose an active thread or human request from the inbox list on the left to start chatting in real time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
