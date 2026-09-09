import React, { useState } from 'react';
import {
  HeartPulse,
  Database,
  Shield,
  Radio,
  Sparkles,
  RefreshCw,
  Activity,
  Cpu,
} from 'lucide-react';
import type { SystemHealthReport, ServiceHealthMetric } from '../../../../lib/healthTelemetry';

interface SystemHealthViewProps {
  healthReport: SystemHealthReport | null;
  onRefreshHealth: (probeGemini?: boolean) => Promise<void>;
  isProbing?: boolean;
}

export const SystemHealthView: React.FC<SystemHealthViewProps> = ({
  healthReport,
  onRefreshHealth,
  isProbing = false,
}) => {
  const [manualProbeRunning, setManualProbeRunning] = useState(false);

  const handleRunProbe = async (forceGemini: boolean) => {
    setManualProbeRunning(true);
    try {
      await onRefreshHealth(forceGemini);
    } finally {
      setManualProbeRunning(false);
    }
  };

  const renderStatusBadge = (status: ServiceHealthMetric['status']) => {
    switch (status) {
      case 'Operational':
        return (
          <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Operational</span>
          </span>
        );
      case 'Degraded':
        return (
          <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Degraded</span>
          </span>
        );
      case 'Error':
        return (
          <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <span>Error</span>
          </span>
        );
      case 'Unknown':
      default:
        return (
          <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
            <span>Unknown</span>
          </span>
        );
    }
  };

  if (!healthReport) {
    return (
      <div className="p-12 text-center rounded-2xl bg-[#0A0A0F] border border-white/[0.08] space-y-3 font-mono">
        <HeartPulse className="w-8 h-8 text-[#2563EB] animate-pulse mx-auto" />
        <div className="text-sm font-bold text-white">PROBING INFRASTRUCTURE...</div>
        <p className="text-xs text-zinc-400">
          Running round-trip latency checks across Database, Auth, Realtime, and Gemini.
        </p>
      </div>
    );
  }

  const { services } = healthReport;
  const serviceList = [
    { key: 'database', item: services.database, icon: Database, desc: 'PostgreSQL Database engine via Supabase PostgREST' },
    { key: 'auth', item: services.auth, icon: Shield, desc: 'PKCE Session token exchange & identity provider' },
    { key: 'realtime', item: services.realtime, icon: Radio, desc: 'WebSocket channel for instantaneous visitor & handoff sync' },
    { key: 'nora', item: services.noraCore, icon: Sparkles, desc: 'AI Concierge orchestration and conversation state machine' },
    { key: 'gemini', item: services.geminiAi, icon: Cpu, desc: 'Google Gemini multimodal inference provider' },
    { key: 'app', item: services.application, icon: Activity, desc: 'Client application & frontend asset delivery engine' },
  ];

  return (
    <div className="space-y-6 font-mono">
      
      {/* Overview Banner */}
      <div className="p-5 rounded-2xl bg-[#0A0A0F] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              INFRASTRUCTURE HEALTH METRICS
            </h2>
            {renderStatusBadge(healthReport.overallStatus)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            Last measured: {new Date(healthReport.timestamp).toLocaleTimeString()} • Zero fabricated health claims
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleRunProbe(false)}
            disabled={manualProbeRunning || isProbing}
            className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-white transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${manualProbeRunning ? 'animate-spin text-[#2563EB]' : ''}`} />
            <span>Ping Services</span>
          </button>

          <button
            type="button"
            onClick={() => handleRunProbe(true)}
            disabled={manualProbeRunning || isProbing}
            className="px-3 py-1.5 rounded-lg bg-[#2563EB]/20 hover:bg-[#2563EB]/30 border border-[#2563EB]/40 text-xs text-[#3B82F6] hover:text-white transition-colors flex items-center gap-1.5"
            title="Sends a single controlled test prompt to Gemini to test end-to-end inference without polling"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Test Gemini Provider</span>
          </button>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {serviceList.map(({ key, item, icon: Icon, desc }) => (
          <div
            key={key}
            className="p-5 rounded-2xl bg-[#0A0A0F] border border-white/[0.08] flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-zinc-300">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wide">
                      {item.name}
                    </h3>
                    <span className="text-[10px] text-zinc-500 uppercase">{item.category}</span>
                  </div>
                </div>

                {renderStatusBadge(item.status)}
              </div>

              <p className="text-[11px] text-zinc-400 leading-relaxed">
                {desc}
              </p>
            </div>

            <div className="pt-3 border-t border-white/[0.04] flex items-center justify-between text-[11px]">
              <span className="text-zinc-500">Latency:</span>
              <span className="font-bold text-white">
                {item.latencyMs !== null ? `${item.latencyMs} ms` : 'Telemetry Connected'}
              </span>
            </div>

            {item.error && (
              <div className="p-2 rounded bg-red-500/10 border border-red-500/20 text-[10px] text-red-400">
                {item.error}
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
};
