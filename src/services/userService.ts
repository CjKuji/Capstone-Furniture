import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/user";
import type { UserRole } from "@/types/enums";

/* =========================================================
   USERS
========================================================= */

export async function getUsers(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*");

  if (error) throw error;
  return data ?? [];
}

export async function getUserById(id: string): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function updateUser(
  id: string,
  payload: Partial<Profile>
) {
  const { data, error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/* =========================================================
   AUTH HELPERS
========================================================= */

export async function getCurrentProfile(userId: string): Promise<Profile> {
  return getUserById(userId);
}

export async function getUserRole(userId: string): Promise<UserRole> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error) throw error;

  return data.role;
}