import React, { useState } from 'react';
import { Sliders, CheckCircle, Award, Eye } from 'lucide-react';

export const NexusCVDemo: React.FC = () => {
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif' | 'mono'>('sans');
  const [density, setDensity] = useState<'compact' | 'harmonious' | 'spacious'>('harmonious');
  const [accentColor, setAccentColor] = useState<string>('#2563EB');
  const [activeTab, setActiveTab] = useState<'preview' | 'tokens' | 'ats'>('preview');

  const atsChecks = [
    { label: "Semantic Heading Hierarchy (H1-H4)", score: "100%", status: "OPTIMAL" },
    { label: "Single-Column Flow (No Table Layout Traps)", score: "PASSED", status: "VERIFIED" },
    { label: "Date & Institution Schema Extraction", score: "98%", status: "PARSED" },
    { label: "Zero Unrendered Glyphs or Complex Shapes", score: "CLEAN", status: "VERIFIED" },
  ];

  const getFontClass = () => {
    switch (fontFamily) {
      case 'serif': return 'font-serif';
      case 'mono': return 'font-mono';
      default: return 'font-sans';
    }
  };

  const getPaddingClass = () => {
    switch (density) {
      case 'compact': return 'p-4 space-y-3';
      case 'spacious': return 'p-8 space-y-6';
      default: return 'p-6 space-y-4';
    }
  };

  return (
    <div className="rounded-xl bg-void-card border border-white/[0.08] p-6 lg:p-8 shadow-2xl relative">
      
      {/* Top Header & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="telemetry-tag px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              IN DEVELOPMENT // DIGITAL PRODUCT
            </span>
            <span className="text-[11px] font-mono text-zinc-500">v0.9-BETA</span>
          </div>
          <h3 className="font-display font-bold text-xl sm:text-2xl text-white">
            NexusCV — Intelligent Resume Engine
          </h3>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1">
            Engineered career document architecture combining tokenized typography with semantic ATS parseability and clean visual hierarchy.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 bg-void-surface px-3 py-1.5 rounded border border-white/[0.04]">
          <Sliders className="w-3.5 h-3.5 text-signal" />
          <span>INTERACTIVE DESIGN TOKENS</span>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="mt-6 flex items-center justify-between border-b border-white/[0.06] pb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          {[
            { id: 'preview', label: 'Interactive Document', icon: Eye },
            { id: 'tokens', label: 'Design System Tokens', icon: Sliders },
            { id: 'ats', label: 'ATS Parser Telemetry', icon: Award },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
                  isSelected
                    ? 'bg-signal text-white shadow-[0_0_12px_rgba(37,99,235,0.4)]'
                    : 'bg-void-surface text-zinc-400 hover:text-white border border-white/[0.04]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Live Token Controls for Document */}
        <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">Font:</span>
            {(['sans', 'serif', 'mono'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFontFamily(f)}
                className={`px-1.5 py-0.5 rounded uppercase text-[10px] ${
                  fontFamily === f ? 'bg-white text-black font-bold' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">Accent:</span>
            {[
              { label: 'Signal', color: '#2563EB' },
              { label: 'Emerald', color: '#059669' },
              { label: 'Slate', color: '#64748B' },
            ].map((c) => (
              <button
                key={c.color}
                onClick={() => setAccentColor(c.color)}
                style={{ backgroundColor: c.color }}
                className={`w-3.5 h-3.5 rounded-full transition-transform ${
                  accentColor === c.color ? 'scale-125 ring-2 ring-white/50' : 'opacity-70 hover:opacity-100'
                }`}
                aria-label={`Select ${c.label} color`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Container View */}
      <div className="mt-6">
        
        {/* Preview Tab */}
        {activeTab === 'preview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Live Rendered Resume Sheet */}
            <div className={`lg:col-span-8 bg-zinc-950 border border-white/[0.1] rounded-lg text-zinc-200 shadow-2xl transition-all ${getFontClass()} ${getPaddingClass()}`}>
              
              {/* Resume Header */}
              <div className="border-b border-white/[0.1] pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                      ALEXANDER VANCE
                    </h1>
                    <div className="text-xs font-semibold tracking-wider uppercase mt-0.5" style={{ color: accentColor }}>
                      Staff Systems Architect & Frontend Engineer
                    </div>
                  </div>
                  <div className="text-right text-[11px] font-mono text-zinc-500 space-y-0.5">
                    <div>San Francisco, CA</div>
                    <div>alex.vance@domain.io</div>
                  </div>
                </div>
                <p className="mt-3 text-xs text-zinc-400 leading-relaxed max-w-xl">
                  Specializing in high-performance digital product architectures, resilient design token frameworks, and zero-latency user interfaces.
                </p>
              </div>

              {/* Experience Section */}
              <div>
                <div className="text-[11px] font-mono font-bold tracking-widest uppercase mb-2" style={{ color: accentColor }}>
                  EXECUTIVE EXPERIENCE
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex items-center justify-between font-semibold text-white">
                      <span>Principal Product Engineer · Continuum Systems</span>
                      <span className="font-mono text-zinc-500 text-[11px]">2023 — PRESENT</span>
                    </div>
                    <p className="text-zinc-400 text-[11px] mt-1 leading-relaxed">
                      Architected universal design token engine reducing cross-platform UI discrepancies by 94%. Mentored 14 engineers on Core Web Vitals optimization and keyboard navigation ergonomics.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between font-semibold text-white">
                      <span>Lead Interface Engineer · Synthetix Labs</span>
                      <span className="font-mono text-zinc-500 text-[11px]">2021 — 2023</span>
                    </div>
                    <p className="text-zinc-400 text-[11px] mt-1 leading-relaxed">
                      Engineered multi-tenant SaaS dashboard managing 100M+ monthly data telemetry events with sub-50ms render latency.
                    </p>
                  </div>
                </div>
              </div>

              {/* Skills & Systems */}
              <div className="pt-2 border-t border-white/[0.06]">
                <div className="text-[11px] font-mono font-bold tracking-widest uppercase mb-2" style={{ color: accentColor }}>
                  SYSTEM PROFICIENCIES
                </div>
                <div className="flex flex-wrap gap-1.5 text-[11px] font-mono">
                  {['TypeScript', 'React / Next.js', 'Design Token Pipelines', 'CSS Containment', 'WCAG AA Accessibility', 'Distributed Systems'].map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-zinc-300">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

            </div>

            {/* Right: Design Rationale & Controls */}
            <div className="lg:col-span-4 space-y-4">
              <div className="p-4 rounded-lg bg-void-surface border border-white/[0.06]">
                <div className="text-xs font-mono text-signal font-semibold uppercase mb-2">
                  PRODUCT THINKING
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  NexusCV moves beyond static PDFs. It treats professional credentials as a living structured schema that can be projected into any editorial typography style without losing structural semantic hierarchy.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-void-surface border border-white/[0.06] space-y-2.5">
                <div className="text-[11px] font-mono text-zinc-500 uppercase">
                  Layout Spacing Density
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-xs font-mono">
                  {(['compact', 'harmonious', 'spacious'] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDensity(d)}
                      className={`py-1.5 rounded text-center uppercase text-[10px] transition-all ${
                        density === d
                          ? 'bg-signal text-white'
                          : 'bg-void-deep text-zinc-400 hover:text-white border border-white/[0.04]'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-void-surface border border-white/[0.06] flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-400">ATS Readiness Score</span>
                <span className="text-emerald-400 font-bold">99 / 100</span>
              </div>
            </div>

          </div>
        )}

        {/* Tokens Tab */}
        {activeTab === 'tokens' && (
          <div className="p-6 rounded-lg bg-void-surface border border-white/[0.06] font-mono text-xs">
            <div className="text-zinc-400 mb-4 text-xs">
              // NexusCV Design Token Configuration Schema
            </div>
            <pre className="text-zinc-300 overflow-x-auto leading-relaxed">
              <code>{JSON.stringify({
                typography: {
                  primaryFont: fontFamily,
                  baseSize: "14px",
                  lineHeight: "1.5",
                  headingScale: [1.2, 1.4, 1.8, 2.2]
                },
                spacing: {
                  density: density,
                  sectionGap: density === 'compact' ? '16px' : density === 'spacious' ? '32px' : '24px',
                },
                theme: {
                  accent: accentColor,
                  background: "#09090C",
                  contrastRatio: "12.8:1 (AAA Compliance)"
                }
              }, null, 2)}</code>
            </pre>
          </div>
        )}

        {/* ATS Telemetry Tab */}
        {activeTab === 'ats' && (
          <div className="p-6 rounded-lg bg-void-surface border border-white/[0.06] space-y-4">
            <div className="text-xs font-mono text-zinc-400 pb-3 border-b border-white/[0.04] flex items-center justify-between">
              <span>AUTOMATED APPLICANT TRACKING SYSTEM (ATS) AUDIT</span>
              <span className="text-emerald-400 font-bold">OPTIMAL PASS RATE</span>
            </div>
            <div className="space-y-3">
              {atsChecks.map((check, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded bg-void-card border border-white/[0.03] text-xs">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>{check.label}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-zinc-400">{check.score}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {check.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
