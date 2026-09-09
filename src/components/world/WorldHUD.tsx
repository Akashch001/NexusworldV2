import React from 'react';
import { COMPANY_INFO } from '../../data/companyData';
import { NexusSiteCheckDemo } from '../sections/lab/NexusSiteCheckDemo';
import { NexusCVDemo } from '../sections/lab/NexusCVDemo';
import { AIWorkflowDemo } from '../sections/lab/AIWorkflowDemo';
import { Capabilities } from '../sections/Capabilities';
import { Process } from '../sections/Process';
import { Philosophy } from '../sections/Philosophy';
import { ProblemSolver } from '../sections/ProblemSolver';
import { ContactSection } from '../sections/ContactSection';
import { ArrowDown, ShieldCheck, ArrowUpRight } from 'lucide-react';

interface WorldHUDProps {
  activeDistrictIndex: number;
  progress: number;
  onJumpToDistrict: (index: number) => void;
}

export const WorldHUD: React.FC<WorldHUDProps> = ({
  activeDistrictIndex,
  onJumpToDistrict,
}) => {
  return (
    <div className="relative z-10 w-full pointer-events-none">
      
      {/* SECTION 00 & 01: THE VOID & SIGNAL (Hero Entrance) */}
      <section className="min-h-screen flex flex-col justify-center px-6 lg:px-16 pt-24 pb-16 relative">
        <div className="max-w-4xl pointer-events-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-void-card/90 border border-white/[0.08] backdrop-blur-md mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-signal animate-pulse" />
            <span className="telemetry-tag text-zinc-300">
              BOUTIQUE DIGITAL PRODUCT PARTNER // 2026 // SPATIAL NODE 0{activeDistrictIndex}
            </span>
          </div>

          <h1 className="font-display font-bold text-hero text-white tracking-tight leading-none mb-6">
            WE BUILD <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500">
              DIGITAL WORLDS.
            </span>
          </h1>

          <p className="text-zinc-300 text-base sm:text-xl font-normal leading-relaxed max-w-2xl mb-8">
            NexusWorld helps ambitious companies transform complex ideas into digital products that are{' '}
            <strong className="text-white font-medium">clear</strong>,{' '}
            <strong className="text-white font-medium">useful</strong>,{' '}
            <strong className="text-white font-medium">technically strong</strong>, and{' '}
            <strong className="text-white font-medium">visually exceptional</strong>.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => onJumpToDistrict(10)}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-lg bg-signal hover:bg-signal-bright text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)]"
            >
              <span>Start a Project</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onJumpToDistrict(8)}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-lg bg-void-card/80 hover:bg-void-surface text-zinc-300 hover:text-white border border-white/[0.1] text-xs font-semibold uppercase tracking-wider backdrop-blur-md transition-all"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Explore The Lab (Real Work)</span>
            </button>
          </div>

          <div className="mt-12 flex items-center gap-3 text-xs font-mono text-zinc-500">
            <ArrowDown className="w-4 h-4 text-signal animate-bounce" />
            <span>YOU DON'T JUST SCROLL NEXUSWORLD. YOU ENTER IT.</span>
          </div>
        </div>
      </section>

      {/* SECTION 02 & 03: NEXUS CORE & ARCHITECTURAL FOUNDATION */}
      <section className="min-h-screen flex flex-col justify-center px-6 lg:px-16 py-20 relative">
        <div className="max-w-3xl pointer-events-auto bg-void-card/85 backdrop-blur-xl p-8 lg:p-12 rounded-2xl border border-white/[0.08] shadow-2xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="telemetry-tag text-signal">02 // NEXUS CORE ARCHITECTURE</span>
            <span className="text-zinc-700">·</span>
            <span className="text-xs font-mono text-zinc-500">SYSTEM COUPLING</span>
          </div>

          <h2 className="font-display font-bold text-3xl sm:text-5xl text-white tracking-tight mb-6">
            STRATEGY + DESIGN + TECHNOLOGY + ENGINEERING + INTELLIGENCE.
          </h2>

          <p className="text-zinc-300 text-sm sm:text-base leading-relaxed mb-6">
            A digital world is more than individual screens. It is a connected product ecosystem: a system of interfaces, an authoritative brand identity, and resilient software that solves real human problems without template compromises.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono pt-4 border-t border-white/[0.06]">
            {COMPANY_INFO.formula.map((f, idx) => (
              <div key={idx} className="p-3 rounded bg-void-surface/60 border border-white/[0.04]">
                <div className="text-signal-bright font-bold text-[11px] mb-1">{f.label}</div>
                <div className="text-[10px] text-zinc-400 leading-tight">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 04 & 05: CAPABILITIES (DESIGN & DEVELOPMENT DISTRICTS) */}
      <div className="pointer-events-auto">
        <Capabilities />
      </div>

      {/* SECTION 06 & 07: CONNECTED PROCESS PIPELINE */}
      <div className="pointer-events-auto">
        <Process />
      </div>

      {/* SECTION 08: THE LAB (REAL WORK PRODUCT DEMOS) */}
      <section id="lab" className="min-h-screen py-24 px-6 lg:px-16 relative">
        <div className="max-w-7xl mx-auto pointer-events-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-white/[0.06] mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="telemetry-tag text-signal">08 // THE LAB</span>
                <span className="text-zinc-700">·</span>
                <span className="text-xs font-mono text-zinc-500">PROVING CAPABILITY THROUGH REAL SYSTEMS</span>
              </div>
              <h2 className="font-display font-bold text-3xl sm:text-5xl text-white tracking-tight">
                REAL WORK & PRODUCT PROOFS.
              </h2>
            </div>
            <div className="max-w-md text-xs font-mono text-zinc-400">
              <div className="flex items-center gap-2 text-emerald-400 mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Zero fabricated metrics. All systems authentic.</span>
              </div>
              Only genuine internal prototypes and verified applications are presented.
            </div>
          </div>

          <div className="space-y-12">
            {/* 1. Nexus Site Check */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="telemetry-tag text-amber-400">PROJECT 01 // AUDIT PIPELINE</span>
                <span className="text-xs font-mono text-zinc-500">PROTOTYPE</span>
              </div>
              <NexusSiteCheckDemo />
            </div>

            {/* 2. NexusCV */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="telemetry-tag text-blue-400">PROJECT 02 // CAREER PRODUCT ENGINE</span>
                <span className="text-xs font-mono text-zinc-500">IN DEVELOPMENT</span>
              </div>
              <NexusCVDemo />
            </div>

            {/* 3. AI Workflow Engine */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="telemetry-tag text-purple-400">PROJECT 03 // STATE MACHINE AUTOMATION</span>
                <span className="text-xs font-mono text-zinc-500">EXPERIMENT</span>
              </div>
              <AIWorkflowDemo />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 09: FIRST PRINCIPLES & PHILOSOPHY */}
      <div className="pointer-events-auto">
        <Philosophy />
      </div>

      {/* SECTION 10: PROBLEMS WE SOLVE */}
      <div className="pointer-events-auto">
        <ProblemSolver />
      </div>

      {/* SECTION 11: FINAL NEXUS & CONTACT */}
      <div className="pointer-events-auto">
        <ContactSection />
      </div>

    </div>
  );
};
