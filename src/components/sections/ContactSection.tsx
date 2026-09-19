import React, { useState } from 'react';
import { Check, Send, Terminal, Copy } from 'lucide-react';
import { COMPANY_INFO } from '../../data/companyData';
import { supabase } from '../../lib/supabaseClient';
import { getOrCreateSessionToken } from '../../hooks/useVisitorTelemetry';

export const ContactSection: React.FC = () => {
  const [selectedServices, setSelectedServices] = useState<string[]>(['UI/UX Design', 'Frontend Engineering']);
  const [timeline, setTimeline] = useState<string>('1-2 Months');
  const [clientName, setClientName] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [projectDescription, setProjectDescription] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Obfuscated key retrieval to prevent basic scraping
  const getAccessKey = () => {
    // Hidden key: c0c19f1d-64be-4da4-bd39-7a0ae81cfa43
    const enc = [99, 48, 99, 49, 57, 102, 49, 100, 45, 54, 52, 98, 101, 45, 52, 100, 97, 52, 45, 98, 100, 51, 57, 45, 55, 97, 48, 97, 101, 56, 49, 99, 102, 97, 52, 51];
    return String.fromCharCode(...enc);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientEmail || !clientPhone) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Save lead to Supabase database so it appears in the Admin Dashboard
      try {
        const token = getOrCreateSessionToken();
        await supabase.functions.invoke('nexus-intelligence', {
          body: {
            action: 'save_lead',
            lead: {
              name: clientName,
              email: clientEmail,
              phone: clientPhone,
              service_interest: selectedServices.join(', '),
              project_description: projectDescription,
              timeline: timeline,
              lead_temperature: 'warm',
              source: 'contact_form',
            },
            visitorId: token,
          }
        });
      } catch (dbErr) {
        console.warn('Supabase lead capture note:', dbErr);
      }

      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: getAccessKey(),
          subject: `Project Inquiry: ${clientName || 'Digital Product'} via NexusWorld.in`,
          from_name: clientName,
          email: clientEmail,
          phone: clientPhone,
          message: `Project Scope:\n- Selected Disciplines: ${selectedServices.join(', ')}\n- Estimated Timeline: ${timeline}\n\nProject Details:\n${projectDescription || '[No description provided]'}`,
        }),
      });
      const result = await response.json();
      if (result.success) {
        setSubmitStatus('success');
        // Clear form
        setClientName('');
        setClientEmail('');
        setClientPhone('');
        setProjectDescription('');
        setSelectedServices(['UI/UX Design', 'Frontend Engineering']);
        setTimeline('1-2 Months');
        setTimeout(() => setSubmitStatus('idle'), 5000);
      } else {
        setSubmitStatus('error');
        setTimeout(() => setSubmitStatus('idle'), 3000);
      }
    } catch (error) {
      console.error(error);
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus('idle'), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <form onSubmit={handleSubmit} className="lg:col-span-7 rounded-xl bg-void-card border border-white/[0.08] p-6 lg:p-8 shadow-2xl space-y-6">
            
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

            {/* 3. Contact Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1.5">
                  Your Name / Entity:
                </label>
                <input
                  type="text"
                  required
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
                  required
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="elena@company.com"
                  className="w-full bg-void-surface border border-white/[0.08] focus:border-signal rounded-lg px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1.5">
                  Phone / Whatsapp:
                </label>
                <input
                  type="tel"
                  required
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
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

            {/* Send Form Action */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting || submitStatus === 'success'}
                className={`flex-1 py-3.5 px-6 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  submitStatus === 'success' 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : submitStatus === 'error'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-signal hover:bg-signal-bright text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] disabled:opacity-50'
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Transmitting...
                  </span>
                ) : submitStatus === 'success' ? (
                  <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Specification Received</span>
                ) : submitStatus === 'error' ? (
                  <span>Transmission Failed - Retry</span>
                ) : (
                  <span className="flex items-center gap-2"><Send className="w-3.5 h-3.5" /> Transmit Project Specification</span>
                )}
              </button>

              <button
                type="button"
                onClick={handleCopyEmail}
                className="py-3.5 px-4 rounded-lg bg-void-surface hover:bg-white/[0.06] border border-white/[0.08] text-xs font-mono text-zinc-300 hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Email'}</span>
              </button>
            </div>

          </form>

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
                  <span className="text-zinc-500">Phone: </span>
                  <span className="text-zinc-200">{COMPANY_INFO.phone}</span>
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
