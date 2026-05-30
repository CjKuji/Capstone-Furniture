"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { getMyOrders, getMyOrderById } from "@/services/orders/fetchOrderService";
import type { Order } from "@/types/order";

export type OrderWithItems = Order & {
  order_items: NonNullable<Order["order_items"]>;
};

/**
 * Helper to ensure order_items is always an array
 */
const transformOrder = (order: any): OrderWithItems => ({
  ...order,
  order_items: order.order_items ?? [],
});

export const userOrderKeys = {
  all: ["user-orders"] as const,
  lists: () => [...userOrderKeys.all, "list"] as const,
  details: () => [...userOrderKeys.all, "detail"] as const,
  detail: (id: string) => [...userOrderKeys.details(), id] as const,
};

/**
 * Hook: Fetch all customer orders
 *
 * KEY FIXES vs original:
 *
 * 1. gcTime: Infinity (was 15 min)
 *    staleTime: Infinity means data is never considered stale, so React Query
 *    won't refetch in the background. BUT if gcTime is shorter than the time
 *    between visits, the cache entry gets garbage-collected while the user is
 *    on another page. When they return, the cache is empty and isLoading fires
 *    again — causing the skeleton flash. Setting gcTime to Infinity keeps the
 *    cache alive for the entire session, matching the staleTime intent.
 *
 * 2. refetchOnWindowFocus: false, refetchOnReconnect: false
 *    With staleTime: Infinity these would be no-ops anyway (data is never
 *    stale so focus/reconnect refetches are skipped), but being explicit
 *    prevents any future staleTime change from accidentally re-enabling them.
 *
 * 3. placeholderData: (prev) => prev
 *    During any transition where React Query does fetch (e.g. manual refetch
 *    via refetch()), this keeps the previous data visible instead of wiping
 *    it to undefined. isLoading stays false; only isFetching goes true.
 *    This is the "keep showing old data while refreshing" pattern.
 */
export function useMyOrders() {
  return useQuery<OrderWithItems[], Error>({
    queryKey: userOrderKeys.lists(),
    queryFn: async () => {
      const data = await getMyOrders();
      return (data ?? []).map(transformOrder);
    },
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    placeholderData: (prev) => prev,
    retry: 2,
  });
}

/**
 * Hook: Fetch single order by ID (with placeholder protection)
 */
export function useMyOrderById(orderId?: string) {
  return useQuery<OrderWithItems, Error>({
    queryKey: orderId ? userOrderKeys.detail(orderId) : ["user-orders", "disabled"],
    enabled: !!orderId,
    queryFn: async () => {
      if (!orderId) throw new Error("Order ID required");
      const data = await getMyOrderById(orderId);
      return transformOrder(data);
    },
    placeholderData: (previousData) => previousData,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 2,
  });
}

/**
 * Hook: Cache management actions
 */
export function useUserOrderActions() {
  const queryClient = useQueryClient();

  const invalidateAll = useCallback(
    () => queryClient.invalidateQueries({ queryKey: userOrderKeys.all }),
    [queryClient]
  );

  const invalidateList = useCallback(
    () => queryClient.invalidateQueries({ queryKey: userOrderKeys.lists() }),
    [queryClient]
  );

  const invalidateDetail = useCallback(
    (orderId: string) =>
      queryClient.invalidateQueries({ queryKey: userOrderKeys.detail(orderId) }),
    [queryClient]
  );

  return { invalidateAll, invalidateList, invalidateDetail };
}