"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

import type { Profile } from "@/types/user";
import type { UserRole } from "@/types/enums";

import { getCurrentProfile } from "@/services/userService";

/* =========================================================
   GLOBAL CACHE
   
   We cache both the profile AND the resolved auth user so
   that the Navbar can gate on `initialized` without ever
   seeing the "no user yet" flash, even across soft navigations
   where the module is NOT re-evaluated but component state is.
========================================================= */

let cachedProfile: Profile | null = null;
let cachedAuthUser: any | null = null;
let activeProfilePromise: Promise<Profile | null> | null = null;

/**
 * Whether we have completed at least one full auth resolution cycle.
 * Stored outside the component so it survives re-mounts (e.g. Strict Mode
 * double-invoke, layout re-renders) without flashing the unresolved state.
 */
let globalInitialized = false;

/* ========================================================= */

export function useUser() {
  /**
   * Seed state from module-level cache so the very first render already
   * has the right values if the hook was previously initialized in this
   * browser session (e.g. navigating between pages in the same tab).
   * This eliminates the frame where profile=null / initialized=false
   * that caused the "Get Started" flash.
   */
  const [profile, setProfile] = useState<Profile | null>(cachedProfile);
  const [authUser, setAuthUser] = useState<any | null>(cachedAuthUser);
  const [loading, setLoading] = useState(!globalInitialized);
  const [initialized, setInitialized] = useState(globalInitialized);

  const mounted = useRef(true);
  const role = profile?.role ?? null;

  /* =========================================================
     SYNCHRONOUS CACHE REHYDRATION

     useLayoutEffect runs synchronously before the browser paints,
     so if the module-level cache already has auth data (the user
     navigated to a new page and Navbar re-mounted, or a portal modal
     triggered a React tree reconciliation), we snap to the correct
     values before any pixel is drawn.

     This is the primary fix for the Navbar flicker when
     OrderFullDetailModal mounts via createPortal: the portal commit
     causes React to re-run layout effects in sibling trees. Without
     this, the Navbar's useUser instance briefly sees stale
     initialized=false / authUser=null from its useState seed,
     which makes the auth-gated UI flash to the loading state.

     We use `typeof window !== "undefined"` guard defensively, but
     since this file is "use client" it will never run on the server.
  ========================================================= */
  useLayoutEffect(() => {
    let changed = false;

    if (cachedAuthUser !== authUser) {
      setAuthUser(cachedAuthUser);
      changed = true;
    }
    if (cachedProfile !== profile) {
      setProfile(cachedProfile);
      changed = true;
    }
    if (globalInitialized && !initialized) {
      setLoading(false);
      setInitialized(true);
      changed = true;
    }

    // Suppress lint warning — we intentionally only want this on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
     HELPERS
  ========================================================= */

  /** Mark fully resolved — updates both module flag and component state. */
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

      if (mounted.current) {
        setProfile(result);
      }

      return result;
    } catch (error) {
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
  ========================================================= */

  const loadUser = useCallback(async () => {
    try {
      /**
       * Only show the loading skeleton when we have absolutely no cached
       * data. If we already know the user, keep showing them while we
       * silently verify in the background.
       */
      if (!globalInitialized) {
        setLoading(true);
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user ?? null;

      /**
       * KEY FIX: Set authUser from the session IMMEDIATELY — before the
       * profile fetch — and write to the module-level cache so any
       * concurrent render that calls useUser() also sees the right value.
       *
       * Previously authUser was only set after fetchProfile resolved, so
       * there was a window where initialized=true but authUser=null, which
       * caused the Navbar to flash "Get Started" even though the user was
       * actually logged in.
       */
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
      console.error("[useUser] loadUser error:", error);
      if (mounted.current) setProfile(null);
      markInitialized();
    }
  }, [fetchProfile, markInitialized]);

  useEffect(() => {
    /**
     * If we're already globally initialized (e.g. navigating back to a
     * page that mounts Navbar again), skip the full load — local state
     * was already seeded from cache at useState() call time.
     * Only re-run loadUser if something genuinely needs refreshing.
     */
    if (!globalInitialized) {
      loadUser();
    }
  }, [loadUser]);

  /* =========================================================
     AUTH LISTENER (SINGLE SOURCE OF TRUTH)
  ========================================================= */

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      /**
       * CRITICAL: Ignore token refresh events entirely.
       *
       * Supabase fires onAuthStateChange for EVERY auth event, including
       * TOKEN_REFRESHED which happens silently in the background whenever
       * the JWT nears expiry. This can be triggered by DOM activity (e.g.
       * opening a modal) which wakes the Supabase realtime client.
       *
       * Previously we ran setAuthUser + fetchProfile on every event, which
       * caused a re-render cycle during token refresh: the component briefly
       * saw a "loading" state mid-refresh and the Navbar flashed "Get Started".
       *
       * Fix: only act on events that genuinely change who the user is.
       * SIGNED_IN / SIGNED_OUT / USER_UPDATED are the only ones that matter.
       * TOKEN_REFRESHED, MFA_CHALLENGE_VERIFIED, PASSWORD_RECOVERY etc. leave
       * the user identity unchanged — skip them completely.
       */
      if (
        event !== "SIGNED_IN" &&
        event !== "SIGNED_OUT" &&
        event !== "USER_UPDATED"
      ) {
        return;
      }

      queueMicrotask(async () => {
        if (!mounted.current) return;

        const user = session?.user ?? null;

        // Only update state if the user identity actually changed
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
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile, markInitialized]);

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