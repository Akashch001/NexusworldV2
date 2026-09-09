import React, { useState } from 'react';
import {
  type ProjectIntelligence,
  type ProgressiveIntentStage,
  calculateIntelligenceCompletion,
} from '../../data/conciergeData';
import {
  User,
  Mail,
  Phone,
  Building,
  Briefcase,
  Globe,
  Smartphone,
  Target,
  AlertCircle,
  Clock,
  DollarSign,
  Edit2,
  Check,
  Sparkles,
  Shield,
} from 'lucide-react';

interface ProjectIntelligencePanelProps {
  intelligence: ProjectIntelligence;
  onUpdateIntelligence: (updated: Partial<ProjectIntelligence>) => void;
  className?: string;
}

export const ProjectIntelligencePanel: React.FC<ProjectIntelligencePanelProps> = ({
  intelligence,
  onUpdateIntelligence,
  className = '',
}) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const stats = calculateIntelligenceCompletion(intelligence);

  const getIntentBadge = (intent: ProgressiveIntentStage) => {
    switch (intent) {
      case 'CONFIRMED':
        return { label: 'CONFIRMED (BOOKED)', color: 'text-lime-400 bg-lime-500/10 border-lime-500/30' };
      case 'BOOKING_ENGAGED':
        return { label: 'BOOKING ENGAGED', color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' };
      case 'CONSULTATION_OFFERED':
        return { label: 'CONSULTATION READY', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' };
      case 'QUALIFIED':
        return { label: 'QUALIFIED PROJECT', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
      case 'PROJECT_INQUIRY':
        return { label: 'PROJECT INQUIRY', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' };
      default:
        return { label: 'EXPLORING // GENERAL', color: 'text-zinc-400 bg-zinc-800/30 border-zinc-700/40' };
    }
  };

  const currentIntent = getIntentBadge(intelligence.intent);

  const startEdit = (field: string, initial: string) => {
    setEditingField(field);
    setEditValue(initial || '');
  };

  const saveEdit = () => {
    if (!editingField) return;

    if (editingField === 'fullName') {
      onUpdateIntelligence({ contact: { ...intelligence.contact, fullName: editValue } });
    } else if (editingField === 'email') {
      onUpdateIntelligence({ contact: { ...intelligence.contact, email: editValue } });
    } else if (editingField === 'phoneNumber') {
      onUpdateIntelligence({ contact: { ...intelligence.contact, phoneNumber: editValue } });
    } else if (editingField === 'companyName') {
      onUpdateIntelligence({ business: { ...intelligence.business, companyName: editValue } });
    } else if (editingField === 'websiteUrl') {
      onUpdateIntelligence({ digital: { ...intelligence.digital, hasWebsite: 'Yes', websiteUrl: editValue } });
    } else if (editingField === 'need') {
      onUpdateIntelligence({ project: { ...intelligence.project, need: editValue } });
    } else if (editingField === 'problem') {
      onUpdateIntelligence({ project: { ...intelligence.project, problem: editValue } });
    } else if (editingField === 'timeline') {
      onUpdateIntelligence({ project: { ...intelligence.project, timeline: editValue as any } });
    } else if (editingField === 'budget') {
      onUpdateIntelligence({ project: { ...intelligence.project, budget: editValue } });
    }

    setEditingField(null);
  };

  return (
    <div className={`flex flex-col h-full bg-void-card border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl ${className}`}>
      
      {/* Header with Telemetry & Completion Meter */}
      <div className="p-4 sm:p-5 border-b border-white/[0.06] bg-void-surface/60">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-signal animate-pulse" />
            <span className="telemetry-tag text-zinc-300 font-bold tracking-wider">
              PROJECT INTELLIGENCE
            </span>
          </div>
          <span className={`text-[9px] font-mono px-2 py-0.5 rounded border uppercase font-bold tracking-wider ${currentIntent.color}`}>
            {currentIntent.label}
          </span>
        </div>

        {/* Missing-Information Signal Metric */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-signal" />
              <span>Signals Captured: {stats.capturedCount}/{stats.totalCount}</span>
            </span>
            <span className="text-white font-semibold">{stats.percentage}%</span>
          </div>
          <div className="w-full h-1.5 bg-void-deep rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-signal to-signal-bright transition-all duration-500"
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
          {stats.missingFields.length > 0 && (
            <div className="mt-2 flex items-center gap-1 text-[10px] font-mono text-zinc-500 truncate">
              <span className="text-zinc-600">Pending signals:</span>
              <span className="text-zinc-400">{stats.missingFields.slice(0, 3).join(', ')}{stats.missingFields.length > 3 ? '...' : ''}</span>
            </div>
          )}
        </div>
      </div>

      {/* Intelligence Field Matrix */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 text-xs font-mono">
        
        {/* 1. CONTACT PARAMETERS */}
        <div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest pb-1.5 mb-2 border-b border-white/[0.04] flex items-center justify-between">
            <span>Contact Telemetry</span>
            <span className="text-[9px] text-zinc-600">CLICK ANY TO EDIT</span>
          </div>

          <div className="space-y-2">
            {/* Name */}
            <div
              onClick={() => startEdit('fullName', intelligence.contact.fullName)}
              className="group p-2 rounded bg-void-surface/50 hover:bg-void-surface border border-white/[0.04] hover:border-signal/40 transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-zinc-500 group-hover:text-signal" />
                <span className="text-zinc-500 text-[11px]">Name:</span>
                <span className={intelligence.contact.fullName ? 'text-white font-medium' : 'text-zinc-600 italic'}>
                  {intelligence.contact.fullName || 'Undetermined'}
                </span>
              </div>
              <Edit2 className="w-3 h-3 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Email */}
            <div
              onClick={() => startEdit('email', intelligence.contact.email)}
              className="group p-2 rounded bg-void-surface/50 hover:bg-void-surface border border-white/[0.04] hover:border-signal/40 transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-zinc-500 group-hover:text-signal" />
                <span className="text-zinc-500 text-[11px]">Email:</span>
                <span className={intelligence.contact.email ? 'text-white font-medium' : 'text-zinc-600 italic'}>
                  {intelligence.contact.email || 'Undetermined'}
                </span>
              </div>
              <Edit2 className="w-3 h-3 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Phone Number (Explicit) */}
            <div
              onClick={() => startEdit('phoneNumber', intelligence.contact.phoneNumber)}
              className="group p-2 rounded bg-void-surface/50 hover:bg-void-surface border border-white/[0.04] hover:border-signal/40 transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-zinc-500 group-hover:text-signal" />
                <span className="text-zinc-500 text-[11px]">Phone:</span>
                <span className={intelligence.contact.phoneNumber ? 'text-white font-medium' : 'text-zinc-600 italic'}>
                  {intelligence.contact.phoneNumber || 'Optional / Pending'}
                </span>
              </div>
              <Edit2 className="w-3 h-3 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>

        {/* 2. BUSINESS SPECIFICATION */}
        <div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest pb-1.5 mb-2 border-b border-white/[0.04]">
            Business Entity
          </div>

          <div className="space-y-2">
            {/* Company Name (Explicit) */}
            <div
              onClick={() => startEdit('companyName', intelligence.business.companyName)}
              className="group p-2 rounded bg-void-surface/50 hover:bg-void-surface border border-white/[0.04] hover:border-signal/40 transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Building className="w-3.5 h-3.5 text-zinc-500 group-hover:text-signal" />
                <span className="text-zinc-500 text-[11px]">Company:</span>
                <span className={intelligence.business.companyName ? 'text-white font-medium' : 'text-zinc-600 italic'}>
                  {intelligence.business.companyName || 'Undisclosed'}
                </span>
              </div>
              <Edit2 className="w-3 h-3 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Business Type */}
            <div className="p-2 rounded bg-void-surface/50 border border-white/[0.04] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-zinc-500 text-[11px]">Type:</span>
                <span className={intelligence.business.businessType !== 'Unknown' ? 'text-white font-medium' : 'text-zinc-600 italic'}>
                  {intelligence.business.businessType}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. DIGITAL PRESENCE (Separated Website & App) */}
        <div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest pb-1.5 mb-2 border-b border-white/[0.04]">
            Existing Digital Footprint
          </div>

          <div className="space-y-2">
            {/* Website */}
            <div
              onClick={() => startEdit('websiteUrl', intelligence.digital.websiteUrl)}
              className="group p-2 rounded bg-void-surface/50 hover:bg-void-surface border border-white/[0.04] hover:border-signal/40 transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-zinc-500 group-hover:text-signal" />
                <span className="text-zinc-500 text-[11px]">Website:</span>
                <span className="text-zinc-300">
                  {intelligence.digital.hasWebsite === 'Yes'
                    ? (intelligence.digital.websiteUrl || 'Yes (URL Pending)')
                    : intelligence.digital.hasWebsite === 'No'
                    ? 'None (Starting Fresh)'
                    : 'Unknown'}
                </span>
              </div>
              <Edit2 className="w-3 h-3 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* App */}
            <div className="p-2 rounded bg-void-surface/50 border border-white/[0.04] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-zinc-500 text-[11px]">Mobile App:</span>
                <span className="text-zinc-300">
                  {intelligence.digital.hasApp === 'Yes'
                    ? (intelligence.digital.appPlatform || 'Yes (Existing)')
                    : intelligence.digital.hasApp === 'No'
                    ? 'None'
                    : 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. PROJECT SCOPE & REQUIREMENTS */}
        <div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest pb-1.5 mb-2 border-b border-white/[0.04]">
            Project Vector & Requirements
          </div>

          <div className="space-y-2">
            {/* Need / Goal */}
            <div
              onClick={() => startEdit('need', intelligence.project.need)}
              className="group p-2 rounded bg-void-surface/50 hover:bg-void-surface border border-white/[0.04] hover:border-signal/40 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-0.5">
                <span className="flex items-center gap-1.5">
                  <Target className="w-3 h-3 text-signal" />
                  <span>Identified Need:</span>
                </span>
                <Edit2 className="w-3 h-3 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className={intelligence.project.need ? 'text-zinc-200' : 'text-zinc-600 italic'}>
                {intelligence.project.need || 'Awaiting description...'}
              </div>
            </div>

            {/* Problem Statement */}
            <div
              onClick={() => startEdit('problem', intelligence.project.problem)}
              className="group p-2 rounded bg-void-surface/50 hover:bg-void-surface border border-white/[0.04] hover:border-signal/40 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-0.5">
                <span className="flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3 text-amber-500/70" />
                  <span>Friction / Problem:</span>
                </span>
                <Edit2 className="w-3 h-3 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className={intelligence.project.problem ? 'text-zinc-200' : 'text-zinc-600 italic'}>
                {intelligence.project.problem || 'Not yet identified...'}
              </div>
            </div>

            {/* Services Matrix */}
            <div className="p-2 rounded bg-void-surface/50 border border-white/[0.04]">
              <span className="text-zinc-500 text-[11px] block mb-1">Aligned Disciplines:</span>
              <div className="flex flex-wrap gap-1">
                {intelligence.project.services.length > 0 ? (
                  intelligence.project.services.map((s) => (
                    <span key={s} className="px-1.5 py-0.5 rounded bg-signal/15 text-signal-bright border border-signal/30 text-[10px]">
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-zinc-600 italic text-[11px]">Identifying during conversation...</span>
                )}
              </div>
            </div>

            {/* Timeline & Budget Grid */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div
                onClick={() => startEdit('timeline', intelligence.project.timeline)}
                className="group p-2 rounded bg-void-surface/50 hover:bg-void-surface border border-white/[0.04] hover:border-signal/40 cursor-pointer"
              >
                <div className="flex items-center justify-between text-[10px] text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-zinc-500" />
                    <span>Timeline:</span>
                  </span>
                  <Edit2 className="w-2.5 h-2.5 text-zinc-600 opacity-0 group-hover:opacity-100" />
                </div>
                <div className="text-zinc-200 font-semibold mt-0.5 truncate text-[11px]">
                  {intelligence.project.timeline}
                </div>
              </div>

              <div
                onClick={() => startEdit('budget', intelligence.project.budget)}
                className="group p-2 rounded bg-void-surface/50 hover:bg-void-surface border border-white/[0.04] hover:border-signal/40 cursor-pointer"
              >
                <div className="flex items-center justify-between text-[10px] text-zinc-500">
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-zinc-500" />
                    <span>Budget:</span>
                  </span>
                  <Edit2 className="w-2.5 h-2.5 text-zinc-600 opacity-0 group-hover:opacity-100" />
                </div>
                <div className="text-zinc-200 font-semibold mt-0.5 truncate text-[11px]">
                  {intelligence.project.budget || 'Undisclosed (Optional)'}
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Inline Field Editor Modal */}
      {editingField && (
        <div className="p-3 bg-void-deep border-t border-white/[0.08] flex items-center gap-2">
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder={`Correct ${editingField}...`}
            className="flex-1 bg-void-surface border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-signal"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEdit();
              if (e.key === 'Escape') setEditingField(null);
            }}
          />
          <button
            onClick={saveEdit}
            className="px-2.5 py-1.5 rounded bg-signal text-white text-xs flex items-center gap-1 font-semibold"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>
          <button
            onClick={() => setEditingField(null)}
            className="px-2 py-1.5 text-zinc-500 hover:text-zinc-300 text-xs"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Direct Founder Relay Guarantee */}
      <div className="px-4 py-2.5 bg-void-surface border-t border-white/[0.04] flex items-center justify-between text-[10px] font-mono text-zinc-500">
        <div className="flex items-center gap-1.5">
          <Shield className="w-3 h-3 text-emerald-400" />
          <span>DIRECT FOUNDER RELAY</span>
        </div>
        <span>ANDY WATSON · 2026</span>
      </div>

    </div>
  );
};
