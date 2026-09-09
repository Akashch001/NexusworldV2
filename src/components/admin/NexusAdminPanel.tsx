import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { runFullHealthReport, type SystemHealthReport } from '../../lib/healthTelemetry';
import { AdminUserManagement } from './AdminUserManagement';
import type {
  CommandNavSection,
  VisitorSession,
  VisitorEvent,
  ConversationRecord,
  LeadRecord,
  SystemLogRecord,
  CommandBadgeCounts,
} from './command-center/types';
import { CommandSidebar } from './command-center/CommandSidebar';
import { CommandHeader } from './command-center/CommandHeader';
import { CommandPalette } from './command-center/CommandPalette';
import { OverviewView } from './command-center/views/OverviewView';
import { LiveVisitorsView } from './command-center/views/LiveVisitorsView';
import { ActivityStreamView } from './command-center/views/ActivityStreamView';
import { ConversationsView } from './command-center/views/ConversationsView';
import { LeadsView } from './command-center/views/LeadsView';
import { ProductsView } from './command-center/views/ProductsView';
import { SystemHealthView } from './command-center/views/SystemHealthView';
import { AiMonitoringView } from './command-center/views/AiMonitoringView';
import { LimitsView } from './command-center/views/LimitsView';
import { ErrorCenterView } from './command-center/views/ErrorCenterView';
import { SecuritySettingsView } from './command-center/views/SecuritySettingsView';

interface NexusAdminPanelProps {
  user: {
    id: string;
    email: string;
    full_name: string;
    role: string;
  };
  onExit?: () => void;
}

export const NexusAdminPanel: React.FC<NexusAdminPanelProps> = ({ user, onExit }) => {
  // Navigation State
  const [activeSection, setActiveSection] = useState<CommandNavSection>('overview');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Operational Data State
  const [visitorSessions, setVisitorSessions] = useState<VisitorSession[]>([]);
  const [visitorEvents, setVisitorEvents] = useState<VisitorEvent[]>([]);
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLogRecord[]>([]);
  const [healthReport, setHealthReport] = useState<SystemHealthReport | null>(null);

  // Operator Presence
  const [isOnlinePresence, setIsOnlinePresence] = useState<boolean>(false);

  // Selected details
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorSession | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>(undefined);

  // Refresh indicator
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Realtime Telemetry Freshness State
  const [lastTelemetryAt, setLastTelemetryAt] = useState<Date | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');

  // Fetch Operator Online Presence
  const fetchPresence = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('is_online')
        .eq('id', user.id)
        .maybeSingle();

      if (data && typeof data.is_online === 'boolean') {
        setIsOnlinePresence(data.is_online);
      }
    } catch {
      // Fallback
    }
  }, [user.id]);

  // Toggle Operator Online Presence
  const handleTogglePresence = async () => {
    const nextState = !isOnlinePresence;
    setIsOnlinePresence(nextState);

    try {
      await supabase
        .from('profiles')
        .update({ is_online: nextState })
        .eq('id', user.id);

      // Log operator presence change
      await supabase.from('system_logs').insert({
        service: 'application',
        level: 'info',
        event: 'admin_presence_toggle',
        message: `Admin ${user.full_name || user.email} set presence to ${nextState ? 'ONLINE' : 'AWAY'}`,
        details: { admin_id: user.id, is_online: nextState },
      });
    } catch {
      // Revert if failed
      setIsOnlinePresence(!nextState);
    }
  };

  // Fetch all operational datasets from Supabase (Zero fake data)
  const fetchOperationalData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [sessionsRes, eventsRes, convRes, leadsRes, logsRes] = await Promise.all([
        supabase
          .from('visitor_sessions')
          .select('*')
          .order('last_seen_at', { ascending: false })
          .limit(100),
        supabase
          .from('visitor_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('conversations')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(50),
        supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('system_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100),
      ]);

      if (sessionsRes.data) setVisitorSessions(sessionsRes.data as VisitorSession[]);
      if (eventsRes.data) setVisitorEvents(eventsRes.data as VisitorEvent[]);
      if (convRes.data) setConversations(convRes.data as ConversationRecord[]);
      if (leadsRes.data) setLeads(leadsRes.data as LeadRecord[]);
      if (logsRes.data) setSystemLogs(logsRes.data as SystemLogRecord[]);

      // Extract authentic latest telemetry timestamp
      const timestamps: number[] = [];
      (sessionsRes.data || []).forEach((s: any) => {
        if (s.last_seen_at) timestamps.push(new Date(s.last_seen_at).getTime());
        if (s.created_at) timestamps.push(new Date(s.created_at).getTime());
      });
      (eventsRes.data || []).forEach((e: any) => {
        if (e.created_at) timestamps.push(new Date(e.created_at).getTime());
      });
      (logsRes.data || []).forEach((l: any) => {
        if (l.created_at) timestamps.push(new Date(l.created_at).getTime());
      });

      if (timestamps.length > 0) {
        setLastTelemetryAt(new Date(Math.max(...timestamps)));
      }

      // Run health check
      const report = await runFullHealthReport(false);
      setHealthReport(report);
    } catch {
      // Graceful error state
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Initial Load & Realtime Subscriptions
  useEffect(() => {
    fetchPresence();
    fetchOperationalData();

    // Supabase Realtime Channels for Instant Updates
    const realtimeChannel = supabase
      .channel('nexus_command_center_hub')
      // 1. Visitor Sessions
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'visitor_sessions' },
        (payload) => {
          setLastTelemetryAt(new Date());
          if (payload.eventType === 'INSERT') {
            setVisitorSessions((prev) => [payload.new as VisitorSession, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setVisitorSessions((prev) =>
              prev.map((s) => (s.id === payload.new.id ? (payload.new as VisitorSession) : s))
            );
          } else if (payload.eventType === 'DELETE') {
            setVisitorSessions((prev) => prev.filter((s) => s.id !== payload.old.id));
          }
        }
      )
      // 2. Visitor Events
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'visitor_events' },
        (payload) => {
          setLastTelemetryAt(new Date());
          setVisitorEvents((prev) => [payload.new as VisitorEvent, ...prev.slice(0, 99)]);
        }
      )
      // 3. Conversations (Human Handoff & State Updates)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        (payload) => {
          setLastTelemetryAt(new Date());
          if (payload.eventType === 'INSERT') {
            setConversations((prev) => [payload.new as ConversationRecord, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setConversations((prev) =>
              prev.map((c) => (c.id === payload.new.id ? (payload.new as ConversationRecord) : c))
            );
          }
        }
      )
      // 4. Leads
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        (payload) => {
          setLastTelemetryAt(new Date());
          if (payload.eventType === 'INSERT') {
            setLeads((prev) => [payload.new as LeadRecord, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setLeads((prev) =>
              prev.map((l) => (l.id === payload.new.id ? (payload.new as LeadRecord) : l))
            );
          }
        }
      )
      // 5. System Logs
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'system_logs' },
        (payload) => {
          setLastTelemetryAt(new Date());
          setSystemLogs((prev) => [payload.new as SystemLogRecord, ...prev.slice(0, 99)]);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('connected');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setRealtimeStatus('disconnected');
        }
      });

    // Health probe interval (every 45s)
    const healthTimer = setInterval(async () => {
      const report = await runFullHealthReport(false);
      setHealthReport(report);
    }, 45000);

    // Command Palette Keyboard Shortcut (⌘K / Ctrl+K)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      realtimeChannel.unsubscribe();
      clearInterval(healthTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [fetchPresence, fetchOperationalData]);

  // Badge Counts derived directly from real data
  const badgeCounts: CommandBadgeCounts = useMemo(() => {
    const activeVisitors = visitorSessions.filter((s) => s.is_active).length;
    const waitingHandoffs = conversations.filter((c) => c.status === 'human_requested').length;
    const activeConversations = conversations.filter((c) => c.status === 'human' || c.status === 'ai').length;
    const newLeads = leads.filter((l) => l.lead_status === 'new').length;
    const criticalErrors = systemLogs.filter((l) => l.level === 'critical').length;

    return {
      activeVisitors,
      waitingHandoffs,
      activeConversations,
      newLeads,
      criticalErrors,
    };
  }, [visitorSessions, conversations, leads, systemLogs]);

  // Sign Out Handler
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/admin/login';
  };

  // Exit to 3D World Handler
  const handleReturnToSite = () => {
    if (onExit) {
      onExit();
    } else {
      window.location.href = '/';
    }
  };

  // Active Live Visitors filtered to recently active
  const activeVisitorsList = useMemo(() => {
    return visitorSessions.filter((s) => s.is_active);
  }, [visitorSessions]);

  return (
    <div className="min-h-screen bg-[#050507] text-[#F4F4F6] font-sans flex select-none selection:bg-[#2563EB] selection:text-white">
      
      {/* 1. Operational Sidebar */}
      <CommandSidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        badgeCounts={badgeCounts}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* 2. Main Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Command Header */}
        <CommandHeader
          currentSection={activeSection}
          user={user}
          isOnlinePresence={isOnlinePresence}
          onTogglePresence={handleTogglePresence}
          onExitToWorld={handleReturnToSite}
          onSignOut={handleSignOut}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
          onRefreshData={fetchOperationalData}
          isRefreshing={isRefreshing}
          lastTelemetryAt={lastTelemetryAt}
          realtimeStatus={realtimeStatus}
        />

        {/* Dynamic View Display */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            
            {activeSection === 'overview' && (
              <OverviewView
                activeVisitors={activeVisitorsList}
                allSessions={visitorSessions}
                conversations={conversations}
                leads={leads}
                events={visitorEvents}
                systemLogs={systemLogs}
                healthReport={healthReport}
                lastTelemetryAt={lastTelemetryAt}
                realtimeStatus={realtimeStatus}
                onNavigate={setActiveSection}
                onSelectVisitor={(v) => {
                  setSelectedVisitor(v);
                  setActiveSection('live_visitors');
                }}
                onSelectConversation={(conv) => {
                  setSelectedConversationId(conv.id);
                  setActiveSection('conversations');
                }}
                onSelectLead={() => {
                  setActiveSection('leads');
                }}
              />
            )}

            {activeSection === 'live_visitors' && (
              <LiveVisitorsView
                sessions={visitorSessions}
                selectedVisitor={selectedVisitor}
                onSelectVisitor={setSelectedVisitor}
                onNavigateToConversation={(convId) => {
                  setSelectedConversationId(convId);
                  setActiveSection('conversations');
                }}
                onNavigateToLead={() => {
                  setActiveSection('leads');
                }}
              />
            )}

            {activeSection === 'activity' && (
              <ActivityStreamView
                events={visitorEvents}
                systemLogs={systemLogs}
                onRefresh={fetchOperationalData}
                isRefreshing={isRefreshing}
                onSelectVisitorByToken={(token) => {
                  const match = visitorSessions.find((s) => s.visitor_token === token);
                  if (match) setSelectedVisitor(match);
                  setActiveSection('live_visitors');
                }}
                onSelectConversation={(convId) => {
                  setSelectedConversationId(convId);
                  setActiveSection('conversations');
                }}
              />
            )}

            {activeSection === 'conversations' && (
              <ConversationsView
                conversations={conversations}
                currentUserId={user.id}
                currentUserName={user.full_name || 'Andy Watson'}
                selectedConversationId={selectedConversationId}
                onRefreshConversations={fetchOperationalData}
                onNavigateToLeads={() => setActiveSection('leads')}
              />
            )}

            {activeSection === 'leads' && (
              <LeadsView
                leads={leads}
                onRefreshLeads={fetchOperationalData}
                onNavigateToConversation={(convId) => {
                  setSelectedConversationId(convId);
                  setActiveSection('conversations');
                }}
              />
            )}

            {activeSection === 'products' && (
              <ProductsView />
            )}

            {activeSection === 'health' && (
              <SystemHealthView
                healthReport={healthReport}
                onRefreshHealth={async (forceGemini) => {
                  const rep = await runFullHealthReport(forceGemini);
                  setHealthReport(rep);
                }}
              />
            )}

            {activeSection === 'ai' && (
              <AiMonitoringView
                conversations={conversations}
                systemLogs={systemLogs}
                onTestGeminiProbe={async () => {
                  const rep = await runFullHealthReport(true);
                  setHealthReport(rep);
                }}
              />
            )}

            {activeSection === 'limits' && (
              <LimitsView
                counts={{
                  visitors: visitorSessions.length,
                  conversations: conversations.length,
                  leads: leads.length,
                  events: visitorEvents.length,
                }}
              />
            )}

            {activeSection === 'errors' && (
              <ErrorCenterView
                systemLogs={systemLogs}
                onRefresh={fetchOperationalData}
                isRefreshing={isRefreshing}
              />
            )}

            {activeSection === 'users' && (
              <div className="animate-in fade-in duration-150">
                <AdminUserManagement
                  currentUserRole={user.role}
                  currentUserId={user.id}
                />
              </div>
            )}

            {(activeSection === 'security' || activeSection === 'settings') && (
              <SecuritySettingsView />
            )}

          </div>
        </main>
      </div>

      {/* 3. Global Command Palette (⌘K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectSection={setActiveSection}
        onExitToWorld={handleReturnToSite}
        onTogglePresence={handleTogglePresence}
        isOnline={isOnlinePresence}
      />

    </div>
  );
};

export default NexusAdminPanel;
