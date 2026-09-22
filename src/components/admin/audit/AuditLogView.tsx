import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import type { SystemLogRecord } from '../warm-theme/tokens';

interface AuditLogViewProps {
  logs: SystemLogRecord[];
  onRefresh?: () => void;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | 'info' | 'warning' | 'error' | 'critical'>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (levelFilter !== 'all' && log.level !== levelFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const event = (log.event || '').toLowerCase();
        const msg = (log.message || '').toLowerCase();
        const srv = (log.service || '').toLowerCase();
        if (!event.includes(q) && !msg.includes(q) && !srv.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [logs, levelFilter, searchQuery]);

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 space-y-6 antialiased text-[#242321] select-none max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9D4CA] pb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-[#242321]">
            Audit Log
          </h1>
          <p className="text-xs text-[#716D65] mt-1">
            Chronological log of administrative actions, handoffs, authentication events, and role updates
          </p>
        </div>

        {/* Level Filters */}
        <div className="flex items-center gap-1 p-1 bg-[#FBF9F4] border border-[#D9D4CA] rounded-lg text-xs self-start sm:self-auto">
          {(['all', 'info', 'warning', 'error', 'critical'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className={`px-3 py-1 rounded-md capitalize transition-colors ${
                levelFilter === lvl
                  ? 'bg-[#EEEAE1] text-[#242321] font-semibold'
                  : 'text-[#716D65] hover:text-[#242321]'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#716D65]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter audit events by event name, message, or service..."
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#FBF9F4] border border-[#D9D4CA] text-xs text-[#242321] placeholder-[#716D65] focus:outline-none focus:border-[#242321]"
        />
      </div>

      {/* Logs Table */}
      <div className="bg-[#FBF9F4] border border-[#D9D4CA] rounded-xl overflow-hidden shadow-2xs">
        {filteredLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#D9D4CA] bg-[#F5F1E8]/70 text-[11px] font-mono text-[#716D65] uppercase">
                  <th className="py-3 px-4 font-medium">Timestamp</th>
                  <th className="py-3 px-4 font-medium">Level</th>
                  <th className="py-3 px-4 font-medium">Event</th>
                  <th className="py-3 px-4 font-medium">Message</th>
                  <th className="py-3 px-4 font-medium text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9D4CA]/60">
                {filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  const time = new Date(log.created_at).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="hover:bg-[#F5F1E8]/50 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4 font-mono text-[11px] text-[#716D65] whitespace-nowrap">
                          {time}
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-medium ${
                              log.level === 'critical' || log.level === 'error'
                                ? 'bg-[#F9ECEC] text-[#A83B3B]'
                                : log.level === 'warning'
                                ? 'bg-[#F8F1EC] text-[#B56A45]'
                                : 'bg-[#EEF5F0] text-[#4F8A5B]'
                            }`}
                          >
                            {log.level}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-mono text-[11px] font-medium text-[#242321]">
                          {log.event}
                        </td>

                        <td className="py-3 px-4 text-[#242321] max-w-md truncate">
                          {log.message}
                        </td>

                        <td className="py-3 px-4 text-right text-[#716D65]">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 inline" />
                          ) : (
                            <ChevronRight className="w-4 h-4 inline" />
                          )}
                        </td>
                      </tr>

                      {isExpanded && log.details && (
                        <tr className="bg-[#F5F1E8]">
                          <td colSpan={5} className="p-4 border-b border-[#D9D4CA]">
                            <div className="text-[10px] font-mono text-[#716D65] uppercase mb-1">
                              Event Metadata
                            </div>
                            <pre className="text-[11px] font-mono bg-[#FBF9F4] p-3 rounded-lg border border-[#D9D4CA] overflow-x-auto text-[#242321]">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-[#716D65]">
            No audit log records found matching the current filter.
          </div>
        )}
      </div>
    </div>
  );
};
