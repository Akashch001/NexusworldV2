import React, { useState } from 'react';
import {
  UserCheck,
  Mail,
  Phone,
  Building,
  ArrowRight,
  Search,
  Filter,
  X,
} from 'lucide-react';
import type { LeadRecord } from '../types';
import { supabase } from '../../../../lib/supabaseClient';

interface LeadsViewProps {
  leads: LeadRecord[];
  onRefreshLeads: () => Promise<void>;
  onNavigateToConversation?: (convId: string) => void;
}

export const LeadsView: React.FC<LeadsViewProps> = ({
  leads,
  onRefreshLeads,
  onNavigateToConversation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.company_name && lead.company_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (lead.service_interest && lead.service_interest.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      selectedStatus === 'all' || lead.lead_status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const handleUpdateStatus = async (leadId: string, newStatus: LeadRecord['lead_status']) => {
    setUpdatingId(leadId);
    try {
      const { error } = await supabase
        .from('leads')
        .update({ lead_status: newStatus })
        .eq('id', leadId);

      if (!error) {
        await onRefreshLeads();
        if (selectedLead && selectedLead.id === leadId) {
          setSelectedLead((prev) => prev ? { ...prev, lead_status: newStatus } : null);
        }
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const getTemperatureBadge = (temp: LeadRecord['lead_temperature']) => {
    switch (temp) {
      case 'hot':
        return (
          <span className="px-2 py-0.5 rounded text-[9px] uppercase font-bold bg-red-500/20 text-red-400 border border-red-500/30">
            Hot 🔥
          </span>
        );
      case 'warm':
        return (
          <span className="px-2 py-0.5 rounded text-[9px] uppercase font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            Warm
          </span>
        );
      case 'cold':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[9px] uppercase font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
            Cold
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 font-mono">
      
      {/* Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#0A0A0F] border border-white/[0.08]">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads by name, email, company..."
              className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-[#2563EB] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Status Filter Dropdown */}
          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-zinc-500" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-[#0A0A0F] border border-white/[0.08] text-zinc-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
            >
              <option value="all">All Stages ({leads.length})</option>
              <option value="new">New ({leads.filter(l => l.lead_status === 'new').length})</option>
              <option value="qualified">Qualified ({leads.filter(l => l.lead_status === 'qualified').length})</option>
              <option value="contacted">Contacted ({leads.filter(l => l.lead_status === 'contacted').length})</option>
              <option value="meeting_booked">Meeting Booked ({leads.filter(l => l.lead_status === 'meeting_booked').length})</option>
              <option value="proposal">Proposal ({leads.filter(l => l.lead_status === 'proposal').length})</option>
              <option value="won">Won ({leads.filter(l => l.lead_status === 'won').length})</option>
              <option value="lost">Lost ({leads.filter(l => l.lead_status === 'lost').length})</option>
            </select>
          </div>
        </div>

        <div className="text-[11px] text-zinc-400 shrink-0">
          Total Qualified: {leads.filter(l => l.lead_score >= 50).length}
        </div>
      </div>

      {/* Leads Table */}
      {leads.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0A0A0F] border border-white/[0.08] space-y-3">
          <UserCheck className="w-8 h-8 text-zinc-600 mx-auto" />
          <div className="text-sm font-bold text-white">NO LEADS RECORDED</div>
          <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
            No customer leads captured yet. When visitors share their project brief or book a consultation via NORA, their profile is recorded here automatically.
          </p>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-[#0A0A0F] border border-white/[0.08] text-xs text-zinc-500">
          No leads match the active filter criteria.
        </div>
      ) : (
        <div className="rounded-2xl bg-[#0A0A0F] border border-white/[0.08] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[10px] uppercase text-zinc-400 tracking-wider">
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Service Interest</th>
                  <th className="py-3 px-4">Score / Temp</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className="cursor-pointer hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Contact */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{lead.name}</div>
                      <div className="text-[11px] text-zinc-400">{lead.email}</div>
                      {lead.phone && <div className="text-[10px] text-zinc-500">{lead.phone}</div>}
                    </td>

                    {/* Company */}
                    <td className="py-3 px-4 text-zinc-300">
                      {lead.company_name || 'Individual / Founder'}
                    </td>

                    {/* Service Interest */}
                    <td className="py-3 px-4 text-zinc-300">
                      <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-[10px] text-zinc-300">
                        {lead.service_interest || 'Full Stack / AI'}
                      </span>
                    </td>

                    {/* Score & Temp */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{lead.lead_score}/100</span>
                        {getTemperatureBadge(lead.lead_temperature)}
                      </div>
                    </td>

                    {/* Stage Dropdown */}
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={lead.lead_status}
                        onChange={(e) => handleUpdateStatus(lead.id, e.target.value as any)}
                        disabled={updatingId === lead.id}
                        className="bg-black/40 border border-white/[0.08] text-white rounded px-2 py-1 text-[11px] font-mono focus:outline-none"
                      >
                        <option value="new">New</option>
                        <option value="qualified">Qualified</option>
                        <option value="contacted">Contacted</option>
                        <option value="meeting_booked">Meeting Booked</option>
                        <option value="proposal">Proposal</option>
                        <option value="won">Won</option>
                        <option value="lost">Lost</option>
                        <option value="archived">Archived</option>
                      </select>
                    </td>

                    {/* Created */}
                    <td className="py-3 px-4 text-zinc-500 text-[11px]">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedLead(lead)}
                        className="px-2.5 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-colors border border-white/[0.06]"
                      >
                        Brief →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lead Detail Slide-Over Drawer */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-lg bg-[#0A0A0F] border-l border-white/[0.1] h-full flex flex-col shadow-2xl overflow-hidden font-mono"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-white/[0.08] bg-white/[0.02] flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-purple-400" />
                  <span>LEAD INTELLIGENCE BRIEF</span>
                </div>
                <div className="text-sm font-bold text-white mt-1">
                  {selectedLead.name}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="p-1.5 rounded-lg bg-white/[0.04] text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
              
              {/* Contact Information */}
              <div className="space-y-2">
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                  CONTACT DETAILS
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Mail className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{selectedLead.email}</span>
                  </div>
                  {selectedLead.phone && (
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Phone className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{selectedLead.phone}</span>
                    </div>
                  )}
                  {selectedLead.company_name && (
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Building className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{selectedLead.company_name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Project Requirements & Intelligence */}
              <div className="space-y-2">
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                  PROJECT SCOPE & INTELLIGENCE
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                  <div>
                    <span className="text-zinc-500 text-[10px] uppercase block">Service Area</span>
                    <span className="text-white font-medium">{selectedLead.service_interest || 'General Development'}</span>
                  </div>

                  {selectedLead.project_description && (
                    <div>
                      <span className="text-zinc-500 text-[10px] uppercase block">Description</span>
                      <p className="text-zinc-300 leading-relaxed mt-0.5">{selectedLead.project_description}</p>
                    </div>
                  )}

                  {selectedLead.pain_points && (
                    <div>
                      <span className="text-zinc-500 text-[10px] uppercase block">Blockers / Friction</span>
                      <p className="text-amber-300 leading-relaxed mt-0.5">{selectedLead.pain_points}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-1 border-t border-white/[0.04]">
                    <div>
                      <span className="text-zinc-500 text-[10px] uppercase block">Budget</span>
                      <span className="text-white font-medium">{selectedLead.budget_range || 'Undisclosed'}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[10px] uppercase block">Timeline</span>
                      <span className="text-white font-medium">{selectedLead.timeline || 'Flexible'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conversation Link if available */}
              {selectedLead.conversation_id && onNavigateToConversation && (
                <div className="p-3.5 rounded-xl bg-[#2563EB]/10 border border-[#2563EB]/30 flex items-center justify-between">
                  <div className="text-xs text-[#3B82F6]">
                    Original NORA Chat Available
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateToConversation(selectedLead.conversation_id!);
                      setSelectedLead(null);
                    }}
                    className="text-xs text-white hover:underline flex items-center gap-1"
                  >
                    <span>View Chat</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/[0.08] bg-black/40 flex items-center justify-between">
              <span className="text-[10px] text-zinc-500">
                Created: {new Date(selectedLead.created_at).toLocaleString()}
              </span>
              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="px-3 py-1.5 rounded-lg bg-white/[0.04] text-white text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
