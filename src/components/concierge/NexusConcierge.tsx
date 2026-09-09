import React, { useState, useEffect, useRef } from 'react';
import {
  type ConciergeVisualState,
  type ProjectIntelligence,
  type ProgressiveIntentStage,
  type ChatMessage,
  type MockTimeSlot,
  type NexusCharacter,
  INITIAL_INTELLIGENCE,
  NEXUS_CHARACTERS,
  calculateIntelligenceCompletion,
} from '../../data/conciergeData';
import { PixelAgent } from './PixelAgent';
import { ProjectIntelligencePanel } from './ProjectIntelligencePanel';
import { supabase } from '../../lib/supabaseClient';
import { ConsultationBookingView } from './ConsultationBookingView';
import { ProjectBriefView } from './ProjectBriefView';
import { getOrCreateSessionToken } from '../../hooks/useVisitorTelemetry';
import {
  X,
  Send,
  RotateCcw,
  Sliders,
} from 'lucide-react';

interface NexusConciergeProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NexusConcierge: React.FC<NexusConciergeProps> = ({ isOpen, onClose }) => {
  const [visualState, setVisualState] = useState<ConciergeVisualState>('IDLE');
  const [intelligence, setIntelligence] = useState<ProjectIntelligence>(INITIAL_INTELLIGENCE);
  const [viewMode, setViewMode] = useState<'chat' | 'booking' | 'brief'>('chat');
  const [bookedSlot, setBookedSlot] = useState<MockTimeSlot | null>(null);
  const [mobileIntelligenceOpen, setMobileIntelligenceOpen] = useState<boolean>(false);
  const [activeCharacter, setActiveCharacter] = useState<NexusCharacter>('NORA');

  const conversationIdRef = useRef<string | null>(null);
  const [inputVal, setInputVal] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'ai',
      text: "NEXUS INTELLIGENCE // SYSTEM ONLINE. I'm NORA. I help you understand what you're building, what's getting in the way, and where Nexus World can help.",
      timestamp: '11:00 EST',
      suggestions: [
        "We're a SaaS startup needing a complete UX/UI redesign",
        "Building an AI product experience from scratch",
        "Need high-craft frontend engineering & design system",
        "Just exploring NexusWorld capabilities",
      ],
      intentBadge: 'EXPLORING',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Log NORA opened event
  useEffect(() => {
    if (isOpen) {
      setVisualState('OBSERVING');
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

      // Log to visitor_events
      try {
        const token = getOrCreateSessionToken();
        supabase.from('visitor_events').insert({
          visitor_token: token,
          event_type: 'concierge',
          event_name: 'nora_opened',
          metadata: { timestamp: new Date().toISOString() }
        }).then(() => {});
      } catch {
        // Silent
      }
    } else {
      setVisualState('IDLE');
    }
  }, [isOpen, messages, viewMode]);

  // Subscribe to realtime messages if conversationId is established
  useEffect(() => {
    const convId = conversationIdRef.current;
    if (!convId) return;

    const channel = supabase
      .channel(`vis_concierge_${convId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${convId}`,
        },
        (payload) => {
          const newMsg = payload.new as any;
          // If human operator (Andy Watson) sent message, display to visitor in real time
          if (newMsg && (newMsg.metadata?.sender === 'human' || newMsg.role === 'system')) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              const isOperator = newMsg.metadata?.sender === 'human';
              return [
                ...prev,
                {
                  id: newMsg.id,
                  sender: 'ai',
                  text: isOperator ? `[Andy Watson]: ${newMsg.content}` : newMsg.content,
                  timestamp: new Date(newMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  intentBadge: isOperator ? 'CONSULTATION_OFFERED' : undefined,
                },
              ];
            });
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  if (!isOpen) return null;

  const handleUpdateIntelligence = (updated: Partial<ProjectIntelligence>) => {
    setIntelligence((prev) => ({
      ...prev,
      ...updated,
      contact: { ...prev.contact, ...(updated.contact || {}) },
      business: { ...prev.business, ...(updated.business || {}) },
      digital: { ...prev.digital, ...(updated.digital || {}) },
      project: { ...prev.project, ...(updated.project || {}) },
    }));
    setVisualState('SUCCESS');
    setTimeout(() => setVisualState('IDLE'), 1200);
  };

  // Conversational response engine with progressive extraction
  const processUserMessage = (text: string) => {
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setVisualState('THINKING');

    const lower = text.toLowerCase();

    setTimeout(() => {
      setVisualState('RESPONDING');

      // 1. Check if user accepts consultation booking
      if (
        intelligence.intent === 'CONSULTATION_OFFERED' &&
        (lower.includes('yes') || lower.includes('sure') || lower.includes('schedule') || lower.includes('book') || lower.includes('sounds good') || lower.includes('ready'))
      ) {
        setIntelligence((prev) => ({ ...prev, intent: 'BOOKING_ENGAGED' }));
        setVisualState('BOOKING');
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: "Excellent. Let's select an alignment window for your roadmap consultation with Andy Watson.",
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          intentBadge: 'BOOKING_ENGAGED',
        };
        setMessages((prev) => [...prev, aiMsg]);
        setTimeout(() => setViewMode('booking'), 900);
        return;
      }

      // 2. Check for project context (SaaS, website, AI, etc.)
      let updatedIntelligence = { ...intelligence };
      let aiResponseText = '';
      let suggestions: string[] = [];
      let newIntent: ProgressiveIntentStage = intelligence.intent;

      // Extract business / project signals
      if (lower.includes('saas') || lower.includes('startup') || lower.includes('tech') || lower.includes('ecommerce') || lower.includes('agency')) {
        const type = lower.includes('saas') ? 'SaaS' : lower.includes('startup') ? 'Startup' : lower.includes('ecommerce') ? 'E-commerce' : 'Technology';
        updatedIntelligence.business.businessType = type;
        if (!updatedIntelligence.business.companyName) {
          // Attempt to extract company name if mentioned
          const match = text.match(/(?:at|for|company is|called)\s+([A-Z][A-Za-z0-9]+)/);
          if (match && match[1]) updatedIntelligence.business.companyName = match[1];
        }
      }

      if (lower.includes('redesign') || lower.includes('outdated') || lower.includes('ui') || lower.includes('ux') || lower.includes('website') || lower.includes('app')) {
        newIntent = 'PROJECT_INQUIRY';
        updatedIntelligence.project.need = updatedIntelligence.project.need || 'Digital Product / Website Redesign';
        if (lower.includes('outdated') || lower.includes('ugly') || lower.includes('slow') || lower.includes('confusing')) {
          updatedIntelligence.project.problem = 'Current digital experience is outdated or causing conversion drop-off';
        }
        if (!updatedIntelligence.project.services.includes('UI/UX Design')) {
          updatedIntelligence.project.services = [...updatedIntelligence.project.services, 'UI/UX Design', 'Frontend Engineering'];
        }
      }

      if (lower.includes('ai') || lower.includes('automation') || lower.includes('workflow')) {
        newIntent = 'PROJECT_INQUIRY';
        updatedIntelligence.project.need = 'AI-Powered Digital Experience & Workflow Automation';
        if (!updatedIntelligence.project.services.includes('AI Experiences')) {
          updatedIntelligence.project.services = [...updatedIntelligence.project.services, 'AI Experiences'];
        }
      }

      // Extract Website / App status
      if (lower.includes('existing website') || lower.includes('have a website') || lower.includes('our site') || lower.includes('.com') || lower.includes('.in') || lower.includes('.io')) {
        updatedIntelligence.digital.hasWebsite = 'Yes';
        const urlMatch = text.match(/([a-zA-Z0-9-]+\.(?:com|in|io|co|org|net|app|dev))/i);
        if (urlMatch) updatedIntelligence.digital.websiteUrl = urlMatch[0];
      } else if (lower.includes('from scratch') || lower.includes('starting from zero') || lower.includes('no website')) {
        updatedIntelligence.digital.hasWebsite = 'No';
      }

      // Extract Timeline
      if (lower.includes('asap') || lower.includes('immediately')) {
        updatedIntelligence.project.timeline = 'ASAP';
      } else if (lower.includes('this month') || lower.includes('few weeks')) {
        updatedIntelligence.project.timeline = 'This month';
      } else if (lower.includes('1-3') || lower.includes('1 to 3') || lower.includes('couple months')) {
        updatedIntelligence.project.timeline = '1–3 months';
      } else if (lower.includes('3-6') || lower.includes('exploring')) {
        updatedIntelligence.project.timeline = '3–6 months';
      }

      // Extract Contact Details (Name, Email, Phone)
      const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) {
        updatedIntelligence.contact.email = emailMatch[0];
      }

      const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      if (phoneMatch) {
        updatedIntelligence.contact.phoneNumber = phoneMatch[0];
      }

      if (!updatedIntelligence.contact.fullName && (lower.includes('my name is') || lower.includes("i'm ") || lower.includes('im ') || lower.includes('call me '))) {
        const nameMatch = text.match(/(?:my name is|i'm|im|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
        if (nameMatch && nameMatch[1]) updatedIntelligence.contact.fullName = nameMatch[1];
      }

      // Progress Intent & Formulate Next Conversational Step
      const completion = calculateIntelligenceCompletion(updatedIntelligence);
      if (completion.capturedCount >= 3 && newIntent === 'EXPLORING') {
        newIntent = 'PROJECT_INQUIRY';
      }

      if (!updatedIntelligence.digital.hasWebsite || updatedIntelligence.digital.hasWebsite === 'Unknown') {
        aiResponseText = "Understood. That directly matches what we engineer. Do you currently have an existing website or app, or are we architecting this completely from scratch?";
        suggestions = ["We have an existing website", "Starting completely from scratch", "We have a mobile app but no web presence"];
      } else if (!updatedIntelligence.business.companyName && !updatedIntelligence.contact.fullName) {
        aiResponseText = "Got it. Before I synthesize the project parameters for Andy Watson, what is your name and company or business name?";
        suggestions = ["I'm Elena from NexaCore", "Alex from Continuum Labs", "Personal stealth project"];
      } else if (!updatedIntelligence.contact.email) {
        newIntent = 'QUALIFIED';
        aiResponseText = `Thank you, ${updatedIntelligence.contact.fullName || 'there'}. What is the best email address to send your technical project brief to? (And optionally, a phone number if preferred for WhatsApp/calls).`;
        suggestions = ["Enter email above", "contact@mycompany.com"];
      } else {
        // High Intent & Snapshot synthesis
        newIntent = 'CONSULTATION_OFFERED';
        aiResponseText = `Here is what I have synthesized for NexusWorld:\n\n• Entity: ${updatedIntelligence.business.companyName || updatedIntelligence.business.businessType || 'Digital Venture'}\n• Core Need: ${updatedIntelligence.project.need || 'Digital Product Engineering'}\n• Friction: ${updatedIntelligence.project.problem || 'Outdated UX / scalability limitations'}\n• Disciplines: ${updatedIntelligence.project.services.join(', ') || 'UI/UX & Frontend'}\n• Timeline: ${updatedIntelligence.project.timeline}\n\nDoes this accurately represent your goals? If so, would you like to explore scheduling a 30-minute consultation with Andy Watson?`;
        suggestions = ["Yes, let's schedule a consultation", "Actually, I need to adjust a detail", "Just send the brief to my email"];
      }

      // Generate dynamic response using AI Backend
      const fetchAIResponse = async () => {
        try {
          if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
             throw new Error('Supabase not configured');
          }
          const { data, error } = await supabase.functions.invoke('nexus-intelligence', {
            body: {
              messages: [...messages, userMsg],
              activeCharacter: activeCharacter,
              context: updatedIntelligence,
              projectId: null,
              visitorId: getOrCreateSessionToken(),
              conversationId: conversationIdRef.current,
            }
          });
          if (error) throw error;
          if (data?.conversationId) {
            conversationIdRef.current = data.conversationId;
          }
          return data.response;
        } catch (err: any) {
          console.error('AI Backend Error:', err);
          // If the AI fails (e.g. Quota Exhausted), we MUST override the hardcoded onboarding question.
          // Otherwise, NORA will reply with unrelated stale content.
          return "My intelligence backend is currently experiencing heavy load or quota limits. Please leave your contact details or try again shortly, and Andy will reach out directly.";
        }
      };

      fetchAIResponse().then((realAiResponse) => {
         if (realAiResponse) {
             aiResponseText = realAiResponse;
         }

         updatedIntelligence.intent = newIntent;
         setIntelligence(updatedIntelligence);

         const aiMsg: ChatMessage = {
           id: `ai-${Date.now()}`,
           sender: 'ai',
           text: aiResponseText,
           timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
           suggestions,
           intentBadge: newIntent,
         };

         setMessages((prev) => [...prev, aiMsg]);
         setVisualState(newIntent === 'CONSULTATION_OFFERED' ? 'SUCCESS' : 'IDLE');
      });
    }, 650);
  };

  const handleSend = () => {
    if (!inputVal.trim()) return;
    processUserMessage(inputVal);
  };

  const handleReset = () => {
    setIntelligence(INITIAL_INTELLIGENCE);
    setViewMode('chat');
    setBookedSlot(null);
    setMessages([
      {
        id: 'm1',
        sender: 'ai',
        text: `NEXUS INTELLIGENCE // SYSTEM ONLINE. I'm ${activeCharacter}. I help you understand what you're building, what's getting in the way, and where Nexus World can help.`,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        suggestions: [
          "We're a SaaS startup needing a complete UX/UI redesign",
          "Building an AI product experience from scratch",
          "Need high-craft frontend engineering & design system",
        ],
        intentBadge: 'EXPLORING',
      },
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Outer Modal Container */}
      <div className="relative w-full max-w-5xl h-[92vh] sm:h-[680px] bg-void-card border border-white/[0.1] rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08] bg-void-surface">
          <div className="flex items-center gap-3">
            <PixelAgent state={visualState} size={32} showLabel={false} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-sm text-white tracking-wider">
                  {NEXUS_CHARACTERS[activeCharacter].name}
                </span>
                <span className="telemetry-tag px-1.5 py-0.2 rounded bg-signal/15 text-signal-bright border border-signal/30 text-[9px] uppercase">
                  {NEXUS_CHARACTERS[activeCharacter].role}
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">
                NEXUS INTELLIGENCE · {NEXUS_CHARACTERS[activeCharacter].tagline}
              </span>
            </div>
          </div>

          {/* Character Selector */}
          <div className="hidden md:flex items-center gap-1.5 absolute left-1/2 -translate-x-1/2">
            {(Object.keys(NEXUS_CHARACTERS) as NexusCharacter[]).map((char) => (
              <button
                key={char}
                onClick={() => {
                   setActiveCharacter(char);
                   setMessages([{
                      id: `m1-${char}`,
                      sender: 'ai',
                      text: `NEXUS INTELLIGENCE // ${char} ONLINE. ${NEXUS_CHARACTERS[char].description}`,
                      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                      suggestions: ["What do you specialize in?", "Let's discuss my project"],
                      intentBadge: 'EXPLORING',
                   }]);
                }}
                className={`px-2 py-1 text-[10px] font-mono transition-all ${
                  activeCharacter === char 
                    ? 'text-signal-bright' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                [{char}]
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* View switcher buttons if past exploring */}
            {intelligence.intent !== 'EXPLORING' && (
              <div className="hidden sm:flex items-center gap-1 bg-void-deep p-1 rounded-lg border border-white/[0.04] text-xs font-mono">
                <button
                  onClick={() => setViewMode('chat')}
                  className={`px-2.5 py-1 rounded transition-all ${
                    viewMode === 'chat' ? 'bg-signal text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Conversation
                </button>
                <button
                  onClick={() => setViewMode('booking')}
                  className={`px-2.5 py-1 rounded transition-all ${
                    viewMode === 'booking' ? 'bg-signal text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Consultation
                </button>
                {bookedSlot && (
                  <button
                    onClick={() => setViewMode('brief')}
                    className={`px-2.5 py-1 rounded transition-all ${
                      viewMode === 'brief' ? 'bg-signal text-white' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Project Brief
                  </button>
                )}
              </div>
            )}

            {/* Mobile Project Intelligence Toggle Button */}
            <button
              onClick={() => setMobileIntelligenceOpen(!mobileIntelligenceOpen)}
              className="lg:hidden px-2.5 py-1.5 rounded bg-void-deep border border-white/10 text-[11px] font-mono text-zinc-300 flex items-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5 text-signal" />
              <span>Signals</span>
            </button>

            <button
              onClick={handleReset}
              className="p-1.5 rounded text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors"
              title="Reset Conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              aria-label="Close Intelligence"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Split Dual Pane (Conversation + Project Intelligence) */}
        <div className="flex-1 overflow-hidden relative flex">
          
          {/* Main Panel View Switching */}
          {viewMode === 'booking' ? (
            <div className="w-full h-full p-4">
              <ConsultationBookingView
                intelligence={intelligence}
                onConfirmBooking={(slot) => {
                  setBookedSlot(slot);
                  setIntelligence((prev) => ({ ...prev, intent: 'CONFIRMED' }));
                  setViewMode('brief');
                }}
                onBackToChat={() => setViewMode('chat')}
              />
            </div>
          ) : viewMode === 'brief' ? (
            <div className="w-full h-full p-4">
              <ProjectBriefView
                intelligence={intelligence}
                bookedSlot={bookedSlot}
                onClose={onClose}
                onReset={handleReset}
              />
            </div>
          ) : (
            <>
              {/* Left/Center: Conversation Area */}
              <div className="flex-1 flex flex-col h-full bg-void">
                
                {/* Messages Stream */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                  {messages.map((m) => {
                    const isAi = m.sender === 'ai';
                    return (
                      <div
                        key={m.id}
                        className={`flex gap-3 max-w-2xl ${isAi ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                      >
                        {isAi && (
                          <div className="w-7 h-7 rounded overflow-hidden border border-white/10 shrink-0 bg-void-surface">
                            <PixelAgent state={visualState} size={28} showLabel={false} />
                          </div>
                        )}

                        <div className={`space-y-2 ${isAi ? 'text-left' : 'text-right'}`}>
                          <div
                            className={`p-3.5 rounded-xl text-xs leading-relaxed ${
                              isAi
                                ? 'bg-void-surface border border-white/[0.06] text-zinc-200'
                                : 'bg-signal text-white font-medium rounded-tr-none'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{m.text}</p>
                          </div>

                          {/* Chips / Quick Reply Suggestions */}
                          {m.suggestions && m.suggestions.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {m.suggestions.map((s, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => processUserMessage(s)}
                                  className="px-2.5 py-1 rounded bg-void-deep hover:bg-void-surface border border-white/[0.06] hover:border-signal/40 text-[11px] font-mono text-zinc-400 hover:text-white transition-all text-left"
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          )}

                          <div className="text-[9px] font-mono text-zinc-600 px-1">
                            {m.timestamp}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Bar */}
                <div className="p-3 sm:p-4 bg-void-surface border-t border-white/[0.06]">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSend();
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={inputVal}
                      onChange={(e) => {
                        setInputVal(e.target.value);
                        if (visualState !== 'LISTENING') setVisualState('LISTENING');
                      }}
                      onBlur={() => {
                        if (visualState === 'LISTENING') setVisualState('IDLE');
                      }}
                      placeholder="Type your project goals, technical friction, or questions..."
                      className="flex-1 bg-void-deep border border-white/10 focus:border-signal rounded-lg px-4 py-3 text-xs sm:text-sm text-white placeholder:text-zinc-600 focus:outline-none transition-colors font-mono"
                    />

                    <button
                      type="submit"
                      disabled={!inputVal.trim()}
                      className="p-3 rounded-lg bg-signal hover:bg-signal-bright disabled:opacity-40 text-white transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] focus:outline-none"
                      aria-label="Send message"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>

              {/* Right: Signature Project Intelligence Panel (Desktop) */}
              <div className="hidden lg:block w-[360px] h-full border-l border-white/[0.08] shrink-0">
                <ProjectIntelligencePanel
                  intelligence={intelligence}
                  onUpdateIntelligence={handleUpdateIntelligence}
                />
              </div>

              {/* Mobile Bottom-Sheet Drawer for Intelligence */}
              {mobileIntelligenceOpen && (
                <div className="lg:hidden absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex flex-col justify-end">
                  <div className="h-[80%] bg-void-card border-t border-white/10 rounded-t-2xl p-4 flex flex-col">
                    <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-2">
                      <span className="telemetry-tag text-zinc-300">PROJECT INTELLIGENCE</span>
                      <button
                        onClick={() => setMobileIntelligenceOpen(false)}
                        className="p-1 text-zinc-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      <ProjectIntelligencePanel
                        intelligence={intelligence}
                        onUpdateIntelligence={handleUpdateIntelligence}
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

        </div>

      </div>
    </div>
  );
};
