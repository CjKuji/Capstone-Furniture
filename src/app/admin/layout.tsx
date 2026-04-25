"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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
        const { data: auth, error: authError } =
          await supabase.auth.getUser();

        if (authError || !auth?.user) {
          router.replace("/auth/login");
          return;
        }

        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", auth.user.id)
          .single();

        if (error || !profileData) {
          router.replace("/auth/login");
          return;
        }

        const role = profileData.role;

        const isAdmin =
          role === "admin" || role === "super_admin";

        if (!isAdmin) {
          router.replace("/");
          return;
        }

        if (!mounted) return;

        setProfile(profileData);
      } catch {
        router.replace("/auth/login");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-sm text-neutral-500">
        Checking permissions...
      </div>
    );
  }

  if (!profile) return null;

  return <>{children}</>;
}