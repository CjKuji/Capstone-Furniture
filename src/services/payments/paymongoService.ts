import { supabase } from "@/lib/supabase";

/**
 * =========================================================
 * TYPES
 * =========================================================
 */
type CreateCheckoutParams = {
  paymentId: string;
  customerEmail?: string;
  description?: string;
};

/**
 * =========================================================
 * PAYMONGO CONFIG & DYNAMIC URL LOGIC
 * =========================================================
 */
const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY!;
const PAYMONGO_BASE_URL = "https://api.paymongo.com/v1";

/**
 * DYNAMIC APP_URL HELPER
 * Ensures redirects point to localhost in dev and Vercel in prod.
 */
const getBaseUrl = () => {
  if (typeof window !== "undefined") return window.location.origin;

  // Check if we are on Vercel
  if (process.env.VERCEL_ENV === "production") return `https://woodforge.vercel.app`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  // Fallback to local environment variable or localhost
  return process.env.NEXT_PUBLIC_APP_URL || "https://drivable-equipment-dart.ngrok-free.dev";
};

const APP_URL = getBaseUrl();

/**
 * =========================================================
 * AUTH HEADER
 * =========================================================
 */
function getAuthHeader() {
  return {
    Authorization: `Basic ${Buffer.from(
      `${PAYMONGO_SECRET_KEY}:`
    ).toString("base64")}`,
    "Content-Type": "application/json",
  };
}

/**
 * =========================================================
 * CREATE CHECKOUT (CLEAN + RETRY SAFE)
 * =========================================================
 */
export async function createPaymongoCheckout({
  paymentId,
  customerEmail,
  description = "Furniture Order Payment",
}: CreateCheckoutParams) {
  /**
   * 1. FETCH PAYMENT (SOURCE OF TRUTH)
   */
  const { data: payment, error } = await supabase
    .from("payments")
    .select(
      `
      id,
      order_id,
      amount,
      status,
      checkout_url,
      checkout_session_id,
      payment_intent_id
    `
    )
    .eq("id", paymentId)
    .single();

  if (error || !payment) {
    throw new Error("Payment not found");
  }

  /**
   * 2. BLOCK ONLY FINALIZED PAYMENTS
   */
  if (payment.status === "paid") {
    throw new Error("Payment already completed");
  }

  /**
   * 3. OPTIONAL SAFE REUSE (UI OPTIMIZATION ONLY)
   */
  if (
    payment.status === "pending" &&
    payment.checkout_url &&
    payment.checkout_session_id
  ) {
    return {
      checkoutId: payment.checkout_session_id,
      checkoutUrl: payment.checkout_url,
      paymentIntentId: payment.payment_intent_id,
      reused: true,
    };
  }

  /**
   * 4. VALIDATE AMOUNT
   */
  const amount = Number(payment.amount);
  if (!amount || amount <= 0) {
    throw new Error("Invalid payment amount");
  }
  const amountInCentavos = Math.round(amount * 100);

  /**
   * 5. DYNAMIC ROUTES
   */
  const successUrl =
    `${APP_URL}/orders?payment=success` +
    `&paymentId=${paymentId}` +
    `&orderId=${payment.order_id}`;

  const cancelUrl =
    `${APP_URL}/orders?payment=cancelled` +
    `&paymentId=${paymentId}` +
    `&orderId=${payment.order_id}`;

  /**
   * 6. CREATE PAYMONGO CHECKOUT SESSION
   */
  const response = await fetch(
    `${PAYMONGO_BASE_URL}/checkout_sessions`,
    {
      method: "POST",
      headers: getAuthHeader(),
      body: JSON.stringify({
        data: {
          attributes: {
            billing: customerEmail
              ? { email: customerEmail }
              : undefined,

            send_email_receipt: true,
            show_description: true,
            description,

            line_items: [
              {
                currency: "PHP",
                amount: amountInCentavos,
                name: "Furniture Order Payment",
                description,
                quantity: 1,
              },
            ],

            payment_method_types: [
              "gcash",
              "paymaya",
              "card",
            ],

            success_url: successUrl,
            cancel_url: cancelUrl,

            metadata: {
              payment_id: paymentId,
              order_id: payment.order_id,
            },
          },
        },
      }),
    }
  );

  const result = await response.json();

  /**
   * 7. ERROR HANDLING
   */
  if (!response.ok) {
    throw new Error(
      result?.errors?.[0]?.detail ||
        "Failed to create checkout session"
    );
  }

  const checkout = result?.data;
  if (!checkout?.attributes?.checkout_url) {
    throw new Error("Invalid PayMongo response");
  }

  /**
   * 8. EXTRACT DATA
   */
  const checkoutSessionId = checkout.id;
  const paymentIntentId = checkout?.attributes?.payment_intent?.id ?? null;
  const checkoutUrl = checkout.attributes.checkout_url;

  /**
   * 9. SAVE CHECKOUT DATA (NO BUSINESS LOGIC)
   */
  const { error: updateError } = await supabase
    .from("payments")
    .update({
      checkout_session_id: checkoutSessionId,
      payment_intent_id: paymentIntentId,
      checkout_url: checkoutUrl,
      raw_response: checkout,
      provider: "paymongo",
      updated_at: new Date().toISOString(),
    })
    .eq("id", paymentId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  /**
   * 10. RETURN RESULT
   */
  return {
    checkoutId: checkoutSessionId,
    checkoutUrl,
    paymentIntentId,
    reused: false,
  };
}