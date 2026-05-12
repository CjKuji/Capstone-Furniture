import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * GET PAYMENT + ORDER STATUS
 *
 * Used by:
 * - /payment/success page
 *
 * Source of truth:
 * - payments.status (pending | paid)
 * - orders.payment_status (unpaid | partially_paid | fully_paid)
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
     * 1. Get payment
     */
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("id, status, amount, order_id")
      .eq("id", paymentId)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    /**
     * 2. Get order status
     */
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, payment_status")
      .eq("id", payment.order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    /**
     * 3. Return clean response
     */
    return NextResponse.json({
      paymentId: payment.id,
      paymentStatus: payment.status, // "pending" | "paid"
      orderId: order.id,
      orderPaymentStatus: order.payment_status, // "unpaid" | "partially_paid" | "fully_paid"
      amount: payment.amount,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: err.message || "Failed to fetch payment status",
      },
      { status: 500 }
    );
  }
}