import React from 'react';
import { ArrowUpRight, Mail, ShieldCheck } from 'lucide-react';
import { COMPANY_INFO } from '../../data/companyData';

interface FooterProps {
  onNavigate: (sectionId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="relative bg-[#030305] border-t border-white/[0.08] pt-20 pb-12 overflow-hidden">
      {/* Subtle background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-signal/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        
        {/* Large Editorial Brand Statement */}
        <div className="pb-16 border-b border-white/[0.06]">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="max-w-2xl">
              <span className="telemetry-tag text-signal tracking-widest block mb-3">
                MISSION STATEMENT // 2026
              </span>
              <h2 className="font-display font-bold text-3xl sm:text-5xl lg:text-6xl tracking-tight text-white leading-[1.08]">
                WE BUILD <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500">
                  DIGITAL WORLDS.
                </span>
              </h2>
              <p className="mt-4 text-zinc-400 text-sm sm:text-base leading-relaxed">
                A boutique digital product partner for ambitious companies transforming complex ideas into clear, useful, technically strong, and visually exceptional digital products.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <a
                href={`mailto:${COMPANY_INFO.email}`}
                className="group inline-flex items-center gap-3 px-6 py-3.5 rounded-lg bg-white text-black font-semibold text-xs uppercase tracking-wider hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)]"
              >
                <Mail className="w-4 h-4" />
                <span>{COMPANY_INFO.email}</span>
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Middle Columns: Architecture, Navigation, Coordinates */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 border-b border-white/[0.06] text-xs">
          {/* Col 1: Identity & Attribution */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded bg-void-card border border-white/10 flex items-center justify-center">
                <span className="font-display font-bold text-white text-xs">N</span>
              </div>
              <span className="font-display font-bold text-sm tracking-wider text-white">
                {COMPANY_INFO.brand}
              </span>
            </div>
            <p className="text-zinc-400 leading-relaxed mb-4">
              Engineered around human interaction and technological restraint.
            </p>
            <div className="p-3 rounded bg-void-card/60 border border-white/[0.06] font-mono text-[11px] text-zinc-400 space-y-1">
              <div className="text-zinc-500">FOUNDER ATTRIBUTION</div>
              <div className="text-zinc-200 font-semibold">{COMPANY_INFO.founder}</div>
              <div className="text-signal">{COMPANY_INFO.role} · Est. {COMPANY_INFO.year}</div>
            </div>
          </div>

          {/* Col 2: Core Capabilities */}
          <div>
            <div className="telemetry-tag text-zinc-400 mb-4">CAPABILITY MATRIX</div>
            <ul className="space-y-2 text-zinc-400">
              {['Product Strategy', 'UI/UX Design', 'Design Systems', 'Frontend Engineering', 'AI Experiences', 'SaaS Products', 'Branding & Digital Identity'].map((cap) => (
                <li key={cap}>
                  <button
                    onClick={() => onNavigate('capabilities')}
                    className="hover:text-white transition-colors text-left"
                  >
                    {cap}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: The Lab */}
          <div>
            <div className="telemetry-tag text-zinc-400 mb-4">THE LAB // REAL WORK</div>
            <ul className="space-y-2.5 text-zinc-400 font-mono text-[11px]">
              <li>
                <button
                  onClick={() => onNavigate('lab')}
                  className="flex items-center justify-between w-full hover:text-white transition-colors text-left focus:outline-none"
                >
                  <span>Nexus Site Check</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">PROTOTYPE</span>
                </button>
              </li>
              <li>
                <a
                  href="https://nexuscv.nexusworld.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between w-full hover:text-white transition-colors text-left group focus:outline-none"
                >
                  <span className="flex items-center gap-1">
                    NexusCV
                    <ArrowUpRight className="w-3 h-3 text-zinc-500 group-hover:text-white transition-colors" />
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">LIVE APP ↗</span>
                </a>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('lab')}
                  className="flex items-center justify-between w-full hover:text-white transition-colors text-left focus:outline-none"
                >
                  <span>Workflow State Engine</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">EXPERIMENT</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Verified Integrity */}
          <div>
            <div className="telemetry-tag text-zinc-400 mb-4">STANDARDS & ETHICS</div>
            <p className="text-zinc-400 leading-relaxed mb-3">
              We do not publish manufactured case studies or unverified client rosters. Every project presented is real, verified, and explicitly categorized.
            </p>
            <div className="flex items-center gap-2 text-zinc-500 font-mono text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero-Fabrication Guarantee</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Domain */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-zinc-500">
          <div>
            © {COMPANY_INFO.year} {COMPANY_INFO.brand} · All Rights Reserved.
          </div>

          <div className="flex items-center gap-6">
            <span className="text-zinc-400">DOMAIN: {COMPANY_INFO.domain}</span>
            <span className="text-zinc-700">|</span>
            <a
              href={`mailto:${COMPANY_INFO.email}`}
              className="hover:text-signal transition-colors text-zinc-400"
            >
              {COMPANY_INFO.email}
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};
