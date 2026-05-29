import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * =========================================================
 * PAYMONGO WEBHOOK (FINAL SOURCE OF TRUTH)
 * =========================================================
 * * RULES:
 * - DB is source of truth
 * - Only "paid" is a final state
 * - No external calculator usage (re-sums DB values)
 * - Idempotent + safe for replays
 */

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    /**
     * 1. EXTRACT EVENT DATA
     */
    const eventType = payload?.data?.attributes?.type;
    const eventData = payload?.data?.attributes?.data?.attributes;

    // Support both Checkout Session and Payment Intent structures
    const checkoutSessionId =
      eventData?.checkout_session_id ||
      eventData?.checkout_session?.id;

    const paymentIntentId =
      eventData?.payment_intent?.id ||
      eventData?.payment_intent_id;

    const paymentId = eventData?.metadata?.payment_id ?? null;
    const webhookEventId = payload?.data?.id ?? null;

    console.log("🔥 PayMongo Webhook Received:", {
      eventType,
      paymentId,
      checkoutSessionId,
      paymentIntentId,
    });

    /**
     * 2. FILTER ONLY SUCCESS EVENTS
     */
    const isSuccessEvent =
      eventType === "checkout_session.payment.paid" ||
      eventType === "payment.paid";

    if (!isSuccessEvent) {
      return NextResponse.json({
        success: true,
        message: "Ignored non-payment event",
      });
    }

    /**
     * 3. FIND PAYMENT (ROBUST MATCHING)
     */
    let query = supabase.from("payments").select("*");

    if (paymentId) {
      query = query.eq("id", paymentId);
    } else if (checkoutSessionId) {
      query = query.eq("checkout_session_id", checkoutSessionId);
    } else if (paymentIntentId) {
      query = query.eq("payment_intent_id", paymentIntentId);
    } else {
      return NextResponse.json(
        { error: "No identifiers found in webhook payload" },
        { status: 400 }
      );
    }

    const { data: payment, error: paymentError } = await query.single();

    if (paymentError || !payment) {
      return NextResponse.json(
        { error: "Payment record not found in database" },
        { status: 404 }
      );
    }

    /**
     * 4. IDEMPOTENCY CHECK (CRITICAL)
     */
    if (payment.status === "paid") {
      return NextResponse.json({
        success: true,
        message: "Already processed",
        paymentId: payment.id,
      });
    }

    /**
     * 5. MARK PAYMENT AS PAID
     */
    const { error: updateError } = await supabase
      .from("payments")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        raw_response: payload,
        webhook_event_id: webhookEventId,
        webhook_received_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    if (updateError) {
      throw new Error(`Failed to update payment: ${updateError.message}`);
    }

    /**
     * 6. RECALCULATE ORDER TOTALS (DB ONLY)
     */
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, final_total_price, quote_total_price")
      .eq("id", payment.order_id)
      .single();

    if (orderError || !order) {
      throw new Error("Associated order not found");
    }

    const orderTotal = Number(
      order.final_total_price ?? order.quote_total_price ?? 0
    );

    // Sum all successful payments for this order
    const { data: paidPayments, error: paidError } = await supabase
      .from("payments")
      .select("amount")
      .eq("order_id", payment.order_id)
      .eq("status", "paid");

    if (paidError) {
      throw new Error(`Failed to fetch paid payments: ${paidError.message}`);
    }

    const totalPaid =
      paidPayments?.reduce(
        (sum, p) => sum + Number(p.amount || 0),
        0
      ) || 0;

    const remaining = Math.max(orderTotal - totalPaid, 0);

    /**
     * 7. DETERMINE ORDER STATUS
     */
    let paymentStatus: "unpaid" | "partially_paid" | "fully_paid";

    if (totalPaid <= 0) {
      paymentStatus = "unpaid";
    } else if (totalPaid < orderTotal) {
      paymentStatus = "partially_paid";
    } else {
      paymentStatus = "fully_paid";
    }

    /**
     * 8. UPDATE ORDER RECORD
     */
    const { error: orderUpdateError } = await supabase
      .from("orders")
      .update({
        payment_status: paymentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.order_id);

    if (orderUpdateError) {
      throw new Error(`Order update failed: ${orderUpdateError.message}`);
    }

    /**
     * 9. FINAL SUCCESS RESPONSE
     */
    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      orderId: payment.order_id,
      total: orderTotal,
      totalPaid,
      remaining,
      paymentStatus,
    });

  } catch (err: any) {
    console.error("🔥 WEBHOOK CRITICAL ERROR:", err);

    return NextResponse.json(
      {
        success: false,
        error: err.message || "Internal Webhook Error",
      },
      { status: 500 }
    );
  }
}