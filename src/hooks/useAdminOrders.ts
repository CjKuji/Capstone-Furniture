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

/**
 * Hook: Fetch all administrative pipeline orders
 */
export function useAdminOrders() {
  const queryClient = useQueryClient();

  const queryResult = useQuery<OrderAdmin[]>({
    queryKey: adminOrderKeys.list(),
    queryFn: async () => {
      const data = await getAdminOrders();
      return data ?? [];
    },
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    placeholderData: (prev) => prev,
    retry: 2,
  });

  const mutate = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: adminOrderKeys.list() });
  }, [queryClient]);

  return {
    ...queryResult,
    mutate,
  };
}

/**
 * Hook: Fetch isolated admin data parameters by Order ID
 */
export function useAdminOrder(orderId?: string) {
  const queryClient = useQueryClient();
  const safeOrderId = orderId ?? "";

  const queryResult = useQuery<OrderAdmin>({
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

  const mutate = useCallback(() => {
    if (safeOrderId) {
      return queryClient.invalidateQueries({ queryKey: adminOrderKeys.detail(safeOrderId) });
    }
  }, [queryClient, safeOrderId]);

  return {
    ...queryResult,
    mutate,
  };
}

/**
 * Hook: Core administration pipeline mutators and cache sync handlers
 */
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
    
    // UX ENHANCEMENT: OPTIMISTIC CACHE WRITE
    onMutate: async ({ orderId, status }) => {
      // Cancel outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: adminOrderKeys.all });

      // Snapshot the previous values from cache
      const previousOrders = queryClient.getQueryData<OrderAdmin[]>(adminOrderKeys.list());
      const previousDetail = queryClient.getQueryData<OrderAdmin>(adminOrderKeys.detail(orderId));

      // Optimistically update the list array cache
      if (previousOrders) {
        queryClient.setQueryData<OrderAdmin[]>(
          adminOrderKeys.list(),
          previousOrders.map((order) =>
            order.id === orderId ? { ...order, order_status: status } : order
          )
        );
      }

      // Optimistically update the unique detail item cache
      if (previousDetail) {
        queryClient.setQueryData<OrderAdmin>(
          adminOrderKeys.detail(orderId),
          { ...previousDetail, order_status: status }
        );
      }

      // Return context containing snapshot data to utilize during fallback rollbacks
      return { previousOrders, previousDetail, orderId };
    },

    onError: (err, variables, context) => {
      console.error("Mutation failed, rolling back changes...", err);
      // Revert cache to exact snapshot values captured in onMutate
      if (context?.previousOrders) {
        queryClient.setQueryData(adminOrderKeys.list(), context.previousOrders);
      }
      if (context?.previousDetail && context.orderId) {
        queryClient.setQueryData(adminOrderKeys.detail(context.orderId), context.previousDetail);
      }
    },

    onSettled: (data, error, variables) => {
      // Silently re-sync with the backend database records in the background
      queryClient.invalidateQueries({ queryKey: adminOrderKeys.list() });
      queryClient.invalidateQueries({ queryKey: adminOrderKeys.detail(variables.orderId) });
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