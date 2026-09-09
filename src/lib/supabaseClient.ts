import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// If credentials are missing, we log a warning. In a real app we might throw,
// but for the visual mockup fallback we allow initialization to fail gracefully.
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Nexus Intelligence backend features will be disabled.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
