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

            <div className="flex flex-col items-start lg:items-end gap-4">
              <a
                href={`mailto:${COMPANY_INFO.email}`}
                className="group inline-flex items-center gap-3 px-6 py-3.5 rounded-lg bg-white text-black font-semibold text-xs uppercase tracking-wider hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)]"
              >
                <Mail className="w-4 h-4" />
                <span>{COMPANY_INFO.email}</span>
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
              <nav aria-label="Nexus World social links" className="flex flex-wrap items-center gap-2">
                {[
                  {
                    label: 'LinkedIn',
                    href: 'https://www.linkedin.com/company/nexusworld-studio/',
                    icon: 'M20.45 2H3.55C2.69 2 2 2.68 2 3.52v16.96C2 21.32 2.69 22 3.55 22h16.9c.86 0 1.55-.68 1.55-1.52V3.52C22 2.68 21.31 2 20.45 2ZM7.93 18.75H4.98V9.2h2.95v9.55ZM6.45 7.9a1.71 1.71 0 1 1 0-3.42 1.71 1.71 0 0 1 0 3.42Zm12.3 10.85H15.8V14.1c0-1.11-.02-2.54-1.55-2.54-1.55 0-1.79 1.21-1.79 2.46v4.73H9.51V9.2h2.83v1.3h.04c.39-.74 1.36-1.53 2.79-1.53 2.99 0 3.58 1.97 3.58 4.53v5.25Z',
                  },
                  {
                    label: 'Facebook',
                    href: 'https://www.facebook.com/profile.php?id=61594043699147',
                    icon: 'M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.23.2 2.23.2v2.45h-1.26c-1.24 0-1.62.77-1.62 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z',
                  },
                ].map(({ label, href, icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Nexus World on ${label} (opens in a new tab)`}
                    className="group inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 text-xs font-medium text-zinc-400 transition-colors duration-200 hover:border-white/25 hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-[#030305] motion-reduce:transition-none"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-4 w-4 shrink-0">
                      <path d={icon} />
                    </svg>
                    <span>{label}</span>
                    <ArrowUpRight aria-hidden="true" className="h-3 w-3 text-zinc-500 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none" />
                  </a>
                ))}
              </nav>
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
