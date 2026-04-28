"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createOrder } from "@/services/orders/createOrderService";
import { userOrderKeys } from "@/hooks/useUserOrders";

import type { CreateOrderPayload, Order } from "@/types/order";

/**
 * =========================================================
 * CREATE ORDER HOOK (SNAPSHOT-BASED SYSTEM)
 * FULLY ALIGNED WITH DB + SERVICE
 * =========================================================
 */
export function useOrderCreate() {
  const queryClient = useQueryClient();

  const mutation = useMutation<Order, Error, CreateOrderPayload>({
    mutationFn: (payload) => createOrder(payload),

    /**
     * =====================================================
     * IMPORTANT: refresh order lists after creation
     * =====================================================
     */
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: userOrderKeys.all,
      });
    },
  });

  return {
    /**
     * =====================================================
     * ACTIONS
     * =====================================================
     */
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,

    /**
     * =====================================================
     * STATE
     * =====================================================
     */
    isPending: mutation.isPending,
    isLoading: mutation.isPending, // backward compatibility
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,

    /**
     * =====================================================
     * UTILITIES
     * =====================================================
     */
    reset: mutation.reset,
  };
}