"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

import type { Profile } from "@/types/user";
import type { UserRole } from "@/types/enums";

import { getCurrentProfile } from "@/services/userService";

/* =========================================================
   GLOBAL CACHE
========================================================= */

let cachedProfile: Profile | null = null;
let cachedAuthUser: any | null = null;
let activeProfilePromise: Promise<Profile | null> | null = null;
let globalInitialized = false;

/**
 * In-flight getSession promise — deduplicated so Strict Mode's
 * double-invoke never races two simultaneous lock acquisitions.
 * Both invocations await the same promise; only the first one
 * actually calls supabase.auth.getSession().
 */
let activeSessionPromise: Promise<any> | null = null;

/* ========================================================= */

export function useUser() {
  const [profile, setProfile]       = useState<Profile | null>(cachedProfile);
  const [authUser, setAuthUser]     = useState<any | null>(cachedAuthUser);
  const [loading, setLoading]       = useState(!globalInitialized);
  const [initialized, setInitialized] = useState(globalInitialized);

  const mounted = useRef(true);
  const role    = profile?.role ?? null;

  /* =========================================================
     SYNCHRONOUS CACHE REHYDRATION
  ========================================================= */
  useLayoutEffect(() => {
    if (cachedAuthUser !== authUser)    setAuthUser(cachedAuthUser);
    if (cachedProfile  !== profile)     setProfile(cachedProfile);
    if (globalInitialized && !initialized) {
      setLoading(false);
      setInitialized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =========================================================
     MOUNT SAFETY
  ========================================================= */
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  /* =========================================================
     HELPERS
  ========================================================= */
  const markInitialized = useCallback(() => {
    globalInitialized = true;
    if (mounted.current) {
      setLoading(false);
      setInitialized(true);
    }
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
      if (mounted.current) setProfile(result);
      return result;
    } catch (error) {
      // Suppress Strict Mode lock-steal noise; treat as non-fatal
      if (isLockError(error)) {
        return cachedProfile;
      }
      console.error("[useUser] profile fetch error:", error);
      cachedProfile = null;
      if (mounted.current) setProfile(null);
      return null;
    } finally {
      activeProfilePromise = null;
    }
  }, []);

  /* =========================================================
     INITIAL LOAD
     
     KEY FIX: deduplicate getSession() with a module-level promise
     so Strict Mode's double-invoke shares one lock acquisition
     instead of two racing calls that trigger the 5 s timeout.
  ========================================================= */
  const loadUser = useCallback(async () => {
    try {
      if (!globalInitialized) setLoading(true);

      // Deduplicate — both Strict Mode invocations await the same promise
      if (!activeSessionPromise) {
        activeSessionPromise = supabase.auth.getSession();
      }
      const { data: { session } } = await activeSessionPromise;

      const user = session?.user ?? null;

      cachedAuthUser = user;
      if (mounted.current) setAuthUser(user);

      if (!user) {
        cachedProfile = null;
        if (mounted.current) setProfile(null);
        markInitialized();
        return;
      }

      await fetchProfile(user.id);
      markInitialized();
    } catch (error) {
      // Lock-steal errors from Strict Mode double-invoke are harmless —
      // the second invocation will complete via the shared promise above.
      if (isLockError(error)) return;
      console.error("[useUser] loadUser error:", error);
      if (mounted.current) setProfile(null);
      markInitialized();
    } finally {
      // Clear so the next genuine call (e.g. after sign-out) gets a fresh session
      activeSessionPromise = null;
    }
  }, [fetchProfile, markInitialized]);

  useEffect(() => {
    if (!globalInitialized) {
      loadUser();
    }
  }, [loadUser]);

  /* =========================================================
     AUTH LISTENER
  ========================================================= */
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Only react to identity-changing events — ignore TOKEN_REFRESHED etc.
        if (
          event !== "SIGNED_IN" &&
          event !== "SIGNED_OUT" &&
          event !== "USER_UPDATED"
        ) return;

        queueMicrotask(async () => {
          if (!mounted.current) return;

          const user = session?.user ?? null;
          const userChanged = cachedAuthUser?.id !== user?.id;
          if (!userChanged && globalInitialized) return;

          cachedAuthUser = user;
          setAuthUser(user);

          if (!user) {
            cachedProfile = null;
            setProfile(null);
            markInitialized();
            return;
          }

          await fetchProfile(user.id);
          markInitialized();
        });
      }
    );

    return () => { subscription.unsubscribe(); };
  }, [fetchProfile, markInitialized]);

  /* =========================================================
     ROLE CHECK
  ========================================================= */
  const hasRole = useCallback(
    (required: UserRole) => {
      if (!role) return false;
      const hierarchy: Record<UserRole, number> = {
        customer:    1,
        admin:       2,
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
    user:        profile,
    authUser,
    role,
    loading,
    initialized,
    isAdmin:      role === "admin" || role === "super_admin",
    isSuperAdmin: role === "super_admin",
    isCustomer:   role === "customer",
    hasRole,
    refetch:      loadUser,
  };
}

/* =========================================================
   UTILITY
========================================================= */
function isLockError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.name === "AbortError" ||
    error.message.includes("AbortError") ||
    error.message.includes("Lock") ||
    error.message.includes("lock")
  );
}