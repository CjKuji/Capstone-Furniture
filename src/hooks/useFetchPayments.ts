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
  byOrder: (orderId: string) => [...paymentKeys.all, "order", orderId] as const,
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
  const safeOrderId = orderId ?? "";

  return useQuery<PaymentSummary>({
    queryKey: paymentKeys.byOrder(safeOrderId),

    queryFn: async () => {
      if (!safeOrderId) {
        return EMPTY_PAYMENT_SUMMARY;
      }
      return await fetchPaymentsByOrder(safeOrderId);
    },

    enabled: Boolean(safeOrderId),

    /**
     * PREVENT UI FLICKER
     */
    placeholderData: (previousData) => previousData ?? EMPTY_PAYMENT_SUMMARY,

    /**
     * ── FIX: STABILIZED TO PREVENT INFINITE INTERACTION RERENDERS ──
     */
    staleTime: Infinity,
    gcTime: 15 * 60 * 1000,

    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchInterval: options?.refetchInterval ?? false,

    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });
}