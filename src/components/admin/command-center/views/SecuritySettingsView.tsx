import React, { useState } from 'react';
import {
  ShieldCheck,
  Trash2,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import { supabase } from '../../../../lib/supabaseClient';

export const SecuritySettingsView: React.FC = () => {
  const [retentionDays, setRetentionDays] = useState<number>(7);
  const [isCleaning, setIsCleaning] = useState<boolean>(false);
  const [cleanResult, setCleanResult] = useState<string | null>(null);

  const handleRunCleanup = async () => {
    setIsCleaning(true);
    setCleanResult(null);
    try {
      const { data, error } = await supabase.rpc('cleanup_stale_telemetry', {
        p_days_retention: retentionDays,
      });

      if (error) {
        setCleanResult(`Cleanup error: ${error.message}`);
      } else {
        setCleanResult(
          `Cleanup successful: Purged ${data.deleted_events || 0} old events, marked ${data.deactivated_sessions || 0} inactive sessions.`
        );
      }
    } catch (err: any) {
      setCleanResult(`Execution failed: ${err.message}`);
    } finally {
      setIsCleaning(false);
    }
  };

  const securityPolicies = [
    {
      table: 'public.profiles',
      rule: 'Row Level Security (RLS) Active',
      desc: 'Users can read and update own profile. Role escalation strictly guarded by database trigger against unauthorized JWT claims.',
      status: 'Enforced',
    },
    {
      table: 'public.visitor_sessions',
      rule: 'Session Isolation Policy',
      desc: 'Anonymous visitors can create and update only their own session using cryptographic visitor_token. Full roster visible only to admins.',
      status: 'Enforced',
    },
    {
      table: 'public.visitor_events',
      rule: 'Append-Only Telemetry',
      desc: 'Visitors can insert chronological events tied to their token. Events cannot be modified or deleted by clients.',
      status: 'Enforced',
    },
    {
      table: 'public.conversations & messages',
      rule: 'Transcript Privacy',
      desc: 'Conversations isolated to the owning visitor or authenticated user. Admins granted operational clearance for live handoff.',
      status: 'Enforced',
    },
    {
      table: 'public.system_logs',
      rule: 'Zero-Secret Logging',
      desc: 'Operational log rejects passwords, tokens, and API credentials. Read restricted to owner/admin role.',
      status: 'Enforced',
    },
  ];

  return (
    <div className="space-y-6 font-mono">
      
      {/* Header */}
      <div className="p-5 rounded-2xl bg-[#0A0A0F] border border-white/[0.08] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>SECURITY ENCLAVE & ACCESS CONTROL</span>
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            Row Level Security (RLS) enforcement and telemetry retention parameters.
          </div>
        </div>
      </div>

      {/* RLS Policies Table */}
      <div className="rounded-2xl bg-[#0A0A0F] border border-white/[0.08] overflow-hidden">
        <div className="p-4 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            DATABASE ROW LEVEL SECURITY (RLS) POLICIES
          </span>
          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>ALL TABLES PROTECTED</span>
          </span>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {securityPolicies.map((sp) => (
            <div key={sp.table} className="p-4 hover:bg-white/[0.01] transition-colors text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white font-mono text-[11px]">{sp.table}</span>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {sp.status}
                </span>
              </div>
              <div className="text-zinc-300 font-medium text-[11px]">{sp.rule}</div>
              <p className="text-zinc-400 text-[11px] leading-relaxed">{sp.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Telemetry Retention Strategy Card */}
      <div className="p-5 rounded-2xl bg-[#0A0A0F] border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
            <Sliders className="w-4 h-4 text-[#3B82F6]" />
            <span>TELEMETRY RETENTION & PRUNING SCHEDULE</span>
          </div>
          <span className="text-[10px] text-zinc-500">Automated SQL Function</span>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          Telemetry tables are bounded by server-side pruning to prevent database bloat. Inactive sessions are flagged after 10 minutes of inactivity, and discrete visitor events are purged after the retention window.
        </p>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-400">Event Retention Window:</span>
            <select
              value={retentionDays}
              onChange={(e) => setRetentionDays(Number(e.target.value))}
              className="bg-[#0A0A0F] border border-white/[0.1] text-white rounded px-2.5 py-1 text-xs focus:outline-none"
            >
              <option value={3}>3 Days</option>
              <option value={7}>7 Days (Recommended)</option>
              <option value={14}>14 Days</option>
              <option value={30}>30 Days</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleRunCleanup}
            disabled={isCleaning}
            className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-zinc-200 hover:text-white transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span>{isCleaning ? 'Pruning...' : 'Run Prune Function Now'}</span>
          </button>
        </div>

        {cleanResult && (
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] text-[11px] text-emerald-400">
            {cleanResult}
          </div>
        )}
      </div>

    </div>
  );
};
