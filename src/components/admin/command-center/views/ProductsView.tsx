import React from 'react';
import {
  FileText,
  ScanEye,
  Wrench,
} from 'lucide-react';

export const ProductsView: React.FC = () => {
  const products = [
    {
      id: 'nexus-cv',
      name: 'NexusCV',
      tagline: 'Spatial AI Resume & Portfolio Intelligence',
      status: 'In Development',
      telemetryStatus: 'Telemetry unavailable',
      telemetryNote: 'Product is currently running in local/private beta. Telemetry pipeline pending integration.',
      icon: FileText,
      link: '/products/nexus-cv',
    },
    {
      id: 'site-check',
      name: 'Nexus Site Check',
      tagline: 'Autonomous Full-Stack Audit & Performance Scanner',
      status: 'Active Internal Tool',
      telemetryStatus: 'Telemetry unavailable',
      telemetryNote: 'Audit telemetry connected to private test suites. Public pipeline pending.',
      icon: ScanEye,
      link: '/products/site-check',
    },
    {
      id: 'nexus-tools',
      name: 'Nexus Tools Suite',
      tagline: 'High-craft frontend utilities, design tokens, and components',
      status: 'Integrated Core',
      telemetryStatus: 'Operational (Embedded)',
      telemetryNote: 'Bundled directly inside NexusWorld spatial runtime.',
      icon: Wrench,
      link: '/#capabilities',
    },
  ];

  return (
    <div className="space-y-6 font-mono">
      
      {/* Header */}
      <div className="p-5 rounded-2xl bg-[#0A0A0F] border border-white/[0.08] flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-white uppercase tracking-wider">
            NEXUSWORLD SUITE OPERATIONS
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            Product telemetry and operational integration status. Zero fabricated conversion metrics.
          </div>
        </div>
      </div>

      {/* Product Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {products.map((p) => {
          const Icon = p.icon;
          return (
            <div
              key={p.id}
              className="p-5 rounded-2xl bg-[#0A0A0F] border border-white/[0.08] flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-zinc-300">
                    <Icon className="w-4 h-4 text-[#3B82F6]" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-white/[0.04] text-zinc-300 border border-white/[0.08]">
                    {p.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    {p.name}
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                    {p.tagline}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1">
                <div className="text-[10px] text-zinc-500 font-bold uppercase">
                  TELEMETRY STATUS
                </div>
                <div className="text-xs font-medium text-amber-400/90">
                  {p.telemetryStatus}
                </div>
                <div className="text-[10px] text-zinc-500 leading-tight">
                  {p.telemetryNote}
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
