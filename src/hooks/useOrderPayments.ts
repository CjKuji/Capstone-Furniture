"use client";

import { useQuery } from "@tanstack/react-query";
import type { Payment } from "@/lib/orderFinancials";

type PaymentRow = {
  amount: number;
  status: string;
};

async function fetchOrderPayments(orderId: string): Promise<Payment[]> {
  const res = await fetch(`/api/payments?orderId=${orderId}`);

  if (!res.ok) {
    throw new Error("Failed to fetch payments");
  }

  const data: PaymentRow[] = await res.json();

  return data.map((p) => ({
    amount: Number(p.amount ?? 0),
    status: p.status,
  }));
}

/**
 * =========================================================
 * PAYMENTS HOOK
 * =========================================================
 */
export function useOrderPayments(orderId: string) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["order-payments", orderId],
    queryFn: () => fetchOrderPayments(orderId),
    enabled: !!orderId,
  });

  return {
    payments: data,
    loading: isLoading,
  };
}