import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 🛠️ RUNTIME GUARD: This satisfies TypeScript by verifying they aren't null or undefined
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "CRITICAL: Missing Supabase environment variables. Check your server .env configuration."
  );
}

declare global {
  var __supabase_admin__: ReturnType<typeof createClient<Database>> | undefined;
}

/**
 * =========================================================
 * ADMINISTRATIVE SUPABASE CLIENT (SERVER-ONLY SINGLETON)
 * =========================================================
 * This client completely bypasses RLS policies. 
 * NEVER import this file into client-side code / React components.
 */
export const supabaseAdmin: ReturnType<typeof createClient<Database>> =
  globalThis.__supabase_admin__ ??
  createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__supabase_admin__ = supabaseAdmin;
}