"use client";

import { useQuery } from "@tanstack/react-query";

import {
  getMyOrders,
  getMyOrderById,
} from "@/services/orders/fetchOrderService";

import type { Order } from "@/types/order";

export type OrderWithItems = Order & {
  order_items: NonNullable<Order["order_items"]>;
};

export const userOrderKeys = {
  all: ["user-orders"] as const,
  lists: () => [...userOrderKeys.all, "list"] as const,
  list: () => [...userOrderKeys.lists()] as const,
  details: () => [...userOrderKeys.all, "detail"] as const,
  detail: (orderId: string) =>
    [...userOrderKeys.details(), orderId] as const,
};

export function useMyOrders() {
  return useQuery<OrderWithItems[], Error>({
    queryKey: userOrderKeys.list(),

    queryFn: async () => {
      console.log("🔥 ORDER DEBUG: getMyOrders()");

      const data = await getMyOrders();

      console.log("📦 RAW ORDERS:", data);

      const normalized = (data ?? []).map((order, index) => {
        console.log(`--- ORDER ${index + 1} ---`);
        console.log("ID:", order.id);
        console.log("ORDER ITEMS:", order.order_items);
        console.log("ITEM COUNT:", order.order_items?.length);

        order.order_items?.forEach((item, i) => {
          console.log(`  ITEM ${i + 1}:`, item);
          console.log("  furniture_snapshot:", item.furniture_snapshot);
          console.log("  variant_snapshot:", item.variant_snapshot);
          console.log("  model_snapshot_url:", item.model_snapshot_url);
        });

        return {
          ...order,
          order_items: order.order_items ?? [],
        };
      });

      return normalized;
    },
  });
}

export function useMyOrderById(orderId?: string) {
  return useQuery<OrderWithItems, Error>({
    queryKey: userOrderKeys.detail(orderId ?? ""),
    enabled: !!orderId,

    queryFn: async () => {
      if (!orderId) throw new Error("Order ID is required");

      const data = await getMyOrderById(orderId);

      console.log("🔥 SINGLE ORDER DEBUG:", data);

      return {
        ...data,
        order_items: data.order_items ?? [],
      };
    },
  });
}