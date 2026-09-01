import { createClient } from '@supabase/supabase-js';

// Public, browser-safe client. Uses the anon key, so it's protected by the
// Row Level Security policies in supabase/schema.sql.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
