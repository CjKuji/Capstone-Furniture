import { supabase } from "@/lib/supabase";
import {
  calculatePaymentBreakdown,
  PaymentType,
} from "@/utils/paymentCalculator";

/**
 * =========================================================
 * TYPES
 * =========================================================
 */
type CreatePaymentParams = {
  orderId: string;
  userId: string;
  type: PaymentType;
};

/**
 * =========================================================
 * DERIVE ORDER PAYMENT STATUS
 * =========================================================
 */
function derivePaymentStatus(total: number, totalPaid: number) {
  if (totalPaid <= 0) return "unpaid";
  if (totalPaid >= total) return "fully_paid";
  return "partially_paid";
}

/**
 * =========================================================
 * CREATE PAYMENT (CLEAN RETRY-SAFE FLOW)
 * =========================================================
 *
 * RULES:
 * - Always new payment row per attempt
 * - Cancel old pending payments only
 * - Paid payments are immutable source of truth
 * - No intent tracking
 */
export async function createPayment({
  orderId,
  userId,
  type,
}: CreatePaymentParams) {
  /**
   * 1. FETCH ORDER
   */
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, final_total_price, quote_total_price")
    .eq("id", orderId)
    .single();

  if (orderError || !order) throw new Error("Order not found");

  const total = Number(
    order.final_total_price ?? order.quote_total_price ?? 0
  );

  if (total <= 0) throw new Error("Invalid order total");

  /**
   * 2. GET PAID PAYMENTS (SOURCE OF TRUTH)
   */
  const { data: paidPayments } = await supabase
    .from("payments")
    .select("amount")
    .eq("order_id", orderId)
    .eq("status", "paid");

  const totalPaid = (paidPayments || []).reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0
  );

  const remaining = Math.max(total - totalPaid, 0);

  if (remaining <= 0) {
    throw new Error("Order already fully paid");
  }

  /**
   * 3. CANCEL OLD PENDING PAYMENTS (SAFE RETRY RESET)
   */
  await supabase
    .from("payments")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("order_id", orderId)
    .eq("status", "pending");

  /**
   * 4. CALCULATE NEXT PAYMENT AMOUNT
   */
  const breakdown = calculatePaymentBreakdown(
    total,
    totalPaid,
    type
  );

  const amountToPay = Math.min(breakdown.payNow, remaining);

  if (amountToPay <= 0) {
    throw new Error("Invalid payment amount");
  }

  /**
   * 5. CREATE NEW PAYMENT ROW (ALWAYS FRESH)
   */
  const { data: payment, error } = await supabase
    .from("payments")
    .insert({
      order_id: orderId,
      user_id: userId,
      amount: amountToPay,
      currency: "PHP",
      provider: "paymongo",
      status: "pending",
      external_reference: orderId,
      computed_from_order: true,
    })
    .select()
    .single();

  if (error || !payment) {
    throw new Error(error?.message || "Failed to create payment");
  }

  /**
   * 6. RETURN RESULT
   */
  return {
    payment,
    breakdown: {
      ...breakdown,
      total,
      totalPaid,
      remaining,
      amountToPay,
    },
  };
}

/**
 * =========================================================
 * HANDLE PAYMENT SUCCESS (WEBHOOK FINALIZER)
 * =========================================================
 */
export async function handlePaymentSuccess(paymentId: string) {
  /**
   * 1. FETCH PAYMENT
   */
  const { data: payment, error } = await supabase
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .single();

  if (error || !payment) throw new Error("Payment not found");

  /**
   * 2. IDEMPOTENCY CHECK
   */
  if (payment.status === "paid") {
    return { success: true, alreadyProcessed: true };
  }

  /**
   * 3. MARK PAYMENT AS PAID
   */
  await supabase
    .from("payments")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", paymentId);

  /**
   * 4. RECALCULATE ORDER FROM SOURCE OF TRUTH
   */
  const { data: order } = await supabase
    .from("orders")
    .select("final_total_price, quote_total_price")
    .eq("id", payment.order_id)
    .single();

  const total = Number(
    order?.final_total_price ?? order?.quote_total_price ?? 0
  );

  const { data: paidPayments } = await supabase
    .from("payments")
    .select("amount")
    .eq("order_id", payment.order_id)
    .eq("status", "paid");

  const totalPaid = (paidPayments || []).reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0
  );

  const remaining = Math.max(total - totalPaid, 0);

  const paymentStatus = derivePaymentStatus(total, totalPaid);

  /**
   * 5. UPDATE ORDER STATUS
   */
  await supabase
    .from("orders")
    .update({
      payment_status: paymentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payment.order_id);

  return {
    success: true,
    total,
    totalPaid,
    remaining,
    paymentStatus,
    isFullyPaid: paymentStatus === "fully_paid",
  };
}