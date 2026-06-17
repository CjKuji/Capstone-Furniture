"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchPayments,
  PaymentSummary,
  EMPTY_PAYMENT_SUMMARY,
} from "@/services/payments/fetchPaymentService";

export const paymentKeys = {
  all: ["payments"] as const,
  byOrder: (orderId: string) => [...paymentKeys.all, "order", orderId] as const,
  byInquiry: (inquiryId: string) => [...paymentKeys.all, "inquiry", inquiryId] as const,
};

interface UsePaymentsQueryOptions {
  refetchInterval?: number | false;
  type?: "order" | "inquiry";
}

/**
 * =========================================================
 * DETERMINISTIC PIPELINE QUERY HOOK
 * =========================================================
 */
export function usePaymentsQuery(
  targetId?: string | undefined, 
  options?: UsePaymentsQueryOptions
) {
  const safeId = targetId ?? "";
  
  const isInquiry = options?.type 
    ? options.type === "inquiry"
    : safeId.length === 36 && !safeId.startsWith("ORD"); 

  return useQuery<PaymentSummary>({
    queryKey: isInquiry ? paymentKeys.byInquiry(safeId) : paymentKeys.byOrder(safeId),

    queryFn: async () => {
      if (!safeId) {
        return EMPTY_PAYMENT_SUMMARY;
      }

      if (isInquiry) {
        return await fetchPayments({ inquiryId: safeId });
      }

      return await fetchPayments({ orderId: safeId });
    },

    enabled: Boolean(safeId),
    placeholderData: (previousData) => previousData ?? EMPTY_PAYMENT_SUMMARY,
    
    // Kept low so manual refetches or route switches pull clean data
    staleTime: 5000, 
    gcTime: 15 * 60 * 1000,

    refetchOnWindowFocus: true, // Switched to true so background switches pull live updates
    refetchOnReconnect: true,
    refetchInterval: options?.refetchInterval ?? false,

    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });
}