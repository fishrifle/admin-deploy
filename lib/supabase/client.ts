// lib/supabaseClient.ts
import { createClient as _createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";

export const createClient = _createClient;

// Client-side Supabase client with anonymous key for security
export const supabase = _createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
