import { createClient } from '@supabase/supabase-js';

const globalProcess = (globalThis as unknown as { process?: { env?: Record<string, string> } }).process;
const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) || globalProcess?.env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://eartedmosimwcqqbgbth.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_placeholder';



// If credentials are missing, we log a warning. In a real app we might throw,
// but for the visual mockup fallback we allow initialization to fail gracefully.
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Nexus Intelligence backend features will be disabled.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
