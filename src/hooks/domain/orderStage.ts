import type {
  OrderStatus,
  PaymentStatus,
  FulfillmentStatus,
  DeliveryMethod,
} from "@/types/enums";

/**
 * =========================================================
 * 1. DOMAIN ORDER STAGE (SINGLE SOURCE OF TRUTH)
 * =========================================================
 * This is the ONLY computed state used by UI layers.
 *
 * RULES:
 * - order_status = business flow
 * - payment_status = money flow
 * - fulfillment_status = physical flow
 * =========================================================
 */
export type OrderStage =
  | "cancelled"

  /**
   * =====================================================
   * BUSINESS FLOW
   * =====================================================
   */
  | "pending_review"
  | "in_review"
  | "quoted"
  | "accepted"

  /**
   * =====================================================
   * PAYMENT FLOW (ONLY VALID WHEN ACCEPTED)
   * =====================================================
   */
  | "awaiting_payment"
  | "pending_verification"
  | "partially_paid"
  | "fully_paid"

  /**
   * =====================================================
   * PHYSICAL FLOW
   * =====================================================
   */
  | "in_production"
  | "ready_for_shipping"
  | "ready_for_pickup"
  | "shipped"
  | "picked_up"
  | "delivered"

  /**
   * =====================================================
   * FINAL
   * =====================================================
   */
  | "completed";

/**
 * =========================================================
 * RAW ORDER INPUT
 * =========================================================
 */
export type OrderLike = {
  status: OrderStatus;
  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus | null;
  delivery_method: DeliveryMethod | null; // ✅ FIX HERE
};

/**
 * =========================================================
 * MAIN NORMALIZER (CORE BUSINESS RULE ENGINE)
 * =========================================================
 */
export function getOrderStage(order: OrderLike): OrderStage {
  const o = order.status;
  const p = order.payment_status;
  const f = order.fulfillment_status;

  /**
   * =====================================================
   * 1. HARD STOP (CANCEL ALWAYS WINS)
   * =====================================================
   */
  if (o === "cancelled") return "cancelled";

  /**
   * =====================================================
   * 2. PHYSICAL STATE (REAL WORLD ALWAYS OVERRIDES)
   * =====================================================
   */
  if (f === "delivered") return "delivered";
  if (f === "picked_up") return "picked_up";
  if (f === "shipped") return "shipped";

  /**
   * READY STATE
   */
  if (f === "ready_for_shipping") return "ready_for_shipping";
  if (f === "ready_for_pickup") return "ready_for_pickup";

  /**
   * PRODUCTION
   */
  if (f === "in_production") return "in_production";

  /**
   * =====================================================
   * 3. BUSINESS FLOW
   * =====================================================
   */
  if (o === "pending_review") return "pending_review";
  if (o === "in_review") return "in_review";
  if (o === "quoted") return "quoted";

  /**
   * =====================================================
   * 4. ACCEPTED → PAYMENT FLOW
   * =====================================================
   */
  if (o === "accepted") {
    if (p === "unpaid") return "awaiting_payment";

    if (p === "pending_verification")
      return "pending_verification";

    if (p === "partially_paid")
      return "partially_paid";

    if (p === "fully_paid")
      return "fully_paid";

    return "awaiting_payment";
  }

  /**
   * =====================================================
   * 5. FINAL STATE
   * =====================================================
   */
  if (o === "completed") return "completed";

  /**
   * =====================================================
   * 6. FALLBACK
   * =====================================================
   */
  return "pending_review";
}

/**
 * =========================================================
 * UI HELPERS (ROLE AGNOSTIC)
 * =========================================================
 */
export function isFinalStage(stage: OrderStage) {
  return (
    stage === "delivered" ||
    stage === "picked_up" ||
    stage === "completed"
  );
}

export function isInProgress(stage: OrderStage) {
  return (
    stage === "in_production" ||
    stage === "shipped" ||
    stage === "ready_for_shipping" ||
    stage === "ready_for_pickup"
  );
}

export function requiresPayment(stage: OrderStage) {
  return (
    stage === "awaiting_payment" ||
    stage === "pending_verification" ||
    stage === "partially_paid"
  );
}

/**
 * =========================================================
 * OPTIONAL: GROUPS (useful for UI badges / steps)
 * =========================================================
 */
export function getStageGroup(stage: OrderStage):
  | "business"
  | "payment"
  | "production"
  | "fulfillment"
  | "final"
  | "cancelled" {
  if (stage === "cancelled") return "cancelled";

  if (
    stage === "pending_review" ||
    stage === "in_review" ||
    stage === "quoted" ||
    stage === "accepted"
  ) {
    return "business";
  }

  if (
    stage === "awaiting_payment" ||
    stage === "pending_verification" ||
    stage === "partially_paid" ||
    stage === "fully_paid"
  ) {
    return "payment";
  }

  if (stage === "in_production") return "production";

  if (
    stage === "ready_for_shipping" ||
    stage === "ready_for_pickup" ||
    stage === "shipped" ||
    stage === "picked_up" ||
    stage === "delivered"
  ) {
    return "fulfillment";
  }

  if (stage === "completed") return "final";

  return "business";
}