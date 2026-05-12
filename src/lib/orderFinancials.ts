import type { Order } from "@/types/order";

/**
 * Charge coming from DB or hook
 */
export type Charge = {
  amount: number;
  is_additive: boolean;
};

/**
 * Payment coming from payments table (PayMongo/manual/etc)
 */
export type Payment = {
  amount: number;
  status: "pending" | "paid" | "failed" | "refunded" | string;
};

export type OrderFinancials = {
  subtotal: number;
  chargesTotal: number;
  finalTotal: number;

  totalPaid: number;
  remaining: number;

  isFullyPaid: boolean;
};

/**
 * =========================================================
 * SINGLE SOURCE OF TRUTH (ADMIN + USER + PAYMENTS)
 * =========================================================
 */
export function calculateOrderFinancials(
  order: Order,
  charges: Charge[] = [],
  payments: Payment[] = []
): OrderFinancials {
  /**
   * 1. SUBTOTAL (order items)
   */
  const subtotal =
    order.order_items?.reduce(
      (sum, item) => sum + Number(item.total_price ?? 0),
      0
    ) ?? 0;

  /**
   * 2. CHARGES TOTAL
   */
  const chargesTotal = charges.reduce((total, charge) => {
    const amount = Number(charge.amount ?? 0);
    return charge.is_additive ? total + amount : total - amount;
  }, 0);

  /**
   * 3. FINAL TOTAL (locked after accepted charges)
   */
  const isChargesAccepted = order.charge_status === "accepted";

  const finalTotal =
    isChargesAccepted && order.final_total_price != null
      ? Number(order.final_total_price)
      : subtotal + chargesTotal;

  /**
   * 4. TOTAL PAID (FROM PAYMENTS TABLE — SOURCE OF TRUTH)
   * Only count successful payments
   */
  const totalPaid = payments.reduce((sum, p) => {
    if (p.status !== "paid") return sum;
    return sum + Number(p.amount ?? 0);
  }, 0);

  /**
   * 5. REMAINING BALANCE
   */
  const remaining = Math.max(finalTotal - totalPaid, 0);

  return {
    subtotal,
    chargesTotal,
    finalTotal,
    totalPaid,
    remaining,
    isFullyPaid: remaining <= 0,
  };
}