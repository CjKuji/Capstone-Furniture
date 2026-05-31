import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

/**
 * Server-only Supabase client using the service role key.
 * Use this ONLY in API routes and server components.
 * Never import this in client components — it exposes the service role key.
 */
export function createServerClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}