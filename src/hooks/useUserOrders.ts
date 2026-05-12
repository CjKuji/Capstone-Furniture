"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getMyOrders,
  getMyOrderById,
} from "@/services/orders/fetchOrderService";

import type { Order } from "@/types/order";

/**
 * =========================================================
 * NORMALIZED TYPE
 * =========================================================
 */
export type OrderWithItems = Order & {
  order_items: NonNullable<Order["order_items"]>;
};

/**
 * =========================================================
 * QUERY KEYS (CLEAN + SCALABLE)
 * =========================================================
 *
 * IMPORTANT:
 * These keys will be used for:
 * - payments → invalidate orders
 * - charges → invalidate orders
 * - admin updates → refresh UI instantly
 */
export const userOrderKeys = {
  all: ["user-orders"] as const,

  lists: () => [...userOrderKeys.all, "list"] as const,

  list: () => [...userOrderKeys.all, "list"] as const,

  details: () => [...userOrderKeys.all, "detail"] as const,

  detail: (orderId: string) =>
    [...userOrderKeys.all, "detail", orderId] as const,
};

/**
 * =========================================================
 * ALL ORDERS
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

    /**
     * =========================================================
     * CACHE STRATEGY
     * =========================================================
     */
    staleTime: 10 * 1000,
    gcTime: 5 * 60 * 1000,

    refetchOnWindowFocus: true,
    refetchOnReconnect: true,

    retry: 2,
  });
}

/**
 * =========================================================
 * SINGLE ORDER
 * =========================================================
 */
export function useMyOrderById(orderId?: string) {
  return useQuery<OrderWithItems, Error>({
    queryKey: userOrderKeys.detail(orderId ?? ""),

    enabled: !!orderId,

    queryFn: async () => {
      if (!orderId) {
        throw new Error("Order ID is required");
      }

      const data = await getMyOrderById(orderId);

      return {
        ...data,
        order_items: data.order_items ?? [],
      };
    },

    /**
     * =========================================================
     * CACHE STRATEGY
     * =========================================================
     */
    staleTime: 10 * 1000,
    gcTime: 5 * 60 * 1000,

    refetchOnWindowFocus: true,
    refetchOnReconnect: true,

    retry: 2,
  });
}