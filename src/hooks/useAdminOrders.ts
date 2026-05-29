"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

/**
 * =========================================================
 * ALL ADMIN ORDERS
 * =========================================================
 */
export function useAdminOrders() {
  return useQuery<OrderAdmin[]>({
    queryKey: adminOrderKeys.list(),
    queryFn: async () => {
      const data = await getAdminOrders();
      return data ?? [];
    },
    // Set staleTime to Infinity to pull instantly from cache with 0 loading flicker
    staleTime: Infinity,
    gcTime: 15 * 60 * 1000, // Retain inside garbage collector for 15 minutes
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 2,
  });
}

/**
 * =========================================================
 * SINGLE ADMIN ORDER
 * =========================================================
 */
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
    staleTime: Infinity,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 2,
  });
}

/**
 * =========================================================
 * ADMIN MUTATIONS & MUTATION ACTIONS
 * =========================================================
 */
export function useAdminOrderActions() {
  const queryClient = useQueryClient();

  // Encapulsated mutation hook for safe state validation handling
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

  const invalidateOrders = async () => {
    await queryClient.invalidateQueries({ queryKey: adminOrderKeys.all });
  };

  const invalidateOrder = async (orderId: string) => {
    await queryClient.invalidateQueries({ queryKey: adminOrderKeys.detail(orderId) });
  };

  return {
    invalidateOrders,
    invalidateOrder,
    updateStatus: updateStatusMutation.mutateAsync,
    isUpdating: updateStatusMutation.isPending,
  };
}