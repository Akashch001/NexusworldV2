import React, { useState } from 'react';
import { Check, X, Zap } from 'lucide-react';

export const Distinction: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'systems' | 'interaction' | 'engineering'>('systems');

  const distinctionPoints = [
    {
      id: 'systems',
      title: 'Systems Over Pages',
      label: 'SYSTEMS ARCHITECTURE',
      traditional: 'Static monolithic pages stitched together with disjointed templates, causing visual inconsistency and high maintenance debt.',
      nexus: 'Living design systems, centralized token architectures, and reusable components that keep multi-platform digital products aligned and rapid to iterate.',
      terminalCode: `// Nexus Design Token Synchronizer
export const TokenSystem = {
  spatialGrid: 8,
  typographyScale: ['12px', '14px', '16px', '20px', '28px', '48px'],
  motionCurve: 'cubic-bezier(0.16, 1, 0.3, 1)',
  colorPrimitives: { void: '#050507', signal: '#2563EB' }
};`,
    },
    {
      id: 'interaction',
      title: 'Cognitive Flow Over Decoration',
      label: 'INTERACTION DESIGN',
      traditional: 'Superficial animations and arbitrary particle effects that slow down user task completion and cause cognitive fatigue.',
      nexus: 'Purposeful micro-motion engineered around human cognitive models. Every transition informs spatial context, state progression, and intent.',
      terminalCode: `// Cognitive State Engine
function onUserAction(intent: UserIntent): Transition {
  return intent.type === 'CONFIRM_STEP'
    ? { morph: 'SUCCESS_STATE', feedback: 'HAPTIC_MICRO', duration: 150 }
    : { morph: 'INLINE_ASSIST', guideFocus: true };
}`,
    },
    {
      id: 'engineering',
      title: 'Performance Craft Over Plugin Bloat',
      label: 'FRONTEND ENGINEERING',
      traditional: 'Heavy drag-and-drop CMS page builders with 80+ third-party scripts, resulting in 4-second load times and failing Core Web Vitals.',
      nexus: 'Handcrafted frontend engineering. Clean semantic DOM, CSS containment, sub-50ms Interaction to Next Paint (INP), and zero layout shifts.',
      terminalCode: `// Telemetry Audit Verification
const VitalsReport = {
  INP: '24ms',     // Optimal < 200ms
  LCP: '0.74s',    // Optimal < 2.5s
  CLS: '0.000',    // Zero layout shift
  Accessibility: '100/100 WCAG AA'
};`,
    },
  ];

  const current = distinctionPoints.find(p => p.id === activeTab) || distinctionPoints[0];

  return (
    <section className="py-24 relative border-t border-white/[0.06] bg-void">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        
        {/* Header */}
        <div className="max-w-3xl mb-14">
          <div className="flex items-center gap-2 mb-3">
            <span className="telemetry-tag text-signal">02 // ARCHITECTURAL DISTINCTION</span>
            <span className="text-zinc-700">·</span>
            <span className="text-xs font-mono text-zinc-500">ENGINEERED FOR AMBITIOUS PRODUCTS</span>
          </div>
          <h2 className="font-display font-bold text-3xl sm:text-5xl text-white tracking-tight leading-tight">
            NOT A WEB DESIGN AGENCY. <br />
            <span className="text-zinc-400">A DIGITAL PRODUCT PARTNER.</span>
          </h2>
          <p className="mt-4 text-zinc-400 text-sm sm:text-base leading-relaxed">
            We don't simply assemble brochure websites. We engineer interactive digital products, systems, and interfaces around how people actually interact with technology.
          </p>
        </div>

        {/* Interactive Paradigm Switcher */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Navigation Tabs */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            {distinctionPoints.map((p) => {
              const isSelected = activeTab === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setActiveTab(p.id as any)}
                  className={`p-5 rounded-xl text-left border transition-all duration-300 ${
                    isSelected
                      ? 'bg-void-card border-signal shadow-[0_0_20px_rgba(37,99,235,0.2)]'
                      : 'bg-void-surface/50 border-white/[0.06] hover:border-white/15 hover:bg-void-surface'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="telemetry-tag text-zinc-500">{p.label}</span>
                    <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-signal' : 'bg-transparent'}`} />
                  </div>
                  <h3 className="font-display font-bold text-white text-base">
                    {p.title}
                  </h3>
                </button>
              );
            })}

            <div className="p-5 rounded-xl bg-void-surface/40 border border-white/[0.04] mt-2">
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mb-2">
                <Zap className="w-4 h-4 text-signal" />
                <span>PURPOSEFUL TECHNOLOGY</span>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Technology serves the product. We do not use 3D, WebGL, AI, or animations unless they genuinely elevate user comprehension or business outcomes.
              </p>
            </div>
          </div>

          {/* Right Comparison & Terminal Proof Engine */}
          <div className="lg:col-span-8 rounded-xl bg-void-card border border-white/[0.08] p-6 lg:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-6">
              <span className="telemetry-tag text-signal">{current.label} // AUDIT BREAKDOWN</span>
              <span className="text-[11px] font-mono text-zinc-400">SIDE-BY-SIDE VERIFICATION</span>
            </div>

            {/* Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              
              {/* Traditional Shop */}
              <div className="p-5 rounded-lg bg-red-950/10 border border-red-900/20">
                <div className="flex items-center gap-2 mb-3 text-red-400 text-xs font-mono font-semibold">
                  <X className="w-4 h-4" />
                  <span>CONVENTIONAL WEB AGENCY</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {current.traditional}
                </p>
              </div>

              {/* NexusWorld Product Partner */}
              <div className="p-5 rounded-lg bg-signal/10 border border-signal/30">
                <div className="flex items-center gap-2 mb-3 text-signal-bright text-xs font-mono font-semibold">
                  <Check className="w-4 h-4" />
                  <span>NEXUSWORLD PRODUCT PARTNER</span>
                </div>
                <p className="text-xs text-zinc-200 leading-relaxed">
                  {current.nexus}
                </p>
              </div>

            </div>

            {/* Live Terminal Snippet Showing Real Product Thinking */}
            <div className="rounded-lg bg-void-deep border border-white/[0.06] overflow-hidden">
              <div className="px-4 py-2.5 bg-void-surface border-b border-white/[0.04] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                  <span className="ml-2 text-[10px] font-mono text-zinc-400">system.spec.ts</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-600">60FPS ISOLATED</span>
              </div>
              <pre className="p-4 text-[11px] font-mono text-zinc-300 overflow-x-auto leading-relaxed">
                <code>{current.terminalCode}</code>
              </pre>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
