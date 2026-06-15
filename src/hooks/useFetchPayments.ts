"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchPayments,
  PaymentSummary,
  EMPTY_PAYMENT_SUMMARY,
} from "@/services/payments/fetchPaymentService";

/**
 * =========================================================
 * QUERY KEYS (Polymorphic Engine Structure)
 * =========================================================
 */
export const paymentKeys = {
  all: ["payments"] as const,
  byOrder: (orderId: string) => [...paymentKeys.all, "order", orderId] as const,
  byInquiry: (inquiryId: string) => [...paymentKeys.all, "inquiry", inquiryId] as const,
};

interface UsePaymentsQueryOptions {
  refetchInterval?: number | false;
}

/**
 * =========================================================
 * DUAL PIPELINE QUERY HOOK
 * =========================================================
 * * FIX: 'targetId' now explicitly accepts string | undefined to eliminate 
 * compilation mismatch errors directly from parent modal invocation loops.
 */
export function usePaymentsQuery(
  targetId?: string | undefined, 
  options?: UsePaymentsQueryOptions
) {
  // Normalize undefined or null variables seamlessly to an operational empty string
  const safeId = targetId ?? "";

  // Detect pipeline routing structure cleanly via UUID structure constraint metrics
  const isUuid = safeId.length === 36; 

  return useQuery<PaymentSummary>({
    // Keeps state domains completely partitioned to prevent data blending leaks
    queryKey: isUuid ? paymentKeys.byInquiry(safeId) : paymentKeys.byOrder(safeId),

    queryFn: async () => {
      if (!safeId) {
        return EMPTY_PAYMENT_SUMMARY;
      }

      if (isUuid) {
        return await fetchPayments({ inquiryId: safeId });
      }

      return await fetchPayments({ orderId: safeId });
    },

    // Safeguard constraint: Prevents running a live network fetch until targetId resolves
    enabled: Boolean(safeId),

    /**
     * PREVENT UI FLICKER
     */
    placeholderData: (previousData) => previousData ?? EMPTY_PAYMENT_SUMMARY,

    /**
     * STABILIZED TO PREVENT INFINITE INTERACTION RERENDERS
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