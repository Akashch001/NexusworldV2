import React from 'react';
import {
  Sparkles,
  CheckCircle2,
  Terminal,
} from 'lucide-react';
import type { ConversationRecord, SystemLogRecord } from '../types';

interface AiMonitoringViewProps {
  conversations: ConversationRecord[];
  systemLogs: SystemLogRecord[];
  onTestGeminiProbe: () => Promise<void>;
  isProbing?: boolean;
}

export const AiMonitoringView: React.FC<AiMonitoringViewProps> = ({
  conversations,
  systemLogs,
  onTestGeminiProbe,
  isProbing = false,
}) => {
  // Extract real AI error events from system_logs
  const aiErrors = systemLogs.filter((l) => l.service === 'gemini_ai' || l.service === 'nora_core');
  const aiConversations = conversations.filter((c) => c.status === 'ai');

  return (
    <div className="space-y-6 font-mono">
      
      {/* Overview Card */}
      <div className="p-5 rounded-2xl bg-[#0A0A0F] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              NORA AI & GEMINI ORCHESTRATION
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              OPERATIONAL
            </span>
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            Provider: Google Gemini 2.0 Flash / Pro • Edge Multimodal Runtime
          </div>
        </div>

        <button
          type="button"
          onClick={onTestGeminiProbe}
          disabled={isProbing}
          className="px-3.5 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isProbing ? 'Executing Probe...' : 'Execute Test Inference'}</span>
        </button>
      </div>

      {/* Real AI Metrics Cards (Zero Fake Tokens) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#0A0A0F] border border-white/[0.08] space-y-1">
          <div className="text-zinc-500 text-[10px] uppercase">Active AI Handlers</div>
          <div className="text-2xl font-bold font-display text-white">{aiConversations.length}</div>
          <div className="text-[10px] text-zinc-400">Conversations currently autonomous</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0A0A0F] border border-white/[0.08] space-y-1">
          <div className="text-zinc-500 text-[10px] uppercase">Provider Quota</div>
          <div className="text-sm font-bold text-zinc-300 mt-2">Provider quota unavailable</div>
          <div className="text-[10px] text-zinc-500">Google Cloud quota metrics require direct GCP telemetry</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0A0A0F] border border-white/[0.08] space-y-1">
          <div className="text-zinc-500 text-[10px] uppercase">AI Exceptions</div>
          <div className="text-2xl font-bold font-display text-white">{aiErrors.length}</div>
          <div className="text-[10px] text-zinc-400">{aiErrors.length === 0 ? 'Zero inference errors recorded' : 'Logged in error center'}</div>
        </div>
      </div>

      {/* Function Calling & Tool Declarations (Real Architecture) */}
      <div className="p-5 rounded-2xl bg-[#0A0A0F] border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
            <Terminal className="w-4 h-4 text-[#3B82F6]" />
            <span>NORA CONTROLLED TOOL DECLARATIONS</span>
          </div>
          <span className="text-[10px] text-zinc-500">Server-Side Function Calling</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-emerald-400 font-bold font-mono">capture_lead</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Active</span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Extracts validated contact information, project requirements, budget, timeline, and computes lead temperature.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-amber-400 font-bold font-mono">request_human</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Active</span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Triggers state machine transition to human handoff, activates Andy Watson's dashboard alert, and pauses NORA responses.
            </p>
          </div>
        </div>
      </div>

      {/* AI Operational Logs */}
      <div className="p-5 rounded-2xl bg-[#0A0A0F] border border-white/[0.08] space-y-3">
        <div className="text-xs font-bold text-white uppercase tracking-wider">
          AI OPERATIONAL LOGS
        </div>

        {aiErrors.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-500 space-y-1">
            <CheckCircle2 className="w-6 h-6 text-emerald-500/50 mx-auto" />
            <div className="text-zinc-300">NO AI FAILURES RECORDED</div>
            <p className="text-[11px] text-zinc-500">Multimodal inference running without logged exceptions.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {aiErrors.map((log) => (
              <div key={log.id} className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
                <div className="flex items-center justify-between font-bold">
                  <span>{log.event}</span>
                  <span className="text-[10px] text-zinc-400">{new Date(log.created_at).toLocaleTimeString()}</span>
                </div>
                <div className="mt-1 text-[11px] text-zinc-300">{log.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
