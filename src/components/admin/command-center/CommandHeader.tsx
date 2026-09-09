import React, { useState } from 'react';
import { 
  Globe, LogOut, Menu, RefreshCw
} from 'lucide-react';
import type { CommandNavSection } from './types';
import { useTelemetryStatus } from './hooks/useTelemetryStatus';

interface CommandHeaderProps {
  currentSection: CommandNavSection;
  user: {
    id: string;
    email: string;
    full_name: string;
    role: string;
  };
  isOnlinePresence: boolean;
  onTogglePresence: () => Promise<void>;
  onExitToWorld: () => void;
  onSignOut: () => void;
  onToggleMobileMenu: () => void;
  onRefreshData?: () => void;
  isRefreshing?: boolean;
  lastTelemetryAt?: Date | null;
  realtimeStatus?: 'connected' | 'connecting' | 'disconnected';
}

const SECTION_TITLES: Record<CommandNavSection, { title: string; subtitle: string }> = {
  overview: {
    title: 'Command Overview',
    subtitle: 'High-level real-time operational telemetry and active signals',
  },
  live_visitors: {
    title: 'Live Visitors',
    subtitle: 'Active anonymous web sessions and journey timelines',
  },
  activity: {
    title: 'Activity Stream',
    subtitle: 'Chronological event feed across visitors, NORA, and leads',
  },
  leads: {
    title: 'Lead Pipeline',
    subtitle: 'Validated leads generated through conversations and briefs',
  },
  conversations: {
    title: 'Live Conversations',
    subtitle: 'NORA concierge transcripts with human takeover capability',
  },
  products: {
    title: 'Product Operations',
    subtitle: 'Operational status for NexusCV, Site Check, and Suite Tools',
  },
  health: {
    title: 'System Health',
    subtitle: 'Real-time round-trip latency probes across infrastructure',
  },
  ai: {
    title: 'AI & NORA Intelligence',
    subtitle: 'Gemini inference monitoring, function calls, and error tracking',
  },
  limits: {
    title: 'Limits & Quotas',
    subtitle: 'Measurable database and API usage counters',
  },
  errors: {
    title: 'Error Center',
    subtitle: 'Operational exception logs and severity alerts',
  },
  users: {
    title: 'User Management',
    subtitle: 'Administrative accounts, clearance roles, and security policies',
  },
  security: {
    title: 'Security & Enclave',
    subtitle: 'Session policies, Row Level Security, and audit trails',
  },
  settings: {
    title: 'Platform Settings',
    subtitle: 'Telemetry retention schedules and operational parameters',
  },
};

export const CommandHeader: React.FC<CommandHeaderProps> = ({
  currentSection,
  user,
  isOnlinePresence,
  onTogglePresence,
  onExitToWorld,
  onSignOut,
  onToggleMobileMenu,
  onRefreshData,
  isRefreshing = false,
  lastTelemetryAt = null,
  realtimeStatus = 'connected',
}) => {
  const [presenceLoading, setPresenceLoading] = useState(false);
  const telemetry = useTelemetryStatus(lastTelemetryAt, realtimeStatus);
  const sectionMeta = SECTION_TITLES[currentSection] || {
    title: 'Command Center',
    subtitle: 'NexusWorld Operations',
  };

  const handlePresenceToggle = async () => {
    setPresenceLoading(true);
    try {
      await onTogglePresence();
    } finally {
      setPresenceLoading(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#07070A]/90 backdrop-blur-xl border-b border-white/[0.06] px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        
        {/* Left: Mobile Toggle & Page Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="p-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-zinc-400 hover:text-white lg:hidden"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-display font-bold text-white tracking-wide truncate">
                {sectionMeta.title}
              </h1>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-[9px] font-mono text-zinc-400 uppercase">
                {currentSection.replace('_', ' ')}
              </span>
            </div>
            <p className="text-[11px] font-mono text-zinc-400 truncate hidden md:block mt-0.5">
              {sectionMeta.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Operational Controls & Presence */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Live Telemetry Status Pill */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-mono font-bold uppercase transition-all ${
              telemetry.level === 'live'
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                : telemetry.level === 'delayed'
                ? 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                : telemetry.level === 'offline'
                ? 'bg-red-500/10 border-red-500/25 text-red-400'
                : 'bg-zinc-800 border-zinc-700 text-zinc-400'
            }`}
            title={`Realtime Telemetry Status: ${telemetry.statusText}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                telemetry.level === 'live'
                  ? 'bg-emerald-400 animate-pulse shadow-[0_0_6px_#10B981]'
                  : telemetry.level === 'delayed'
                  ? 'bg-amber-400'
                  : telemetry.level === 'offline'
                  ? 'bg-red-500'
                  : 'bg-zinc-500'
              }`}
            />
            <span>{telemetry.statusPillText}</span>
          </div>

          {/* Manual Refresh Button */}
          {onRefreshData && (
            <button
              type="button"
              onClick={onRefreshData}
              disabled={isRefreshing}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-xs font-mono text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5"
              title="Refresh operational data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#2563EB]' : ''}`} />
              <span className="hidden md:inline">Sync</span>
            </button>
          )}

          {/* Operator Online Presence Switcher */}
          <button
            type="button"
            onClick={handlePresenceToggle}
            disabled={presenceLoading}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all flex items-center gap-2 ${
              isOnlinePresence
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-zinc-800/40 border-zinc-700/50 text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-300'
            }`}
            title="Toggle whether Andy is marked online for live human takeover"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isOnlinePresence ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#10B981]' : 'bg-zinc-600'
              }`}
            />
            <span className="hidden sm:inline font-medium">
              {isOnlinePresence ? 'Andy Online' : 'Andy Away'}
            </span>
          </button>

          {/* User Badge */}
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <div className="w-5 h-5 rounded-full bg-[#2563EB]/20 border border-[#2563EB]/40 flex items-center justify-center text-[10px] font-mono font-bold text-[#3B82F6]">
              {user.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-mono text-zinc-300 max-w-[120px] truncate">
              {user.full_name || user.email.split('@')[0]}
            </span>
          </div>

          {/* Return to 3D World */}
          <button
            type="button"
            onClick={onExitToWorld}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-xs font-mono text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5"
            title="Exit to Public 3D World"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden md:inline">3D World</span>
          </button>

          {/* Sign Out */}
          <button
            type="button"
            onClick={onSignOut}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs font-mono text-red-400 hover:text-red-300 transition-colors flex items-center gap-1.5"
            title="Sign Out of Control Room"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>

        </div>

      </div>
    </header>
  );
};
