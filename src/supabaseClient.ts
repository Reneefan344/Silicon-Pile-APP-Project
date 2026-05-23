/// <reference types="vite/client" />
import { createClient } from "@supabase/supabase-js";

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials not configured. Check your .env.local file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Stateless client that never persists session — always uses anon key.
// Used for unauthenticated queries (e.g., phone lookup during login).
export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
