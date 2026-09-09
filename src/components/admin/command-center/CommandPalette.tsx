import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  LayoutDashboard,
  Radio,
  Activity,
  UserCheck,
  MessageSquare,
  FileText,
  HeartPulse,
  Sparkles,
  Gauge,
  AlertTriangle,
  Users,
  ShieldCheck,
  Settings,
  Globe,
  CornerDownLeft,
} from 'lucide-react';
import type { CommandNavSection } from './types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSection: (section: CommandNavSection) => void;
  onExitToWorld: () => void;
  onTogglePresence: () => void;
  isOnline: boolean;
}

interface PaletteItem {
  id: string;
  label: string;
  category: 'Navigation' | 'Actions';
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  shortcut?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectSection,
  onExitToWorld,
  onTogglePresence,
  isOnline,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items: PaletteItem[] = [
    {
      id: 'nav-overview',
      label: 'Open Overview',
      category: 'Navigation',
      icon: LayoutDashboard,
      action: () => onSelectSection('overview'),
    },
    {
      id: 'nav-live-visitors',
      label: 'Open Live Visitors',
      category: 'Navigation',
      icon: Radio,
      action: () => onSelectSection('live_visitors'),
    },
    {
      id: 'nav-activity',
      label: 'Open Activity Stream',
      category: 'Navigation',
      icon: Activity,
      action: () => onSelectSection('activity'),
    },
    {
      id: 'nav-leads',
      label: 'Open Leads Pipeline',
      category: 'Navigation',
      icon: UserCheck,
      action: () => onSelectSection('leads'),
    },
    {
      id: 'nav-conversations',
      label: 'Open Live Conversations',
      category: 'Navigation',
      icon: MessageSquare,
      action: () => onSelectSection('conversations'),
    },
    {
      id: 'nav-products',
      label: 'Open Product Operations',
      category: 'Navigation',
      icon: FileText,
      action: () => onSelectSection('products'),
    },
    {
      id: 'nav-health',
      label: 'Open System Health Telemetry',
      category: 'Navigation',
      icon: HeartPulse,
      action: () => onSelectSection('health'),
    },
    {
      id: 'nav-ai',
      label: 'Open AI & Gemini Monitoring',
      category: 'Navigation',
      icon: Sparkles,
      action: () => onSelectSection('ai'),
    },
    {
      id: 'nav-limits',
      label: 'Open Limits & Quotas',
      category: 'Navigation',
      icon: Gauge,
      action: () => onSelectSection('limits'),
    },
    {
      id: 'nav-errors',
      label: 'Open Error Center',
      category: 'Navigation',
      icon: AlertTriangle,
      action: () => onSelectSection('errors'),
    },
    {
      id: 'nav-users',
      label: 'Open User Management',
      category: 'Navigation',
      icon: Users,
      action: () => onSelectSection('users'),
    },
    {
      id: 'nav-security',
      label: 'Open Security & Policies',
      category: 'Navigation',
      icon: ShieldCheck,
      action: () => onSelectSection('security'),
    },
    {
      id: 'nav-settings',
      label: 'Open Settings',
      category: 'Navigation',
      icon: Settings,
      action: () => onSelectSection('settings'),
    },
    {
      id: 'act-presence',
      label: isOnline ? 'Set Presence: Away' : 'Set Presence: Online (Ready for Takeover)',
      category: 'Actions',
      icon: Radio,
      action: onTogglePresence,
    },
    {
      id: 'act-world',
      label: 'Exit to Public 3D World',
      category: 'Actions',
      icon: Globe,
      action: onExitToWorld,
    },
  ];

  const filteredItems = items.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[14vh] p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-[#0C0C12] border border-white/[0.12] rounded-xl shadow-2xl shadow-black/90 overflow-hidden flex flex-col font-mono text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.08] bg-white/[0.02]">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or jump to view..."
            className="flex-1 bg-transparent text-white placeholder:text-zinc-500 text-xs focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-[10px] text-zinc-400">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[360px] overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-zinc-500 text-xs">
              No matching commands found.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-left ${
                    isSelected
                      ? 'bg-[#2563EB] text-white'
                      : 'text-zinc-300 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-zinc-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[9px] uppercase px-1.5 py-0.5 rounded border ${
                        isSelected
                          ? 'border-white/20 text-white/90 bg-white/10'
                          : 'border-white/[0.06] text-zinc-400 bg-white/[0.02]'
                      }`}
                    >
                      {item.category}
                    </span>
                    {isSelected && (
                      <CornerDownLeft className="w-3.5 h-3.5 text-white/80" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Palette Footer */}
        <div className="px-4 py-2 border-t border-white/[0.06] bg-black/40 flex items-center justify-between text-[10px] text-zinc-400">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <div>NEXUS COMMAND DISPATCH</div>
        </div>
      </div>
    </div>
  );
};
