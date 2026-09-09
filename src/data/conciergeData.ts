export type ConciergeVisualState =
  | 'IDLE'        // Subtle resting pixel matrix
  | 'OBSERVING'   // Passive awareness during world exploration
  | 'LISTENING'   // Focused aperture responding to user input
  | 'THINKING'    // Internal signal processing cycle
  | 'RESPONDING'  // Waveform signal emissions in electric blue (#2563EB)
  | 'SUCCESS'     // Affirmative geometric lock in signal lime (#D7FF3F)
  | 'BOOKING'     // Focused scheduling nexus
  | 'ERROR'       // Subtle amber warning jitter
  | 'OFFLINE';    // Low-energy standby state

export type ProgressiveIntentStage =
  | 'EXPLORING'             // General browsing / asking questions
  | 'PROJECT_INQUIRY'       // Specific product idea or problem identified
  | 'QUALIFIED'             // Scope aligns with Nexus capabilities
  | 'CONSULTATION_OFFERED'  // AI offers alignment roadmap call with Andy
  | 'BOOKING_ENGAGED'       // Visitor accepted; calendar unlocked
  | 'CONFIRMED';            // Meeting confirmed & project brief compiled

export interface ContactInfo {
  fullName: string;
  email: string;
  phoneNumber: string; // Explicit Phone Number
}

export type BusinessType =
  | 'Startup'
  | 'SaaS'
  | 'Technology'
  | 'E-commerce'
  | 'Agency'
  | 'Local'
  | 'Enterprise'
  | 'Creator'
  | 'Other'
  | 'Unknown';

export interface BusinessInfo {
  companyName: string; // Explicit Company Name
  businessType: BusinessType;
}

export interface DigitalPresence {
  hasWebsite: 'Yes' | 'No' | 'Unknown';
  websiteUrl: string;
  hasApp: 'Yes' | 'No' | 'Unknown';
  appPlatform: string;
}

export type ProjectTimeline =
  | 'ASAP'
  | 'This month'
  | '1–3 months'
  | '3–6 months'
  | 'Exploring'
  | 'Not decided';

export interface ProjectScope {
  need: string;
  problem: string;
  desiredOutcome: string;
  services: string[];
  timeline: ProjectTimeline;
  budget: string; // Optional
}

export interface ProjectIntelligence {
  contact: ContactInfo;
  business: BusinessInfo;
  digital: DigitalPresence;
  project: ProjectScope;
  intent: ProgressiveIntentStage;
  lastUpdatedField?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user' | 'system';
  text: string;
  timestamp: string;
  suggestions?: string[];
  intentBadge?: ProgressiveIntentStage;
  isSnapshot?: boolean;
}

export interface MockTimeSlot {
  id: string;
  day: string;
  date: string;
  time: string;
}

export const INITIAL_INTELLIGENCE: ProjectIntelligence = {
  contact: {
    fullName: '',
    email: '',
    phoneNumber: '',
  },
  business: {
    companyName: '',
    businessType: 'Unknown',
  },
  digital: {
    hasWebsite: 'Unknown',
    websiteUrl: '',
    hasApp: 'Unknown',
    appPlatform: '',
  },
  project: {
    need: '',
    problem: '',
    desiredOutcome: '',
    services: [],
    timeline: 'Not decided',
    budget: '',
  },
  intent: 'EXPLORING',
};

export const MOCK_CALENDAR_SLOTS: MockTimeSlot[] = [
  { id: 's1', day: 'Tuesday', date: 'Next Tuesday (Sep 15)', time: '10:00 AM EST' },
  { id: 's2', day: 'Tuesday', date: 'Next Tuesday (Sep 15)', time: '02:30 PM EST' },
  { id: 's3', day: 'Tuesday', date: 'Next Tuesday (Sep 15)', time: '05:00 PM EST' },
  { id: 's4', day: 'Wednesday', date: 'Next Wednesday (Sep 16)', time: '11:00 AM EST' },
  { id: 's5', day: 'Wednesday', date: 'Next Wednesday (Sep 16)', time: '03:00 PM EST' },
  { id: 's6', day: 'Thursday', date: 'Next Thursday (Sep 17)', time: '01:30 PM EST' },
  { id: 's7', day: 'Thursday', date: 'Next Thursday (Sep 17)', time: '04:30 PM EST' },
];

/**
 * Calculates how many core project signals have been identified
 */
export function calculateIntelligenceCompletion(data: ProjectIntelligence): {
  capturedCount: number;
  totalCount: number;
  percentage: number;
  missingFields: string[];
} {
  const checks = [
    { label: 'Name', valid: !!data.contact.fullName.trim() },
    { label: 'Email', valid: !!data.contact.email.trim() },
    { label: 'Phone', valid: !!data.contact.phoneNumber.trim(), optional: true },
    { label: 'Company Name', valid: !!data.business.companyName.trim() },
    { label: 'Business Type', valid: data.business.businessType !== 'Unknown' },
    { label: 'Website Status', valid: data.digital.hasWebsite !== 'Unknown' },
    { label: 'App Status', valid: data.digital.hasApp !== 'Unknown' },
    { label: 'Project Goal / Need', valid: !!data.project.need.trim() },
    { label: 'Problem / Friction', valid: !!data.project.problem.trim() },
    { label: 'Services', valid: data.project.services.length > 0 },
    { label: 'Timeline', valid: data.project.timeline !== 'Not decided' },
  ];

  const requiredChecks = checks.filter(c => !c.optional);
  const capturedCount = requiredChecks.filter(c => c.valid).length;
  const missingFields = requiredChecks.filter(c => !c.valid).map(c => c.label);
  const percentage = Math.round((capturedCount / requiredChecks.length) * 100);

  return {
    capturedCount,
    totalCount: requiredChecks.length,
    percentage,
    missingFields,
  };
}

export type NexusCharacter = 'NEX' | 'NOVA' | 'NEO' | 'NORA';

export interface NexusCharacterDefinition {
  id: NexusCharacter;
  name: string;
  role: string;
  tagline: string;
  personality: string;
  description: string;
  accentColor: string;
  visualStyle: string;
}

export const NEXUS_CHARACTERS: Record<NexusCharacter, NexusCharacterDefinition> = {
  NEX: {
    id: 'NEX',
    name: 'NEX',
    role: 'STRATEGY',
    tagline: 'Business Discovery & Strategic Direction',
    personality: 'Precise, Strategic, Calm, Direct, Analytical',
    description: "Helps define what should be built, identifies actual business friction, and aligns roadmap viability.",
    accentColor: '#3B82F6', // Crisp Sapphire
    visualStyle: 'Structured, geometric, navigation-oriented signal mapping',
  },
  NOVA: {
    id: 'NOVA',
    name: 'NOVA',
    role: 'DESIGN',
    tagline: 'Product Experience & Visual Systems',
    personality: 'Creative, Curious, Visual, Refined, Expressive',
    description: "Guides UI/UX thinking, brand language, interaction design, and design token architectures.",
    accentColor: '#8B5CF6', // Refined Violet
    visualStyle: 'Fluid, organic pixel movement, light expansion',
  },
  NEO: {
    id: 'NEO',
    name: 'NEO',
    role: 'TECHNOLOGY',
    tagline: 'Engineering & Frontend Architecture',
    personality: 'Technical, Reliable, Efficient, Logical, Engineering-focused',
    description: "Assesses frontend feasibility, performance budgets, stack integrations, and resilient implementation.",
    accentColor: '#06B6D4', // Electric Cyan
    visualStyle: 'Structured signal grids, fast controlled pulses, technical telemetry',
  },
  NORA: {
    id: 'NORA',
    name: 'NORA',
    role: 'INTELLIGENCE',
    tagline: 'Conversational Coordinator & Synthesis',
    personality: 'Human, Intelligent, Warm, Clear, Professional',
    description: "Central interface coordinating natural dialogue, qualifying project intent, and orchestrating consultations.",
    accentColor: '#2563EB', // Core Signal Blue
    visualStyle: 'Adaptive, responsive, balanced central coordination signal',
  },
};

