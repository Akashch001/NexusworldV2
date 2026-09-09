import React, { useState } from 'react';
import { CAPABILITIES, type Capability } from '../../data/companyData';
import { Layers, ArrowRight, CheckCircle, Code, Sparkles, Palette, Target } from 'lucide-react';

export const Capabilities: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeCapability, setActiveCapability] = useState<Capability>(CAPABILITIES[0]);

  const categories = ['All', 'Strategy', 'Design', 'Engineering', 'Intelligence'];

  const filteredCapabilities = selectedCategory === 'All'
    ? CAPABILITIES
    : CAPABILITIES.filter(c => c.category === selectedCategory);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Strategy': return Target;
      case 'Design': return Palette;
      case 'Engineering': return Code;
      case 'Intelligence': return Sparkles;
      default: return Layers;
    }
  };

  return (
    <section id="capabilities" className="py-24 relative border-t border-white/[0.06] bg-void-deep contain-isolated">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="telemetry-tag text-signal">01 // CORE CAPABILITIES</span>
              <span className="text-zinc-700">·</span>
              <span className="text-xs font-mono text-zinc-500">END-TO-END DIGITAL PRODUCT EXPERTISE</span>
            </div>
            <h2 className="font-display font-bold text-3xl sm:text-5xl text-white tracking-tight">
              WHAT WE BUILD.
            </h2>
          </div>
          <p className="max-w-md text-zinc-400 text-sm leading-relaxed">
            NexusWorld operates as a dedicated digital product partner, bridging high-level strategic viability with obsessive design craft and resilient frontend engineering.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto py-6 text-xs font-mono">
          <span className="text-zinc-600 mr-2 uppercase tracking-wider">Filter:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-signal text-white shadow-[0_0_12px_rgba(37,99,235,0.4)]'
                  : 'bg-void-card border border-white/[0.06] text-zinc-400 hover:text-white hover:border-white/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Capabilities Grid & Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">
          
          {/* Left: Capability List / Cards */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredCapabilities.map((cap) => {
              const isSelected = activeCapability.id === cap.id;
              const Icon = getCategoryIcon(cap.category);
              return (
                <div
                  key={cap.id}
                  onClick={() => setActiveCapability(cap)}
                  className={`cursor-pointer rounded-xl p-5 border transition-all duration-300 relative group flex flex-col justify-between ${
                    isSelected
                      ? 'bg-void-surface border-signal shadow-[0_0_20px_rgba(37,99,235,0.2)]'
                      : 'bg-void-card/60 border-white/[0.06] hover:border-white/20 hover:bg-void-card'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-8 h-8 rounded flex items-center justify-center ${
                        isSelected ? 'bg-signal text-white' : 'bg-white/[0.04] text-zinc-400 group-hover:text-white'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                        {cap.category}
                      </span>
                    </div>

                    <h3 className="font-display font-bold text-white text-base tracking-wide mb-1.5 group-hover:text-signal-bright transition-colors">
                      {cap.title}
                    </h3>
                    <p className="text-zinc-400 text-xs leading-relaxed line-clamp-2">
                      {cap.subtitle}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between text-[11px] font-mono text-zinc-500">
                    <span>{cap.deliverables.length} Deliverables</span>
                    <span className="text-signal flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Inspect <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Active Capability Deep Inspection Panel */}
          <div className="lg:col-span-5">
            <div className="sticky top-28 rounded-xl bg-void-card border border-white/[0.1] p-6 lg:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-signal/10 blur-3xl pointer-events-none" />
              
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-signal" />
                  <span className="telemetry-tag text-zinc-400">DISCIPLINE SPECIFICATION</span>
                </div>
                <span className="text-[10px] font-mono text-signal bg-signal/10 px-2 py-0.5 rounded border border-signal/20">
                  {activeCapability.category}
                </span>
              </div>

              <h3 className="font-display font-bold text-2xl text-white tracking-tight">
                {activeCapability.title}
              </h3>
              <p className="text-xs font-mono text-zinc-400 mt-1 mb-4">
                {activeCapability.subtitle}
              </p>

              <p className="text-zinc-300 text-sm leading-relaxed mb-6">
                {activeCapability.description}
              </p>

              <div className="space-y-3">
                <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                  Architectural Deliverables:
                </div>
                {activeCapability.deliverables.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-2.5 rounded bg-void-surface border border-white/[0.04] text-xs text-zinc-300"
                  >
                    <CheckCircle className="w-4 h-4 text-signal shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-zinc-500">
                <span>BOUTIQUE STANDARD</span>
                <span className="text-zinc-400">ZERO GENERIC TEMPLATES</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
