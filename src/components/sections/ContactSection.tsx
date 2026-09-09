import React, { useState } from 'react';
import { Check, Send, Terminal, Copy } from 'lucide-react';
import { COMPANY_INFO } from '../../data/companyData';

export const ContactSection: React.FC = () => {
  const [selectedServices, setSelectedServices] = useState<string[]>(['UI/UX Design', 'Frontend Engineering']);
  const [timeline, setTimeline] = useState<string>('1-2 Months');
  const [clientName, setClientName] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [projectDescription, setProjectDescription] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const availableServices = [
    'Product Strategy',
    'UI/UX Design',
    'Design Systems',
    'Frontend Engineering',
    'AI Experiences',
    'SaaS Products',
    'Mobile Applications',
    'Branding & Identity',
  ];

  const toggleService = (srv: string) => {
    if (selectedServices.includes(srv)) {
      setSelectedServices(selectedServices.filter(s => s !== srv));
    } else {
      setSelectedServices([...selectedServices, srv]);
    }
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(COMPANY_INFO.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const emailSubject = encodeURIComponent(`Project Inquiry: ${clientName || 'Digital Product'} via NexusWorld.in`);
  const emailBody = encodeURIComponent(
    `Hello Andy,\n\nI would like to discuss building a digital product with NexusWorld.\n\nProject Scope:\n- Selected Disciplines: ${selectedServices.join(', ')}\n- Estimated Timeline: ${timeline}\n\nProject Details:\n${projectDescription || '[Add brief notes about your product vision]'}\n\nBest,\n${clientName || '[Your Name]'}\n${clientEmail || ''}`
  );

  return (
    <section id="contact" className="py-24 relative border-t border-white/[0.06] bg-void-deep contain-isolated">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-14">
          <div className="flex items-center gap-2 mb-3">
            <span className="telemetry-tag text-signal">07 // COMMENCE COLLABORATION</span>
            <span className="text-zinc-700">·</span>
            <span className="text-xs font-mono text-zinc-500">DIRECT FOUNDER DESK</span>
          </div>
          <h2 className="font-display font-bold text-3xl sm:text-5xl text-white tracking-tight">
            LET'S BUILD WHAT'S NEXT.
          </h2>
          <p className="mt-4 text-zinc-400 text-sm sm:text-base leading-relaxed">
            Configure your product parameters below to generate a tailored project brief, or reach out directly to Andy Watson at{' '}
            <a href={`mailto:${COMPANY_INFO.email}`} className="text-white hover:text-signal underline decoration-signal/50">
              {COMPANY_INFO.email}
            </a>.
          </p>
        </div>

        {/* Interactive Scope Configurator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Interactive Configurator Controls */}
          <div className="lg:col-span-7 rounded-xl bg-void-card border border-white/[0.08] p-6 lg:p-8 shadow-2xl space-y-6">
            
            {/* 1. Disciplines Selection */}
            <div>
              <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block mb-3">
                1. Select Required Capabilities:
              </label>
              <div className="flex flex-wrap gap-2">
                {availableServices.map((srv) => {
                  const isSelected = selectedServices.includes(srv);
                  return (
                    <button
                      key={srv}
                      type="button"
                      onClick={() => toggleService(srv)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-signal text-white shadow-[0_0_12px_rgba(37,99,235,0.4)] border border-signal-bright'
                          : 'bg-void-surface text-zinc-400 hover:text-white border border-white/[0.06]'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      <span>{srv}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Timeline Selector */}
            <div>
              <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider block mb-3">
                2. Target Timeline:
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                {['Sprint (2-4 Wks)', '1-2 Months', 'Quarterly System'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTimeline(t)}
                    className={`py-2 px-3 rounded-lg text-center transition-all ${
                      timeline === t
                        ? 'bg-white text-black font-semibold'
                        : 'bg-void-surface text-zinc-400 hover:text-white border border-white/[0.06]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1.5">
                  Your Name / Entity:
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Elena Rostova"
                  className="w-full bg-void-surface border border-white/[0.08] focus:border-signal rounded-lg px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1.5">
                  Your Contact Email:
                </label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="elena@company.com"
                  className="w-full bg-void-surface border border-white/[0.08] focus:border-signal rounded-lg px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* 4. Notes */}
            <div>
              <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1.5">
                Brief Description of the Problem / Product:
              </label>
              <textarea
                rows={3}
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Share your goals, current friction points, or ambitious vision..."
                className="w-full bg-void-surface border border-white/[0.08] focus:border-signal rounded-lg p-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none transition-colors resize-none"
              />
            </div>

            {/* Send Mail Action */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <a
                href={`mailto:${COMPANY_INFO.email}?subject=${emailSubject}&body=${emailBody}`}
                className="flex-1 py-3.5 px-6 rounded-lg bg-signal hover:bg-signal-bright text-white text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.4)]"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Transmit Project Specification</span>
              </a>

              <button
                type="button"
                onClick={handleCopyEmail}
                className="py-3.5 px-4 rounded-lg bg-void-surface hover:bg-white/[0.06] border border-white/[0.08] text-xs font-mono text-zinc-300 hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Email'}</span>
              </button>
            </div>

          </div>

          {/* Right: Direct Founder Terminal & Protocol Info */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Terminal Card */}
            <div className="rounded-xl bg-void-card border border-white/[0.08] p-6 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-4 text-xs font-mono text-zinc-500">
                <span className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-signal" />
                  <span>DIRECT INQUIRY DESK</span>
                </span>
                <span className="text-emerald-400">ACCEPTING CLIENTS</span>
              </div>

              <div className="p-4 rounded-lg bg-void-deep border border-white/[0.04] space-y-2.5 font-mono text-xs text-zinc-300">
                <div className="text-zinc-500 text-[11px]">// Leadership Relay</div>
                <div>
                  <span className="text-zinc-500">Lead: </span>
                  <span className="text-white font-semibold">{COMPANY_INFO.founder}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Role: </span>
                  <span className="text-signal-bright">{COMPANY_INFO.role} (2026)</span>
                </div>
                <div>
                  <span className="text-zinc-500">Email: </span>
                  <span className="text-zinc-200">{COMPANY_INFO.email}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Location: </span>
                  <span className="text-zinc-400">Global Synchronized (EST Relay)</span>
                </div>
              </div>

              <div className="mt-4 text-xs text-zinc-400 leading-relaxed">
                Every inquiry is reviewed directly by leadership. We limit concurrent engagements to maintain boutique craft, obsessive focus, and sub-100ms communication.
              </div>
            </div>

            {/* Quality Standard Guarantee */}
            <div className="p-5 rounded-xl bg-void-surface/50 border border-white/[0.04] text-xs space-y-2">
              <div className="font-mono text-signal uppercase text-[10px] tracking-wider">
                COMMUNICATION PROTOCOL
              </div>
              <p className="text-zinc-400 leading-relaxed">
                Initial response within 24 business hours. Preliminary roadmap architecture provided after initial alignment call.
              </p>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
