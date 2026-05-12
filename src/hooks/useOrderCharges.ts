"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

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

  byOrder: (orderId: string) =>
    ["order-charges", orderId] as const,
};

const orderKeys = {
  all: ["orders"] as const,

  detail: (orderId: string) =>
    ["order", orderId] as const,

  admin: ["admin-orders"] as const,
};

/* =========================================================
   HOOK
========================================================= */

export function useOrderCharges(
  orderId: string
) {
  const queryClient =
    useQueryClient();

  /* =========================================================
     CHARGES QUERY
  ========================================================= */

  const chargesQuery = useQuery<
    OrderCharge[],
    Error
  >({
    queryKey:
      chargeKeys.byOrder(orderId),

    queryFn: async (): Promise<
      OrderCharge[]
    > => {
      const data =
        await getOrderCharges(
          orderId
        );

      /**
       * SAFETY
       */
      return Array.isArray(data)
        ? (data as OrderCharge[])
        : [];
    },

    enabled: !!orderId,
  });

  /* =========================================================
     INVALIDATION
  ========================================================= */

  const invalidate =
    async () => {
      await queryClient.invalidateQueries(
        {
          queryKey:
            chargeKeys.byOrder(
              orderId
            ),
        }
      );

      await queryClient.invalidateQueries(
        {
          queryKey:
            orderKeys.all,
        }
      );

      await queryClient.invalidateQueries(
        {
          queryKey:
            orderKeys.admin,
        }
      );

      await queryClient.invalidateQueries(
        {
          queryKey:
            orderKeys.detail(
              orderId
            ),
        }
      );
    };

  /* =========================================================
     MUTATIONS
  ========================================================= */

  const addMutation =
    useMutation({
      mutationFn: addCharge,
      onSuccess: invalidate,
    });

  const updateMutation =
    useMutation({
      mutationFn:
        updateCharge,

      onSuccess: invalidate,
    });

  const deleteMutation =
    useMutation({
      mutationFn:
        deleteCharge,

      onSuccess: invalidate,
    });

  const finalizeMutation =
    useMutation({
      mutationFn:
        finalizeOrderCharges,

      onSuccess: invalidate,
    });

  /* =========================================================
     WRAPPERS
  ========================================================= */

  const createCharge = (
    params: {
      orderId: string;
      adminId: string;

      type: string;

      label?: string | null;

      amount: number;

      isAdditive?: boolean;
    }
  ) => {
    return addMutation.mutateAsync(
      {
        orderId:
          params.orderId,

        adminId:
          params.adminId,

        type: params.type,

        label:
          params.label ??
          null,

        amount:
          Number(
            params.amount
          ) || 0,

        isAdditive:
          params.isAdditive ??
          true,
      }
    );
  };

  const editCharge = (
    params: {
      chargeId: string;
      adminId: string;

      type?: string;

      label?: string | null;

      amount?: number;

      isAdditive?: boolean;
    }
  ) => {
    return updateMutation.mutateAsync(
      {
        chargeId:
          params.chargeId,

        adminId:
          params.adminId,

        type: params.type,

        label:
          params.label ??
          null,

        amount:
          params.amount !==
          undefined
            ? Number(
                params.amount
              ) || 0
            : undefined,

        isAdditive:
          params.isAdditive,
      }
    );
  };

  const removeCharge = (
    chargeId: string
  ) => {
    return deleteMutation.mutateAsync(
      chargeId
    );
  };

  const finalizeCharges = (
    params: {
      orderId: string;
      adminId: string;
    }
  ) => {
    return finalizeMutation.mutateAsync(
      params
    );
  };

  /* =========================================================
     RETURN
  ========================================================= */

  return {
    charges:
      (chargesQuery.data ??
        []) as OrderCharge[],

    isLoading:
      chargesQuery.isLoading,

    createCharge,
    editCharge,
    removeCharge,
    finalizeCharges,

    isAdding:
      addMutation.isPending,

    isUpdating:
      updateMutation.isPending,

    isDeleting:
      deleteMutation.isPending,

    isFinalizing:
      finalizeMutation.isPending,

    error:
      addMutation.error ||
      updateMutation.error ||
      deleteMutation.error ||
      finalizeMutation.error ||
      chargesQuery.error,
  };
}