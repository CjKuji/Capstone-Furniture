"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import AdminSidebar from "@/app/components/AdminSidebar";

import type { Profile } from "@/types/user";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  // Initialize the central QueryClient instance inside a state wrapper 
  // to ensure it persists cleanly across client re-renders.
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 10, // Global baseline: Consider data fresh for 10 seconds
        refetchOnWindowFocus: true, // Automatically re-sync active views when returning to the tab
      },
    },
  }));

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        /* =========================================================
           STEP 1: AUTH USER
        ========================================================= */

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.replace("/auth/login");
          return;
        }

        /* =========================================================
           STEP 2: FETCH PROFILE
        ========================================================= */

        const { data: profileData, error: profileError } =
          await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

        if (profileError || !profileData) {
          router.replace("/auth/login");
          return;
        }

        /* =========================================================
           STEP 3: SAFE ROLE NORMALIZATION
        ========================================================= */

        const normalizedProfile: Profile = {
          ...profileData,
          role: profileData.role ?? "customer",
          created_at: profileData.created_at ?? new Date().toISOString(),
        };

        /* =========================================================
           STEP 4: ADMIN GUARD
        ========================================================= */

        const isAdmin =
          normalizedProfile.role === "admin" ||
          normalizedProfile.role === "super_admin";

        if (!isAdmin) {
          router.replace("/");
          return;
        }

        if (!mounted) return;

        setProfile(normalizedProfile);
      } catch (error) {
        console.error("ADMIN_LAYOUT_ERROR", error);
        router.replace("/auth/login");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [router]);

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-sm text-neutral-500 bg-[#0F0A06]">
        Loading admin workspace...
      </div>
    );
  }

  /* =========================================================
     BLOCK RENDER
  ========================================================= */

  if (!profile) return null;

  /* =========================================================
     DASHBOARD SHELL + CACHE SYSTEM PROVIDER
  ========================================================= */

  return (
    <QueryClientProvider client={queryClient}>
      <div className="h-screen overflow-hidden bg-[#0F0A06] text-white">
        <div className="fixed inset-y-0 left-0 z-40 hidden md:block">
          <AdminSidebar />
        </div>

        <main className="h-screen overflow-y-auto ml-20 lg:ml-64">
          {children}
        </main>
      </div>
    </QueryClientProvider>
  );
}