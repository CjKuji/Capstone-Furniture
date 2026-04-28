"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

import type { Profile } from "@/types/user";
import type { UserRole } from "@/types/enums";
import { getCurrentProfile } from "@/services/userService";

/* ========================================================= */

export function useUser() {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const mounted = useRef(true);

  const role = user?.role ?? null;

  /* ========================================================= */

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  /* =========================================================
     CORE FIX: SESSION RESTORE (IMPORTANT)
  ========================================================= */

  const loadUser = useCallback(async () => {
    try {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        if (!mounted.current) return;

        setUser(null);
        setLoading(false);
        setInitialized(true);
        return;
      }

      const profile = await getCurrentProfile(session.user.id);

      if (!mounted.current) return;

      setUser(profile);
    } catch (e) {
      console.error("[useUser] loadUser error:", e);

      if (!mounted.current) return;

      setUser(null);
    } finally {
      if (!mounted.current) return;

      setLoading(false);
      setInitialized(true);
    }
  }, []);

  /* =========================================================
     FIX: AUTH LISTENER (CRITICAL MISSING PIECE)
  ========================================================= */

  useEffect(() => {
    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted.current) return;

      if (!session?.user) {
        setUser(null);
        setLoading(false);
        setInitialized(true);
        return;
      }

      const profile = await getCurrentProfile(session.user.id);

      if (!mounted.current) return;

      setUser(profile);
      setLoading(false);
      setInitialized(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadUser]);

  /* ========================================================= */

  const hasRole = useCallback(
    (required: UserRole) => {
      if (!role) return false;

      const hierarchy: Record<UserRole, number> = {
        customer: 1,
        admin: 2,
        super_admin: 3,
      };

      return hierarchy[role] >= hierarchy[required];
    },
    [role]
  );

  /* ========================================================= */

  return {
    user,
    role,
    loading,
    initialized,

    isAdmin: role === "admin" || role === "super_admin",
    isSuperAdmin: role === "super_admin",
    isCustomer: role === "customer",

    hasRole,

    refetch: loadUser,
  };
}