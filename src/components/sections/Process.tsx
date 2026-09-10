import React, { useState } from 'react';
import { PROCESS_STAGES, type ProcessStage } from '../../data/companyData';
import { GitCommit, CornerDownRight, Check } from 'lucide-react';

export const Process: React.FC = () => {
  const [activeStage, setActiveStage] = useState<ProcessStage>(PROCESS_STAGES[0]);

  return (
    <section id="process" className="py-24 relative border-t border-white/[0.06] bg-void">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="telemetry-tag text-signal">04 // CONNECTED PIPELINE</span>
              <span className="text-zinc-700">·</span>
              <span className="text-xs font-mono text-zinc-500">SYSTEMS DELIVERY MODEL</span>
            </div>
            <h2 className="font-display font-bold text-3xl sm:text-5xl text-white tracking-tight">
              HOW WE THINK & BUILD.
            </h2>
          </div>
          <p className="max-w-md text-zinc-400 text-sm leading-relaxed">
            Not a rigid linear assembly line, but an adaptive connected system designed to translate raw complexity into high-craft digital products.
          </p>
        </div>

        {/* Interactive Pipeline Track */}
        <div className="mt-12">
          
          {/* Progress Indicator Bar / Connected Nodes */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pb-8">
            {PROCESS_STAGES.map((stage) => {
              const isSelected = activeStage.id === stage.id;
              return (
                <button
                  key={stage.id}
                  onClick={() => setActiveStage(stage)}
                  className={`p-4 rounded-xl border text-left transition-all duration-200 relative ${
                    isSelected
                      ? 'bg-void-card border-signal shadow-[0_0_15px_rgba(37,99,235,0.25)]'
                      : 'bg-void-surface/50 border-white/[0.04] hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 mb-2">
                    <span>PHASE</span>
                    <span className={isSelected ? 'text-signal-bright font-bold' : ''}>{stage.step}</span>
                  </div>
                  <div className="font-display font-bold text-white text-sm">
                    {stage.title}
                  </div>
                  <div className={`mt-3 h-1 w-full rounded-full ${isSelected ? 'bg-signal' : 'bg-white/[0.06]'}`} />
                </button>
              );
            })}
          </div>

          {/* Active Stage Deep Architecture Card */}
          <div className="rounded-xl bg-void-card border border-white/[0.08] p-6 lg:p-10 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.06] mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-signal/15 border border-signal/30 flex items-center justify-center font-display font-bold text-signal-bright text-lg">
                  {activeStage.step}
                </div>
                <div>
                  <div className="telemetry-tag text-signal">ACTIVE PHASE INSPECTION</div>
                  <h3 className="font-display font-bold text-2xl text-white">
                    {activeStage.title}
                  </h3>
                </div>
              </div>

              <div className="px-4 py-2 rounded bg-void-surface border border-white/[0.04] text-xs font-mono text-zinc-400 italic">
                "{activeStage.philosophy}"
              </div>
            </div>

            <p className="text-zinc-300 text-sm sm:text-base leading-relaxed mb-8 max-w-2xl">
              {activeStage.summary}
            </p>

            {/* Inputs vs Outputs Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Inputs */}
              <div className="p-5 rounded-lg bg-void-surface/60 border border-white/[0.04]">
                <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <GitCommit className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Phase Inputs (What We Ingest)</span>
                </div>
                <div className="space-y-2">
                  {activeStage.inputs.map((inp, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-zinc-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 shrink-0" />
                      <span>{inp}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Outputs */}
              <div className="p-5 rounded-lg bg-void-surface/60 border border-signal/20">
                <div className="text-xs font-mono text-signal-bright uppercase tracking-wider mb-4 flex items-center gap-2">
                  <CornerDownRight className="w-3.5 h-3.5 text-signal" />
                  <span>Phase Outputs (Tangible Deliverables)</span>
                </div>
                <div className="space-y-2">
                  {activeStage.outputs.map((out, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-zinc-200">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{out}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Adaptive Note */}
            <div className="mt-8 pt-6 border-t border-white/[0.04] flex items-center justify-between text-xs font-mono text-zinc-500">
              <span>FLEXIBLE ARCHITECTURE</span>
              <span className="text-zinc-400">Methodology adapts to problem space</span>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
