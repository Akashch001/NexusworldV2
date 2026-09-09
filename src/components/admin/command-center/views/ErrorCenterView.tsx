import React, { useState } from 'react';
import {
  CheckCircle2,
  Filter,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { SystemLogRecord } from '../types';

interface ErrorCenterViewProps {
  systemLogs: SystemLogRecord[];
  onRefresh: () => Promise<void>;
  isRefreshing?: boolean;
}

export const ErrorCenterView: React.FC<ErrorCenterViewProps> = ({
  systemLogs,
  onRefresh,
  isRefreshing = false,
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const filteredLogs = systemLogs.filter((log) => {
    const matchesSeverity =
      selectedSeverity === 'all' || log.level === selectedSeverity;
    const matchesSearch =
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.event.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.service.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  const getSeverityBadge = (level: SystemLogRecord['level']) => {
    switch (level) {
      case 'critical':
        return (
          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
            Critical
          </span>
        );
      case 'error':
        return (
          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-red-500/15 text-red-400 border border-red-500/20">
            Error
          </span>
        );
      case 'warning':
        return (
          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-500/15 text-amber-400 border border-amber-500/20">
            Warning
          </span>
        );
      case 'info':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-blue-500/15 text-blue-400 border border-blue-500/20">
            Info
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 font-mono">
      
      {/* Control Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#0A0A0F] border border-white/[0.08]">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search exceptions by message, service..."
              className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-[#2563EB] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-zinc-500" />
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-[#0A0A0F] border border-white/[0.08] text-zinc-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
            >
              <option value="all">All Severities ({systemLogs.length})</option>
              <option value="critical">Critical ({systemLogs.filter(l => l.level === 'critical').length})</option>
              <option value="error">Error ({systemLogs.filter(l => l.level === 'error').length})</option>
              <option value="warning">Warning ({systemLogs.filter(l => l.level === 'warning').length})</option>
              <option value="info">Info ({systemLogs.filter(l => l.level === 'info').length})</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#2563EB]' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Logs Table / Accordion */}
      {systemLogs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0A0A0F] border border-white/[0.08] space-y-3">
          <CheckCircle2 className="w-8 h-8 text-emerald-500/60 mx-auto" />
          <div className="text-sm font-bold text-white">NO SYSTEM ERRORS</div>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Zero errors or unhandled exceptions logged in the platform. Operational logs are captured in real time.
          </p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-[#0A0A0F] border border-white/[0.08] text-xs text-zinc-500">
          No logs match the current filter query.
        </div>
      ) : (
        <div className="rounded-2xl bg-[#0A0A0F] border border-white/[0.08] divide-y divide-white/[0.04]">
          {filteredLogs.map((log) => {
            const isExpanded = expandedLogId === log.id;

            return (
              <div key={log.id} className="p-4 hover:bg-white/[0.01] transition-colors space-y-2 text-xs">
                <div
                  className="flex items-start justify-between gap-3 cursor-pointer"
                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {getSeverityBadge(log.level)}
                      <span className="text-zinc-400 font-mono text-[10px] uppercase">
                        [{log.service}]
                      </span>
                      <span className="font-bold text-white uppercase text-[11px] truncate">
                        {log.event}
                      </span>
                    </div>

                    <div className="text-zinc-300 text-xs leading-relaxed break-words">
                      {log.message}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <button
                      type="button"
                      className="p-1 text-zinc-500 hover:text-white"
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details / Stack */}
                {isExpanded && log.details && (
                  <div className="mt-2 p-3 rounded-xl bg-black/60 border border-white/[0.06] text-[11px] font-mono text-zinc-300 overflow-x-auto">
                    <div className="text-[10px] text-zinc-500 font-bold uppercase mb-1">
                      DIAGNOSTIC METADATA
                    </div>
                    <pre className="whitespace-pre-wrap leading-relaxed">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
