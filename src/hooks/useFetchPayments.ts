"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchPaymentsByOrder,
  PaymentSummary,
  EMPTY_PAYMENT_SUMMARY,
} from "@/services/payments/fetchPaymentService";

/**
 * =========================================================
 * QUERY KEYS
 * =========================================================
 */

export const paymentKeys = {
  all: ["payments"] as const,

  byOrder: (orderId: string) =>
    [...paymentKeys.all, "order", orderId] as const,
};

/**
 * =========================================================
 * HOOK
 * =========================================================
 */

export function usePaymentsQuery(
  orderId?: string,
  options?: {
    refetchInterval?: number | false;
  }
) {
  /**
   * ---------------------------------------------------------
   * SAFE ORDER ID
   * ---------------------------------------------------------
   */

  const safeOrderId = orderId ?? "";

  /**
   * ---------------------------------------------------------
   * QUERY
   * ---------------------------------------------------------
   */

  return useQuery<PaymentSummary>({
    queryKey: paymentKeys.byOrder(safeOrderId),

    /**
     * ---------------------------------------------------------
     * QUERY FUNCTION
     * ---------------------------------------------------------
     */

    queryFn: async () => {
      /**
       * Prevent invalid fetches
       */

      if (!safeOrderId) {
        return EMPTY_PAYMENT_SUMMARY;
      }

      /**
       * Fetch normalized payment summary
       */

      return await fetchPaymentsByOrder(safeOrderId);
    },

    /**
     * ---------------------------------------------------------
     * ENABLE ONLY WHEN ORDER EXISTS
     * ---------------------------------------------------------
     */

    enabled: Boolean(safeOrderId),

    /**
     * ---------------------------------------------------------
     * IMPORTANT:
     * PREVENT UI FLICKER
     * ---------------------------------------------------------
     *
     * Keeps previous payment values while refetching
     * instead of temporarily resetting to zero/empty
     */

    placeholderData: (previousData) =>
      previousData ?? EMPTY_PAYMENT_SUMMARY,

    /**
     * ---------------------------------------------------------
     * CACHE BEHAVIOR
     * ---------------------------------------------------------
     */

    staleTime: 10 * 1000,

    gcTime: 5 * 60 * 1000,

    /**
     * ---------------------------------------------------------
     * REFETCH BEHAVIOR
     * ---------------------------------------------------------
     */

    refetchOnWindowFocus: false,

    refetchOnReconnect: true,

    /**
     * ---------------------------------------------------------
     * OPTIONAL REAL-TIME POLLING
     * ---------------------------------------------------------
     */

    refetchInterval: options?.refetchInterval ?? false,

    /**
     * ---------------------------------------------------------
     * RESILIENCE
     * ---------------------------------------------------------
     */

    retry: 2,

    retryDelay: (attempt) =>
      Math.min(1000 * 2 ** attempt, 10000),
  });
}