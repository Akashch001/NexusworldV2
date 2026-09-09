import React, { useState } from 'react';
import { type ProjectIntelligence, type MockTimeSlot } from '../../data/conciergeData';
import { Copy, Check, Download, ShieldCheck } from 'lucide-react';

interface ProjectBriefViewProps {
  intelligence: ProjectIntelligence;
  bookedSlot: MockTimeSlot | null;
  onClose: () => void;
  onReset: () => void;
}

export const ProjectBriefView: React.FC<ProjectBriefViewProps> = ({
  intelligence,
  bookedSlot,
  onClose,
  onReset,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  const briefText = `==================================================
NEXUS WORLD // PROJECT INTELLIGENCE BRIEF
Direct Relay to: Andy Watson (Co-Founder, 2026)
Domain: nexusworld.in · Contact: connect@nexusworld.in
==================================================

[CONTACT]
Name: ${intelligence.contact.fullName || 'Prospective Partner'}
Email: ${intelligence.contact.email || 'Undisclosed'}
Phone: ${intelligence.contact.phoneNumber || 'Undisclosed'}

[BUSINESS]
Company: ${intelligence.business.companyName || 'Undisclosed Entity'}
Business Type: ${intelligence.business.businessType}

[DIGITAL PRESENCE]
Website: ${intelligence.digital.hasWebsite === 'Yes' ? intelligence.digital.websiteUrl || 'Existing (URL Pending)' : intelligence.digital.hasWebsite}
Mobile App: ${intelligence.digital.hasApp === 'Yes' ? intelligence.digital.appPlatform || 'Existing' : intelligence.digital.hasApp}

[PROJECT SCOPE]
Core Need: ${intelligence.project.need || 'Digital Product Architecture'}
Problem: ${intelligence.project.problem || 'Not specified'}
Desired Outcome: ${intelligence.project.desiredOutcome || 'Scalable, high-craft digital experience'}
Disciplines: ${intelligence.project.services.join(', ') || 'UI/UX, Frontend Engineering'}
Target Timeline: ${intelligence.project.timeline}
Budget Envelope: ${intelligence.project.budget || 'Undisclosed (Optional)'}

[LEAD STATUS]
Intent Classification: QUALIFIED // HIGH INTENT
Consultation: ${bookedSlot ? `${bookedSlot.date} at ${bookedSlot.time}` : 'Pending Selection'}

==================================================
Prepared by NEXUS INTELLIGENCE · Coordinated by NORA
==================================================`;

  const handleCopy = () => {
    navigator.clipboard.writeText(briefText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([briefText], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `nexusworld_brief_${(intelligence.business.companyName || 'inquiry').toLowerCase().replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="flex flex-col h-full bg-void-card border border-white/[0.08] rounded-xl overflow-hidden p-6 lg:p-8 shadow-2xl relative">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="telemetry-tag px-2 py-0.5 rounded bg-lime-500/10 text-lime-400 border border-lime-500/20">
              PROJECT BRIEF // SYNCHRONIZED
            </span>
            <span className="text-[10px] font-mono text-zinc-500">EXECUTIVE SPECIFICATION</span>
          </div>
          <h3 className="font-display font-bold text-2xl text-white tracking-tight">
            Nexus Project Brief
          </h3>
          <p className="text-zinc-400 text-xs mt-0.5">
            Structured brief prepared for Andy Watson & the NexusWorld engineering team.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-void-surface hover:bg-white/[0.06] border border-white/10 text-xs font-mono text-zinc-300 hover:text-white transition-all shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-lime-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-void-surface hover:bg-white/[0.06] border border-white/10 text-xs font-mono text-zinc-300 hover:text-white transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .txt</span>
          </button>
        </div>
      </div>

      {/* Main Terminal View of Brief */}
      <div className="flex-1 overflow-y-auto py-6">
        <div className="rounded-lg bg-void-deep border border-white/[0.06] p-5 font-mono text-xs text-zinc-300 leading-relaxed shadow-inner overflow-x-auto">
          <pre className="whitespace-pre-wrap">{briefText}</pre>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs font-mono text-zinc-500">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Zero trackers. Directly routed to connect@nexusworld.in.</span>
          </span>
          <span className="text-zinc-600">NEXUS INTELLIGENCE</span>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={onReset}
          className="text-xs font-mono text-zinc-500 hover:text-zinc-300 underline"
        >
          Start New Conversation
        </button>

        <button
          onClick={onClose}
          className="px-6 py-2.5 rounded-lg bg-signal hover:bg-signal-bright text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)]"
        >
          Close & Return to World
        </button>
      </div>

    </div>
  );
};
