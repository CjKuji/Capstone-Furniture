import { NextResponse } from "next/server";

import { createPayment } from "@/services/payments/paymentsService";
import { createPaymongoCheckout } from "@/services/payments/paymongoService";

import type { PaymentType } from "@/utils/paymentCalculator";

/**
 * =========================================================
 * TYPES
 * =========================================================
 */
type CreateCheckoutBody = {
  orderId: string;
  userId: string;
  type: PaymentType;
};

/**
 * =========================================================
 * HEALTH CHECK
 * =========================================================
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: "create-checkout route is alive",
  });
}

/**
 * =========================================================
 * CREATE CHECKOUT (FINAL CLEAN FLOW)
 * =========================================================
 *
 * FLOW:
 * 1. Validate input
 * 2. Create NEW payment row (always fresh on retry)
 * 3. Compute amount via calculator inside service
 * 4. Create PayMongo checkout from payment.amount
 * 5. Return checkout URL
 */
export async function POST(req: Request) {
  try {
    /**
     * ---------------------------------------------------------
     * 1. PARSE BODY
     * ---------------------------------------------------------
     */
    const body: CreateCheckoutBody = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { orderId, userId, type } = body;

    /**
     * ---------------------------------------------------------
     * 2. VALIDATION
     * ---------------------------------------------------------
     */
    if (!orderId || !userId || !type) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (type !== "partial" && type !== "full") {
      return NextResponse.json(
        { success: false, error: "Invalid payment type" },
        { status: 400 }
      );
    }

    /**
     * ---------------------------------------------------------
     * 3. CREATE PAYMENT (ALWAYS NEW ROW ON RETRY)
     * ---------------------------------------------------------
     *
     * IMPORTANT RULE:
     * - No reuse logic here
     * - Every retry = new payment row
     * - Calculator only determines amount
     */
    const { payment, breakdown } = await createPayment({
      orderId,
      userId,
      type,
    });

    if (!payment?.id) {
      throw new Error("Failed to create payment");
    }

    /**
     * ---------------------------------------------------------
     * 4. CREATE PAYMONGO CHECKOUT
     * ---------------------------------------------------------
     *
     * IMPORTANT:
     * - PayMongo NEVER calculates amount
     * - It only reads payment.amount
     */
    const checkout = await createPaymongoCheckout({
      paymentId: payment.id,
      description:
        type === "partial"
          ? "Furniture Order Downpayment (50%)"
          : "Furniture Order Full Payment",
    });

    if (!checkout?.checkoutUrl) {
      throw new Error("Failed to create checkout session");
    }

    /**
     * ---------------------------------------------------------
     * 5. RESPONSE
     * ---------------------------------------------------------
     */
    return NextResponse.json({
      success: true,

      /**
       * PAYMENT (SOURCE OF TRUTH)
       */
      payment: {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
      },

      /**
       * PAYMONGO CHECKOUT
       */
      checkoutId: checkout.checkoutId,
      checkoutUrl: checkout.checkoutUrl,
      paymentIntentId: checkout.paymentIntentId,

      /**
       * CALCULATOR OUTPUT (UI ONLY)
       */
      breakdown: {
        total: breakdown.total,
        totalPaid: breakdown.totalPaid,
        remaining: breakdown.remaining,
        payNow: breakdown.payNow,
        remainingAfterPayment: breakdown.remainingAfterPayment,
        previewPaymentStatus: breakdown.previewPaymentStatus,
      },
    });
  } catch (err: any) {
    console.error("CREATE CHECKOUT ERROR:", err);

    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Failed to create checkout",
      },
      { status: 500 }
    );
  }
}