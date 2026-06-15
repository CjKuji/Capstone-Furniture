// services/payments/fetchPaymentService.ts

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
  order_id: string | null;   // Nullable to support custom inquiries
  inquiry_id: string | null; // Added to support custom inquiries
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
 * CORE FETCH & AGGREGATE LOGIC (REUSABLE PIPELINE)
 * =========================================================
 */

export async function fetchPayments({
  orderId,
  inquiryId,
}: {
  orderId?: string;
  inquiryId?: string;
}): Promise<PaymentSummary> {
  /**
   * 1. VALIDATION
   */
  if (!orderId && !inquiryId) {
    return EMPTY_PAYMENT_SUMMARY;
  }

  // Choose the column target and its corresponding record identification key
  const targetField: "order_id" | "inquiry_id" = orderId ? "order_id" : "inquiry_id";
  const targetId = orderId || inquiryId;

  /**
   * 2. FETCH PAYMENTS
   */
  const { data, error } = await supabase
    .from("payments")
    .select(
      `
      id,
      order_id,
      inquiry_id,
      user_id,
      amount,
      status,
      created_at,
      paid_at
      `
    )
    .eq(targetField, targetId ?? "")
    .order("created_at", { ascending: false });

  /**
   * 3. HANDLE ERROR
   */
  if (error) {
    console.error(
      `[fetchPayments] Failed to fetch payments for ${targetField}:`,
      error.message
    );
    throw new Error(error.message);
  }

  /**
   * 4. NORMALIZE PAYMENTS
   */
  const payments: PaymentRow[] = Array.isArray(data)
    ? (data as PaymentRow[])
    : [];

  /**
   * 5. INITIAL TOTALS
   */
  let totalPaid = 0;
  let totalPending = 0;
  let totalFailed = 0;

  /**
   * 6. AGGREGATE TOTALS
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
   * 7. RETURN CLEAN SUMMARY
   */
  return {
    payments,
    latestPayment: payments.length > 0 ? payments[0] : null,
    totalPaid,
    totalPending,
    totalFailed,
  };
}

/**
 * =========================================================
 * BACKWARDS COMPATIBLE / WORKFLOW SPECIFIC WRAPPERS
 * =========================================================
 * FIX: Updated parameter typing definitions to cleanly accept string | undefined 
 * to handle loading states in your visual components seamlessly.
 */

export async function fetchPaymentsByOrder(orderId?: string | undefined): Promise<PaymentSummary> {
  if (!orderId) return EMPTY_PAYMENT_SUMMARY;
  return fetchPayments({ orderId });
}

export async function fetchPaymentsByInquiry(inquiryId?: string | undefined): Promise<PaymentSummary> {
  if (!inquiryId) return EMPTY_PAYMENT_SUMMARY;
  return fetchPayments({ inquiryId });
}