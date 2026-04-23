import { supabase } from "@/lib/supabase";

/* =========================================================
   DASHBOARD STATS SERVICE
   ========================================================= */

export async function getAdminStats() {
  const [
    { count: totalFurniture },
    { count: publishedFurniture },
    { count: totalUsers },
    { count: savedConfigs },
  ] = await Promise.all([
    supabase.from("furniture").select("*", { count: "exact", head: true }),

    supabase
      .from("furniture")
      .select("*", { count: "exact", head: true })
      .eq("publish_status", "published"),

    supabase.from("profiles").select("*", { count: "exact", head: true }),

    supabase
      .from("furniture_configurations")
      .select("*", { count: "exact", head: true }),
  ]);

  return {
    totalFurniture: totalFurniture ?? 0,
    publishedFurniture: publishedFurniture ?? 0,
    totalUsers: totalUsers ?? 0,
    savedConfigs: savedConfigs ?? 0,
  };
}