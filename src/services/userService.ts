import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/user";

/* =========================
   USERS
========================= */

export async function getUsers(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*");

  if (error) throw error;
  return data ?? [];
}

export async function getUserById(id: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function updateUser(id: string, payload: Partial<Profile>) {
  const { data, error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}