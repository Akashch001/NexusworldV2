import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  User,
  Bot,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  ArrowDown,
  ArrowLeft,
  XCircle,
  Loader2,
  Radio,
} from 'lucide-react';
import type { ConversationRecord, VisitorSession, AdminUser } from '../warm-theme/tokens';
import { supabase } from '../../../lib/supabaseClient';

export interface ChatMessageRecord {
  id: string;
  conversation_id: string;
  user_id?: string | null;
  visitor_id?: string | null;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: {
    sender?: 'human' | 'ai' | 'visitor' | 'system';
    sender_id?: string;
    sender_name?: string;
    [key: string]: any;
  } | null;
  created_at: string;
  deliveryStatus?: 'sending' | 'sent' | 'failed';
}

interface ChatWindowProps {
  conversation: ConversationRecord;
  visitorSession?: VisitorSession;
  currentUser: AdminUser;
  onBack?: () => void;
  onStatusChange?: (newStatus: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  visitorSession,
  currentUser,
  onBack,
  onStatusChange,
}) => {
  const [messages, setMessages] = useState<ChatMessageRecord[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTakingHandoff, setIsTakingHandoff] = useState(false);
  const [isEndingChat, setIsEndingChat] = useState(false);
  const [handoffError, setHandoffError] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll helper
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  }, []);

  // Handle scroll to toggle scroll-to-bottom button
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 80;
    setShowScrollBottom(!isNearBottom);
  };

  // Fetch initial message history
  useEffect(() => {
    let isMounted = true;
    setIsLoadingMessages(true);

    async function loadMessages() {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: true });

        if (error) throw error;
        if (isMounted) {
          setMessages(
            (data || []).map((m: any) => ({
              ...m,
              deliveryStatus: 'sent',
            }))
          );
          setTimeout(() => scrollToBottom(false), 50);
        }
      } catch (err) {
        console.error('Error loading messages:', err);
      } finally {
        if (isMounted) setIsLoadingMessages(false);
      }
    }

    loadMessages();

    // Supabase Realtime Subscription for incoming messages
    const channel = supabase
      .channel(`admin_chat_${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessageRecord;
          setMessages((prev) => {
            // Deduplicate if already present (e.g. from local optimistic insert)
            if (prev.some((m) => m.id === newMsg.id)) {
              return prev.map((m) =>
                m.id === newMsg.id ? { ...newMsg, deliveryStatus: 'sent' } : m
              );
            }
            return [...prev, { ...newMsg, deliveryStatus: 'sent' }];
          });
          setTimeout(() => scrollToBottom(true), 50);
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      channel.unsubscribe();
    };
  }, [conversation.id, scrollToBottom]);

  // Atomic HAND OFF Action via PostgreSQL RPC
  const handleTakeHandoff = async () => {
    if (isTakingHandoff) return;
    setIsTakingHandoff(true);
    setHandoffError(null);

    try {
      const { error } = await supabase.rpc('claim_conversation', {
        p_conversation_id: conversation.id,
      });

      if (error) {
        console.error('Handoff claim error:', error);
        let userMessage = 'Unable to hand off this conversation. Please try again.';
        if (error.message?.includes('already been claimed')) {
          userMessage = 'This conversation has already been claimed by another agent.';
        } else if (error.message?.includes('Unauthorized') || error.message?.includes('Forbidden')) {
          userMessage = 'You do not have permission to claim this conversation.';
        } else if (error.message?.includes('not found')) {
          userMessage = 'This conversation could not be found.';
        } else if (error.message?.includes('closed')) {
          userMessage = 'This conversation has already been closed.';
        }
        setHandoffError(userMessage);
        return;
      }

      if (onStatusChange) onStatusChange('human');
    } catch (err: any) {
      console.error('Handoff network/unexpected error:', err);
      setHandoffError('Network error while claiming conversation. Please try again.');
    } finally {
      setIsTakingHandoff(false);
    }
  };

  // Atomic END CHAT Action via PostgreSQL RPC
  const handleEndChat = async () => {
    if (isEndingChat) return;
    if (!window.confirm('Are you sure you want to end and close this conversation?')) return;

    setIsEndingChat(true);

    try {
      const { error } = await supabase.rpc('end_conversation', {
        p_conversation_id: conversation.id,
      });

      if (error) {
        console.error('Error ending conversation:', error);
        alert(`Failed to end chat: ${error.message}`);
        return;
      }

      if (onStatusChange) onStatusChange('closed');
    } catch (err: any) {
      console.error('Unexpected error ending chat:', err);
      alert('Unable to close conversation. Please try again.');
    } finally {
      setIsEndingChat(false);
    }
  };

  // Send Human Agent Message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isSending) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: ChatMessageRecord = {
      id: tempId,
      conversation_id: conversation.id,
      user_id: currentUser.id,
      visitor_id: conversation.visitor_id,
      role: 'assistant',
      content: text,
      metadata: {
        sender: 'human',
        sender_id: currentUser.id,
        sender_name: 'Nexus Team',
      },
      created_at: new Date().toISOString(),
      deliveryStatus: 'sending',
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, optimisticMsg]);
    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsSending(true);
    setTimeout(() => scrollToBottom(true), 20);

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          user_id: currentUser.id,
          visitor_id: conversation.visitor_id,
          role: 'assistant',
          content: text,
          metadata: {
            sender: 'human',
            sender_id: currentUser.id,
            sender_name: 'Nexus Team',
          },
        })
        .select()
        .single();

      if (error) throw error;

      // Replace optimistic message with confirmed message
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...(data as ChatMessageRecord), deliveryStatus: 'sent' } : m
        )
      );

      // Update conversation updated_at timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversation.id);
    } catch (err) {
      // Mark as failed for retry
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...m, deliveryStatus: 'failed' } : m
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  // Retry a failed message
  const handleRetry = (msg: ChatMessageRecord) => {
    setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    handleSendMessage(msg.content);
  };

  // Textarea keydown: Enter to send, Shift+Enter for newline
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const isHumanActive = conversation.status === 'human';
  const isHumanRequested = conversation.status === 'human_requested';
  const isClosed = conversation.status === 'closed';

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FBF9F4] select-none text-[#242321] relative">
      {/* 1. Header */}
      <div className="px-4 py-3.5 border-b border-[#D9D4CA] flex items-center justify-between bg-[#F5F1E8]/70 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-1.5 rounded-md hover:bg-[#EEEAE1] text-[#716D65] hover:text-[#242321]"
              aria-label="Back to conversations list"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-[#242321]">
                {visitorSession?.ip_masked || 'Visitor'}
              </span>

              {/* Status Badge */}
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-medium ${
                  isHumanRequested
                    ? 'bg-[#B56A45] text-white animate-pulse'
                    : isHumanActive
                    ? 'bg-[#4F8A5B] text-white'
                    : isClosed
                    ? 'bg-[#EEEAE1] text-[#716D65]'
                    : 'bg-[#EEEAE1] text-[#242321]'
                }`}
              >
                {isHumanRequested
                  ? 'HUMAN REQUESTED'
                  : isHumanActive
                  ? 'HUMAN ACTIVE'
                  : isClosed
                  ? 'CLOSED'
                  : 'AI ACTIVE'}
              </span>
            </div>

            <div className="text-[11px] text-[#716D65] flex items-center gap-1.5 mt-0.5 truncate">
              <span>
                {visitorSession?.city ? `${visitorSession.city}, ` : ''}
                {visitorSession?.country?.split('|')[1] || visitorSession?.country || 'Global Location'}
              </span>
              <span>·</span>
              <span className="font-mono">{visitorSession?.current_url || '/'}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Hand Off Button */}
          {conversation.status !== 'human' && conversation.status !== 'closed' && (
            <button
              onClick={handleTakeHandoff}
              disabled={isTakingHandoff}
              className="px-3 py-1.5 rounded-md bg-[#B56A45] text-white text-xs font-medium hover:bg-[#A35936] transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              {isTakingHandoff ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Radio className="w-3.5 h-3.5" />
              )}
              <span>HAND OFF</span>
            </button>
          )}

          {/* End Chat Button */}
          {!isClosed && (
            <button
              onClick={handleEndChat}
              disabled={isEndingChat}
              className="px-2.5 py-1.5 rounded-md border border-[#D9D4CA] hover:bg-[#EEEAE1] text-[#716D65] hover:text-[#A83B3B] text-xs font-medium transition-colors flex items-center gap-1"
              title="Close and end conversation"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">END CHAT</span>
            </button>
          )}
        </div>
      </div>

      {/* Handoff Failure / Error Banner with Retry */}
      {handoffError && (
        <div className="px-4 py-2.5 bg-[#F9ECEC] border-b border-[#A83B3B]/30 text-[#A83B3B] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-medium">{handoffError}</span>
          </div>
          <button
            onClick={handleTakeHandoff}
            disabled={isTakingHandoff}
            className="px-2.5 py-1 bg-[#A83B3B] text-white rounded text-xs font-medium hover:bg-[#8F3232] transition-colors shrink-0 disabled:opacity-50"
          >
            {isTakingHandoff ? 'Retrying...' : 'Retry'}
          </button>
        </div>
      )}

      {/* 2. Operational Notice Banners */}
      {isHumanActive && (
        <div className="px-4 py-2.5 bg-[#EEF5F0] border-b border-[#4F8A5B]/20 text-[#4F8A5B] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#4F8A5B] animate-pulse shrink-0" />
            <span className="font-medium">
              ● HUMAN ACTIVE — NORA has stopped responding. Handled by Nexus Team.
            </span>
          </div>
          <div className="text-[11px] text-[#4F8A5B]/90 font-mono flex items-center gap-2 shrink-0">
            <span>
              Claimed by {conversation.assigned_to === currentUser.id ? 'You' : 'Nexus Team'}
            </span>
            {conversation.human_accepted_at && (
              <>
                <span>·</span>
                <span>
                  Claimed at {new Date(conversation.human_accepted_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {isHumanRequested && (
        <div className="px-4 py-2.5 bg-[#F8F1EC] border-b border-[#B56A45]/30 text-[#B56A45] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-medium">
              HUMAN REQUESTED — Visitor is waiting for an agent. Click "HAND OFF" to join and reply.
            </span>
          </div>
        </div>
      )}

      {isClosed && (
        <div className="px-4 py-2 bg-[#EEEAE1] border-b border-[#D9D4CA] text-[#716D65] text-xs text-center font-mono">
          CONVERSATION CLOSED — Read-only transcript
        </div>
      )}

      {/* 3. Messages Stream */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4"
      >
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-48 text-[#716D65] gap-2 text-xs">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading conversation transcript...</span>
          </div>
        ) : messages.length > 0 ? (
          messages.map((msg) => {
            const isVisitor = msg.role === 'user';
            const isSystem = msg.role === 'system';
            const isHumanOperator =
              msg.metadata?.sender === 'human' ||
              (msg.role === 'assistant' && msg.user_id && isHumanActive);

            const timeStr = new Date(msg.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <div className="px-3 py-1 rounded-full bg-[#EEEAE1] text-[#716D65] text-[11px] font-mono border border-[#D9D4CA] text-center max-w-md">
                    {msg.content}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isVisitor ? 'items-start' : 'items-end'}`}
              >
                {/* Sender Identity Label */}
                <div className="flex items-center gap-1.5 text-[10px] text-[#716D65] mb-1 px-1 font-mono">
                  {isVisitor ? (
                    <>
                      <User className="w-3 h-3" />
                      <span>{visitorSession?.ip_masked || 'Visitor'}</span>
                    </>
                  ) : isHumanOperator ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4F8A5B]" />
                      <span className="font-semibold text-[#242321]">
                        {msg.metadata?.sender_name || 'Nexus Team'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Bot className="w-3 h-3" />
                      <span>NORA (AI)</span>
                    </>
                  )}
                  <span>·</span>
                  <span>{timeStr}</span>
                </div>

                {/* Speech Bubble */}
                <div
                  className={`max-w-xl rounded-2xl px-4 py-2.5 text-xs md:text-sm leading-relaxed whitespace-pre-wrap break-words shadow-2xs ${
                    isVisitor
                      ? 'bg-[#EEEAE1] text-[#242321] rounded-tl-xs border border-[#D9D4CA]'
                      : isHumanOperator
                      ? 'bg-[#242321] text-[#F5F1E8] rounded-tr-xs'
                      : 'bg-[#FBF9F4] text-[#242321] rounded-tr-xs border border-[#D9D4CA]'
                  }`}
                >
                  {msg.content}
                </div>

                {/* Delivery & Failure State */}
                {!isVisitor && msg.deliveryStatus && (
                  <div className="flex items-center gap-1 text-[10px] text-[#716D65] mt-1 px-1 font-mono">
                    {msg.deliveryStatus === 'sending' && <span>Sending...</span>}
                    {msg.deliveryStatus === 'sent' && (
                      <span className="flex items-center gap-1 text-[#4F8A5B]">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Sent</span>
                      </span>
                    )}
                    {msg.deliveryStatus === 'failed' && (
                      <div className="flex items-center gap-1.5 text-[#A83B3B]">
                        <AlertCircle className="w-3 h-3" />
                        <span>Failed</span>
                        <button
                          onClick={() => handleRetry(msg)}
                          className="underline hover:text-[#242321] flex items-center gap-0.5"
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
                          <span>Retry</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-[#716D65] text-xs">
            <Bot className="w-8 h-8 mb-2 opacity-40" />
            <span>No messages recorded in this conversation yet.</span>
          </div>
        )}
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom(true)}
          className="absolute right-6 bottom-24 p-2 rounded-full bg-[#242321] text-white shadow-lg hover:bg-[#383633] transition-all z-20"
          aria-label="Scroll to bottom"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* 4. Chat Composer (Fixed to Safe Bottom Area) */}
      <div className="p-3 md:p-4 border-t border-[#D9D4CA] bg-[#F5F1E8] shrink-0">
        {isClosed ? (
          <div className="p-2.5 text-center text-xs text-[#716D65] bg-[#FBF9F4] rounded-lg border border-[#D9D4CA]">
            This conversation is closed. Re-opening is not available from the operator console.
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-end gap-2 bg-[#FBF9F4] border border-[#D9D4CA] rounded-xl p-1.5 focus-within:border-[#242321] transition-colors shadow-2xs">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  // Auto-adjust height up to 120px
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                onKeyDown={handleKeyDown}
                placeholder={
                  isHumanActive
                    ? "Type message as Nexus Team (Enter to send, Shift+Enter for new line)..."
                    : "Take handoff to chat with this visitor..."
                }
                rows={1}
                disabled={!isHumanActive || isSending}
                className="flex-1 max-h-32 px-2.5 py-1.5 text-xs md:text-sm bg-transparent border-none text-[#242321] placeholder-[#716D65] focus:outline-none resize-none leading-relaxed disabled:opacity-50"
              />

              <button
                onClick={() => handleSendMessage()}
                disabled={!isHumanActive || !inputValue.trim() || isSending}
                className="p-2 rounded-lg bg-[#242321] text-[#F5F1E8] hover:bg-[#383633] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                aria-label="Send message"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between px-1 text-[10px] text-[#716D65] font-mono">
              <span>
                Sending as <strong className="text-[#242321]">Nexus Team</strong>
              </span>
              <span>Enter to send · Shift+Enter for newline</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
