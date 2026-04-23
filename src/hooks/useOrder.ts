"use client";

import { useEffect, useState, useCallback } from "react";
import { getOrders, updateOrder } from "@/services/orderService";
import type { Order } from "@/types/order";

export function useOrders() {
  const [data, setData] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await getOrders();
      setData(res);
    } catch {
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(async (id: string, payload: Partial<Order>) => {
    await updateOrder(id, payload);
    await fetch();
  }, [fetch]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    data,
    loading,
    error,
    update,
    refetch: fetch,
  };
}