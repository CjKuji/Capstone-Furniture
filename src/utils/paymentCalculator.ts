export type PaymentType = "full" | "partial";

export type PaymentStatus =
  | "unpaid"
  | "partially_paid"
  | "fully_paid";

export type PaymentBreakdown = {
  total: number;
  totalPaid: number;
  remaining: number;

  /**
   * Amount THIS checkout should charge
   */
  payNow: number;

  /**
   * Remaining AFTER this payment succeeds
   */
  remainingAfterPayment: number;

  /**
   * UI preview ONLY (after successful payment)
   */
  previewPaymentStatus: PaymentStatus;
};

const DOWNPAYMENT_RATE = 0.5;

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

/**
 * =========================================================
 * PAYMENT CALCULATOR (SIMPLE + PRODUCTION SAFE)
 * =========================================================
 *
 * RULES:
 * - Only computes NEXT payment amount
 * - Does NOT track intent state
 * - Does NOT assume system flow
 * - Works with "always new payment row" architecture
 */
export function calculatePaymentBreakdown(
  total: number,
  totalPaid: number,
  type: PaymentType
): PaymentBreakdown {
  /**
   * VALIDATION
   */
  if (!Number.isFinite(total) || total <= 0) {
    throw new Error("Invalid order total");
  }

  if (!Number.isFinite(totalPaid) || totalPaid < 0) {
    throw new Error("Invalid paid amount");
  }

  const safePaid = clamp(totalPaid, 0, total);
  const remaining = Math.max(total - safePaid, 0);

  /**
   * =========================================================
   * FULLY PAID
   * =========================================================
   */
  if (remaining === 0) {
    return {
      total,
      totalPaid: safePaid,
      remaining: 0,
      payNow: 0,
      remainingAfterPayment: 0,
      previewPaymentStatus: "fully_paid",
    };
  }

  /**
   * =========================================================
   * FULL PAYMENT
   * =========================================================
   * Always pay remaining balance
   */
  if (type === "full") {
    return {
      total,
      totalPaid: safePaid,
      remaining,

      payNow: remaining,
      remainingAfterPayment: 0,
      previewPaymentStatus: "fully_paid",
    };
  }

  /**
   * =========================================================
   * PARTIAL PAYMENT FLOW
   * =========================================================
   *
   * RULE:
   * - First payment must reach 50%
   * - After that, user can pay remaining freely
   */
  const requiredDownpayment = total * DOWNPAYMENT_RATE;

  const stillNeedDownpayment = Math.max(
    requiredDownpayment - safePaid,
    0
  );

  let payNow: number;

  if (stillNeedDownpayment > 0) {
    payNow = Math.min(stillNeedDownpayment, remaining);
  } else {
    payNow = remaining;
  }

  payNow = clamp(payNow, 0, remaining);

  const remainingAfterPayment = remaining - payNow;

  return {
    total,
    totalPaid: safePaid,
    remaining,

    payNow,
    remainingAfterPayment,

    previewPaymentStatus:
      remainingAfterPayment === 0
        ? "fully_paid"
        : "partially_paid",
  };
}