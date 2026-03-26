import { createClient } from '@supabase/supabase-js'

// DEBUG: Log which Supabase URL is being used at startup
// If this prints "undefined", your .env file is missing or not loaded
console.log(" USING SUPABASE URL:", import.meta.env.VITE_SUPABASE_URL)

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
