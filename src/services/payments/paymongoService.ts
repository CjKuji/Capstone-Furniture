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
 * Ensures redirects point to the correct domain based on environment.
 */
const getBaseUrl = () => {
  // 1. If we have an explicit APP_URL env (like in Vercel settings), use it
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;

  // 2. Client-side fallback
  if (typeof window !== "undefined") return window.location.origin;

  // 3. Vercel specific fallbacks
  if (process.env.VERCEL_ENV === "production") return `https://woodforge.vercel.app`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  // 4. Local dev fallback
  return "https://drivable-equipment-dart.ngrok-free.dev";
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
  description,
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
      inquiry_id,
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
   * Note: If you changed the redirect URLs, you might want to comment this out 
   * once to force a fresh session creation with the new URLs.
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
   * 5. DETERMINISTIC CONTEXT & DYNAMIC ROUTES
   * Fixed: Pointing success/cancel URLs to the main /inquiry landing page.
   */
  const isInquiry = !!payment.inquiry_id;
  
  const defaultName = isInquiry ? "Custom Inquiry Design Fee" : "Furniture Order Payment";
  const finalDescription = description || (isInquiry ? "Custom Workshop Adjustment Charges" : "Furniture Order Payment");

  // REDIRECT LOGIC: Points to /inquiry instead of deep profile links
  const successUrl = isInquiry
    ? `${APP_URL}/inquiry?payment=success&paymentId=${paymentId}&inquiryId=${payment.inquiry_id}`
    : `${APP_URL}/orders?payment=success&paymentId=${paymentId}&orderId=${payment.order_id}`;

  const cancelUrl = isInquiry
    ? `${APP_URL}/inquiry?payment=cancelled&paymentId=${paymentId}&inquiryId=${payment.inquiry_id}`
    : `${APP_URL}/orders?payment=cancelled&paymentId=${paymentId}&orderId=${payment.order_id}`;

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
            billing: customerEmail ? { email: customerEmail } : undefined,
            send_email_receipt: true,
            show_description: true,
            description: finalDescription,

            line_items: [
              {
                currency: "PHP",
                amount: amountInCentavos,
                name: defaultName,
                description: finalDescription,
                quantity: 1,
              },
            ],

            payment_method_types: ["gcash", "paymaya", "card"],

            success_url: successUrl,
            cancel_url: cancelUrl,

            metadata: {
              payment_id: paymentId,
              order_id: payment.order_id || "",
              inquiry_id: payment.inquiry_id || "",
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
      result?.errors?.[0]?.detail || "Failed to create checkout session"
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
   * 9. SAVE CHECKOUT DATA
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