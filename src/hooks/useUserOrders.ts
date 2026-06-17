"use client";

import { useQuery, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
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
 * Includes exposure of fallback parameters to support layout revalidation
 */
export function useMyOrders(
  options?: Partial<UseQueryOptions<OrderWithItems[], Error>>
) {
  const queryClient = useQueryClient();

  const queryResult = useQuery<OrderWithItems[], Error>({
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
    ...options,
  });

  // Inject a standard mutate helper for easy alignment with layout hooks (like SWR fallback syntax)
  const mutate = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: userOrderKeys.lists() });
  }, [queryClient]);

  return {
    ...queryResult,
    mutate,
  };
}

/**
 * Hook: Fetch single order by ID
 */
export function useMyOrderById(orderId?: string) {
  const queryClient = useQueryClient();
  const safeOrderId = orderId ?? "";

  const queryResult = useQuery<OrderWithItems, Error>({
    queryKey: safeOrderId ? userOrderKeys.detail(safeOrderId) : ["user-orders", "disabled"],
    enabled: !!safeOrderId,
    queryFn: async () => {
      if (!safeOrderId) throw new Error("Order ID required");
      const data = await getMyOrderById(safeOrderId);
      return transformOrder(data);
    },
    placeholderData: (previousData) => previousData,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 2,
  });

  const mutate = useCallback(() => {
    if (safeOrderId) {
      return queryClient.invalidateQueries({ queryKey: userOrderKeys.detail(safeOrderId) });
    }
  }, [queryClient, safeOrderId]);

  return {
    ...queryResult,
    mutate,
  };
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