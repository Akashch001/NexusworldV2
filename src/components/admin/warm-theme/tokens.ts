/**
 * Nexus World Admin — Warm Editorial Design Tokens & System Types
 * 
 * Palette:
 * - Background: #F5F1E8 (Warm Cream)
 * - Surface: #FBF9F4 (Warm White Paper)
 * - Secondary Surface: #EEEAE1 (Soft Taupe/Sand)
 * - Primary Text: #242321 (Deep Charcoal)
 * - Secondary Text: #716D65 (Warm Muted Grey)
 * - Border: #D9D4CA (Soft Warm Border)
 * - Live Green: #4F8A5B (Muted Natural Green)
 * - Human Request / Attention: #B56A45 (Warm Terracotta)
 * - Muted Accent: #7C766C (Warm Earth)
 */

export const ADMIN_COLORS = {
  bg: '#F5F1E8',
  surface: '#FBF9F4',
  secondarySurface: '#EEEAE1',
  textPrimary: '#242321',
  textSecondary: '#716D65',
  border: '#D9D4CA',
  liveGreen: '#4F8A5B',
  attention: '#B56A45',
  mutedAccent: '#7C766C',
  white: '#FFFFFF',
  danger: '#A83B3B',
  dangerBg: '#F9ECEC',
  successBg: '#EEF5F0',
  attentionBg: '#F8F1EC',
} as const;

export type AdminRole = 'owner' | 'super_admin' | 'admin' | 'agent' | 'user';

export type AdminSection =
  | 'overview'
  | 'visitors'
  | 'analytics'
  | 'conversations'
  | 'handoffs'
  | 'users'
  | 'settings'
  | 'audit';

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  display_name?: string | null;
  is_active?: boolean;
}

export interface VisitorSession {
  id: string;
  visitor_token: string;
  entry_url: string;
  current_url: string;
  referrer: string | null;
  device_type: 'desktop' | 'mobile' | 'tablet' | string;
  browser: string | null;
  os: string | null;
  ip_masked: string;
  country: string | null;
  city: string | null;
  region?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  timezone?: string | null;
  is_active: boolean;
  created_at: string;
  last_seen_at: string;
  event_count?: number;
}

export interface VisitorEvent {
  id: string;
  session_id: string | null;
  visitor_token: string;
  event_type: string;
  event_name: string;
  metadata: Record<string, any>;
  created_at: string;
}

export type ConversationStatus =
  | 'ai'
  | 'human_requested'
  | 'human'
  | 'closed'
  | 'availability_checking'
  | string;

export interface ConversationRecord {
  id: string;
  user_id: string | null;
  visitor_id: string | null;
  project_id?: string | null;
  title?: string;
  status: ConversationStatus;
  human_requested_at?: string | null;
  human_accepted_at?: string | null;
  assigned_to?: string | null;
  claimed_by_user_id?: string | null;
  claimed_at?: string | null;
  closed_at?: string | null;
  handoff_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SystemLogRecord {
  id: string;
  service: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  event: string;
  message: string;
  details?: Record<string, any>;
  created_at: string;
}
