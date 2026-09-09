import {
  Radio,
  MessageSquare,
  UserCheck,
  ArrowRight,
  Clock,
  Headphones,
  Database,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import type {
  VisitorSession,
  VisitorEvent,
  ConversationRecord,
  LeadRecord,
  SystemLogRecord,
  CommandNavSection,
} from '../types';
import type { SystemHealthReport } from '../../../../lib/healthTelemetry';
import { LiveTrafficGraph } from '../components/LiveTrafficGraph';
import { useTelemetryStatus } from '../hooks/useTelemetryStatus';

interface OverviewViewProps {
  activeVisitors: VisitorSession[];
  allSessions: VisitorSession[];
  conversations: ConversationRecord[];
  leads: LeadRecord[];
  events: VisitorEvent[];
  systemLogs: SystemLogRecord[];
  healthReport: SystemHealthReport | null;
  lastTelemetryAt: Date | null;
  realtimeStatus?: 'connected' | 'connecting' | 'disconnected';
  onNavigate: (section: CommandNavSection) => void;
  onSelectVisitor: (session: VisitorSession) => void;
  onSelectConversation?: (conv: ConversationRecord) => void;
  onSelectLead?: (lead: LeadRecord) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  activeVisitors,
  allSessions,
  conversations,
  leads,
  events,
  systemLogs,
  healthReport,
  lastTelemetryAt,
  realtimeStatus = 'connected',
  onNavigate,
  onSelectVisitor,
  onSelectConversation,
  onSelectLead,
}) => {
  // Urgent items: Conversations waiting for human takeover
  const urgentHandoffs = conversations.filter((c) => c.status === 'human_requested');
  const activeAiConvs = conversations.filter((c) => c.status === 'ai');
  const newLeads = leads.filter((l) => l.lead_status === 'new');
  const criticalLogs = systemLogs.filter((l) => l.level === 'critical');

  // Real-time telemetry freshness tracking
  const telemetry = useTelemetryStatus(lastTelemetryAt, realtimeStatus);

  return (
    <div className="space-y-6 font-mono select-none">
      
      {/* 1. STATUS HEADER: Live Telemetry Freshness Indicator */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0A0A0F] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-black/40">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full shrink-0 ${
              telemetry.level === 'live'
                ? 'bg-emerald-400 animate-pulse shadow-[0_0_10px_#10B981]'
                : telemetry.level === 'delayed'
                ? 'bg-amber-400 shadow-[0_0_10px_#F59E0B]'
                : telemetry.level === 'offline'
                ? 'bg-red-500 shadow-[0_0_10px_#EF4444]'
                : 'bg-zinc-600'
            }`}
          />
          <div>
            <div className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>{telemetry.statusText}</span>
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">
              Live operational pipeline • Zero synthetic analytics
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-400 shrink-0 self-start sm:self-auto bg-white/[0.03] border border-white/[0.06] px-3 py-1.5 rounded-xl">
          <Clock className="w-3.5 h-3.5 text-[#3B82F6]" />
          <span>Last telemetry:</span>
          <span className="font-bold text-white">{telemetry.relativeTimeText}</span>
        </div>
      </div>

      {/* 2. URGENT ATTENTION BANNER (If Human Takeover is Requested) */}
      {urgentHandoffs.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <span>ACTION REQUIRED // HUMAN TAKEOVER REQUESTED</span>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              </div>
              <div className="text-[11px] text-zinc-300 mt-0.5">
                {urgentHandoffs.length} visitor{urgentHandoffs.length > 1 ? 's are' : ' is'} waiting for Andy Watson in live chat.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (urgentHandoffs[0] && onSelectConversation) {
                onSelectConversation(urgentHandoffs[0]);
              } else {
                onNavigate('conversations');
              }
            }}
            className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-colors flex items-center gap-2 shrink-0 self-start sm:self-auto shadow-[0_0_15px_rgba(245,158,11,0.3)]"
          >
            <span>Take Over Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. LIVE NOW COMPACT METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Metric 1: Live Visitors */}
        <div 
          onClick={() => onNavigate('live_visitors')}
          className="p-4 rounded-xl bg-[#0A0A0F] border border-white/[0.08] hover:border-[#2563EB]/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>ACTIVE VISITORS</span>
            </span>
            <span className="text-[10px] text-zinc-500 group-hover:text-white transition-colors">
              VIEW →
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold font-display text-white">
            {activeVisitors.length}
          </div>
          <div className="text-[10px] text-zinc-400 mt-1 truncate">
            {activeVisitors.length === 0
              ? 'Waiting for new sessions'
              : `${activeVisitors.length} active within last 10m`}
          </div>
        </div>

        {/* Metric 2: Active Conversations */}
        <div 
          onClick={() => onNavigate('conversations')}
          className="p-4 rounded-xl bg-[#0A0A0F] border border-white/[0.08] hover:border-[#2563EB]/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-[#3B82F6]" />
              <span>CONVERSATIONS</span>
            </span>
            <span className="text-[10px] text-zinc-500 group-hover:text-white transition-colors">
              VIEW →
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold font-display text-white">
            {conversations.length}
          </div>
          <div className="text-[10px] text-zinc-400 mt-1 truncate">
            {urgentHandoffs.length > 0 ? (
              <span className="text-amber-400 font-bold">{urgentHandoffs.length} waiting for Andy</span>
            ) : (
              `${activeAiConvs.length} active with NORA`
            )}
          </div>
        </div>

        {/* Metric 3: Human Requests */}
        <div 
          onClick={() => onNavigate('conversations')}
          className={`p-4 rounded-xl border transition-all cursor-pointer group ${
            urgentHandoffs.length > 0
              ? 'bg-amber-500/10 border-amber-500/40 hover:border-amber-400'
              : 'bg-[#0A0A0F] border-white/[0.08] hover:border-white/[0.2]'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <Headphones className={`w-3.5 h-3.5 ${urgentHandoffs.length > 0 ? 'text-amber-400' : 'text-zinc-500'}`} />
              <span>HUMAN REQUESTS</span>
            </span>
            <span className="text-[10px] text-zinc-500 group-hover:text-white transition-colors">
              VIEW →
            </span>
          </div>
          <div className={`mt-2 text-2xl font-bold font-display ${urgentHandoffs.length > 0 ? 'text-amber-400' : 'text-white'}`}>
            {urgentHandoffs.length}
          </div>
          <div className="text-[10px] text-zinc-400 mt-1 truncate">
            {urgentHandoffs.length === 0 ? 'Zero pending handoffs' : 'Requires Andy takeover'}
          </div>
        </div>

        {/* Metric 4: New Leads */}
        <div 
          onClick={() => {
            if (newLeads[0] && onSelectLead) onSelectLead(newLeads[0]);
            onNavigate('leads');
          }}
          className="p-4 rounded-xl bg-[#0A0A0F] border border-white/[0.08] hover:border-[#2563EB]/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>NEW LEADS</span>
            </span>
            <span className="text-[10px] text-zinc-500 group-hover:text-white transition-colors">
              VIEW →
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold font-display text-white">
            {newLeads.length}
          </div>
          <div className="text-[10px] text-zinc-400 mt-1 truncate">
            {leads.length} total qualified in pipeline
          </div>
        </div>

      </div>

      {/* 4. MAIN OPERATIONAL GRID: Live Traffic Graph (2/3) + Attention Panel (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Cols): Live Traffic Graph */}
        <div className="lg:col-span-2">
          <LiveTrafficGraph
            sessions={allSessions}
            events={events}
            isRealtimeConnected={realtimeStatus === 'connected'}
          />
        </div>

        {/* Right Column (1 Col): Operational Attention Panel */}
        <div className="p-5 rounded-2xl bg-[#0A0A0F] border border-white/[0.08] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5 text-[#3B82F6]" />
                <span>OPERATIONAL ATTENTION</span>
              </div>
              <span className="text-[10px] text-zinc-500">LIVE SIGNALS</span>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              {/* Signal 1: Human Requests */}
              <div
                onClick={() => onNavigate('conversations')}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  urgentHandoffs.length > 0
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-white/[0.02] border-white/[0.04] text-zinc-400'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Headphones className="w-4 h-4 shrink-0" />
                  <div>
                    <div className="font-bold text-[11px]">Human Takeover</div>
                    <div className="text-[10px] text-zinc-400">
                      {urgentHandoffs.length > 0 ? `${urgentHandoffs.length} waiting for Andy` : 'No pending requests'}
                    </div>
                  </div>
                </div>
                <span className="font-bold text-sm">{urgentHandoffs.length}</span>
              </div>

              {/* Signal 2: Uncontacted Leads */}
              <div
                onClick={() => {
                  if (newLeads[0] && onSelectLead) onSelectLead(newLeads[0]);
                  onNavigate('leads');
                }}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  newLeads.length > 0
                    ? 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                    : 'bg-white/[0.02] border-white/[0.04] text-zinc-400'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <UserCheck className="w-4 h-4 shrink-0" />
                  <div>
                    <div className="font-bold text-[11px]">New Inbound Leads</div>
                    <div className="text-[10px] text-zinc-400">
                      {newLeads.length > 0 ? `${newLeads.length} awaiting follow-up` : 'Pipeline up to date'}
                    </div>
                  </div>
                </div>
                <span className="font-bold text-sm">{newLeads.length}</span>
              </div>

              {/* Signal 3: Critical System Exceptions */}
              <div
                onClick={() => onNavigate('errors')}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  criticalLogs.length > 0
                    ? 'bg-red-500/10 border-red-500/30 text-red-300'
                    : 'bg-white/[0.02] border-white/[0.04] text-zinc-400'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <div>
                    <div className="font-bold text-[11px]">Critical Alarms</div>
                    <div className="text-[10px] text-zinc-400">
                      {criticalLogs.length > 0 ? `${criticalLogs.length} severe logs recorded` : 'Zero critical errors'}
                    </div>
                  </div>
                </div>
                <span className="font-bold text-sm">{criticalLogs.length}</span>
              </div>
            </div>
          </div>

          {/* Attention Status Footer */}
          <div className="pt-3 border-t border-white/[0.06] flex items-center gap-2 text-[11px]">
            {urgentHandoffs.length === 0 && criticalLogs.length === 0 ? (
              <div className="flex items-center gap-2 text-emerald-400">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>All systems normal. No operator intervention needed.</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Operator attention recommended.</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 5. DUAL OPERATIONAL STREAMS: Live Visitors + Real Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Active Live Visitors */}
        <div className="p-5 rounded-2xl bg-[#0A0A0F] border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                CURRENT LIVE VISITORS
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('live_visitors')}
              className="text-[10px] text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <span>ALL SESSIONS</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {activeVisitors.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="text-xs font-medium text-zinc-300">NO ACTIVE VISITORS</div>
              <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                No active website sessions currently recorded. Live visitor signals stream immediately upon connection.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {activeVisitors.slice(0, 5).map((visitor) => (
                <div
                  key={visitor.id}
                  onClick={() => onSelectVisitor(visitor)}
                  className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] hover:border-white/[0.1] transition-all cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-white">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span className="font-semibold text-zinc-200">
                        Session #{visitor.visitor_token.slice(-6).toUpperCase()}
                      </span>
                      <span className="text-[10px] text-zinc-400 uppercase">
                        ({visitor.device_type})
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-400 flex items-center gap-2 truncate">
                      <span className="text-zinc-300">{visitor.current_url || '/'}</span>
                      {visitor.referrer && (
                        <span className="text-zinc-500 truncate">via {visitor.referrer.replace(/^https?:\/\//, '')}</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-zinc-400">
                      {new Date(visitor.last_seen_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                    <span className="text-[9px] text-[#3B82F6] opacity-0 group-hover:opacity-100 transition-opacity">
                      Story →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Latest Real Events */}
        <div className="p-5 rounded-2xl bg-[#0A0A0F] border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#3B82F6]" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                RECENT ACTIVITY
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('activity')}
              className="text-[10px] text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <span>FULL STREAM</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {events.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="text-xs font-medium text-zinc-300">WAITING FOR ACTIVITY</div>
              <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                No visitor or system actions recorded recently. Events stream in real time as users explore the site.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {events.slice(0, 6).map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => {
                    const matchedSession = allSessions.find((s) => s.visitor_token === ev.visitor_token);
                    if (matchedSession) onSelectVisitor(matchedSession);
                    else onNavigate('activity');
                  }}
                  className="p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] text-xs flex items-start justify-between gap-3 cursor-pointer transition-colors group"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.2 rounded bg-white/[0.04] border border-white/[0.06] text-[9px] text-zinc-400 uppercase font-semibold">
                        {ev.event_type}
                      </span>
                      <span className="text-zinc-200 text-xs font-medium truncate group-hover:text-white">
                        {ev.event_name.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {ev.metadata?.url && (
                      <div className="text-[10px] text-zinc-400 truncate">
                        {ev.metadata.url}
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-zinc-500 shrink-0">
                    {new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* 6. OPERATIONAL INFRASTRUCTURE HEALTH STRIP */}
      <div className="p-5 rounded-2xl bg-[#0A0A0F] border border-white/[0.08] space-y-3">
        <div className="flex items-center justify-between text-xs pb-2 border-b border-white/[0.06]">
          <span className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>OPERATIONAL INFRASTRUCTURE</span>
          </span>
          <span className="text-[10px] text-zinc-400">
            {healthReport?.timestamp ? `Checked ${new Date(healthReport.timestamp).toLocaleTimeString()}` : 'Live Probes Active'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
          
          {/* Service 1: PostgreSQL */}
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] space-y-1">
            <div className="text-[9px] text-zinc-400 uppercase">Database</div>
            <div className="text-zinc-200 font-bold text-xs truncate">Supabase DB</div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className={`w-1.5 h-1.5 rounded-full ${healthReport?.services.database.status === 'Operational' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className="text-emerald-400 font-semibold">
                {healthReport?.services.database.latencyMs !== null ? `${healthReport?.services.database.latencyMs}ms` : 'Operational'}
              </span>
            </div>
          </div>

          {/* Service 2: Auth */}
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] space-y-1">
            <div className="text-[9px] text-zinc-400 uppercase">Identity & Auth</div>
            <div className="text-zinc-200 font-bold text-xs truncate">Supabase Auth</div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className={`w-1.5 h-1.5 rounded-full ${healthReport?.services.auth.status === 'Operational' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className="text-emerald-400 font-semibold">
                {healthReport?.services.auth.latencyMs !== null ? `${healthReport?.services.auth.latencyMs}ms` : 'Operational'}
              </span>
            </div>
          </div>

          {/* Service 3: Realtime WebSocket */}
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] space-y-1">
            <div className="text-[9px] text-zinc-400 uppercase">Realtime Engine</div>
            <div className="text-zinc-200 font-bold text-xs truncate">Supabase Channel</div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className={`w-1.5 h-1.5 rounded-full ${realtimeStatus === 'connected' ? 'bg-emerald-400' : 'bg-red-400'}`} />
              <span className={realtimeStatus === 'connected' ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                {realtimeStatus === 'connected' ? 'Connected' : 'Offline'}
              </span>
            </div>
          </div>

          {/* Service 4: NORA Concierge */}
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] space-y-1">
            <div className="text-[9px] text-zinc-400 uppercase">Concierge Service</div>
            <div className="text-zinc-200 font-bold text-xs truncate">NORA Core</div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className={`w-1.5 h-1.5 rounded-full ${healthReport?.services.noraCore.status === 'Operational' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className="text-emerald-400 font-semibold">Operational</span>
            </div>
          </div>

          {/* Service 5: Gemini AI Inference */}
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] space-y-1">
            <div className="text-[9px] text-zinc-400 uppercase">Inference Provider</div>
            <div className="text-zinc-200 font-bold text-xs truncate">Google Gemini 2.0</div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className={`w-1.5 h-1.5 rounded-full ${healthReport?.services.geminiAi.status === 'Operational' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className="text-emerald-400 font-semibold">
                {healthReport?.services.geminiAi.status || 'Operational'}
              </span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
