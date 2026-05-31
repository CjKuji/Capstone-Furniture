"use client";

import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { createOrder } from "@/services/orders/createOrderService";
import { userOrderKeys } from "@/hooks/useUserOrders";

import type {
  Order,
  CreateOrderPayload,
} from "@/types/order";

/**
 * =========================================================
 * LOCAL INPUT TYPES
 * =========================================================
 */

type CreateOrderItemInput = {
  furniture_id: string;
  variant_id?: string | null;
  quantity: number;
};

type LocalCreateOrderPayload = {
  delivery_method:
    | "pickup"
    | "delivery";

  customer_name?:
    | string
    | null;

  phone_number?:
    | string
    | null;

  delivery_address?:
    | string
    | null;

  pickup_location?:
    | string
    | null;

  delivery_notes?:
    | string
    | null;

  request?:
    | {
        description: string;
        imageFiles?: File[]; // ← array: up to 5 reference images
      }
    | null;

  items: CreateOrderItemInput[];
};

/**
 * =========================================================
 * HOOK
 * =========================================================
 */

export function useOrderCreate() {
  const queryClient =
    useQueryClient();

  const mutation =
    useMutation<
      Order,
      Error,
      LocalCreateOrderPayload
    >({
      /**
       * =========================================================
       * CREATE ORDER
       * =========================================================
       */
      mutationFn: async (
        payload
      ) => {
        /**
         * CLEAN + MATCH SERVICE TYPE
         */
        const cleanedPayload: CreateOrderPayload =
          {
            delivery_method:
              payload.delivery_method,

            ...(payload.customer_name
              ? {
                  customer_name:
                    payload.customer_name,
                }
              : {}),

            ...(payload.phone_number
              ? {
                  phone_number:
                    payload.phone_number,
                }
              : {}),

            ...(payload.delivery_address
              ? {
                  delivery_address:
                    payload.delivery_address,
                }
              : {}),

            ...(payload.pickup_location
              ? {
                  pickup_location:
                    payload.pickup_location,
                }
              : {}),

            ...(payload.delivery_notes
              ? {
                  delivery_notes:
                    payload.delivery_notes,
                }
              : {}),

            ...(payload.request
              ? {
                  request: {
                    description:
                      payload.request.description,
                    // Forward the files array — previously this
                    // was omitted entirely, so images never reached
                    // the service or Supabase Storage.
                    imageFiles:
                      payload.request.imageFiles ?? [],
                  },
                }
              : {}),

            items:
              payload.items.map(
                (item) => ({
                  furniture_id:
                    item.furniture_id,

                  quantity:
                    item.quantity,

                  ...(item.variant_id
                    ? {
                        variant_id:
                          item.variant_id,
                      }
                    : {}),
                })
              ),
          };

        return createOrder(
          cleanedPayload
        );
      },

      /**
       * =========================================================
       * SUCCESS
       * =========================================================
       */
      onSuccess: async (
        newOrder
      ) => {
        console.log(
          "✅ ORDER CREATED:",
          newOrder.id
        );

        /**
         * refresh list
         */
        await queryClient.invalidateQueries(
          {
            queryKey:
              userOrderKeys.lists(),
          }
        );

        /**
         * seed detail cache
         */
        queryClient.setQueryData(
          userOrderKeys.detail(
            newOrder.id
          ),

          newOrder
        );
      },

      /**
       * =========================================================
       * ERROR
       * =========================================================
       */
      onError: (error) => {
        console.error(
          "❌ ORDER CREATION FAILED:",
          error.message
        );
      },
    });

  return {
    /**
     * =========================================================
     * ACTIONS
     * =========================================================
     */
    createOrder:
      mutation.mutate,

    createOrderAsync:
      mutation.mutateAsync,

    /**
     * =========================================================
     * STATES
     * =========================================================
     */
    isPending:
      mutation.isPending,

    isLoading:
      mutation.isPending,

    isError:
      mutation.isError,

    error:
      mutation.error,

    isSuccess:
      mutation.isSuccess,

    /**
     * =========================================================
     * UTIL
     * =========================================================
     */
    reset:
      mutation.reset,
  };
}