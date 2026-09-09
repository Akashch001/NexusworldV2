import React, { useState } from 'react';
import { Play, CheckCircle2, RefreshCw, Terminal } from 'lucide-react';

export const AIWorkflowDemo: React.FC = () => {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(3); // default completed view

  const steps = [
    {
      id: 'input',
      title: 'Intent Ingestion',
      detail: 'Parsing product goal: "Build real-time enterprise telemetry table with keyboard shortcuts."',
      output: '{ entity: "TelemetryTable", permissions: ["READ_ADMIN"], targetLatency: "<50ms" }',
    },
    {
      id: 'tokens',
      title: 'Token & Component Resolution',
      detail: 'Mapping design primitives to existing design system tokens and WCAG AA contrast rules.',
      output: '{ baseTokens: ["surface.card", "signal.active", "type.mono.xs"], containment: true }',
    },
    {
      id: 'state',
      title: 'State Machine Synthesis',
      detail: 'Deriving deterministic state boundaries (IDLE -> FETCHING -> LIVE_STREAM -> ERROR).',
      output: '{ states: 4, transitions: 7, unhandledEdgeCases: 0, deterministic: true }',
    },
    {
      id: 'scaffold',
      title: 'Verified Code Generation',
      detail: 'Emitting type-safe TypeScript component with zero unnecessary external dependencies.',
      output: 'export const TelemetryView: FC<Props> = memo(({ stream }) => { ... })',
    },
  ];

  const handleRunPipeline = async () => {
    setIsRunning(true);
    setActiveStepIndex(0);
    for (let i = 0; i < steps.length; i++) {
      setActiveStepIndex(i);
      await new Promise(r => setTimeout(r, 400));
    }
    setIsRunning(false);
  };

  return (
    <div className="rounded-xl bg-void-card border border-white/[0.08] p-6 lg:p-8 shadow-2xl relative">
      
      {/* Top Header & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="telemetry-tag px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
              EXPERIMENT // STATE ENGINE
            </span>
            <span className="text-[11px] font-mono text-zinc-500">LAB-EXP-04</span>
          </div>
          <h3 className="font-display font-bold text-xl sm:text-2xl text-white">
            Cognitive State Machine & AI Automation
          </h3>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1">
            Deterministic agentic pipeline translating high-level business requirements into verified component contracts.
          </p>
        </div>

        <button
          onClick={handleRunPipeline}
          disabled={isRunning}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-void-surface hover:bg-white/[0.06] border border-white/10 hover:border-signal text-xs font-mono text-white transition-all shadow-sm"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-signal animate-spin" />
              <span>Executing Pipeline...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 text-signal" />
              <span>Re-run State Pipeline</span>
            </>
          )}
        </button>
      </div>

      {/* Interactive Step Pipeline Nodes */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((step, idx) => {
          const isDone = idx <= activeStepIndex;
          const isCurrent = idx === activeStepIndex && isRunning;
          return (
            <div
              key={step.id}
              className={`p-4 rounded-lg border transition-all ${
                isCurrent
                  ? 'bg-signal/15 border-signal shadow-[0_0_15px_rgba(37,99,235,0.3)]'
                  : isDone
                  ? 'bg-void-surface border-white/[0.08]'
                  : 'bg-void-deep/40 border-white/[0.02] opacity-40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="telemetry-tag text-zinc-500">STAGE 0{idx + 1}</span>
                {isCurrent ? (
                  <RefreshCw className="w-3.5 h-3.5 text-signal animate-spin" />
                ) : isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <div className="w-3 h-3 rounded-full border border-zinc-700" />
                )}
              </div>

              <div className="font-display font-semibold text-white text-sm mb-1">
                {step.title}
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed mb-3">
                {step.detail}
              </p>

              <div className="p-2 rounded bg-void-deep border border-white/[0.04] font-mono text-[10px] text-zinc-300 truncate">
                {step.output}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Telemetry Note */}
      <div className="mt-8 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-zinc-500">
        <span className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-purple-400" />
          <span>ZERO HALLUCINATIONS · STRICT TYPE VALIDATION</span>
        </span>
        <span className="text-zinc-400">NEXUS LAB RESEARCH // 2026</span>
      </div>

    </div>
  );
};
