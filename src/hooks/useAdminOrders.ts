"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAdminOrders,
  getAdminOrderById,
} from "@/services/orders/fetchOrderService";

import type { OrderAdmin } from "@/types/order";

/**
 * =========================================================
 * QUERY KEYS (ADMIN SYSTEM)
 * =========================================================
 */
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

    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,

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
      if (!safeOrderId) {
        throw new Error("Missing orderId");
      }

      const data = await getAdminOrderById(safeOrderId);

      return data;
    },

    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,

    refetchOnWindowFocus: true,
    refetchOnReconnect: true,

    retry: 2,
  });
}

/**
 * =========================================================
 * ADMIN ACTIONS (INVALIDATION ONLY)
 * =========================================================
 */
export function useAdminOrderActions() {
  const queryClient = useQueryClient();

  const invalidateOrders = async () => {
    await queryClient.invalidateQueries({
      queryKey: adminOrderKeys.all,
    });
  };

  const invalidateOrder = async (orderId: string) => {
    await queryClient.invalidateQueries({
      queryKey: adminOrderKeys.detail(orderId),
    });
  };

  return {
    invalidateOrders,
    invalidateOrder,
  };
}