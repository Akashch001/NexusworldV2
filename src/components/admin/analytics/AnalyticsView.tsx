import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Globe,
  Laptop,
  Layers,
  Compass,
} from 'lucide-react';
import type { VisitorSession, VisitorEvent } from '../warm-theme/tokens';

interface AnalyticsViewProps {
  sessions: VisitorSession[];
  events: VisitorEvent[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  sessions,
  events,
}) => {
  const [timeframe, setTimeframe] = useState<'today' | '7d' | '30d' | 'all'>('all');

  // Filter sessions by selected timeframe
  const filteredSessions = useMemo(() => {
    const now = Date.now();
    return sessions.filter((s) => {
      const time = new Date(s.created_at).getTime();
      if (timeframe === 'today') {
        const todayStr = new Date().toISOString().split('T')[0];
        return s.created_at?.startsWith(todayStr);
      }
      if (timeframe === '7d') return now - time <= 7 * 86400000;
      if (timeframe === '30d') return now - time <= 30 * 86400000;
      return true;
    });
  }, [sessions, timeframe]);

  // Aggregate Countries
  const countryCounts = useMemo(() => {
    const map = new Map<string, number>();
    filteredSessions.forEach((s) => {
      const countryRaw = s.country || 'Unknown';
      const cleanName = countryRaw.includes('|') ? countryRaw.split('|')[1] : countryRaw;
      map.set(cleanName, (map.get(cleanName) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [filteredSessions]);

  // Aggregate Cities
  const cityCounts = useMemo(() => {
    const map = new Map<string, number>();
    filteredSessions.forEach((s) => {
      if (s.city) {
        map.set(s.city, (map.get(s.city) || 0) + 1);
      }
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [filteredSessions]);

  // Aggregate Top Pages (from events or current_url)
  const topPages = useMemo(() => {
    const map = new Map<string, number>();
    // From sessions
    filteredSessions.forEach((s) => {
      const path = s.entry_url || s.current_url || '/';
      map.set(path, (map.get(path) || 0) + 1);
    });
    // From navigation events
    events.forEach((e) => {
      const url = e.metadata?.url || (e.event_type === 'navigation' ? e.metadata?.entryUrl : null);
      if (url) {
        map.set(url, (map.get(url) || 0) + 1);
      }
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [filteredSessions, events]);

  // Aggregate Devices
  const deviceCounts = useMemo(() => {
    const map = new Map<string, number>();
    filteredSessions.forEach((s) => {
      const dev = s.device_type || 'desktop';
      map.set(dev, (map.get(dev) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [filteredSessions]);

  // Aggregate Browsers
  const browserCounts = useMemo(() => {
    const map = new Map<string, number>();
    filteredSessions.forEach((s) => {
      const b = s.browser || 'Unknown';
      map.set(b, (map.get(b) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [filteredSessions]);

  // Aggregate Operating Systems
  const osCounts = useMemo(() => {
    const map = new Map<string, number>();
    filteredSessions.forEach((s) => {
      const o = s.os || 'Unknown';
      map.set(o, (map.get(o) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [filteredSessions]);

  // Traffic Sources / Referrers
  const sourceCounts = useMemo(() => {
    const map = new Map<string, number>();
    filteredSessions.forEach((s) => {
      let src = 'Direct / Organic';
      if (s.referrer) {
        try {
          const host = new URL(s.referrer).hostname.replace('www.', '');
          src = host;
        } catch {
          src = 'Referral';
        }
      }
      map.set(src, (map.get(src) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [filteredSessions]);

  const maxCountryVal = countryCounts[0]?.[1] || 1;
  const maxPageVal = topPages[0]?.[1] || 1;

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 space-y-6 antialiased text-[#242321] select-none max-w-7xl mx-auto w-full">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9D4CA] pb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-[#242321]">
            Visitor Analytics
          </h1>
          <p className="text-xs text-[#716D65] mt-1">
            Audited aggregate traffic patterns, geographical distribution, and devices
          </p>
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center gap-1 p-1 bg-[#FBF9F4] border border-[#D9D4CA] rounded-lg text-xs self-start sm:self-auto">
          {(['today', '7d', '30d', 'all'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1 rounded-md transition-colors ${
                timeframe === t
                  ? 'bg-[#EEEAE1] text-[#242321] font-semibold'
                  : 'text-[#716D65] hover:text-[#242321]'
              }`}
            >
              {t === 'today' ? 'Today' : t === '7d' ? '7 Days' : t === '30d' ? '30 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Tiles (Real Data Only) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="p-4 rounded-xl bg-[#FBF9F4] border border-[#D9D4CA]">
          <div className="text-[11px] text-[#716D65] uppercase font-mono">Total Sessions</div>
          <div className="text-2xl font-semibold font-mono text-[#242321] mt-1">
            {filteredSessions.length}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#FBF9F4] border border-[#D9D4CA]">
          <div className="text-[11px] text-[#716D65] uppercase font-mono">Page Events</div>
          <div className="text-2xl font-semibold font-mono text-[#242321] mt-1">
            {events.length}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#FBF9F4] border border-[#D9D4CA]">
          <div className="text-[11px] text-[#716D65] uppercase font-mono">Countries</div>
          <div className="text-2xl font-semibold font-mono text-[#242321] mt-1">
            {countryCounts.length}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#FBF9F4] border border-[#D9D4CA]">
          <div className="text-[11px] text-[#716D65] uppercase font-mono">Identified Cities</div>
          <div className="text-2xl font-semibold font-mono text-[#242321] mt-1">
            {cityCounts.length}
          </div>
        </div>
      </div>

      {filteredSessions.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Countries Breakdown */}
          <div className="p-5 rounded-xl bg-[#FBF9F4] border border-[#D9D4CA] space-y-4">
            <div className="flex items-center justify-between border-b border-[#D9D4CA] pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#716D65]" />
                <h2 className="text-xs font-semibold uppercase tracking-wider font-mono text-[#242321]">
                  Countries
                </h2>
              </div>
              <span className="text-[11px] text-[#716D65]">Visitors</span>
            </div>

            <div className="space-y-3">
              {countryCounts.map(([country, count]) => {
                const pct = Math.round((count / maxCountryVal) * 100);
                return (
                  <div key={country} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#242321]">{country}</span>
                      <span className="font-mono text-[#716D65]">{count}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#EEEAE1] overflow-hidden">
                      <div
                        className="h-full bg-[#4F8A5B] rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Pages */}
          <div className="p-5 rounded-xl bg-[#FBF9F4] border border-[#D9D4CA] space-y-4">
            <div className="flex items-center justify-between border-b border-[#D9D4CA] pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#716D65]" />
                <h2 className="text-xs font-semibold uppercase tracking-wider font-mono text-[#242321]">
                  Top Pages
                </h2>
              </div>
              <span className="text-[11px] text-[#716D65]">Visits</span>
            </div>

            <div className="space-y-3">
              {topPages.map(([page, count]) => {
                const pct = Math.round((count / maxPageVal) * 100);
                return (
                  <div key={page} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-[#242321] truncate max-w-[260px]">
                        {page}
                      </span>
                      <span className="font-mono text-[#716D65]">{count}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#EEEAE1] overflow-hidden">
                      <div
                        className="h-full bg-[#7C766C] rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Traffic Sources */}
          <div className="p-5 rounded-xl bg-[#FBF9F4] border border-[#D9D4CA] space-y-4">
            <div className="flex items-center justify-between border-b border-[#D9D4CA] pb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#716D65]" />
                <h2 className="text-xs font-semibold uppercase tracking-wider font-mono text-[#242321]">
                  Traffic Sources
                </h2>
              </div>
              <span className="text-[11px] text-[#716D65]">Sessions</span>
            </div>

            <div className="space-y-2.5">
              {sourceCounts.map(([src, count]) => (
                <div
                  key={src}
                  className="flex items-center justify-between p-2 rounded-lg bg-[#F5F1E8] border border-[#D9D4CA] text-xs"
                >
                  <span className="font-medium text-[#242321]">{src}</span>
                  <span className="font-mono text-[#716D65]">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Devices & Platforms */}
          <div className="p-5 rounded-xl bg-[#FBF9F4] border border-[#D9D4CA] space-y-4">
            <div className="flex items-center justify-between border-b border-[#D9D4CA] pb-3">
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-[#716D65]" />
                <h2 className="text-xs font-semibold uppercase tracking-wider font-mono text-[#242321]">
                  Devices & Platforms
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <div className="text-[10px] font-mono uppercase text-[#716D65] mb-1.5">
                  Device Types
                </div>
                <div className="space-y-1.5">
                  {deviceCounts.map(([dev, count]) => (
                    <div
                      key={dev}
                      className="flex items-center justify-between p-1.5 rounded bg-[#F5F1E8]"
                    >
                      <span className="capitalize">{dev}</span>
                      <span className="font-mono text-[#716D65]">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-mono uppercase text-[#716D65] mb-1.5">
                  Browsers
                </div>
                <div className="space-y-1.5">
                  {browserCounts.slice(0, 4).map(([b, count]) => (
                    <div
                      key={b}
                      className="flex items-center justify-between p-1.5 rounded bg-[#F5F1E8]"
                    >
                      <span className="truncate max-w-[100px]">{b}</span>
                      <span className="font-mono text-[#716D65]">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-mono uppercase text-[#716D65] mb-1.5">
                  Operating Systems
                </div>
                <div className="space-y-1.5">
                  {osCounts.slice(0, 4).map(([os, count]) => (
                    <div
                      key={os}
                      className="flex items-center justify-between p-1.5 rounded bg-[#F5F1E8]"
                    >
                      <span className="truncate max-w-[100px]">{os}</span>
                      <span className="font-mono text-[#716D65]">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Honest Empty State */
        <div className="p-16 text-center rounded-xl bg-[#FBF9F4] border border-[#D9D4CA]">
          <div className="w-10 h-10 rounded-full bg-[#EEEAE1] text-[#716D65] flex items-center justify-center mx-auto mb-3">
            <BarChart3 className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-[#242321]">No analytics data recorded yet</h3>
          <p className="text-xs text-[#716D65] max-w-sm mx-auto mt-1">
            As visitors browse nexusworld.in, actual country breakdowns, popular pages, and referral sources will be computed here.
          </p>
        </div>
      )}
    </div>
  );
};
