import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import type {
  VisitorSession,
  VisitorEvent,
  ConversationRecord,
  SystemLogRecord,
  AdminSection,
  AdminUser,
} from './warm-theme/tokens';
import { AdminLayout } from './layout/AdminLayout';
import { OverviewView } from './overview/OverviewView';
import { LiveVisitorsView } from './visitors/LiveVisitorsView';
import { AnalyticsView } from './analytics/AnalyticsView';
import { ConversationsView } from './conversations/ConversationsView';
import { UsersView } from './team/UsersView';
import { SettingsView } from './settings/SettingsView';
import { AuditLogView } from './audit/AuditLogView';

interface NexusAdminPanelProps {
  user: {
    id: string;
    email: string;
    full_name: string;
    role: string;
  };
  onExit?: () => void;
}

// Map URL pathname or hash to AdminSection
function resolveInitialSection(): AdminSection {
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();

  if (path.includes('/visitors') || hash.includes('/visitors')) return 'visitors';
  if (path.includes('/analytics') || hash.includes('/analytics')) return 'analytics';
  if (path.includes('/conversations') || hash.includes('/conversations')) return 'conversations';
  if (path.includes('/handoffs') || hash.includes('/handoffs')) return 'handoffs';
  if (path.includes('/users') || hash.includes('/users')) return 'users';
  if (path.includes('/settings') || hash.includes('/settings')) return 'settings';
  if (path.includes('/audit') || hash.includes('/audit')) return 'audit';
  return 'overview';
}

export const NexusAdminPanel: React.FC<NexusAdminPanelProps> = ({ user, onExit }) => {
  // Navigation State
  const [currentSection, setCurrentSection] = useState<AdminSection>(resolveInitialSection);

  // Operational Datasets
  const [visitorSessions, setVisitorSessions] = useState<VisitorSession[]>([]);
  const [visitorEvents, setVisitorEvents] = useState<VisitorEvent[]>([]);
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLogRecord[]>([]);

  // Agent Presence
  const [isOnlinePresence, setIsOnlinePresence] = useState<boolean>(true);

  // Deep Navigation State
  const [targetedConversationId, setTargetedConversationId] = useState<string | undefined>();
  const [targetedVisitor, setTargetedVisitor] = useState<VisitorSession | null>(null);

  // Sync navigation with browser URL
  const handleNavigate = useCallback((section: AdminSection) => {
    setCurrentSection(section);
    const targetUrl = section === 'overview' ? '/admin' : `/admin/${section}`;
    if (window.location.pathname.startsWith('/admin')) {
      window.history.pushState(null, '', targetUrl);
    } else {
      window.location.hash = `#/${section}`;
    }
  }, []);

  // Listen to popstate (browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentSection(resolveInitialSection());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Fetch Agent Presence
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

  // Toggle Agent Presence
  const handleTogglePresence = async () => {
    const nextState = !isOnlinePresence;
    setIsOnlinePresence(nextState);

    try {
      await supabase
        .from('profiles')
        .update({ is_online: nextState })
        .eq('id', user.id);

      await supabase.from('system_logs').insert({
        service: 'application',
        level: 'info',
        event: 'admin_presence_toggle',
        message: `Agent ${user.full_name || user.email} presence set to ${nextState ? 'ONLINE' : 'AWAY'}`,
        details: { agent_id: user.id, is_online: nextState },
      });
    } catch {
      setIsOnlinePresence(!nextState);
    }
  };

  // Fetch all real operational datasets
  const fetchOperationalData = useCallback(async () => {
    try {
      const [sessionsRes, eventsRes, convRes, logsRes] = await Promise.all([
        supabase
          .from('visitor_sessions')
          .select('*')
          .order('last_seen_at', { ascending: false })
          .limit(200),
        supabase
          .from('visitor_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200),
        supabase
          .from('conversations')
          .select('*')
          .order('updated_at', { ascending: false })
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
      if (logsRes.data) setSystemLogs(logsRes.data as SystemLogRecord[]);
    } catch {
      // Graceful error state
    }
  }, []);

  // Initial Load & Realtime Subscriptions
  useEffect(() => {
    fetchPresence();
    fetchOperationalData();

    // Central Realtime Channel
    const realtimeChannel = supabase
      .channel('nexus_admin_realtime_hub')
      // 1. Visitor Sessions
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'visitor_sessions' },
        (payload) => {
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
          setVisitorEvents((prev) => [payload.new as VisitorEvent, ...prev.slice(0, 199)]);
        }
      )
      // 3. Conversations
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setConversations((prev) => [payload.new as ConversationRecord, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setConversations((prev) =>
              prev.map((c) => (c.id === payload.new.id ? (payload.new as ConversationRecord) : c))
            );
          } else if (payload.eventType === 'DELETE') {
            setConversations((prev) => prev.filter((c) => c.id !== payload.old.id));
          }
        }
      )
      // 4. System Logs
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'system_logs' },
        (payload) => {
          setSystemLogs((prev) => [payload.new as SystemLogRecord, ...prev.slice(0, 99)]);
        }
      )
      .subscribe();

    return () => {
      realtimeChannel.unsubscribe();
    };
  }, [fetchPresence, fetchOperationalData]);

  // Derived live indicators
  const liveVisitorsCount = useMemo(() => {
    const now = Date.now();
    return visitorSessions.filter(
      (s) => s.is_active && now - new Date(s.last_seen_at).getTime() < 90000
    ).length;
  }, [visitorSessions]);

  const pendingHandoffsCount = useMemo(() => {
    return conversations.filter((c) => c.status === 'human_requested').length;
  }, [conversations]);

  const handleOpenConversation = (conversationId: string) => {
    setTargetedConversationId(conversationId);
    handleNavigate('conversations');
  };

  const handleSelectVisitor = (visitor: VisitorSession) => {
    setTargetedVisitor(visitor);
    handleNavigate('visitors');
  };

  return (
    <AdminLayout
      currentSection={currentSection}
      onNavigate={handleNavigate}
      user={user as AdminUser}
      liveVisitorsCount={liveVisitorsCount}
      pendingHandoffsCount={pendingHandoffsCount}
      isOnline={isOnlinePresence}
      onTogglePresence={handleTogglePresence}
      onExit={onExit}
    >
      {/* View Switcher */}
      {currentSection === 'overview' && (
        <OverviewView
          sessions={visitorSessions}
          conversations={conversations}
          onNavigate={handleNavigate}
          onSelectVisitor={handleSelectVisitor}
          onOpenConversation={handleOpenConversation}
        />
      )}

      {currentSection === 'visitors' && (
        <LiveVisitorsView
          sessions={visitorSessions}
          conversations={conversations}
          initialSelectedVisitor={targetedVisitor}
          onOpenConversation={handleOpenConversation}
        />
      )}

      {currentSection === 'analytics' && (
        <AnalyticsView
          sessions={visitorSessions}
          events={visitorEvents}
        />
      )}

      {currentSection === 'conversations' && (
        <ConversationsView
          conversations={conversations}
          sessions={visitorSessions}
          currentUser={user as AdminUser}
          initialSelectedId={targetedConversationId}
          onRefresh={fetchOperationalData}
        />
      )}

      {currentSection === 'handoffs' && (
        <ConversationsView
          conversations={conversations}
          sessions={visitorSessions}
          currentUser={user as AdminUser}
          initialSelectedId={targetedConversationId}
          defaultFilter="handoffs"
          onRefresh={fetchOperationalData}
        />
      )}

      {currentSection === 'users' && (
        <UsersView currentUser={user as AdminUser} />
      )}

      {currentSection === 'settings' && (
        <SettingsView currentUser={user as AdminUser} />
      )}

      {currentSection === 'audit' && (
        <AuditLogView logs={systemLogs} onRefresh={fetchOperationalData} />
      )}
    </AdminLayout>
  );
};

export default NexusAdminPanel;
