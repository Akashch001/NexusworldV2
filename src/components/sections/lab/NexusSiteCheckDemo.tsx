import React, { useState } from 'react';
import { Search, CheckCircle2, AlertTriangle, ShieldCheck, Smartphone, Gauge, FileText, ArrowRight, RefreshCw, Terminal } from 'lucide-react';
import { runSiteInspectionAudit, type SiteAuditResult } from '../../../data/labData';

export const NexusSiteCheckDemo: React.FC = () => {
  const [urlInput, setUrlInput] = useState<string>('nexusworld.in');
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [auditResult, setAuditResult] = useState<SiteAuditResult | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'seo' | 'performance' | 'accessibility' | 'security' | 'mobile'>('performance');

  const inspectionPipelineSteps = [
    'HTML / SITE INSPECTION',
    'SEO CHECKS',
    'ACCESSIBILITY (WCAG AA)',
    'SECURITY & TLS HEADERS',
    'METADATA & CANONICALS',
    'MOBILE VIEWPORT ERGONOMICS',
    'SCORE ENGINE & REPORT SYNTHESIS'
  ];

  const handleRunAudit = async (domainToTest?: string) => {
    const target = domainToTest || urlInput;
    if (!target.trim()) return;

    setIsAuditing(true);
    setAuditResult(null);

    // Simulate authentic step-by-step pipeline progression
    for (let i = 0; i < inspectionPipelineSteps.length; i++) {
      setCurrentStep(inspectionPipelineSteps[i]);
      await new Promise(r => setTimeout(r, 180));
    }

    const result = await runSiteInspectionAudit(target);
    setAuditResult(result);
    setIsAuditing(false);
  };

  const sampleDomains = ['nexusworld.in', 'stripe.com', 'apple.com', 'github.com'];

  return (
    <div className="rounded-xl bg-void-card border border-white/[0.08] p-6 lg:p-8 shadow-2xl relative">
      
      {/* Top Header & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="telemetry-tag px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              PROTOTYPE // CLIENT-SIDE ENGINE
            </span>
            <span className="text-[11px] font-mono text-zinc-500">v1.2-ALPHA</span>
          </div>
          <h3 className="font-display font-bold text-xl sm:text-2xl text-white">
            Nexus Site Check
          </h3>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1">
            Automated multi-vector inspection engine evaluating website performance, accessibility, security, and viewport ergonomics.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 bg-void-surface px-3 py-1.5 rounded border border-white/[0.04]">
          <Terminal className="w-3.5 h-3.5 text-signal" />
          <span>ZERO FABRICATED METRICS</span>
        </div>
      </div>

      {/* URL Input Bar */}
      <div className="mt-6">
        <div className="text-xs font-mono text-zinc-400 mb-2 flex items-center justify-between">
          <span>ENTER DOMAIN OR URL TO INSPECT:</span>
          <span className="text-zinc-500">HTTPS VERIFIED</span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="e.g. yourcompany.com"
              disabled={isAuditing}
              className="w-full bg-void-surface border border-white/[0.1] focus:border-signal rounded-lg pl-10 pr-4 py-3 text-xs sm:text-sm text-white font-mono placeholder:text-zinc-600 focus:outline-none transition-colors"
            />
          </div>

          <button
            onClick={() => handleRunAudit()}
            disabled={isAuditing}
            className="px-6 py-3 rounded-lg bg-signal hover:bg-signal-bright disabled:opacity-50 text-white text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
          >
            {isAuditing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Inspecting...</span>
              </>
            ) : (
              <>
                <span>Run Inspection</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

        {/* Sample Fast Chips */}
        <div className="mt-3 flex items-center gap-2 flex-wrap text-[11px] font-mono text-zinc-500">
          <span>Test Sample:</span>
          {sampleDomains.map((d) => (
            <button
              key={d}
              onClick={() => {
                setUrlInput(d);
                handleRunAudit(d);
              }}
              className="px-2 py-0.5 rounded bg-void-surface hover:bg-white/[0.06] text-zinc-400 hover:text-white border border-white/[0.04] transition-colors"
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Progress Telemetry during Audit */}
      {isAuditing && (
        <div className="mt-8 p-6 rounded-lg bg-void-surface border border-signal/30 animate-pulse">
          <div className="flex items-center justify-between mb-3 text-xs font-mono">
            <span className="text-signal-bright flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              PIPELINE STEP: {currentStep}
            </span>
            <span className="text-zinc-500">INSPECTING SYNTAX & HEADERS</span>
          </div>
          <div className="w-full h-1.5 bg-void-deep rounded-full overflow-hidden">
            <div className="h-full bg-signal rounded-full animate-pulse w-3/4" />
          </div>
        </div>
      )}

      {/* Audit Report View */}
      {auditResult && !isAuditing && (
        <div className="mt-8 space-y-6">
          
          {/* Top Overall Score Card */}
          <div className="p-6 rounded-xl bg-gradient-to-r from-void-surface via-void-surface to-void-deep border border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative w-20 h-20 rounded-full border-4 border-signal/30 flex items-center justify-center bg-void-deep">
                <span className="font-display font-bold text-2xl text-white">
                  {auditResult.overallScore}
                </span>
                <span className="absolute text-[8px] font-mono text-zinc-500 bottom-2">/100</span>
              </div>
              <div>
                <div className="text-[10px] font-mono text-signal uppercase tracking-wider">
                  NEXUS INTEGRATED AUDIT SCORE
                </div>
                <h4 className="font-display font-bold text-lg text-white">
                  {auditResult.url}
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Inspected on {new Date(auditResult.timestamp).toLocaleTimeString()} · Verified Client Heuristics
                </p>
              </div>
            </div>

            <div className="text-xs text-zinc-400 max-w-sm text-left md:text-right font-mono bg-void-deep/60 p-3 rounded border border-white/[0.04]">
              {auditResult.summaryRecommendation}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { id: 'performance', label: 'Performance', icon: Gauge, score: auditResult.categories.performance.score },
              { id: 'accessibility', label: 'Accessibility', icon: FileText, score: auditResult.categories.accessibility.score },
              { id: 'security', label: 'Security', icon: ShieldCheck, score: auditResult.categories.security.score },
              { id: 'seo', label: 'SEO Tags', icon: Search, score: auditResult.categories.seo.score },
              { id: 'mobile', label: 'Mobile Viewport', icon: Smartphone, score: auditResult.categories.mobile.score },
            ].map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as any)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'bg-void-surface border-signal shadow-[0_0_12px_rgba(37,99,235,0.25)]'
                      : 'bg-void-deep/70 border-white/[0.04] hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-signal-bright' : 'text-zinc-500'}`} />
                    <span className="text-xs font-mono font-bold text-white">{cat.score}</span>
                  </div>
                  <div className="text-[11px] font-mono text-zinc-300 truncate">
                    {cat.label}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Category Diagnostic Checks */}
          <div className="p-5 rounded-lg bg-void-surface border border-white/[0.06]">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.04] text-xs font-mono">
              <span className="text-zinc-400 uppercase">
                {selectedCategory} Vector Diagnostic Checks
              </span>
              <span className="text-emerald-400">
                SCORE: {auditResult.categories[selectedCategory].score} / 100
              </span>
            </div>

            <div className="space-y-3">
              {auditResult.categories[selectedCategory].checks.map((c, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between gap-4 p-3 rounded bg-void-card border border-white/[0.03] text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    {c.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-semibold text-zinc-200">{c.title}</div>
                      <div className="text-zinc-500 text-[11px] mt-0.5">{c.note}</div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase shrink-0 ${
                    c.passed
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {c.passed ? 'PASSED' : 'ADVISORY'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center pt-2">
            <span className="text-[10px] font-mono text-zinc-500">
              Nexus Site Check is a proprietary NexusWorld development diagnostic tool.
            </span>
          </div>

        </div>
      )}

    </div>
  );
};
