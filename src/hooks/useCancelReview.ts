"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  approveCancelOrder,
  rejectCancelOrder,
} from "@/services/orders/orderCancellService";

export function useCancelReview() {
  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: approveCancelOrder,

    onSuccess: async (_, vars) => {
      await queryClient.invalidateQueries({
        queryKey: ["order", vars.orderId],
      });

      await queryClient.invalidateQueries({
        queryKey: ["orders"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["conversation", vars.orderId],
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectCancelOrder,

    onSuccess: async (_, vars) => {
      await queryClient.invalidateQueries({
        queryKey: ["order", vars.orderId],
      });

      await queryClient.invalidateQueries({
        queryKey: ["orders"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["conversation", vars.orderId],
      });
    },
  });

  return {
    approveCancel: approveMutation.mutateAsync,
    rejectCancel: rejectMutation.mutateAsync,

    isLoading:
      approveMutation.isPending ||
      rejectMutation.isPending,
  };
}