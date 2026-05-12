import { supabase } from "@/lib/supabase";

/**
 * =========================================================
 * AUTH SERVICE (Supabase)
 * =========================================================
 */
export const authService = {
  /**
   * SIGN UP (profile created via DB trigger)
   */
  async signUp(email: string, password: string, fullName?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName ?? "",
        },
      },
    });

    if (error) throw error;

    return data;
  },

  /**
   * SIGN IN
   */
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return data;
  },

  /**
   * SIGN OUT
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;
  },

  /**
   * GET CURRENT AUTH USER
   */
  async getUser() {
    const { data, error } = await supabase.auth.getUser();

    if (error) throw error;

    return data.user;
  },

  /**
   * GET CURRENT SESSION
   */
  async getSession() {
    const { data, error } = await supabase.auth.getSession();

    if (error) throw error;

    return data.session;
  },

  /**
   * GET USER PROFILE
   * SAFE VERSION
   * - avoids .single() crash
   * - works with RLS enabled
   */
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) throw error;

    return data;
  },
};