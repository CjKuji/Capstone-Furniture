"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMyOrders,
  getMyOrderById,
} from "@/services/orders/fetchOrderService";

import type { Order } from "@/types/order";

export type OrderWithItems = Order & {
  order_items: NonNullable<Order["order_items"]>;
};

export const userOrderKeys = {
  all: ["user-orders"] as const,
  list: () => [...userOrderKeys.all, "list"] as const,
  detail: (orderId: string) => [...userOrderKeys.all, "detail", orderId] as const,
};

/**
 * =========================================================
 * ALL CUSTOMER ORDERS (LIST)
 * =========================================================
 */
export function useMyOrders() {
  return useQuery<OrderWithItems[], Error>({
    queryKey: userOrderKeys.list(),
    queryFn: async () => {
      const data = await getMyOrders();
      return (data ?? []).map((order) => ({
        ...order,
        order_items: order.order_items ?? [],
      }));
    },
    staleTime: Infinity,
    gcTime: 15 * 60 * 1000, 
    refetchOnWindowFocus: false, // 👍 Stops disappearing when shifting windows
    refetchOnReconnect: false,   // 👍 Stops disappearing during minor network drops
    retry: 2,
  });
}

/**
 * =========================================================
 * SINGLE CUSTOMER ORDER (MODAL DETAILS VIEW)
 * =========================================================
 */
export function useMyOrderById(orderId?: string) {
  const safeOrderId = orderId ?? "";

  return useQuery<OrderWithItems, Error>({
    queryKey: safeOrderId
      ? userOrderKeys.detail(safeOrderId)
      : ["user-orders", "detail", "disabled"],
    enabled: !!safeOrderId,
    queryFn: async () => {
      if (!safeOrderId) throw new Error("Order ID is required");
      const data = await getMyOrderById(safeOrderId);
      return {
        ...data,
        order_items: data.order_items ?? [],
      };
    },
    // Absolute Guard: Keeps the old snapshot visible while data re-fetches in the background.
    // This stops React from clearing the child tree and violently unmounting the 3D Canvas.
    placeholderData: (previousData) => previousData,
    staleTime: Infinity,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false, // 🛠️ FIXED: Turned off to protect your WebGL canvas context on window switch
    refetchOnReconnect: false,   // 🛠️ FIXED: Turned off to prevent context loss on unexpected connectivity changes
    retry: 2,
  });
}

/**
 * =========================================================
 * CUSTOMER ACTIONS & CACHE INVALIDATIONS
 * =========================================================
 */
export function useUserOrderActions() {
  const queryClient = useQueryClient();

  const invalidateOrders = async () => {
    await queryClient.invalidateQueries({ queryKey: userOrderKeys.all, exact: false });
  };

  const invalidateOrder = async (orderId: string) => {
    await queryClient.invalidateQueries({ queryKey: userOrderKeys.detail(orderId), exact: true });
  };

  return {
    invalidateOrders,
    invalidateOrder,
  };
}