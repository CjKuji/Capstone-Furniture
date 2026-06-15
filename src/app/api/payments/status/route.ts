import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET PAYMENT + ORDER / INQUIRY STATUS
 *
 * Used by:
 * - /payment/success page
 *
 * Source of truth:
 * - payments.status (pending | paid)
 * - orders.payment_status OR inquiries.payment_status
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get("paymentId");

    if (!paymentId) {
      return NextResponse.json(
        { error: "Missing paymentId" },
        { status: 400 }
      );
    }

    /**
     * 1. Get payment record
     */
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .select("id, status, amount, order_id, inquiry_id")
      .eq("id", paymentId)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    /**
     * 2. Split workflows dynamically depending on target reference
     */
    if (payment.order_id) {
      // --- STANDARD ORDER VERIFICATION ---
      const { data: order, error: orderError } = await supabaseAdmin
        .from("orders")
        .select("id, payment_status")
        .eq("id", payment.order_id)
        .single();

      if (orderError || !order) {
        return NextResponse.json(
          { error: "Associated order record not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        paymentId: payment.id,
        paymentStatus: payment.status,
        amount: payment.amount,
        type: "order",
        orderId: order.id,
        orderPaymentStatus: order.payment_status,
      });

    } else if (payment.inquiry_id) {
      // --- CUSTOM INQUIRY VERIFICATION ---
      // We cast the select filter query through 'as any' to prevent the compiler SelectQueryError mismatch
      const { data: inquiry, error: inquiryError } = await supabaseAdmin
        .from("inquiries")
        .select("id, payment_status" as any)
        .eq("id", payment.inquiry_id)
        .single();

      if (inquiryError || !inquiry) {
        return NextResponse.json(
          { error: "Associated custom inquiry record not found" },
          { status: 404 }
        );
      }

      // Safe explicit cast allows reading data properties without build step warnings
      const typedInquiry = inquiry as any;

      return NextResponse.json({
        paymentId: payment.id,
        paymentStatus: payment.status,
        amount: payment.amount,
        type: "inquiry",
        inquiryId: typedInquiry.id,
        inquiryPaymentStatus: typedInquiry.payment_status,
      });
    }

    /**
     * Fallback error guard if neither key is provided
     */
    return NextResponse.json(
      { error: "Payment record is missing a corresponding order or inquiry tracking ID" },
      { status: 422 }
    );

  } catch (err: any) {
    return NextResponse.json(
      {
        error: err.message || "Failed to fetch payment status",
      },
      { status: 500 }
    );
  }
}