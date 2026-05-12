// services/payments/fetchPaymentsService.ts

import { supabase } from "@/lib/supabase";

/**
 * =========================================================
 * TYPES
 * =========================================================
 */

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "cancelled";

export type PaymentRow = {
  id: string;
  order_id: string;
  user_id: string;
  amount: number;
  status: PaymentStatus;
  created_at: string;
  paid_at: string | null;
};

/**
 * =========================================================
 * RESULT SUMMARY
 * =========================================================
 */

export type PaymentSummary = {
  payments: PaymentRow[];

  latestPayment: PaymentRow | null;

  totalPaid: number;
  totalPending: number;
  totalFailed: number;
};

/**
 * =========================================================
 * EMPTY FALLBACK
 * =========================================================
 */

export const EMPTY_PAYMENT_SUMMARY: PaymentSummary = {
  payments: [],

  latestPayment: null,

  totalPaid: 0,
  totalPending: 0,
  totalFailed: 0,
};

/**
 * =========================================================
 * SAFE NUMBER PARSER
 * =========================================================
 */

function toSafeAmount(value: unknown): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return parsed;
}

/**
 * =========================================================
 * FETCH PAYMENTS BY ORDER
 * =========================================================
 */

export async function fetchPaymentsByOrder(
  orderId: string
): Promise<PaymentSummary> {
  /**
   * ---------------------------------------------------------
   * VALIDATION
   * ---------------------------------------------------------
   */

  if (!orderId || typeof orderId !== "string") {
    return EMPTY_PAYMENT_SUMMARY;
  }

  /**
   * ---------------------------------------------------------
   * FETCH PAYMENTS
   * ---------------------------------------------------------
   */

  const { data, error } = await supabase
    .from("payments")
    .select(
      `
      id,
      order_id,
      user_id,
      amount,
      status,
      created_at,
      paid_at
      `
    )
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });

  /**
   * ---------------------------------------------------------
   * HANDLE ERROR
   * ---------------------------------------------------------
   */

  if (error) {
    console.error(
      "[fetchPaymentsByOrder] Failed to fetch payments:",
      error.message
    );

    throw new Error(error.message);
  }

  /**
   * ---------------------------------------------------------
   * NORMALIZE PAYMENTS
   * ---------------------------------------------------------
   */

  const payments: PaymentRow[] = Array.isArray(data)
    ? (data as PaymentRow[])
    : [];

  /**
   * ---------------------------------------------------------
   * INITIAL TOTALS
   * ---------------------------------------------------------
   */

  let totalPaid = 0;
  let totalPending = 0;
  let totalFailed = 0;

  /**
   * ---------------------------------------------------------
   * AGGREGATE TOTALS
   * ---------------------------------------------------------
   */

  for (const payment of payments) {
    const amount = toSafeAmount(payment.amount);

    switch (payment.status) {
      case "paid":
        totalPaid += amount;
        break;

      case "pending":
        totalPending += amount;
        break;

      case "failed":
      case "cancelled":
        totalFailed += amount;
        break;

      default:
        break;
    }
  }

  /**
   * ---------------------------------------------------------
   * RETURN CLEAN SUMMARY
   * ---------------------------------------------------------
   */

  return {
    payments,

    latestPayment:
      payments.length > 0
        ? payments[0]
        : null,

    totalPaid,
    totalPending,
    totalFailed,
  };
}