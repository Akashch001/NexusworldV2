export type CommandNavSection =
  | 'overview'
  | 'live_visitors'
  | 'activity'
  | 'leads'
  | 'conversations'
  | 'products'
  | 'health'
  | 'ai'
  | 'limits'
  | 'errors'
  | 'users'
  | 'security'
  | 'settings';

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
  is_active: boolean;
  created_at: string;
  last_seen_at: string;
  event_count?: number;
}

export interface VisitorEvent {
  id: string;
  session_id: string | null;
  visitor_token: string;
  event_type: 'navigation' | 'interaction' | 'concierge' | 'lead' | 'system' | string;
  event_name: string;
  metadata: Record<string, any>;
  created_at: string;
}

export type ConversationStatus =
  | 'ai'
  | 'human_requested'
  | 'availability_checking'
  | 'representative_available'
  | 'waiting'
  | 'retrying_availability'
  | 'next_slot_search'
  | 'human_notified'
  | 'appointment_pending'
  | 'appointment_confirmed'
  | 'no_representative_available'
  | 'follow_up_requested'
  | 'human'
  | 'closed';

export interface ConversationRecord {
  id: string;
  user_id: string | null;
  visitor_id: string | null;
  project_id: string | null;
  title: string;
  status: ConversationStatus;
  human_requested_at: string | null;
  human_accepted_at: string | null;
  assigned_to: string | null;
  representative_role?: string | null;
  retry_count?: number;
  next_retry_at?: string | null;
  handoff_reason?: string | null;
  user_timezone?: string | null;
  created_at: string;
  updated_at: string;
  latest_message?: string;
  latest_message_role?: string;
  assigned_user?: {
    id: string;
    full_name: string;
    email: string;
  };
}


export interface MessageRecord {
  id: string;
  conversation_id: string;
  user_id: string | null;
  visitor_id: string | null;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface LeadRecord {
  id: string;
  visitor_id: string | null;
  user_id: string | null;
  conversation_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  website: string | null;
  location: string | null;
  service_interest: string | null;
  project_description: string | null;
  pain_points: string | null;
  budget_range: string | null;
  timeline: string | null;
  lead_score: number;
  lead_temperature: 'cold' | 'warm' | 'hot';
  lead_status: 'new' | 'contacted' | 'qualified' | 'meeting_booked' | 'proposal' | 'won' | 'lost' | 'archived';
  source: string;
  created_at: string;
  updated_at: string;
}

export interface SystemLogRecord {
  id: string;
  service: 'application' | 'supabase_db' | 'supabase_auth' | 'realtime' | 'gemini_ai' | 'nora_core' | string;
  level: 'info' | 'warning' | 'error' | 'critical';
  event: string;
  message: string;
  details: Record<string, any>;
  created_at: string;
}

export interface CommandBadgeCounts {
  activeVisitors: number;
  waitingHandoffs: number;
  activeConversations: number;
  newLeads: number;
  criticalErrors: number;
}
