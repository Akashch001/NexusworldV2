import React, { useState } from 'react';
import {
  Activity,
  Filter,
  Clock,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import type { VisitorEvent, SystemLogRecord } from '../types';

interface ActivityStreamViewProps {
  events: VisitorEvent[];
  systemLogs: SystemLogRecord[];
  onRefresh: () => Promise<void>;
  isRefreshing?: boolean;
  onSelectVisitorByToken?: (token: string) => void;
  onSelectConversation?: (convId: string) => void;
}

export const ActivityStreamView: React.FC<ActivityStreamViewProps> = ({
  events,
  systemLogs,
  onRefresh,
  isRefreshing = false,
  onSelectVisitorByToken,
  onSelectConversation,
}) => {
  const [filterType, setFilterType] = useState<string>('all');

  // Combine visitor events and system logs into one unified chronological stream
  const combinedStream = [
    ...events.map((e) => ({
      id: `ev-${e.id}`,
      type: e.event_type,
      title: e.event_name.replace(/_/g, ' '),
      timestamp: e.created_at,
      source: 'visitor' as const,
      visitorToken: e.visitor_token,
      conversationId: e.metadata?.conversation_id || null,
      leadId: e.metadata?.lead_id || null,
      metadata: e.metadata,
      badge: e.event_type.toUpperCase(),
      badgeColor:
        e.event_type === 'concierge' || e.event_name.includes('handoff')
          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          : e.event_type === 'lead'
          ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    })),
    ...systemLogs.map((l) => ({
      id: `log-${l.id}`,
      type: l.service,
      title: `${l.event}: ${l.message}`,
      timestamp: l.created_at,
      source: 'system' as const,
      visitorToken: null,
      conversationId: l.details?.conversation_id || null,
      leadId: null,
      metadata: l.details,
      badge: l.level.toUpperCase(),
      badgeColor:
        l.level === 'critical' || l.level === 'error'
          ? 'bg-red-500/20 text-red-400 border-red-500/30'
          : l.level === 'warning'
          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
          : 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const filtered = combinedStream.filter((item) => {
    if (filterType === 'all') return true;
    if (filterType === 'visitor') return item.source === 'visitor';
    if (filterType === 'navigation') return item.type === 'navigation';
    if (filterType === 'concierge') return item.type === 'concierge' || item.title.toLowerCase().includes('nora');
    if (filterType === 'lead') return item.type === 'lead';
    if (filterType === 'system') return item.source === 'system';
    if (filterType === 'error') return item.badge === 'ERROR' || item.badge === 'CRITICAL';
    if (filterType === 'security') return item.title.toLowerCase().includes('auth') || item.title.toLowerCase().includes('security');
    return item.type.toLowerCase().includes(filterType.toLowerCase());
  });

  const filterCategories = [
    { id: 'all', label: `All (${combinedStream.length})` },
    { id: 'visitor', label: `Visitor (${events.length})` },
    { id: 'navigation', label: 'Navigation' },
    { id: 'concierge', label: 'Concierge / NORA' },
    { id: 'lead', label: 'Leads' },
    { id: 'system', label: `System (${systemLogs.length})` },
    { id: 'error', label: `Errors (${systemLogs.filter(l => l.level === 'error' || l.level === 'critical').length})` },
  ];

  return (
    <div className="space-y-4 font-mono select-none">
      
      {/* Control Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#0A0A0F] border border-white/[0.08]">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <Filter className="w-3.5 h-3.5 text-zinc-500 mr-1" />
          {filterCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFilterType(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] transition-all ${
                filterType === cat.id
                  ? 'bg-[#2563EB] text-white font-bold shadow-[0_0_10px_rgba(37,99,235,0.3)]'
                  : 'bg-white/[0.02] hover:bg-white/[0.06] text-zinc-400 hover:text-white border border-white/[0.04]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 self-start sm:self-auto shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#2563EB]' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stream Items */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0A0A0F] border border-white/[0.08] space-y-3">
          <Activity className="w-8 h-8 text-zinc-600 mx-auto" />
          <div className="text-sm font-bold text-white">NO EVENTS RECORDED</div>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            The activity stream registers authentic events from visitor explorations and platform operations in real time.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-[#0A0A0F] border border-white/[0.08] divide-y divide-white/[0.04] overflow-hidden">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                if (item.visitorToken && onSelectVisitorByToken) {
                  onSelectVisitorByToken(item.visitorToken);
                } else if (item.conversationId && onSelectConversation) {
                  onSelectConversation(item.conversationId);
                }
              }}
              className={`p-4 transition-colors flex items-start justify-between gap-4 text-xs ${
                item.visitorToken || item.conversationId
                  ? 'hover:bg-white/[0.03] cursor-pointer group'
                  : 'hover:bg-white/[0.01]'
              }`}
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                  <span className="font-bold text-white uppercase text-[11px] truncate group-hover:text-[#60A5FA] transition-colors">
                    {item.title}
                  </span>
                  {item.visitorToken && (
                    <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">
                      #{item.visitorToken.slice(-6).toUpperCase()}
                    </span>
                  )}
                </div>

                {item.metadata && Object.keys(item.metadata).length > 0 && (
                  <div className="text-[11px] text-zinc-400 font-mono">
                    {item.metadata.url && <span>Path: <span className="text-zinc-300">{item.metadata.url}</span></span>}
                    {item.metadata.device && <span> • Device: {item.metadata.device}</span>}
                    {item.metadata.browser && <span> • {item.metadata.browser}</span>}
                    {item.metadata.districtIndex !== undefined && <span> • District #{item.metadata.districtIndex}</span>}
                    {item.metadata.operator && <span> • Operator: {item.metadata.operator}</span>}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </div>

                {(item.visitorToken || item.conversationId) && (
                  <span className="text-[10px] text-[#3B82F6] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                    <span>Inspect</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
