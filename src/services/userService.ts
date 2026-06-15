import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/user";
import type { UserRole } from "@/types/enums";

/* =========================================================
   RAW DB TYPE (Supabase result shape)
========================================================= */

type ProfileRow = {
  id: string;
  first_name: string | null;
  middle_initial: string | null;
  last_name: string | null;
  role: UserRole | null;
  created_at: string | null;
};

/* =========================================================
   NORMALIZER
========================================================= */
function normalizeProfile(p: ProfileRow): Profile {
  return {
    id: p.id,
    first_name: p.first_name ?? null,
    middle_initial: p.middle_initial ?? null,
    last_name: p.last_name ?? null,
    role: (p.role ?? "customer") as UserRole,
    created_at: p.created_at ?? "",
  };
}

/* =========================================================
   USERS
========================================================= */

export async function getUsers(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, middle_initial, last_name, role, created_at");

  if (error) throw error;

  return (data as ProfileRow[] ?? []).map(normalizeProfile);
}

/* =========================================================
   USER BY ID
========================================================= */

export async function getUserById(id: string): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, middle_initial, last_name, role, created_at")
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
  // Map frontend profile payload keys back to the DB profile columns if needed
  const dbPayload = {
    ...(payload.first_name !== undefined && { first_name: payload.first_name }),
    ...(payload.middle_initial !== undefined && { middle_initial: payload.middle_initial }),
    ...(payload.last_name !== undefined && { last_name: payload.last_name }),
    ...(payload.role !== undefined && { role: payload.role }),
  };

  const { data, error } = await supabase
    .from("profiles")
    .update(dbPayload)
    .eq("id", id)
    .select("id, first_name, middle_initial, last_name, role, created_at")
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