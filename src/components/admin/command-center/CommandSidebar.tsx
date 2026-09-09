import React from 'react';
import {
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
  Command,
} from 'lucide-react';
import type { CommandNavSection, CommandBadgeCounts } from './types';

interface CommandSidebarProps {
  activeSection: CommandNavSection;
  onSelectSection: (section: CommandNavSection) => void;
  badgeCounts: CommandBadgeCounts;
  onOpenCommandPalette: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  id: CommandNavSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  badgeColor?: string;
  urgent?: boolean;
}

interface NavGroup {
  groupName: string;
  items: NavItem[];
}

export const CommandSidebar: React.FC<CommandSidebarProps> = ({
  activeSection,
  onSelectSection,
  badgeCounts,
  onOpenCommandPalette,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const navGroups: NavGroup[] = [
    {
      groupName: 'COMMAND',
      items: [
        {
          id: 'overview',
          label: 'Overview',
          icon: LayoutDashboard,
        },
        {
          id: 'live_visitors',
          label: 'Live Visitors',
          icon: Radio,
          badge: badgeCounts.activeVisitors > 0 ? badgeCounts.activeVisitors : undefined,
          badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        },
        {
          id: 'activity',
          label: 'Activity',
          icon: Activity,
        },
      ],
    },
    {
      groupName: 'CUSTOMERS',
      items: [
        {
          id: 'leads',
          label: 'Leads',
          icon: UserCheck,
          badge: badgeCounts.newLeads > 0 ? badgeCounts.newLeads : undefined,
          badgeColor: 'bg-[#2563EB]/15 text-[#3B82F6] border-[#2563EB]/30',
        },
        {
          id: 'conversations',
          label: 'Conversations',
          icon: MessageSquare,
          badge: badgeCounts.waitingHandoffs > 0 ? badgeCounts.waitingHandoffs : (badgeCounts.activeConversations > 0 ? badgeCounts.activeConversations : undefined),
          badgeColor: badgeCounts.waitingHandoffs > 0 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse' : 'bg-white/[0.06] text-zinc-300 border-white/10',
          urgent: badgeCounts.waitingHandoffs > 0,
        },
      ],
    },
    {
      groupName: 'PRODUCTS',
      items: [
        {
          id: 'products',
          label: 'Nexus Suite',
          icon: FileText,
        },
      ],
    },
    {
      groupName: 'SYSTEM',
      items: [
        {
          id: 'health',
          label: 'Health',
          icon: HeartPulse,
        },
        {
          id: 'ai',
          label: 'AI & NORA',
          icon: Sparkles,
        },
        {
          id: 'limits',
          label: 'Limits',
          icon: Gauge,
        },
        {
          id: 'errors',
          label: 'Errors',
          icon: AlertTriangle,
          badge: badgeCounts.criticalErrors > 0 ? badgeCounts.criticalErrors : undefined,
          badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
          urgent: badgeCounts.criticalErrors > 0,
        },
      ],
    },
    {
      groupName: 'ADMIN',
      items: [
        {
          id: 'users',
          label: 'Users',
          icon: Users,
        },
        {
          id: 'security',
          label: 'Security',
          icon: ShieldCheck,
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: Settings,
        },
      ],
    },
  ];

  const handleItemClick = (id: CommandNavSection) => {
    onSelectSection(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-[#07070A] border-r border-white/[0.06] flex flex-col transition-transform duration-200 ease-out select-none ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Banner */}
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 rounded-lg bg-[#101015] border border-white/[0.12] flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.2)]">
              <span className="font-display font-bold text-white text-sm tracking-wider">N</span>
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#2563EB]" />
            </div>
            <div>
              <div className="font-display font-bold text-xs tracking-widest text-white uppercase">
                NEXUSWORLD
              </div>
              <div className="text-[9px] font-mono text-zinc-400 tracking-wider">
                COMMAND CENTER
              </div>
            </div>
          </div>
        </div>

        {/* Command Palette Trigger */}
        <div className="p-3">
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-xs font-mono text-zinc-400 hover:text-white transition-colors group"
          >
            <div className="flex items-center gap-2">
              <Command className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-colors" />
              <span>Command Palette</span>
            </div>
            <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-zinc-400">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
          {navGroups.map((group) => (
            <div key={group.groupName} className="space-y-1">
              <div className="px-3 text-[10px] font-mono font-semibold tracking-wider text-zinc-400 uppercase">
                {group.groupName}
              </div>

              <div className="space-y-0.5 pt-1">
                {group.items.map((item) => {
                  const isActive = activeSection === item.id;
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleItemClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono transition-all text-left ${
                        isActive
                          ? 'bg-[#2563EB] text-white font-medium shadow-[0_0_12px_rgba(37,99,235,0.25)]'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-white' : 'text-zinc-400'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge !== undefined && (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                            isActive
                              ? 'bg-white/20 text-white border-transparent'
                              : item.badgeColor || 'bg-white/[0.06] text-zinc-300 border-white/[0.08]'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* System Enclave Footer Info */}
        <div className="p-3 border-t border-white/[0.06] text-[10px] font-mono text-zinc-400 space-y-1">
          <div className="flex items-center justify-between px-1">
            <span>REALTIME SYNC</span>
            <span className="inline-flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          </div>
          <div className="text-[9px] text-zinc-400 px-1 truncate">
            ENCLAVE LEVEL 5 // SECURE
          </div>
        </div>
      </aside>
    </>
  );
};
