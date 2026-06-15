"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  getAdminOrders,
  getAdminOrderById,
} from "@/services/orders/fetchOrderService";

import type { OrderAdmin } from "@/types/order";
import type { OrderStatus } from "@/types/enums";

export const adminOrderKeys = {
  all: ["admin-orders"] as const,
  list: () => [...adminOrderKeys.all, "list"] as const,
  detail: (id: string) => [...adminOrderKeys.all, "detail", id] as const,
};

export function useAdminOrders() {
  return useQuery<OrderAdmin[]>({
    queryKey: adminOrderKeys.list(),
    queryFn: async () => {
      const data = await getAdminOrders();
      return data ?? [];
    },

    /**
     * FIX 1: gcTime Infinity (was 15 min)
     *
     * staleTime: Infinity means "never consider this data stale", so React
     * Query won't proactively refetch it. But if gcTime is 15 min and the
     * admin navigates away for longer, the cache entry gets garbage-collected.
     * When they return, the cache is empty → isLoading fires → skeleton flash.
     *
     * Setting gcTime: Infinity keeps the cache alive for the entire session,
     * matching the staleTime intent. The realtime subscription handles
     * freshness, so we don't need TTL-based eviction.
     */
    staleTime: Infinity,
    gcTime: Infinity,

    /**
     * FIX 2: refetchOnWindowFocus / refetchOnReconnect → false
     *
     * With staleTime: Infinity these were already no-ops (data is never stale,
     * so focus/reconnect refetches are skipped). Being explicit prevents a
     * future staleTime change from accidentally re-enabling them and fighting
     * the realtime subscription.
     */
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,

    /**
     * FIX 3: placeholderData keeps previous data during any refetch.
     *
     * Without this, when invalidateOrders() fires from the realtime channel,
     * React Query briefly sets orders → undefined while it fetches fresh data.
     * That undefined blows past the `orders.length === 0` guard and flashes
     * the skeleton or the empty state. With placeholderData: (prev) => prev,
     * the old array stays in place; only isFetching goes true, never isLoading.
     */
    placeholderData: (prev) => prev,

    retry: 2,
  });
}

export function useAdminOrder(orderId?: string) {
  const safeOrderId = orderId ?? "";

  return useQuery<OrderAdmin>({
    queryKey: safeOrderId
      ? adminOrderKeys.detail(safeOrderId)
      : ["admin-orders", "detail", "disabled"],
    enabled: !!safeOrderId,
    queryFn: async () => {
      if (!safeOrderId) throw new Error("Missing orderId");
      const data = await getAdminOrderById(safeOrderId);
      return data;
    },
    placeholderData: (previousData) => previousData,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 2,
  });
}

export function useAdminOrderActions() {
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      const { error } = await supabase
        .from("orders")
        .update({ order_status: status })
        .eq("id", orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminOrderKeys.all });
    },
  });

  const invalidateOrders = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: adminOrderKeys.all });
  }, [queryClient]);

  const invalidateOrder = useCallback(async (orderId: string) => {
    await queryClient.invalidateQueries({ queryKey: adminOrderKeys.detail(orderId) });
  }, [queryClient]);

  return {
    invalidateOrders,
    invalidateOrder,
    updateStatus: updateStatusMutation.mutateAsync,
    isUpdating: updateStatusMutation.isPending,
  };
}