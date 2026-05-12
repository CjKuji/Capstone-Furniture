"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

  created_at:
    profileData.created_at ??
    new Date().toISOString(),
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
      <div className="flex items-center justify-center min-h-screen text-sm text-neutral-500">
        Loading admin workspace...
      </div>
    );
  }

  /* =========================================================
     BLOCK RENDER
  ========================================================= */

  if (!profile) return null;

  /* =========================================================
     DASHBOARD SHELL
  ========================================================= */

  return (
    <div className="flex min-h-screen bg-neutral-50 text-neutral-900">
      <AdminSidebar />

      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}