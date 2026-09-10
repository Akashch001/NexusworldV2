import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  MessageSquare,
  Headphones,
  Sparkles,
  Send,
  XCircle,
  UserCheck,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { ConversationRecord, MessageRecord } from '../types';
import { supabase } from '../../../../lib/supabaseClient';

interface ConversationsViewProps {
  conversations: ConversationRecord[];
  currentUserId: string;
  currentUserName: string;
  selectedConversationId?: string;
  onRefreshConversations: () => Promise<void>;
  onNavigateToLeads?: () => void;
}

export const ConversationsView: React.FC<ConversationsViewProps> = ({
  conversations,
  currentUserId,
  currentUserName,
  selectedConversationId,
  onRefreshConversations,
  onNavigateToLeads,
}) => {
  const [filterState, setFilterState] = useState<'all' | 'human_requested' | 'ai' | 'human' | 'closed'>('all');
  const [selectedConv, setSelectedConv] = useState<ConversationRecord | null>(null);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isMobileListOpen, setIsMobileListOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Set initial selected conversation or respond to prop
  useEffect(() => {
    if (selectedConversationId) {
      const match = conversations.find((c) => c.id === selectedConversationId);
      if (match) setSelectedConv(match);
    } else if (!selectedConv && conversations.length > 0) {
      // Prioritize one waiting for human if available
      const waiting = conversations.find((c) => c.status === 'human_requested');
      setSelectedConv(waiting || conversations[0]);
    }
  }, [conversations, selectedConversationId, selectedConv]);

  // Load and subscribe to real-time messages for the selected conversation
  useEffect(() => {
    if (!selectedConv) {
      setMessages([]);
      return;
    }

    let isMounted = true;

    async function loadMessages() {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', selectedConv?.id)
        .order('created_at', { ascending: true });

      if (isMounted && data) {
        setMessages(data as MessageRecord[]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      }
    }

    loadMessages();

    // Subscribe to new messages in this conversation via Supabase Realtime
    const channel = supabase
      .channel(`admin_conv_${selectedConv.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConv.id}`,
        },
        (payload) => {
          if (isMounted) {
            setMessages((prev) => {
              const newMsg = payload.new as MessageRecord;
              if (prev.some((m) => m.id === newMsg.id)) {
                return prev; // Deduplicate
              }
              return [...prev, newMsg];
            });
            setTimeout(() => {
              const container = messagesEndRef.current?.parentElement;
              if (container) {
                // Smart auto-scroll: only scroll to bottom if we're already near the bottom
                const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
                if (isNearBottom) {
                  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }
              }
            }, 50);
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      channel.unsubscribe();
    };
  }, [selectedConv]);

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    if (filterState === 'all') return true;
    return c.status === filterState;
  });

  // Action: Take Over conversation (Andy takes over live from NORA)
  const handleTakeOver = async () => {
    if (!selectedConv) return;
    setActionLoading('takeover');
    try {
      const { error } = await supabase
        .from('conversations')
        .update({
          status: 'human',
          assigned_to: currentUserId,
          human_accepted_at: new Date().toISOString(),
        })
        .eq('id', selectedConv.id);

      if (!error) {
        // Post transition notification in chat transcript
        await supabase.from('messages').insert({
          conversation_id: selectedConv.id,
          role: 'system',
          content: `${currentUserName} (Founder) has joined the conversation to assist you directly.`,
          metadata: { sender: 'system', event: 'human_takeover' },
        });

        setSelectedConv((prev) => (prev ? { ...prev, status: 'human', assigned_to: currentUserId } : null));
        await onRefreshConversations();
      }
    } finally {
      setActionLoading(null);
    }
  };

  // Action: Return conversation control to NORA AI
  const handleReturnToAi = async () => {
    if (!selectedConv) return;
    setActionLoading('return_ai');
    try {
      const { error } = await supabase
        .from('conversations')
        .update({
          status: 'ai',
        })
        .eq('id', selectedConv.id);

      if (!error) {
        await supabase.from('messages').insert({
          conversation_id: selectedConv.id,
          role: 'system',
          content: `Conversation control returned to NORA AI Concierge.`,
          metadata: { sender: 'system', event: 'returned_to_ai' },
        });

        setSelectedConv((prev) => (prev ? { ...prev, status: 'ai' } : null));
        await onRefreshConversations();
      }
    } finally {
      setActionLoading(null);
    }
  };

  // Action: Close conversation
  const handleCloseConversation = async () => {
    if (!selectedConv) return;
    setActionLoading('close');
    try {
      const { error } = await supabase
        .from('conversations')
        .update({
          status: 'closed',
        })
        .eq('id', selectedConv.id);

      if (!error) {
        setSelectedConv((prev) => (prev ? { ...prev, status: 'closed' } : null));
        await onRefreshConversations();
      }
    } finally {
      setActionLoading(null);
    }
  };

  // Action: Send reply as Human operator (Andy)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedConv || isSending) return;

    setIsSending(true);
    const content = replyText.trim();
    setReplyText('');

    try {
      // Insert message as human
      await supabase.from('messages').insert({
        conversation_id: selectedConv.id,
        role: 'assistant', // Render as assistant bubble in visitor view but with human badge
        content,
        metadata: {
          sender: 'human',
          sender_name: currentUserName,
          operator_id: currentUserId,
        },
      });
    } catch {
      // Revert if failed
      setReplyText(content);
    } finally {
      setIsSending(false);
    }
  };

  const getStatusBadge = (status: ConversationRecord['status']) => {
    switch (status) {
      case 'human_requested':
        return (
          <span className="px-2 py-0.5 rounded text-[9px] uppercase font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
            Needs Human
          </span>
        );
      case 'human':
        return (
          <span className="px-2 py-0.5 rounded text-[9px] uppercase font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Andy Active
          </span>
        );
      case 'ai':
        return (
          <span className="px-2 py-0.5 rounded text-[9px] uppercase font-bold bg-[#2563EB]/20 text-[#3B82F6] border border-[#2563EB]/30">
            NORA Active
          </span>
        );
      case 'closed':
        return (
          <span className="px-2 py-0.5 rounded text-[9px] uppercase font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
            Closed
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 font-mono h-[calc(100vh-140px)] flex flex-col">
      
      {/* Filter Tabs Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#0A0A0F] border border-white/[0.08] shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setFilterState('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterState === 'all'
                ? 'bg-white/10 text-white font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            All ({conversations.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterState('human_requested')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              filterState === 'human_requested'
                ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                : 'text-zinc-400 hover:text-amber-400'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Waiting ({conversations.filter(c => c.status === 'human_requested').length})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterState('human')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterState === 'human'
                ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                : 'text-zinc-400 hover:text-emerald-400'
            }`}
          >
            Human Active ({conversations.filter(c => c.status === 'human').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterState('ai')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterState === 'ai'
                ? 'bg-[#2563EB]/20 text-[#3B82F6] font-bold border border-[#2563EB]/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            NORA Active ({conversations.filter(c => c.status === 'ai').length})
          </button>
        </div>

        <div className="text-[11px] text-zinc-400">
          Realtime WebSocket Synced
        </div>
      </div>

      {/* Operational Split Screen: Left List, Right Transcript & Takeover Console */}
      {conversations.length === 0 ? (
        <div className="flex-1 p-12 text-center rounded-2xl bg-[#0A0A0F] border border-white/[0.08] flex flex-col items-center justify-center space-y-3">
          <MessageSquare className="w-8 h-8 text-zinc-600" />
          <div className="text-sm font-bold text-white">NO CONVERSATIONS</div>
          <p className="text-xs text-zinc-400 max-w-md">
            No visitor conversations recorded yet. When a visitor opens NORA on nexusworld.in, the session transcript will stream live here.
          </p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Mobile Conversation Selector (Visible only on < lg) */}
          <div className="lg:hidden relative z-40 shrink-0">
            <button
              onClick={() => setIsMobileListOpen(!isMobileListOpen)}
              className="w-full bg-[#0A0A0F] border border-white/[0.08] rounded-xl p-3 flex justify-between items-center text-xs text-white shadow-lg"
            >
              <div className="flex items-center gap-2 truncate">
                {selectedConv ? (
                  <>
                    <span className="font-bold">Visitor #{selectedConv.visitor_id ? selectedConv.visitor_id.slice(-6).toUpperCase() : 'CLIENT'}</span>
                    {getStatusBadge(selectedConv.status)}
                  </>
                ) : (
                  <span className="text-zinc-500">Select a conversation...</span>
                )}
              </div>
              {isMobileListOpen ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
            </button>
            
            {isMobileListOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 max-h-[50vh] overflow-y-auto bg-[#0A0A0F] border border-white/[0.08] rounded-xl p-2 space-y-1 shadow-2xl divide-y divide-white/[0.04]">
                {filteredConversations.length === 0 ? (
                  <div className="p-4 text-center text-xs text-zinc-500">
                    No conversations in this filter.
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const isSelected = selectedConv?.id === conv.id;
                    const tokenSnippet = conv.visitor_id ? conv.visitor_id.slice(-6).toUpperCase() : 'CLIENT';
                    return (
                      <div
                        key={conv.id}
                        onClick={() => {
                          setSelectedConv(conv);
                          setIsMobileListOpen(false);
                        }}
                        className={`p-3 rounded-xl cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#2563EB]/15 border border-[#2563EB]/40'
                            : 'hover:bg-white/[0.02] border border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-xs text-white truncate">
                            Visitor #{tokenSnippet}
                          </span>
                          {getStatusBadge(conv.status)}
                        </div>
                        <div className="text-[11px] text-zinc-400 truncate mt-1">
                          {conv.title || 'NORA Session'}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Left: Conversations Queue List (4 cols - Desktop Only) */}
          <div className="hidden lg:block lg:col-span-4 bg-[#0A0A0F] border border-white/[0.08] rounded-2xl overflow-y-auto divide-y divide-white/[0.04] p-2 space-y-1">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                No conversations in this filter.
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = selectedConv?.id === conv.id;
                const tokenSnippet = conv.visitor_id ? conv.visitor_id.slice(-6).toUpperCase() : 'CLIENT';

                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConv(conv)}
                    className={`p-3 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#2563EB]/15 border border-[#2563EB]/40'
                        : 'hover:bg-white/[0.02] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-white truncate">
                        Visitor #{tokenSnippet}
                      </span>
                      {getStatusBadge(conv.status)}
                    </div>

                    <div className="text-[11px] text-zinc-400 truncate mt-1">
                      {conv.title || 'NORA Session'}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-2">
                      <span>{new Date(conv.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {conv.assigned_to && (
                        <span className="text-emerald-400 font-medium">Assigned: Andy</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right: Live Transcript & Takeover Controls (8 cols) */}
          <div className="lg:col-span-8 bg-[#0A0A0F] border border-white/[0.08] rounded-2xl flex flex-col overflow-hidden">
            {selectedConv ? (
              <>
                {/* Conversation Header & Action Controls */}
                <div className="p-4 border-b border-white/[0.08] bg-white/[0.02] flex flex-wrap items-center justify-between gap-3 shrink-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        TRANSCRIPT // {selectedConv.visitor_id ? `SESSION #${selectedConv.visitor_id.slice(-8).toUpperCase()}` : 'USER SESSION'}
                      </h3>
                      {getStatusBadge(selectedConv.status)}
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">
                      Started: {new Date(selectedConv.created_at).toLocaleString()}
                    </div>
                  </div>

                  {/* Operational Action Buttons */}
                  <div className="flex items-center gap-2">
                    {selectedConv.status === 'human_requested' && (
                      <button
                        type="button"
                        onClick={handleTakeOver}
                        disabled={actionLoading !== null}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-colors flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                      >
                        <Headphones className="w-3.5 h-3.5" />
                        <span>Take Over Now</span>
                      </button>
                    )}

                    {selectedConv.status === 'ai' && (
                      <button
                        type="button"
                        onClick={handleTakeOver}
                        disabled={actionLoading !== null}
                        className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs transition-colors flex items-center gap-1.5 border border-white/[0.08]"
                      >
                        <Headphones className="w-3.5 h-3.5" />
                        <span>Take Over</span>
                      </button>
                    )}

                    {selectedConv.status === 'human' && (
                      <button
                        type="button"
                        onClick={handleReturnToAi}
                        disabled={actionLoading !== null}
                        className="px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-500 text-white text-xs transition-colors flex items-center gap-1.5 shadow-[0_0_12px_rgba(37,99,235,0.3)]"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Return to NORA</span>
                      </button>
                    )}

                    {selectedConv.status !== 'closed' && (
                      <button
                        type="button"
                        onClick={handleCloseConversation}
                        disabled={actionLoading !== null}
                        className="px-2.5 py-1.5 rounded-lg bg-white/[0.03] hover:bg-red-500/20 text-zinc-400 hover:text-red-300 text-xs transition-colors border border-white/[0.06]"
                        title="Close conversation"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {onNavigateToLeads && (
                      <button
                        type="button"
                        onClick={onNavigateToLeads}
                        className="px-2.5 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] text-zinc-300 text-xs transition-colors border border-white/[0.06] flex items-center gap-1.5"
                        title="View Leads Pipeline"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-purple-400" />
                        <span className="hidden sm:inline">Leads</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Real-time Messages Stream */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="py-12 text-center text-xs text-zinc-500">
                      No messages recorded in this conversation.
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isUser = msg.role === 'user';
                      const isSystem = msg.role === 'system';
                      const isHuman = msg.metadata?.sender === 'human';

                      if (isSystem) {
                        return (
                          <div key={msg.id} className="text-center py-1">
                            <span className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] text-zinc-400 font-mono">
                              {msg.content}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col w-full max-w-[75%] ${
                            isUser ? 'mr-auto text-left items-start' : 'ml-auto text-right items-end'
                          }`}
                        >
                          {/* Sender Label */}
                          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mb-1 px-1 font-mono">
                            {isUser ? (
                              <span>Visitor</span>
                            ) : isHuman ? (
                              <span className="text-emerald-400 font-bold flex items-center gap-1">
                                <Headphones className="w-2.5 h-2.5" />
                                <span>{msg.metadata?.sender_name || 'Andy Watson'} (Founder)</span>
                              </span>
                            ) : (
                              <span className="text-[#3B82F6] font-bold flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>NORA AI</span>
                              </span>
                            )}
                            <span>•</span>
                            <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>

                          {/* Message Bubble */}
                          <div
                            className={`p-3 rounded-xl text-xs leading-relaxed text-left ${
                              isUser
                                ? 'bg-white/[0.05] border border-white/[0.08] text-zinc-200'
                                : isHuman
                                ? 'bg-emerald-600 text-white font-medium'
                                : 'bg-[#2563EB] text-white font-medium'
                            }`}
                          >
                            {isUser || isHuman ? (
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                            ) : (
                              <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-black/20 prose-pre:border prose-pre:border-white/10 prose-a:text-blue-200">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {msg.content}
                                </ReactMarkdown>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Human Operator Reply Console */}
                <div className="p-3 border-t border-white/[0.08] bg-white/[0.02]">
                  {selectedConv.status === 'closed' ? (
                    <div className="py-2 text-center text-xs text-zinc-500">
                      This conversation has been closed. Reopen by taking over to send new messages.
                    </div>
                  ) : (
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (replyText.trim() && !isSending) {
                              handleSendMessage(e as unknown as React.FormEvent);
                            }
                          }
                        }}
                        placeholder={
                          selectedConv.status === 'human'
                            ? 'Reply as Andy Watson (Live)...'
                            : 'Type reply (will send as Andy Watson)...'
                        }
                        className="flex-1 bg-white/[0.03] border border-white/[0.08] focus:border-[#2563EB] rounded-lg px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none transition-colors min-h-[44px] max-h-32 resize-none"
                        rows={1}
                      />

                      <button
                        type="submit"
                        disabled={!replyText.trim() || isSending}
                        className="px-4 py-2.5 rounded-lg bg-[#2563EB] hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                      >
                        {isSending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <span>Send</span>
                            <Send className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-zinc-500">
                Select a conversation from the queue to view transcript.
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
