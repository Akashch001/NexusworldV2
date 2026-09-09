import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const PrivacyDisclosure: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`p-3 rounded-lg bg-void-surface/80 border border-white/[0.06] text-[11px] font-mono text-zinc-400 flex items-start gap-2.5 ${className}`}>
      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
      <div className="leading-relaxed">
        <span className="text-zinc-200 font-semibold block mb-0.5">
          CONFIDENTIALITY & DATA INTEGRITY
        </span>
        Project details and contact telemetry are handled with strict privacy. Zero third-party ad networks, no automated sales spam. Andy Watson & NexusWorld leadership review briefs directly.
      </div>
    </div>
  );
};
