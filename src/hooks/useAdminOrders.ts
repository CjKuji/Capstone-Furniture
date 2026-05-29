"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react"; // Added
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
    staleTime: Infinity,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
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
    staleTime: Infinity,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
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

  // Wrapped in useCallback for use in useEffect
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