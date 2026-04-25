"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

import type { Profile } from "@/types/user";
import type { UserRole } from "@/types/enums";

import {
  getCurrentProfile,
} from "@/services/userService";

/* =========================================================
   GLOBAL USER HOOK
========================================================= */

export function useUser() {
  const [user, setUser] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);

  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const requestId = useRef(0);

  /* =========================================================
     FETCH USER (RACE SAFE)
  ========================================================= */

  const fetchUser = useCallback(async () => {
    const id = ++requestId.current;

    setLoading(true);

    try {
      // 1. Auth session ONLY (no DB logic here)
      const { data: auth, error: authError } =
        await supabase.auth.getUser();

      if (authError || !auth?.user) {
        setUser(null);
        setRole(null);
        return;
      }

      // 2. Profile fetch goes through SERVICE (clean separation)
      const profile = await getCurrentProfile(auth.user.id);

      if (requestId.current !== id) return;

      setUser(profile);
      setRole(profile.role);
    } catch (err) {
      setUser(null);
      setRole(null);
    } finally {
      if (requestId.current === id) {
        setLoading(false);
        setInitialized(true);
      }
    }
  }, []);

  /* =========================================================
     INIT
  ========================================================= */

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  /* =========================================================
     ROLE HELPERS
  ========================================================= */

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

  const isAdmin = role === "admin" || role === "super_admin";
  const isSuperAdmin = role === "super_admin";
  const isCustomer = role === "customer";

  /* ========================================================= */

  return {
    user,
    role,

    loading,
    initialized,

    isAdmin,
    isSuperAdmin,
    isCustomer,

    hasRole,

    refetch: fetchUser,
  };
}