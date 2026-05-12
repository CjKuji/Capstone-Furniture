import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  acceptCharges,
  rejectCharges,
  type AcceptChargesPayload,
  type RejectChargesPayload,
} from "@/services/orders/chargeDecisionService";

/**
 * =========================================================
 * QUERY KEYS
 * =========================================================
 */

const queryKeys = {
  orders: ["user-orders"] as const,

  order: (orderId: string) =>
    ["user-orders", "detail", orderId] as const,

  charges: (orderId: string) =>
    ["order-charges", orderId] as const,
};

/**
 * =========================================================
 * HOOK
 * =========================================================
 *
 * FLOW:
 * - Accept charges → locks pricing
 * - Reject charges → sends automated system chat message
 * - Keeps all order-related UI synced
 */

export function useChargeDecision() {
  const queryClient = useQueryClient();

  /**
   * =========================================================
   * REFRESH / SYNC
   * =========================================================
   */

  const refreshAll = async (orderId: string) => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders,
      }),

      queryClient.invalidateQueries({
        queryKey: queryKeys.order(orderId),
      }),

      queryClient.invalidateQueries({
        queryKey: queryKeys.charges(orderId),
      }),
    ]);
  };

  /**
   * =========================================================
   * ACCEPT CHARGES
   * =========================================================
   */

  const acceptMutation = useMutation({
    mutationFn: (payload: AcceptChargesPayload) =>
      acceptCharges(payload),

    onSuccess: async (_data, variables) => {
      if (!variables?.orderId) return;

      await refreshAll(variables.orderId);
    },
  });

  /**
   * =========================================================
   * REJECT CHARGES
   * =========================================================
   */

  const rejectMutation = useMutation({
    mutationFn: (payload: RejectChargesPayload) =>
      rejectCharges(payload),

    onSuccess: async (_data, variables) => {
      if (!variables?.orderId) return;

      await refreshAll(variables.orderId);
    },
  });

  /**
   * =========================================================
   * API
   * =========================================================
   */

  return {
    /**
     * actions
     */
    acceptCharges: acceptMutation.mutateAsync,
    rejectCharges: rejectMutation.mutateAsync,

    /**
     * loading states
     */
    isAccepting: acceptMutation.isPending,
    isRejecting: rejectMutation.isPending,

    /**
     * errors
     */
    acceptError: acceptMutation.error,
    rejectError: rejectMutation.error,

    /**
     * status
     */
    acceptStatus: acceptMutation.status,
    rejectStatus: rejectMutation.status,
  };
}