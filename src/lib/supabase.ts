import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * =========================================================
 * TYPED SUPABASE CLIENT (SINGLETON)
 * =========================================================
 */

declare global {
  // Use explicit SupabaseClient type definition instead of ReturnType
  var __supabase__: SupabaseClient<Database> | undefined;
}

export const supabase: SupabaseClient<Database> =
  globalThis.__supabase__ ??
  createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // Bypassing top-level types so the internal GoTrue library receives these config settings smoothly
      ...({
        lockType: "custom",
        acquireTimeout: 1500,
      } as any),
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__supabase__ = supabase;
}