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
let activeSessionPromise: Promise<any> | null = null;

type Subscriber = {
  setAuthUser: (u: any) => void;
  setProfile: (p: Profile | null) => void;
  setLoading: (l: boolean) => void;
  setInitialized: (i: boolean) => void;
};
const subscribers = new Set<Subscriber>();

function notifyAll() {
  for (const sub of subscribers) {
    sub.setAuthUser(cachedAuthUser);
    sub.setProfile(cachedProfile);
    sub.setLoading(false);
    sub.setInitialized(true);
  }
}

/* =========================================================
   EXPORTED CACHE PRIMER
   -------------------------------------------------------
   Call this from the login page BEFORE router.push().

   CRITICAL: must set BOTH cachedAuthUser AND cachedProfile.
   The Navbar renders based on `authUser` — if only
   cachedProfile is written, authUser stays null and the
   Navbar shows the logged-out state.

   Usage in login page:
     const { user } = await authService.signIn(email, password);
     await primeUserCache(user);   ← pass the full auth user object
     router.push("/");
========================================================= */
export async function primeUserCache(authUser: any): Promise<void> {
  if (!authUser) return;

  try {
    // Write the auth user immediately so the Navbar sees it
    // synchronously via useLayoutEffect on the next page mount.
    cachedAuthUser = authUser;

    if (activeProfilePromise) {
      await activeProfilePromise;
    } else {
      activeProfilePromise = getCurrentProfile(authUser.id);
      const profile = await activeProfilePromise;
      cachedProfile = profile;
    }

    globalInitialized = true;
    notifyAll();
  } catch {
    // Profile fetch failed — auth user is still set so the
    // Navbar will at least show the logged-in avatar.
    globalInitialized = true;
    notifyAll();
  } finally {
    activeProfilePromise = null;
  }
}

/* =========================================================
   HOOK
========================================================= */

export function useUser() {
  const [profile, setProfile]         = useState<Profile | null>(cachedProfile);
  const [authUser, setAuthUser]       = useState<any | null>(cachedAuthUser);
  const [loading, setLoading]         = useState(!globalInitialized);
  const [initialized, setInitialized] = useState(globalInitialized);

  const mounted = useRef(true);
  const role    = profile?.role ?? null;

  /* =========================================================
     SYNCHRONOUS CACHE REHYDRATION
     Runs before paint. If primeUserCache() ran before
     router.push(), both authUser and profile are already
     populated here — no async round-trip, no flash.
  ========================================================= */
  useLayoutEffect(() => {
    if (cachedAuthUser !== authUser)   setAuthUser(cachedAuthUser);
    if (cachedProfile  !== profile)    setProfile(cachedProfile);
    if (globalInitialized && !initialized) {
      setLoading(false);
      setInitialized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =========================================================
     SUBSCRIBER REGISTRATION
  ========================================================= */
  useEffect(() => {
    mounted.current = true;

    const sub: Subscriber = {
      setAuthUser: (u) => { if (mounted.current) setAuthUser(u); },
      setProfile:  (p) => { if (mounted.current) setProfile(p); },
      setLoading:  (l) => { if (mounted.current) setLoading(l); },
      setInitialized: (i) => { if (mounted.current) setInitialized(i); },
    };
    subscribers.add(sub);

    if (globalInitialized) {
      sub.setAuthUser(cachedAuthUser);
      sub.setProfile(cachedProfile);
      sub.setLoading(false);
      sub.setInitialized(true);
    }

    return () => {
      mounted.current = false;
      subscribers.delete(sub);
    };
  }, []);

  /* =========================================================
     HELPERS
  ========================================================= */
  const markInitialized = useCallback(() => {
    globalInitialized = true;
    notifyAll();
  }, []);

  /* =========================================================
     SAFE PROFILE FETCH
  ========================================================= */
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      if (activeProfilePromise) return activeProfilePromise;

      activeProfilePromise = getCurrentProfile(userId);
      const result = await activeProfilePromise;

      cachedProfile = result;
      for (const sub of subscribers) sub.setProfile(result);
      return result;
    } catch (error) {
      if (isLockError(error)) return cachedProfile;
      console.error("[useUser] profile fetch error:", error);
      cachedProfile = null;
      for (const sub of subscribers) sub.setProfile(null);
      return null;
    } finally {
      activeProfilePromise = null;
    }
  }, []);

  /* =========================================================
     INITIAL LOAD
     Only runs when globalInitialized is still false (first
     ever mount, e.g. hard refresh). Skipped entirely after
     a successful primeUserCache() call.
  ========================================================= */
  const loadUser = useCallback(async () => {
    try {
      if (!globalInitialized) {
        for (const sub of subscribers) sub.setLoading(true);
      }

      if (!activeSessionPromise) {
        activeSessionPromise = supabase.auth.getSession();
      }
      const { data: { session } } = await activeSessionPromise;

      const user = session?.user ?? null;

      cachedAuthUser = user;
      for (const sub of subscribers) sub.setAuthUser(user);

      if (!user) {
        cachedProfile = null;
        for (const sub of subscribers) sub.setProfile(null);
        markInitialized();
        return;
      }

      await fetchProfile(user.id);
      markInitialized();
    } catch (error) {
      if (isLockError(error)) return;
      console.error("[useUser] loadUser error:", error);
      for (const sub of subscribers) sub.setProfile(null);
      markInitialized();
    } finally {
      activeSessionPromise = null;
    }
  }, [fetchProfile, markInitialized]);

  useEffect(() => {
    if (!globalInitialized) {
      loadUser();
    }
  }, [loadUser]);

  /* =========================================================
     AUTH STATE LISTENER
  ========================================================= */
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (
          event !== "SIGNED_IN" &&
          event !== "SIGNED_OUT" &&
          event !== "USER_UPDATED"
        ) return;

        queueMicrotask(async () => {
          const user = session?.user ?? null;

          cachedAuthUser = user;
          for (const sub of subscribers) setAuthUser(user);

          if (!user) {
            cachedProfile = null;
            for (const sub of subscribers) sub.setProfile(null);
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

  return {
    user:         profile, // Returns database profile record maps
    authUser,              // Returns internal raw Supabase Auth object context
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