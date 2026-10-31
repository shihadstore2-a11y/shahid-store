// Supabase Browser & SSR Client using @supabase/ssr
// Manages sessions and auth tokens in secure cookies automatically.
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

const ACTIVE_SUPABASE_URL = "https://umozikpkfmjkcglizysd.supabase.co";
const ACTIVE_SUPABASE_KEY = "sb_publishable_zV1Bzk0vQwm6wSa1YyWzBg_G4Z0ivGb";

function createSupabaseClient() {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ACTIVE_SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || ACTIVE_SUPABASE_KEY;

  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});
