import React, { useState } from 'react';
import { LAB_PROJECTS, type LabProject } from '../../data/labData';
import { NexusSiteCheckDemo } from './lab/NexusSiteCheckDemo';
import { NexusCVDemo } from './lab/NexusCVDemo';
import { AIWorkflowDemo } from './lab/AIWorkflowDemo';
import { ShieldCheck } from 'lucide-react';

export const Lab: React.FC = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('nexus-site-check');

  const getStatusBadge = (status: LabProject['status']) => {
    switch (status) {
      case 'PROTOTYPE':
        return <span className="telemetry-tag px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">PROTOTYPE</span>;
      case 'IN DEVELOPMENT':
        return <span className="telemetry-tag px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">IN DEVELOPMENT</span>;
      case 'EXPERIMENT':
        return <span className="telemetry-tag px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">EXPERIMENT</span>;
    }
  };

  return (
    <section id="lab" className="py-24 relative border-t border-white/[0.06] bg-void-deep contain-isolated">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        
        {/* Section Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="telemetry-tag text-signal">03 // PROVING CAPABILITY</span>
              <span className="text-zinc-700">·</span>
              <span className="text-xs font-mono text-zinc-500">REAL WORK & LIVING SYSTEMS</span>
            </div>
            <h2 className="font-display font-bold text-3xl sm:text-5xl text-white tracking-tight">
              THE LAB.
            </h2>
          </div>
          <div className="max-w-md">
            <p className="text-zinc-400 text-sm leading-relaxed mb-2">
              We prove capability through tangible engineering. The Lab showcases verified NexusWorld internal projects, prototypes, and experiments.
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Only verified, actual systems. Zero simulated enterprise credentials.</span>
            </div>
          </div>
        </div>

        {/* Lab Project Switcher Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
          {LAB_PROJECTS.map((proj) => {
            const isSelected = selectedProjectId === proj.id;
            return (
              <button
                key={proj.id}
                onClick={() => setSelectedProjectId(proj.id)}
                className={`p-5 rounded-xl border text-left transition-all duration-300 relative group ${
                  isSelected
                    ? 'bg-void-card border-signal shadow-[0_0_20px_rgba(37,99,235,0.2)]'
                    : 'bg-void-surface/50 border-white/[0.06] hover:border-white/15 hover:bg-void-surface'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  {getStatusBadge(proj.status)}
                  <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-signal' : 'bg-transparent'}`} />
                </div>
                <h3 className="font-display font-bold text-base text-white group-hover:text-signal-bright transition-colors">
                  {proj.name}
                </h3>
                <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
                  {proj.tagline}
                </p>
              </button>
            );
          })}
        </div>

        {/* Active Interactive Lab Demonstration */}
        <div className="mt-8">
          {selectedProjectId === 'nexus-site-check' && <NexusSiteCheckDemo />}
          {selectedProjectId === 'nexus-cv' && <NexusCVDemo />}
          {selectedProjectId === 'ai-automation-engine' && <AIWorkflowDemo />}
        </div>

      </div>
    </section>
  );
};
