import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * =========================================================
 * TYPED SUPABASE CLIENT (SINGLETON)
 * =========================================================
 */

declare global {

  var __supabase__: ReturnType<typeof createClient<Database>> | undefined;
}

export const supabase: ReturnType<typeof createClient<Database>> =
  globalThis.__supabase__ ??
  createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__supabase__ = supabase;
}