"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/user";

export function useUserProfile() {
  const [data, setData] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getUser();

      if (!auth.user) return;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", auth.user.id)
        .single();

      setData(data);
      setLoading(false);
    };

    load();
  }, []);

  return { data, loading };
}