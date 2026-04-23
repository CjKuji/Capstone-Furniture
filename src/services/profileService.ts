import { supabase } from "@/lib/supabase";

/* =========================================================
   PROFILE
   ========================================================= */

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw error;

  return data;
}

/* =========================================================
   ROLE
   ========================================================= */

export async function getUserRole(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("role") // ✅ FIXED (was user_role)
    .eq("id", userId)
    .single();

  if (error) {
    console.error("getUserRole error:", error);
    return null;
  }

  return data?.role ?? null;
}