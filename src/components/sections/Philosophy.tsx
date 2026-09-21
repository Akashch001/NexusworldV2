import React, { useState } from 'react';
import { PHILOSOPHY_PILLARS, type PhilosophyPillar } from '../../data/companyData';
import { Check, Layers } from 'lucide-react';

export const Philosophy: React.FC = () => {
  const [activePillar, setActivePillar] = useState<PhilosophyPillar>(PHILOSOPHY_PILLARS[0]);
  const [interactiveHoverState, setInteractiveHoverState] = useState<boolean>(false);
  const [systemScale, setSystemScale] = useState<number>(1);
  const [motionTriggered, setMotionTriggered] = useState<boolean>(false);

  return (
    <section id="philosophy" className="py-24 relative border-t border-white/[0.06] bg-void-deep contain-isolated">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="telemetry-tag text-signal">05 // INTERACTIVE PHILOSOPHY</span>
              <span className="text-zinc-700">·</span>
              <span className="text-xs font-mono text-zinc-500">FIRST PRINCIPLES OF INTERFACE DESIGN</span>
            </div>
            <h2 className="font-display font-bold text-3xl sm:text-5xl text-white tracking-tight">
              EVERY INTERACTION MATTERS.
            </h2>
          </div>
          <p className="max-w-md text-zinc-400 text-sm leading-relaxed">
            Every interface should have a purpose. Every animation should communicate change. Every component should contribute to the digital world.
          </p>
        </div>

        {/* Interactive Principle Playground */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left: 5 Pillars List */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            {PHILOSOPHY_PILLARS.map((pillar) => {
              const isSelected = activePillar.id === pillar.id;
              return (
                <button
                  key={pillar.id}
                  onClick={() => setActivePillar(pillar)}
                  className={`p-5 rounded-xl border text-left transition-all duration-200 ${
                    isSelected
                      ? 'bg-void-card border-signal shadow-[0_0_20px_rgba(37,99,235,0.2)]'
                      : 'bg-void-surface/50 border-white/[0.04] hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono mb-2">
                    <span className="telemetry-tag text-zinc-500">{pillar.title}</span>
                    <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-signal' : 'bg-transparent'}`} />
                  </div>
                  <h3 className="font-display font-bold text-white text-base mb-1">
                    {pillar.axiom}
                  </h3>
                  <p className="text-xs text-zinc-400 line-clamp-2">
                    {pillar.explanation}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Right: Live Interactive Demonstration of the Active Principle */}
          <div className="lg:col-span-7 rounded-xl bg-void-card border border-white/[0.08] p-6 lg:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
            
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-6">
                <span className="telemetry-tag text-signal">
                  LIVE DEMONSTRATION // {activePillar.title}
                </span>
                <span className="text-[11px] font-mono text-zinc-500">INTERACTIVE PLAYGROUND</span>
              </div>

              {/* Dynamic Interactive Stage based on selected Pillar */}
              <div className="min-h-[220px] rounded-xl bg-void-deep border border-white/[0.06] p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
                
                {/* 1. INTERACTION Demonstration */}
                {activePillar.id === 'interaction' && (
                  <div className="space-y-4">
                    <div className="text-xs font-mono text-zinc-400">
                      Hover or tap the object below to experience intentional tactile feedback:
                    </div>
                    <button
                      onMouseEnter={() => setInteractiveHoverState(true)}
                      onMouseLeave={() => setInteractiveHoverState(false)}
                      className={`px-6 py-4 rounded-xl font-mono text-xs uppercase tracking-wider transition-all duration-300 border ${
                        interactiveHoverState
                          ? 'bg-signal text-white border-signal-bright shadow-[0_0_30px_rgba(37,99,235,0.6)] scale-105'
                          : 'bg-void-surface text-zinc-300 border-white/15'
                      }`}
                    >
                      {interactiveHoverState ? 'AFFORDANCE REVEALED: READY' : 'RESTING STATE: INTENTIONAL AFFORDANCE'}
                    </button>
                    <div className="text-[11px] font-mono text-zinc-500">
                      Response latency: &lt;16ms (Instant 60fps render)
                    </div>
                  </div>
                )}

                {/* 2. PURPOSE Demonstration */}
                {activePillar.id === 'purpose' && (
                  <div className="space-y-4 max-w-md">
                    <div className="text-xs font-mono text-signal">
                      // RATIONALE OVER NOISE
                    </div>
                    <p className="text-zinc-200 text-sm leading-relaxed">
                      "We never add visual elements simply because the screen felt empty. Every component must justify its presence by reducing cognitive friction."
                    </p>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono">
                      <Check className="w-3.5 h-3.5" />
                      <span>COGNITIVE LOAD MINIMIZED</span>
                    </div>
                  </div>
                )}

                {/* 3. MOTION Demonstration */}
                {activePillar.id === 'motion' && (
                  <div className="space-y-4">
                    <div className="text-xs font-mono text-zinc-400">
                      Motion communicates change of state and spatial continuity:
                    </div>
                    <div className="flex items-center justify-center gap-4">
                      <div
                        className={`w-16 h-16 rounded-xl border border-signal/50 flex items-center justify-center transition-all duration-500 ${
                          motionTriggered
                            ? 'bg-signal text-white rotate-45 scale-110 shadow-[0_0_25px_rgba(37,99,235,0.5)]'
                            : 'bg-void-surface text-zinc-400'
                        }`}
                      >
                        <Layers className="w-6 h-6" />
                      </div>
                    </div>
                    <button
                      onClick={() => setMotionTriggered(!motionTriggered)}
                      className="px-4 py-2 rounded bg-void-surface border border-white/10 hover:border-signal text-xs font-mono text-zinc-300 hover:text-white transition-colors"
                    >
                      Trigger State Morph
                    </button>
                  </div>
                )}

                {/* 4. SYSTEM Demonstration */}
                {activePillar.id === 'system' && (
                  <div className="space-y-4 w-full max-w-sm">
                    <div className="text-xs font-mono text-zinc-400 flex items-center justify-between">
                      <span>Global Spatial Token Scale</span>
                      <span className="text-signal-bright font-bold">{systemScale}x</span>
                    </div>
                    <input
                      id="global-token-scale"
                      name="globalTokenScale"
                      aria-label="Global Spatial Token Scale"
                      type="range"
                      min="0.8"
                      max="1.3"
                      step="0.1"
                      value={systemScale}
                      onChange={(e) => setSystemScale(parseFloat(e.target.value))}
                      className="w-full accent-signal"
                    />
                    <div className="flex items-center justify-center gap-3">
                      <div
                        style={{ padding: `${8 * systemScale}px` }}
                        className="rounded bg-void-surface border border-white/10 text-[10px] font-mono text-zinc-300"
                      >
                        Component A
                      </div>
                      <div
                        style={{ padding: `${12 * systemScale}px` }}
                        className="rounded bg-void-surface border border-signal/40 text-[10px] font-mono text-signal"
                      >
                        Component B
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500">
                      All components synchronously inherit token adjustments
                    </div>
                  </div>
                )}

                {/* 5. CODE Demonstration */}
                {activePillar.id === 'code' && (
                  <div className="space-y-3 text-left w-full">
                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                      <span>CORE WEB VITALS TARGETS</span>
                      <span className="text-emerald-400">PASSED</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                      <div className="p-2.5 rounded bg-void-surface border border-white/[0.04] text-center">
                        <div className="text-zinc-500 text-[10px]">INP</div>
                        <div className="text-emerald-400 font-bold mt-1">&lt; 32ms</div>
                      </div>
                      <div className="p-2.5 rounded bg-void-surface border border-white/[0.04] text-center">
                        <div className="text-zinc-500 text-[10px]">LCP</div>
                        <div className="text-emerald-400 font-bold mt-1">&lt; 0.8s</div>
                      </div>
                      <div className="p-2.5 rounded bg-void-surface border border-white/[0.04] text-center">
                        <div className="text-zinc-500 text-[10px]">CLS</div>
                        <div className="text-emerald-400 font-bold mt-1">0.000</div>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Code Snippet Below Playground */}
              <div className="mt-6 p-4 rounded-lg bg-void-deep border border-white/[0.04] font-mono text-xs text-zinc-300">
                <span className="text-zinc-600 block mb-1">// Axiomatic Implementation</span>
                <code className="text-signal-bright">{activePillar.codeSnippet}</code>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-zinc-500">
              <span>NEXUS PHILOSOPHY STANDARD</span>
              <span className="text-zinc-400">Controlled Craft</span>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
