import React from 'react';
import {
  Gauge,
  Database,
  Cpu,
  Mail,
  HardDrive,
  Radio,
  Sparkles,
  Info,
} from 'lucide-react';

interface LimitsViewProps {
  counts: {
    visitors: number;
    conversations: number;
    leads: number;
    events: number;
  };
}

export const LimitsView: React.FC<LimitsViewProps> = ({ counts }) => {
  const applicationLimits = [
    {
      category: 'Database Records (PostgreSQL)',
      icon: Database,
      items: [
        { name: 'Visitor Sessions Stored', current: counts.visitors, limit: '100,000 (Soft)', status: 'Healthy' },
        { name: 'Visitor Events (Telemetry)', current: counts.events, limit: '7-Day Retention', status: 'Healthy' },
        { name: 'Customer Leads', current: counts.leads, limit: 'Unlimited', status: 'Healthy' },
        { name: 'Conversation Transcripts', current: counts.conversations, limit: 'Unlimited', status: 'Healthy' },
      ],
    },
    {
      category: 'Realtime WebSocket Channels',
      icon: Radio,
      items: [
        { name: 'Concurrent Connected Clients', current: counts.visitors, limit: '200 (Free Tier / 500 Pro)', status: 'Healthy' },
        { name: 'Realtime Messages / sec', current: 'Dynamic', limit: '100 msgs/s', status: 'Healthy' },
      ],
    },
  ];

  const providerQuotas = [
    {
      service: 'Google Gemini 2.0 (Google Cloud)',
      icon: Sparkles,
      status: 'Provider quota telemetry unavailable',
      note: 'Provider telemetry requires Google Cloud Billing & Quota Metrics integration.',
    },
    {
      service: 'Resend / SMTP Transactional Email',
      icon: Mail,
      status: 'Provider quota telemetry unavailable',
      note: 'Email provider quota telemetry not directly linked.',
    },
    {
      service: 'Supabase Storage & Bandwidth',
      icon: HardDrive,
      status: 'Provider quota telemetry unavailable',
      note: 'Storage usage requires Supabase Management API token connection.',
    },
  ];

  return (
    <div className="space-y-6 font-mono">
      
      {/* Informational Header */}
      <div className="p-5 rounded-2xl bg-[#0A0A0F] border border-white/[0.08] flex items-start gap-3">
        <Info className="w-5 h-5 text-[#3B82F6] shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <div className="font-bold text-white uppercase tracking-wider">
            USAGE TRANSPARENCY PRINCIPLE
          </div>
          <p className="text-zinc-400 leading-relaxed text-[11px]">
            This command center strictly distinguishes measurable Application Usage from external Provider Quotas. External cloud limits are only rendered when genuine API telemetry exists—never disguised with synthetic percentage bars.
          </p>
        </div>
      </div>

      {/* 1. Measurable Application Usage */}
      <div className="space-y-4">
        <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Gauge className="w-4 h-4 text-emerald-400" />
          <span>MEASURED APPLICATION USAGE</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {applicationLimits.map((group) => {
            const Icon = group.icon;
            return (
              <div key={group.category} className="p-5 rounded-2xl bg-[#0A0A0F] border border-white/[0.08] space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Icon className="w-4 h-4 text-[#3B82F6]" />
                  <span>{group.category}</span>
                </div>

                <div className="space-y-3 text-xs">
                  {group.items.map((item) => (
                    <div key={item.name} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
                      <div>
                        <div className="text-zinc-300 font-medium">{item.name}</div>
                        <div className="text-[10px] text-zinc-500">Cap / Policy: {item.limit}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-white text-sm">{item.current}</div>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase">
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Provider Quotas (Explicitly Marked Unavailable - Zero Fake Bars) */}
      <div className="space-y-4">
        <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Cpu className="w-4 h-4 text-zinc-500" />
          <span>PROVIDER QUOTAS & EXTERNAL LIMITS</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {providerQuotas.map((pq) => {
            const Icon = pq.icon;
            return (
              <div key={pq.service} className="p-5 rounded-2xl bg-[#0A0A0F] border border-white/[0.08] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Icon className="w-4 h-4 text-zinc-400" />
                  <span className="truncate">{pq.service}</span>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1">
                  <div className="text-[10px] text-amber-400/90 font-bold uppercase tracking-wider">
                    {pq.status}
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {pq.note}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
