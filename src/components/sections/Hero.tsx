import React, { useState } from 'react';
import { ArrowUpRight, Cpu, Layers, Sparkles, Code2, Compass, CheckCircle2 } from 'lucide-react';
import { COMPANY_INFO } from '../../data/companyData';

interface HeroProps {
  onNavigate: (sectionId: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ onNavigate }) => {
  const [activeNode, setActiveNode] = useState<number>(0);

  const nodes = [
    {
      title: "STRATEGY",
      icon: Compass,
      metric: "01",
      desc: "Distilling ambiguous product ideas into structured roadmaps and viable systems.",
      accent: "from-blue-500/20 to-blue-600/5",
    },
    {
      title: "DESIGN",
      icon: Layers,
      metric: "02",
      desc: "Crafting architectural visual systems, ergonomic user flows, and cognitive clarity.",
      accent: "from-indigo-500/20 to-indigo-600/5",
    },
    {
      title: "TECHNOLOGY",
      icon: Cpu,
      metric: "03",
      desc: "Purposeful technology stack selection. Technology serves the product, not vice versa.",
      accent: "from-cyan-500/20 to-cyan-600/5",
    },
    {
      title: "ENGINEERING",
      icon: Code2,
      metric: "04",
      desc: "Pixel-accurate frontend performance, sub-50ms INP response, and zero layout shift.",
      accent: "from-blue-600/20 to-blue-700/5",
    },
    {
      title: "INTELLIGENCE",
      icon: Sparkles,
      metric: "05",
      desc: "Practical AI workflows and cognitive interfaces engineered for human leverage.",
      accent: "from-sky-500/20 to-sky-600/5",
    },
  ];

  return (
    <section id="hero" className="relative min-h-[90vh] flex flex-col justify-center pt-28 pb-20 overflow-hidden">
      {/* Subtle Background Radial Light */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-signal/[0.07] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10 w-full">
        
        {/* Top Status Header */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-void-card border border-white/[0.08] shadow-sm">
            <span className="w-2 h-2 rounded-full bg-signal animate-pulse" />
            <span className="text-[11px] font-mono tracking-wider text-zinc-300 uppercase">
              Boutique Digital Product Partner
            </span>
          </div>
          <span className="hidden sm:inline-block text-zinc-600 font-mono text-xs">/</span>
          <span className="telemetry-tag text-zinc-400">
            NEXUSWORLD · EST. {COMPANY_INFO.year}
          </span>
        </div>

        {/* Primary Typography Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-7">
            {/* Primary Brand Statement */}
            <h1 className="font-display font-bold text-4xl sm:text-6xl lg:text-7xl tracking-tight text-white leading-[1.05]">
              WE BUILD <br />
              <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-100 to-zinc-400">
                DIGITAL WORLDS.
              </span>
            </h1>

            {/* Strategic Value Proposition */}
            <p className="mt-6 text-zinc-300 text-base sm:text-lg leading-relaxed font-normal max-w-xl">
              We help ambitious companies transform complex ideas into digital products that are{' '}
              <strong className="text-white font-medium">clear</strong>,{' '}
              <strong className="text-white font-medium">useful</strong>,{' '}
              <strong className="text-white font-medium">technically strong</strong>, and{' '}
              <strong className="text-white font-medium">visually exceptional</strong>.
            </p>

            <div className="mt-4 flex items-center gap-2 text-xs font-mono text-signal-bright">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Building digital experiences that move businesses forward.</span>
            </div>

            {/* Action Bar */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={() => onNavigate('contact')}
                className="group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-lg bg-signal hover:bg-signal-bright text-white text-xs font-semibold uppercase tracking-wider transition-all duration-200 shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_35px_rgba(37,99,235,0.6)]"
              >
                <span>Start a Project</span>
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>

              <button
                onClick={() => onNavigate('lab')}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-lg bg-void-card hover:bg-void-surface text-zinc-300 hover:text-white border border-white/[0.08] hover:border-white/20 text-xs font-semibold uppercase tracking-wider transition-all duration-200"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Explore The Lab (Real Work)</span>
              </button>
            </div>
          </div>

          {/* Right: Interactive Product World Architecture Engine */}
          <div className="lg:col-span-5">
            <div className="rounded-xl bg-void-surface/90 border border-white/[0.08] p-5 sm:p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-signal" />
                  <span className="telemetry-tag text-zinc-300">CORE FORMULA // ARCHITECTURE</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">INTERACTIVE SYSTEM</span>
              </div>

              {/* Node Switcher */}
              <div className="grid grid-cols-5 gap-1.5 p-1 rounded-lg bg-void-deep border border-white/[0.04] mb-5">
                {nodes.map((n, idx) => {
                  const Icon = n.icon;
                  const isActive = activeNode === idx;
                  return (
                    <button
                      key={n.title}
                      onClick={() => setActiveNode(idx)}
                      className={`flex flex-col items-center py-2 px-1 rounded transition-all ${
                        isActive
                          ? 'bg-signal text-white shadow-[0_0_12px_rgba(37,99,235,0.4)]'
                          : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]'
                      }`}
                      aria-label={`Inspect ${n.title}`}
                    >
                      <Icon className="w-3.5 h-3.5 mb-1" />
                      <span className="text-[9px] font-mono font-semibold tracking-tighter">
                        {n.title.slice(0, 4)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Node Detail Card */}
              <div className="p-5 rounded-lg bg-gradient-to-b from-white/[0.03] to-transparent border border-white/[0.06] relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded bg-signal/15 border border-signal/30 flex items-center justify-center text-signal-bright">
                      {React.createElement(nodes[activeNode].icon, { className: 'w-4 h-4' })}
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-signal tracking-widest uppercase">
                        PILLAR {nodes[activeNode].metric}
                      </div>
                      <h4 className="font-display font-bold text-white text-base tracking-wide">
                        {nodes[activeNode].title}
                      </h4>
                    </div>
                  </div>
                  <span className="telemetry-tag text-zinc-500">ACTIVE TELEMETRY</span>
                </div>

                <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed mb-4">
                  {nodes[activeNode].desc}
                </p>

                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <span className="text-zinc-500">SYSTEM COUPLING</span>
                  <span className="text-emerald-400">SYNCHRONIZED (100%)</span>
                </div>
              </div>

              {/* Bottom Philosophy Snippet */}
              <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between text-[10px] font-mono text-zinc-500">
                <span>NOT A TEMPLATE AGENCY</span>
                <span className="text-zinc-400">BOUTIQUE PRODUCT PARTNER</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
