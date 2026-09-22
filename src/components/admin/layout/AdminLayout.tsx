import React, { useState } from 'react';
import {
  Activity,
  Users,
  BarChart3,
  MessageSquare,
  AlertCircle,
  Settings,
  FileText,
  Menu,
  X,
  LogOut,
  Radio,
  ExternalLink,
} from 'lucide-react';
import type { AdminSection, AdminUser } from '../warm-theme/tokens';

interface AdminLayoutProps {
  currentSection: AdminSection;
  onNavigate: (section: AdminSection) => void;
  user: AdminUser;
  liveVisitorsCount: number;
  pendingHandoffsCount: number;
  isOnline: boolean;
  onTogglePresence: () => void;
  onExit?: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentSection,
  onNavigate,
  user,
  liveVisitorsCount,
  pendingHandoffsCount,
  isOnline,
  onTogglePresence,
  onExit,
  children,
}) => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const userRoleNormalized = (user.role || 'agent').toLowerCase();
  const isAgentOnly = userRoleNormalized === 'agent';
  const isSuperAdmin = userRoleNormalized === 'owner' || userRoleNormalized === 'super_admin';

  const roleDisplayLabel = isSuperAdmin
    ? 'Super Admin'
    : userRoleNormalized === 'admin'
    ? 'Admin'
    : 'Agent';

  const navItems = [
    {
      group: 'COMMAND CENTER',
      items: [
        {
          id: 'overview' as AdminSection,
          label: 'Overview',
          icon: Activity,
          badge: null,
          restricted: false,
        },
        {
          id: 'visitors' as AdminSection,
          label: 'Live Visitors',
          icon: Radio,
          badge: liveVisitorsCount > 0 ? `${liveVisitorsCount}` : null,
          badgeColor: 'bg-[#4F8A5B] text-white',
          restricted: false,
        },
        {
          id: 'analytics' as AdminSection,
          label: 'Analytics',
          icon: BarChart3,
          badge: null,
          restricted: false,
        },
      ],
    },
    {
      group: 'COMMUNICATION',
      items: [
        {
          id: 'conversations' as AdminSection,
          label: 'Conversations',
          icon: MessageSquare,
          badge: null,
          restricted: false,
        },
        {
          id: 'handoffs' as AdminSection,
          label: 'Human Requests',
          icon: AlertCircle,
          badge: pendingHandoffsCount > 0 ? `${pendingHandoffsCount}` : null,
          badgeColor: 'bg-[#B56A45] text-white animate-pulse',
          restricted: false,
        },
      ],
    },
    {
      group: 'TEAM',
      items: [
        {
          id: 'users' as AdminSection,
          label: 'Users & Roles',
          icon: Users,
          badge: null,
          restricted: isAgentOnly,
        },
      ],
    },
    {
      group: 'SYSTEM',
      items: [
        {
          id: 'settings' as AdminSection,
          label: 'Settings',
          icon: Settings,
          badge: null,
          restricted: isAgentOnly,
        },
        {
          id: 'audit' as AdminSection,
          label: 'Audit Log',
          icon: FileText,
          badge: null,
          restricted: isAgentOnly,
        },
      ],
    },
  ];

  const handleNavClick = (sectionId: AdminSection) => {
    onNavigate(sectionId);
    setIsMobileNavOpen(false);
  };

  const handleReturnToSite = () => {
    if (onExit) {
      onExit();
    } else {
      window.location.href = '/';
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#FBF9F4] text-[#242321] border-r border-[#D9D4CA] select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#D9D4CA] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#242321] text-[#F5F1E8] flex items-center justify-center font-serif font-bold text-sm tracking-widest shadow-sm">
            N
          </div>
          <div>
            <div className="text-xs font-semibold tracking-wider text-[#242321] uppercase font-mono">
              NEXUS ADMIN
            </div>
            <div className="text-[11px] text-[#716D65] flex items-center gap-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-[#4F8A5B]' : 'bg-[#7C766C]'}`} />
              <span>{isOnline ? 'System Live' : 'Presence Away'}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleReturnToSite}
          title="Return to public website"
          className="text-[#716D65] hover:text-[#242321] p-1.5 rounded-md hover:bg-[#EEEAE1] transition-colors"
          aria-label="Return to public website"
        >
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navItems.map((group) => {
          const visibleItems = group.items.filter((item) => !item.restricted);
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.group}>
              <div className="px-3 mb-2 text-[10px] font-mono tracking-widest text-[#716D65] uppercase">
                {group.group}
              </div>
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-[#EEEAE1] text-[#242321] font-semibold shadow-xs'
                          : 'text-[#716D65] hover:text-[#242321] hover:bg-[#F5F1E8]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`w-4 h-4 ${
                            isActive ? 'text-[#242321]' : 'text-[#716D65]'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium ${
                            item.badgeColor || 'bg-[#EEEAE1] text-[#242321]'
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
          );
        })}
      </div>

      {/* Agent Operator Presence Card & Profile */}
      <div className="p-3 border-t border-[#D9D4CA] bg-[#F5F1E8]/70 space-y-3">
        {/* Toggle Presence Button */}
        <div className="flex items-center justify-between px-2 py-1.5 rounded-md bg-[#FBF9F4] border border-[#D9D4CA] text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-[#4F8A5B] animate-pulse' : 'bg-[#7C766C]'
              }`}
            />
            <span className="text-[11px] font-medium text-[#242321]">
              {isOnline ? 'Available for Chat' : 'Away'}
            </span>
          </div>
          <button
            onClick={onTogglePresence}
            className="text-[10px] font-mono text-[#716D65] hover:text-[#242321] underline px-1 py-0.5"
          >
            {isOnline ? 'Go Away' : 'Go Live'}
          </button>
        </div>

        {/* User Profile Info */}
        <div className="flex items-center justify-between px-1">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-[#242321] truncate">
              {user.full_name || user.email}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-mono text-[#716D65] uppercase px-1.5 py-0.5 rounded bg-[#EEEAE1]">
                {roleDisplayLabel}
              </span>
            </div>
          </div>
          <button
            onClick={handleReturnToSite}
            title="Sign out / Exit"
            className="text-[#716D65] hover:text-[#B56A45] p-1.5 rounded-md hover:bg-[#EEEAE1] transition-colors"
            aria-label="Exit console"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] w-full bg-[#F5F1E8] text-[#242321] flex flex-col md:flex-row antialiased font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#FBF9F4] border-b border-[#D9D4CA] sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            className="p-1.5 text-[#242321] hover:bg-[#EEEAE1] rounded-md transition-colors"
            aria-label="Toggle navigation menu"
          >
            {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="text-xs font-semibold tracking-wider font-mono uppercase text-[#242321]">
            NEXUS ADMIN
          </span>
        </div>

        <div className="flex items-center gap-2">
          {pendingHandoffsCount > 0 && (
            <button
              onClick={() => handleNavClick('handoffs')}
              className="flex items-center gap-1 text-[11px] font-medium bg-[#B56A45] text-white px-2 py-0.5 rounded-full"
            >
              <AlertCircle className="w-3 h-3" />
              <span>{pendingHandoffsCount}</span>
            </button>
          )}
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-[#4F8A5B]' : 'bg-[#7C766C]'}`} />
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {isMobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-[#242321]/30 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileNavOpen(false)}
          />
          <div className="relative w-4/5 max-w-xs h-full bg-[#FBF9F4] shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Operational Stage */}
      <main className="flex-1 min-w-0 flex flex-col h-auto md:h-screen md:overflow-y-auto">
        {children}
      </main>
    </div>
  );
};
