import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/user";
import type { UserRole } from "@/types/enums";

/* =========================================================
   RAW DB TYPE (Supabase result shape)
========================================================= */

type ProfileRow = {
  id: string;
  full_name: string | null;
  role: UserRole | null;
  created_at: string | null;
};

/* =========================================================
   NORMALIZER
========================================================= */
function normalizeProfile(p: ProfileRow): Profile {
  return {
    id: p.id,
    full_name: p.full_name ?? null,

    role: (p.role ?? "customer") as UserRole,

    // 🔥 FIX HERE
    created_at: p.created_at ?? "",
  };
}

/* =========================================================
   USERS
========================================================= */

export async function getUsers(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at");

  if (error) throw error;

  return (data ?? []).map(normalizeProfile);
}

/* =========================================================
   USER BY ID
========================================================= */

export async function getUserById(id: string): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at")
    .eq("id", id)
    .single();

  if (error) throw error;

  return normalizeProfile(data as ProfileRow);
}

/* =========================================================
   UPDATE USER
========================================================= */

export async function updateUser(
  id: string,
  payload: Partial<Profile>
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", id)
    .select("id, full_name, role, created_at")
    .single();

  if (error) throw error;

  return normalizeProfile(data as ProfileRow);
}

/* =========================================================
   CURRENT PROFILE
========================================================= */

export async function getCurrentProfile(userId: string): Promise<Profile> {
  return getUserById(userId);
}

/* =========================================================
   ROLE ONLY
========================================================= */

export async function getUserRole(userId: string): Promise<UserRole> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error) throw error;

  return (data?.role ?? "customer") as UserRole;
}