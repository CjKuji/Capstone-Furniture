"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { OrderCharge } from "@/types/order";
import {
  addCharge,
  updateCharge,
  deleteCharge,
  getOrderCharges,
  finalizeOrderCharges,
} from "@/services/orders/chargesService";

/* =========================================================
   QUERY KEYS
========================================================= */
const chargeKeys = {
  all: ["order-charges"] as const,
  byOrder: (orderId: string) => ["order-charges", orderId] as const,
};

const orderKeys = {
  detail: (orderId: string) => ["order", orderId] as const,
};

/* =========================================================
   HOOK
========================================================= */
export function useOrderCharges(orderId: string) {
  const queryClient = useQueryClient();

  /* =========================================================
     CHARGES QUERY
  ========================================================= */
  const chargesQuery = useQuery<OrderCharge[], Error>({
    queryKey: chargeKeys.byOrder(orderId),
    queryFn: async (): Promise<OrderCharge[]> => {
      const data = await getOrderCharges(orderId);
      return Array.isArray(data) ? (data as OrderCharge[]) : [];
    },
    enabled: !!orderId,
    staleTime: Infinity,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  /* =========================================================
     PRECISION INVALIDATION (Prevents UI Cascade)
  ========================================================= */
  const invalidate = async () => {
    // 1. Invalidate only THIS order's specific charges
    await queryClient.invalidateQueries({ 
      queryKey: chargeKeys.byOrder(orderId),
      exact: true 
    });
    
    // 2. Invalidate only THIS order's detail view
    await queryClient.invalidateQueries({ 
      queryKey: orderKeys.detail(orderId),
      exact: true 
    });
    
    // NOTE: We no longer invalidate orderKeys.all or orderKeys.admin 
    // unless the user specifically navigates back to a list view.
  };

  /* =========================================================
     MUTATIONS
  ========================================================= */
  const addMutation = useMutation({ mutationFn: addCharge, onSuccess: invalidate });
  const updateMutation = useMutation({ mutationFn: updateCharge, onSuccess: invalidate });
  const deleteMutation = useMutation({ mutationFn: deleteCharge, onSuccess: invalidate });
  const finalizeMutation = useMutation({ mutationFn: finalizeOrderCharges, onSuccess: invalidate });

  /* =========================================================
     WRAPPERS
  ========================================================= */
  const createCharge = (params: {
    orderId: string;
    adminId: string;
    type: string;
    label?: string | null;
    amount: number;
    isAdditive?: boolean;
  }) => {
    return addMutation.mutateAsync({
      ...params,
      label: params.label ?? null,
      amount: Number(params.amount) || 0,
      isAdditive: params.isAdditive ?? true,
    });
  };

  const editCharge = (params: {
    chargeId: string;
    adminId: string;
    type?: string;
    label?: string | null;
    amount?: number;
    isAdditive?: boolean;
  }) => {
    return updateMutation.mutateAsync({
      ...params,
      label: params.label ?? null,
      amount: params.amount !== undefined ? Number(params.amount) || 0 : undefined,
    });
  };

  return {
    charges: (chargesQuery.data ?? []) as OrderCharge[],
    isLoading: chargesQuery.isLoading,
    createCharge,
    editCharge,
    removeCharge: (chargeId: string) => deleteMutation.mutateAsync(chargeId),
    finalizeCharges: (params: { orderId: string; adminId: string }) => finalizeMutation.mutateAsync(params),
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isFinalizing: finalizeMutation.isPending,
    error: addMutation.error || updateMutation.error || deleteMutation.error || finalizeMutation.error || chargesQuery.error,
  };
}