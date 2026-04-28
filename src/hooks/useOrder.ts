"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { paymentAggregateService } from "@/services/orders/paymentAggregateService";

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const { data: order, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (*),
          order_quote_items (*)
        `)
        .eq("id", orderId)
        .single();

      if (error) throw error;

      const payment =
        await paymentAggregateService.getPaymentSummary(orderId);

      return {
        order,
        payment,
      };
    },
    enabled: !!orderId,
  });
}