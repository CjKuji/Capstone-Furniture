"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  requestCancelOrder,
} from "@/services/orders/orderCancellService";

/**
 * =========================================================
 * TYPES (aligned with service)
 * =========================================================
 */
type RequestCancelOrderParams = {
  orderId: string;
  userId: string;
  reason: string;
};

/**
 * =========================================================
 * CANCEL ORDER HOOK
 * =========================================================
 */
export function useCancelOrder() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (params: RequestCancelOrderParams) =>
      requestCancelOrder(params),

    onSuccess: async (_data, variables) => {
      const { orderId } = variables;

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["order", orderId],
        }),

        queryClient.invalidateQueries({
          queryKey: ["orders"],
        }),

        queryClient.invalidateQueries({
          queryKey: ["conversation", orderId],
        }),

        queryClient.invalidateQueries({
          queryKey: ["conversations"],
        }),

        queryClient.invalidateQueries({
          queryKey: ["messages", orderId],
        }),
      ]);
    },
  });

  /**
   * =========================================================
   * ACTIONS
   * =========================================================
   */
  const cancelOrder = (params: RequestCancelOrderParams) => {
    mutation.mutate(params);
  };

  const cancelOrderAsync = (params: RequestCancelOrderParams) => {
    return mutation.mutateAsync(params);
  };

  /**
   * =========================================================
   * RETURN
   * =========================================================
   */
  return {
    cancelOrder,
    cancelOrderAsync,

    isLoading: mutation.isPending,
    isPending: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,

    data: mutation.data,
    error: mutation.error,

    reset: mutation.reset,

    mutation,
  };
}