import React from 'react';
import { CLIENT_CHALLENGES } from '../../data/companyData';
import { HelpCircle } from 'lucide-react';

export const ProblemSolver: React.FC = () => {
  return (
    <section id="impact" className="py-24 relative border-t border-white/[0.06] bg-void">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="telemetry-tag text-signal">06 // PROBLEM RESOLUTION</span>
              <span className="text-zinc-700">·</span>
              <span className="text-xs font-mono text-zinc-500">TURNING COMPLEXITY INTO CLARITY</span>
            </div>
            <h2 className="font-display font-bold text-3xl sm:text-5xl text-white tracking-tight">
              PROBLEMS WE SOLVE.
            </h2>
          </div>
          <p className="max-w-md text-zinc-400 text-sm leading-relaxed">
            Ambitious founders and product teams approach NexusWorld when their product vision is sophisticated, but their user experience is fragmented, unclear, or outdated.
          </p>
        </div>

        {/* 4 Client Problem Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          {CLIENT_CHALLENGES.map((challenge, idx) => (
            <div
              key={challenge.id}
              className="p-6 lg:p-8 rounded-xl bg-void-card/70 border border-white/[0.06] hover:border-white/15 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="telemetry-tag text-zinc-500">CHALLENGE 0{idx + 1}</span>
                  <HelpCircle className="w-4 h-4 text-zinc-600" />
                </div>

                <h3 className="font-display font-bold text-lg text-white mb-2">
                  {challenge.problem}
                </h3>

                <div className="p-3 rounded bg-red-950/10 border border-red-900/20 text-xs text-zinc-400 mb-4 font-mono">
                  <span className="text-red-400 block mb-1 uppercase text-[10px]">Symptom:</span>
                  {challenge.symptom}
                </div>

                <div className="p-3 rounded bg-void-surface border border-signal/20 text-xs text-zinc-300">
                  <span className="text-signal-bright font-mono block mb-1 uppercase text-[10px]">NexusWorld Solution:</span>
                  {challenge.nexusSolution}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/[0.04] flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-500">BUSINESS IMPACT</span>
                <span className="text-emerald-400 font-semibold">{challenge.impact}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
