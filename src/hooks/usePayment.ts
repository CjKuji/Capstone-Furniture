"use client";

import { useState } from "react";

/**
 * =========================================================
 * TYPES (ALIGNED WITH BACKEND)
 * =========================================================
 */

export type PaymentType = "full" | "partial";

export type PaymentStatus =
  | "unpaid"
  | "partially_paid"
  | "fully_paid";

/**
 * =========================================================
 * REQUEST (MATCHES API)
 * =========================================================
 */
type CreateCheckoutParams = {
  orderId: string;
  userId: string;
  type: PaymentType;
};

/**
 * =========================================================
 * BREAKDOWN (FROM CALCULATOR - UI ONLY)
 * =========================================================
 */
type PaymentBreakdown = {
  total: number;
  totalPaid: number;
  remaining: number;

  payNow: number;
  remainingAfterPayment: number;

  previewPaymentStatus: PaymentStatus;
};

/**
 * =========================================================
 * API RESPONSE (BACKEND CONTRACT)
 * =========================================================
 */
type CreateCheckoutResponse = {
  success: boolean;

  payment: {
    id: string;
    status: string;
    amount: number;
  };

  checkoutId: string | null;
  checkoutUrl: string | null;
  paymentIntentId: string | null;

  breakdown: PaymentBreakdown;

  error?: string;
};

/**
 * =========================================================
 * HOOK (CLEAN + RETRY SAFE)
 * =========================================================
 */
export function usePayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * =========================================================
   * CREATE CHECKOUT
   * =========================================================
   *
   * IMPORTANT RULES:
   * - Every call creates NEW payment row (backend rule)
   * - No reuse logic here
   * - No local state assumptions
   */
  const createCheckout = async (
    params: CreateCheckoutParams
  ): Promise<CreateCheckoutResponse> => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      const data: CreateCheckoutResponse = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data?.error || "Failed to create checkout");
      }

      if (!data.checkoutUrl) {
        throw new Error("Missing checkout URL");
      }

      return data;
    } catch (err: any) {
      const message = err?.message || "Payment request failed";

      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * =========================================================
   * PAY (REDIRECT FLOW)
   * =========================================================
   *
   * SIMPLE RULE:
   * - backend creates payment row
   * - backend creates PayMongo checkout
   * - we ONLY redirect
   */
  const pay = async (params: CreateCheckoutParams) => {
    const data = await createCheckout(params);

    window.location.href = data.checkoutUrl!;
    return data;
  };

  /**
   * =========================================================
   * RESET ERROR
   * =========================================================
   */
  const resetError = () => setError(null);

  return {
    createCheckout,
    pay,
    resetError,

    loading,
    error,
  };
}