"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

import type { Profile } from "@/types/user";
import type { UserRole } from "@/types/enums";
import { getCurrentProfile } from "@/services/userService";

/* =========================================================
   CACHE
========================================================= */

let cachedUser: Profile | null = null;
let cachedRole: UserRole | null = null;
let cacheTimestamp = 0;

const CACHE_TTL = 1000 * 60 * 5;

/* ========================================================= */

export function useUser() {
  const [user, setUser] = useState<Profile | null>(cachedUser);
  const [loading, setLoading] = useState(!cachedUser);
  const [initialized, setInitialized] = useState(!!cachedUser);

  const role = user?.role ?? cachedRole ?? null;

  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const safeSet = useCallback((fn: () => void) => {
    if (mountedRef.current) fn();
  }, []);

  const fetchUser = useCallback(async (force = false) => {
    const requestId = ++requestIdRef.current;
    const now = Date.now();

    // ✅ valid cache
    if (!force && cachedUser && now - cacheTimestamp < CACHE_TTL) {
      safeSet(() => {
        setUser(cachedUser);
        setLoading(false);
        setInitialized(true);
      });
      return;
    }

    safeSet(() => setLoading(true));

    try {
      const {
        data: { user: authUser },
        error,
      } = await supabase.auth.getUser();

      // ❗ IMPORTANT FIX:
      // only clear cache if request is still valid
      if (error || !authUser || requestId !== requestIdRef.current) {
        if (requestId === requestIdRef.current) {
          cachedUser = null;
          cachedRole = null;
          cacheTimestamp = Date.now();
        }

        safeSet(() => setUser(null));
        return;
      }

      const profile = await getCurrentProfile(authUser.id);

      if (!mountedRef.current || requestId !== requestIdRef.current) return;

      cachedUser = profile;
      cachedRole = profile.role;
      cacheTimestamp = Date.now();

      safeSet(() => setUser(profile));
    } catch (e) {
      console.error("useUser fetch failed:", e);

      if (requestId === requestIdRef.current) {
        cachedUser = null;
        cachedRole = null;
        cacheTimestamp = Date.now();
      }

      safeSet(() => setUser(null));
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        safeSet(() => {
          setLoading(false);
          setInitialized(true);
        });
      }
    }
  }, [safeSet]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const clearCache = useCallback(() => {
    cachedUser = null;
    cachedRole = null;
    cacheTimestamp = 0;

    safeSet(() => {
      setUser(null);
      setLoading(false);
      setInitialized(true);
    });
  }, [safeSet]);

  const hasRole = useCallback((required: UserRole) => {
    if (!role) return false;

    const hierarchy: Record<UserRole, number> = {
      customer: 1,
      admin: 2,
      super_admin: 3,
    };

    return hierarchy[role] >= hierarchy[required];
  }, [role]);

  return {
    user,
    role,
    loading,
    initialized,

    isAdmin: role === "admin" || role === "super_admin",
    isSuperAdmin: role === "super_admin",
    isCustomer: role === "customer",

    hasRole,

    refetch: () => fetchUser(true),
    clearCache,
  };
}