"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  acceptOrder as acceptOrderApi,
  startProduction as startProductionApi,
  markOrderReady as markOrderReadyApi,
  dispatchOrder as dispatchOrderApi,
  completeOrder as completeOrderApi,
} from "@/services/orders/orderFlowService";

import type { Order, OrderRow } from "@/types/order";
import { userOrderKeys } from "@/hooks/useUserOrders";
import { adminOrderKeys } from "@/hooks/useAdminOrders";
import { normalizeOrderRow } from "@/utils/normalizeOrderRow";

export function useOrderFlow() {
  const queryClient = useQueryClient();

  const handleSuccess = (row: OrderRow) => {
    if (!row?.id) return;

    const normalized = normalizeOrderRow(row);

    // 1. Instantly update active detailed client-side caches
    queryClient.setQueryData<Order | undefined>(
      userOrderKeys.detail(row.id),
      (old) => {
        if (!old) return normalized;
        return {
          ...old,
          ...normalized,
        };
      }
    );

    // 2. Clear out user pipeline queries safely in the background
    queryClient.invalidateQueries({
      queryKey: userOrderKeys.all,
    });

    // 3. Clear out admin records cleanly using formal system key variables
    queryClient.invalidateQueries({
      queryKey: adminOrderKeys.all,
    });
    
    // Fallback alignment for plain string tokens if still used across components
    queryClient.invalidateQueries({
      queryKey: ["admin-orders"],
    });
  };

  const acceptMutation = useMutation<
    OrderRow,
    Error,
    { orderId: string; adminId: string }
  >({
    mutationFn: acceptOrderApi,
    onSuccess: handleSuccess,
  });

  const accept = (orderId: string, adminId: string) =>
    acceptMutation.mutateAsync({ orderId, adminId });

  const startProductionMutation = useMutation<OrderRow, Error, string>({
    mutationFn: startProductionApi,
    onSuccess: handleSuccess,
  });

  const startProduction = (orderId: string) =>
    startProductionMutation.mutateAsync(orderId);

  const markReadyMutation = useMutation<OrderRow, Error, string>({
    mutationFn: markOrderReadyApi,
    onSuccess: handleSuccess,
  });

  const markReady = (orderId: string) =>
    markReadyMutation.mutateAsync(orderId);

  const dispatchMutation = useMutation<OrderRow, Error, string>({
    mutationFn: dispatchOrderApi,
    onSuccess: handleSuccess,
  });

  const dispatch = (orderId: string) =>
    dispatchMutation.mutateAsync(orderId);

  const completeMutation = useMutation<OrderRow, Error, string>({
    mutationFn: completeOrderApi,
    onSuccess: handleSuccess,
  });

  const complete = (orderId: string) =>
    completeMutation.mutateAsync(orderId);

  return {
    accept,
    startProduction,
    markReady,
    dispatch,
    complete,

    isAccepting: acceptMutation.isPending,
    isStartingProduction: startProductionMutation.isPending,
    isMarkingReady: markReadyMutation.isPending,
    isDispatching: dispatchMutation.isPending,
    isCompleting: completeMutation.isPending,

    isLoading:
      acceptMutation.isPending ||
      startProductionMutation.isPending ||
      markReadyMutation.isPending ||
      dispatchMutation.isPending ||
      completeMutation.isPending,

    acceptError: acceptMutation.error,
    startProductionError: startProductionMutation.error,
    markReadyError: markReadyMutation.error,
    dispatchError: dispatchMutation.error,
    completeError: completeMutation.error,
  };
}