import { supabase } from "@/lib/supabase";
import type { PaymentStatus } from "@/types/enums";

/**
 * =========================================================
 * PAYMENT AGGREGATE SERVICE
 * =========================================================
 * RULE:
 * - Payment system ONLY activates AFTER quote exists
 * - null quote = inactive system → always "unpaid"
 * =========================================================
 */

/**
 * Get total paid amount (ONLY verified payments)
 */
async function getTotalPaid(orderId: string): Promise<number> {
  const { data, error } = await supabase
    .from("payments")
    .select("amount, verified_at")
    .eq("order_id", orderId)
    .not("verified_at", "is", null);

  if (error) throw error;

  return (data ?? []).reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0
  );
}

/**
 * Get quote total (STRICT NULL SAFETY)
 */
async function getOrderTotal(orderId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from("orders")
    .select("quote_total_price")
    .eq("id", orderId)
    .maybeSingle(); // IMPORTANT: prevents forced object assumption

  if (error) throw error;

  const total = data?.quote_total_price;

  if (total === null || total === undefined) {
    return null;
  }

  const numeric = Number(total);

  if (Number.isNaN(numeric)) {
    return null;
  }

  return numeric;
}

/**
 * =========================================================
 * CORE PAYMENT STATUS LOGIC
 * =========================================================
 */
async function calculatePaymentStatus(
  orderId: string
): Promise<PaymentStatus> {
  const [paid, total] = await Promise.all([
    getTotalPaid(orderId),
    getOrderTotal(orderId),
  ]);

  /**
   * ---------------------------------------------------------
   * 1. NO QUOTE → PAYMENT SYSTEM DISABLED
   * ---------------------------------------------------------
   */
  if (total === null) {
    return "unpaid";
  }

  /**
   * ---------------------------------------------------------
   * 2. INVALID QUOTE SAFETY GUARD
   * ---------------------------------------------------------
   */
  if (total <= 0) {
    return "unpaid";
  }

  /**
   * ---------------------------------------------------------
   * 3. NO PAYMENT YET
   * ---------------------------------------------------------
   */
  if (paid <= 0) {
    return "unpaid";
  }

  /**
   * ---------------------------------------------------------
   * 4. PARTIAL PAYMENT
   * ---------------------------------------------------------
   */
  if (paid < total) {
    return "partially_paid";
  }

  /**
   * ---------------------------------------------------------
   * 5. FULL PAYMENT
   * ---------------------------------------------------------
   */
  return "fully_paid";
}

/**
 * =========================================================
 * DEBUG / INSPECTION TOOL
 * =========================================================
 */
async function getPaymentSummary(orderId: string) {
  const [paid, total, status] = await Promise.all([
    getTotalPaid(orderId),
    getOrderTotal(orderId),
    calculatePaymentStatus(orderId),
  ]);

  return {
    orderId,
    total,
    paid,
    remaining: total !== null ? Math.max(total - paid, 0) : null,
    status,
  };
}

/**
 * =========================================================
 * EXPORT
 * =========================================================
 */
export const paymentAggregateService = {
  getTotalPaid,
  getOrderTotal,
  calculatePaymentStatus,
  getPaymentSummary,
};