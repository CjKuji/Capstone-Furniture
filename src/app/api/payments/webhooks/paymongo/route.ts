import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * =========================================================
 * PAYMONGO WEBHOOK (FINAL SOURCE OF TRUTH)
 * =========================================================
 * RULES:
 * - DB is source of truth
 * - Only "paid" is a final state
 * - No external calculator usage (re-sums DB values)
 * - Idempotent + safe for replays
 * - Bypasses RLS utilizing supabaseAdmin
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
    let query = supabaseAdmin.from("payments").select("*");

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
    const { error: updateError } = await supabaseAdmin
      .from("payments")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        raw_response: payload,
        webhook_event_id: webhookEventId,
        webhook_received_at: new Date().toISOString(),
      } as any)
      .eq("id", payment.id);

    if (updateError) {
      throw new Error(`Failed to update payment: ${updateError.message}`);
    }

    /**
     * 6. ATTACHMENT REFERENCE VERIFICATION
     */
    if (!payment.order_id && !payment.inquiry_id) {
      throw new Error("Payment record is missing a valid relation to an order_id or inquiry_id");
    }

    /**
     * 7. DYNAMIC PIPELINE SPLIT: RECALCULATE STATE FROM SOURCE OF TRUTH
     */
    let finalCalculatedTotal = 0;
    let totalPaidSum = 0;
    let computedPaymentStatus: "unpaid" | "partially_paid" | "fully_paid" = "unpaid";

    if (payment.order_id) {
      // --- WORKFLOW BRANCH: STANDARD ORDER ---
      const { data: order, error: orderError } = await supabaseAdmin
        .from("orders")
        .select("id, final_total_price, quote_total_price")
        .eq("id", payment.order_id)
        .single();

      if (orderError || !order) {
        throw new Error("Associated order not found");
      }

      finalCalculatedTotal = Number(order.final_total_price ?? order.quote_total_price ?? 0);

      const { data: paidPayments, error: paidError } = await supabaseAdmin
        .from("payments")
        .select("amount")
        .eq("order_id", payment.order_id)
        .eq("status", "paid");

      if (paidError) {
        throw new Error(`Failed to fetch paid payments for order: ${paidError.message}`);
      }

      totalPaidSum = paidPayments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;

      if (totalPaidSum <= 0) {
        computedPaymentStatus = "unpaid";
      } else if (totalPaidSum < finalCalculatedTotal) {
        computedPaymentStatus = "partially_paid";
      } else {
        computedPaymentStatus = "fully_paid";
      }

      const { error: orderUpdateError } = await supabaseAdmin
        .from("orders")
        .update({
          payment_status: computedPaymentStatus,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", payment.order_id);

      if (orderUpdateError) {
        throw new Error(`Order update failed: ${orderUpdateError.message}`);
      }

    } else if (payment.inquiry_id) {
      // --- WORKFLOW BRANCH: CUSTOM WORKSHOP INQUIRY ---
      const { data: inquiryData, error: inquiryError } = await supabaseAdmin
        .from("inquiries")
        .select("id, final_total_price" as any)
        .eq("id", payment.inquiry_id)
        .single();

      if (inquiryError || !inquiryData) {
        throw new Error("Associated custom workshop inquiry not found");
      }

      const inquiry = inquiryData as any;
      finalCalculatedTotal = Number(inquiry.final_total_price ?? 0);

      const { data: paidPayments, error: paidError } = await supabaseAdmin
        .from("payments")
        .select("amount")
        .eq("inquiry_id", payment.inquiry_id)
        .eq("status", "paid");

      if (paidError) {
        throw new Error(`Failed to fetch paid payments for inquiry: ${paidError.message}`);
      }

      totalPaidSum = paidPayments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;

      if (totalPaidSum <= 0) {
        computedPaymentStatus = "unpaid";
      } else if (totalPaidSum < finalCalculatedTotal) {
        computedPaymentStatus = "partially_paid";
      } else {
        computedPaymentStatus = "fully_paid";
      }

      // STREAMLINED PIPELINE ROUTER:
      // If fully paid, send it straight to 'in_production'.
      // If it's only partially paid or unpaid, it safely remains under review ('under_review').
      let dynamicWorkflowStatus = "under_review";
      if (computedPaymentStatus === "fully_paid") {
        dynamicWorkflowStatus = "in_production";
      }

      const { error: inquiryUpdateError } = await supabaseAdmin
        .from("inquiries")
        .update({
          payment_status: computedPaymentStatus,
          status: dynamicWorkflowStatus, 
          charge_status: "accepted",     
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", payment.inquiry_id);

      if (inquiryUpdateError) {
        throw new Error(`Inquiry update failed: ${inquiryUpdateError.message}`);
      }
    }

    const remaining = Math.max(finalCalculatedTotal - totalPaidSum, 0);

    /**
     * 8. FINAL SUCCESS RESPONSE
     */
    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      orderId: payment.order_id || null,
      inquiryId: payment.inquiry_id || null,
      total: finalCalculatedTotal,
      totalPaid: totalPaidSum,
      remaining,
      paymentStatus: computedPaymentStatus,
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