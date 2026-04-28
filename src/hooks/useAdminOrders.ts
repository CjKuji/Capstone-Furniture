"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { OrderAdmin } from "@/types/order";

/**
 * =========================================================
 * QUERY KEYS
 * =========================================================
 */
export const adminOrderKeys = {
  all: ["admin-orders"] as const,
  lists: () => [...adminOrderKeys.all, "list"] as const,
  detail: (id: string) => [...adminOrderKeys.all, "detail", id] as const,
};

/**
 * =========================================================
 * FETCH ALL ORDERS (ADMIN)
 * =========================================================
 */
async function fetchAdminOrders(): Promise<OrderAdmin[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (
        *
      )
    `)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []) as OrderAdmin[];
}

/**
 * =========================================================
 * FETCH SINGLE ORDER (ADMIN)
 * =========================================================
 */
async function fetchAdminOrder(orderId: string): Promise<OrderAdmin> {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (
        *
      )
    `)
    .eq("id", orderId)
    .single();

  if (error || !data) throw new Error("Order not found");

  return data as OrderAdmin;
}

/**
 * =========================================================
 * HOOK: ALL ORDERS
 * =========================================================
 */
export function useAdminOrders() {
  return useQuery<OrderAdmin[]>({
    queryKey: adminOrderKeys.lists(),
    queryFn: fetchAdminOrders,
    staleTime: 30_000,
  });
}

/**
 * =========================================================
 * HOOK: SINGLE ORDER
 * =========================================================
 */
export function useAdminOrder(orderId?: string) {
  return useQuery<OrderAdmin>({
    queryKey: adminOrderKeys.detail(orderId ?? ""),
    queryFn: () => {
      if (!orderId) throw new Error("Missing orderId");
      return fetchAdminOrder(orderId);
    },
    enabled: !!orderId,
    staleTime: 30_000,
  });
}

/**
 * =========================================================
 * INVALIDATION HELPERS
 * =========================================================
 */
export function useAdminOrderActions() {
  const queryClient = useQueryClient();

  const invalidateOrders = () => {
    queryClient.invalidateQueries({
      queryKey: adminOrderKeys.all,
    });
  };

  return { invalidateOrders };
}