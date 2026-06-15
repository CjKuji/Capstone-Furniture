import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  calculatePaymentBreakdown,
  PaymentType,
} from "@/utils/paymentCalculator";

/**
 * =========================================================
 * TYPES
 * =========================================================
 * */
type CreatePaymentParams = {
  orderId?: string;     // Made optional to support inquiries
  inquiryId?: string;   // Added to support inquiries
  userId: string;
  type: PaymentType;
};

/**
 * =========================================================
 * DERIVE ORDER / INQUIRY PAYMENT STATUS
 * =========================================================
 * */
function derivePaymentStatus(total: number, totalPaid: number) {
  if (totalPaid <= 0) return "unpaid";
  if (totalPaid >= total) return "fully_paid";
  return "partially_paid";
}

/**
 * =========================================================
 * CREATE PAYMENT (CLEAN RETRY-SAFE FLOW)
 * =========================================================
 * */
export async function createPayment({
  orderId,
  inquiryId,
  userId,
  type,
}: CreatePaymentParams) {
  if (!orderId && !inquiryId) {
    throw new Error("Either orderId or inquiryId must be provided");
  }

  let total = 0;
  let totalPaid = 0;

  // Explicit type constraint matching your database keys prevents 'never' mapping errors
  const targetField: "order_id" | "inquiry_id" = orderId ? "order_id" : "inquiry_id";
  const targetId = orderId || inquiryId;

  /**
   * 1. FETCH TOTAL FROM SOURCE OF TRUTH (ORDER OR INQUIRY)
   */
  if (orderId) {
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id, final_total_price, quote_total_price")
      .eq("id", orderId)
      .single();

    if (orderError || !order) throw new Error("Order not found");
    total = Number(order.final_total_price ?? order.quote_total_price ?? 0);
  } else {
    // FIX: Swapped out 'total_price' column definition for 'final_total_price' matching database updates
    const { data: inquiry, error: inquiryError } = await supabaseAdmin
      .from("inquiries")
      .select("id, final_total_price")
      .eq("id", inquiryId!)
      .single();

    if (inquiryError || !inquiry) {
      console.error("Supabase Inquiry Database Query Error Trace:", inquiryError);
      throw new Error("Inquiry not found");
    }
    
    total = Number((inquiry as any).final_total_price ?? 0);
  }

  if (total <= 0) throw new Error("Invalid calculation total. Ensure charges are finalized first.");

  /**
   * 2. GET PAID PAYMENTS (SOURCE OF TRUTH)
   */
  const { data: paidPayments } = await supabaseAdmin
    .from("payments")
    .select("amount")
    .eq(targetField as any, targetId as any)
    .eq("status", "paid");

  totalPaid = (paidPayments || []).reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0
  );

  const remaining = Math.max(total - totalPaid, 0);

  if (remaining <= 0) {
    throw new Error("This transaction item is already fully paid");
  }

  /**
   * 3. CANCEL OLD PENDING PAYMENTS (SAFE RETRY RESET)
   */
  await supabaseAdmin
    .from("payments")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    } as any)
    .eq(targetField as any, targetId as any)
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
   * 5. CREATE NEW PAYMENT ROW
   */
  const { data: payment, error } = await supabaseAdmin
    .from("payments")
    .insert({
      order_id: orderId || null,
      inquiry_id: inquiryId || null,
      user_id: userId,
      amount: amountToPay,
      currency: "PHP",
      provider: "paymongo",
      status: "pending",
      external_reference: targetId,
      computed_from_order: !inquiryId,
    } as any)
    .select()
    .single();

  if (error || !payment) {
    throw new Error(error?.message || "Failed to create payment record");
  }

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
 * */
export async function handlePaymentSuccess(paymentId: string) {
  /**
   * 1. FETCH PAYMENT
   */
  const { data: payment, error } = await supabaseAdmin
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
   * 3. VERIFY THAT AN ATTACHMENT TARGET EXISTS
   */
  if (!payment.order_id && !payment.inquiry_id) {
    throw new Error("Payment is missing a corresponding order or inquiry reference.");
  }

  /**
   * 4. MARK PAYMENT AS PAID
   */
  await supabaseAdmin
    .from("payments")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any)
    .eq("id", paymentId);

  /**
   * 5. DYNAMIC RECALCULATION & ROUTING PIPELINE
   */
  let total = 0;
  let totalPaid = 0;
  let paymentStatus = "unpaid";

  if (payment.order_id) {
    // --- WORKFLOW: STANDARD ORDER ---
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("final_total_price, quote_total_price")
      .eq("id", payment.order_id)
      .single();

    total = Number(order?.final_total_price ?? order?.quote_total_price ?? 0);

    const { data: paidPayments } = await supabaseAdmin
      .from("payments")
      .select("amount")
      .eq("order_id" as any, payment.order_id)
      .eq("status", "paid");

    totalPaid = (paidPayments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);
    paymentStatus = derivePaymentStatus(total, totalPaid);

    await supabaseAdmin
      .from("orders")
      .update({
        payment_status: paymentStatus,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", payment.order_id);

  } else if (payment.inquiry_id) {
    // --- WORKFLOW: CUSTOM INQUIRY ---
    // FIX: Updated matching column to 'final_total_price' inside webhook parser block as well
    const { data: inquiry } = await supabaseAdmin
      .from("inquiries")
      .select("final_total_price")
      .eq("id", payment.inquiry_id)
      .single();

    total = Number((inquiry as any)?.final_total_price ?? 0);

    const { data: paidPayments } = await supabaseAdmin
      .from("payments")
      .select("amount")
      .eq("inquiry_id" as any, payment.inquiry_id)
      .eq("status", "paid");

    totalPaid = (paidPayments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);
    paymentStatus = derivePaymentStatus(total, totalPaid);

    // Update the parent custom inquiry's statuses dynamically
    await supabaseAdmin
      .from("inquiries")
      .update({
        payment_status: paymentStatus,
        charge_status: "accepted", // Auto-confirm configuration upon successful payload delivery
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", payment.inquiry_id);
  }

  const remaining = Math.max(total - totalPaid, 0);

  return {
    success: true,
    total,
    totalPaid,
    remaining,
    paymentStatus,
    isFullyPaid: paymentStatus === "fully_paid",
  };
}