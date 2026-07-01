"use client";

import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getAdminDashboardStats, AdminDashboardData } from "@/services/dashboardService";

/* =========================================================
   DASHBOARD QUERY KEY FACTORY
   ========================================================= */
export const dashboardKeys = {
  all: ["admin", "dashboard"] as const,
};

/* =========================================================
   LIVE ADMIN DASHBOARD HOOK
   - Fetches all dashboard stats via React Query
   - Subscribes to real-time changes on all relevant tables
   - Automatically invalidates & refetches on any change
   ========================================================= */
export function useAdminDashboard() {
  const queryClient = useQueryClient();

  // --- React Query fetch ---
  const queryResult = useQuery<AdminDashboardData, Error>({
    queryKey: dashboardKeys.all,
    queryFn: async () => {
      const stats = await getAdminDashboardStats();
      return stats;
    },
    staleTime: 1000 * 30,        // 30s stale time – fast enough for live feel
    refetchInterval: 1000 * 60,   // fallback poll every 60s
    placeholderData: (previousData) => previousData,
  });

  // --- Real-time subscriptions for all dashboard-relevant tables ---
  useEffect(() => {
    // Helper: invalidate dashboard queries
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    };

    // 1. Orders table
    const ordersChannel = supabase
      .channel("dashboard-orders-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        invalidate
      )
      .subscribe();

    // 2. Inquiries table
    const inquiriesChannel = supabase
      .channel("dashboard-inquiries-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inquiries" },
        invalidate
      )
      .subscribe();

    // 3. Payments table
    const paymentsChannel = supabase
      .channel("dashboard-payments-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payments" },
        invalidate
      )
      .subscribe();

    // 4. Conversations table (for unread messages)
    const conversationsChannel = supabase
      .channel("dashboard-conversations-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        invalidate
      )
      .subscribe();

    // 5. Furniture table (for catalog count)
    const furnitureChannel = supabase
      .channel("dashboard-furniture-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "furniture" },
        invalidate
      )
      .subscribe();

    // 6. Profiles table (for user count)
    const profilesChannel = supabase
      .channel("dashboard-profiles-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        invalidate
      )
      .subscribe();

    // Cleanup all channels on unmount
    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(inquiriesChannel);
      supabase.removeChannel(paymentsChannel);
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(furnitureChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, [queryClient]);

  return queryResult;
}