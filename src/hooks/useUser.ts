"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

import type { Profile } from "@/types/user";
import type { UserRole } from "@/types/enums";

import { getCurrentProfile } from "@/services/userService";

/* =========================================================
   GLOBAL CACHE
========================================================= */

let cachedProfile: Profile | null = null;
let activeProfilePromise: Promise<Profile | null> | null = null;

/* ========================================================= */

export function useUser() {
  const [profile, setProfile] = useState<Profile | null>(cachedProfile);
  const [authUser, setAuthUser] = useState<any | null>(null);

  const [loading, setLoading] = useState(!cachedProfile);
  const [initialized, setInitialized] = useState(!!cachedProfile);

  const mounted = useRef(true);
  const role = profile?.role ?? null;

  /* =========================================================
     MOUNT SAFETY
  ========================================================= */

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  /* =========================================================
     SAFE PROFILE FETCH (NO DUPLICATES)
  ========================================================= */

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      if (activeProfilePromise) return activeProfilePromise;

      activeProfilePromise = getCurrentProfile(userId);

      const result = await activeProfilePromise;

      cachedProfile = result;

      if (!mounted.current) return null;

      setProfile(result);
      setLoading(false);
      setInitialized(true);

      return result;
    } catch (error) {
      console.error("[useUser] profile fetch error:", error);

      cachedProfile = null;

      if (mounted.current) {
        setProfile(null);
        setLoading(false);
        setInitialized(true);
      }

      return null;
    } finally {
      activeProfilePromise = null;
    }
  }, []);

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  const loadUser = useCallback(async () => {
    try {
      // Don't flash loading skeleton if we already have cached data
      if (!cachedProfile) {
        setLoading(true);
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user ?? null;
      setAuthUser(user);

      if (!user) {
        cachedProfile = null;

        if (mounted.current) {
          setProfile(null);
          setLoading(false);
          setInitialized(true);
        }

        return;
      }

      await fetchProfile(user.id);
    } catch (error) {
      console.error("[useUser] loadUser error:", error);

      if (mounted.current) {
        setProfile(null);
        setLoading(false);
        setInitialized(true);
      }
    }
  }, [fetchProfile]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  /* =========================================================
     AUTH LISTENER (SINGLE SOURCE OF TRUTH)
  ========================================================= */

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      queueMicrotask(async () => {
        if (!mounted.current) return;

        const user = session?.user ?? null;
        setAuthUser(user);

        if (!user) {
          cachedProfile = null;

          setProfile(null);
          setLoading(false);
          setInitialized(true);

          return;
        }

        await fetchProfile(user.id);
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  /* =========================================================
     ROLE CHECK
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

  /* =========================================================
     API
  ========================================================= */

  return {
    user: profile,
    authUser,
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