/**
 * =========================================================
 * PUBLISH STATUS
 * =========================================================
 */
export type PublishStatus =
  | "draft"
  | "published"
  | "archived";

/**
 * =========================================================
 * INQUIRY STATUS
 * =========================================================
 */
export type InquiryStatus =
  | "pending"
  | "responded"
  | "converted"
  | "closed";

/**
 * =========================================================
 * ORDER STATUS
 * =========================================================
 * Operational workflow only
 */
export type OrderStatus =
  | "requested"
  | "accepted"
  | "awaiting_payment"
  | "payment_verification"
  | "in_production"

  // fulfillment
  | "ready_for_pickup"
  | "ready_for_shipment"

  // logistics
  | "shipped"
  | "in_transit"

  // final
  | "completed"
  | "cancelled";

/**
 * =========================================================
 * CANCEL STATUS
 * =========================================================
 */
export type CancelStatus =
  | "none"
  | "requested"
  | "approved"
  | "rejected";

/**
 * =========================================================
 * DELIVERY METHOD
 * =========================================================
 */
export type DeliveryMethod =
  | "pickup"
  | "delivery";

/**
 * =========================================================
 * USER ROLE
 * =========================================================
 */
export type UserRole =
  | "customer"
  | "admin"
  | "super_admin";

/**
 * =========================================================
 * MESSAGE SENDER TYPE
 * =========================================================
 */
export type SenderType =
  | "customer"
  | "admin"
  | "system";

/**
 * =========================================================
 * PAYMENT STATUS
 * =========================================================
 * STRICTLY financial state
 */
export type PaymentStatus =
  | "unpaid"
  | "pending_verification"
  | "partially_paid"
  | "fully_paid"
  | "rejected"
  | "refunded";

/**
 * =========================================================
 * PAYMENT METHOD
 * =========================================================
 */
export type PaymentMethod =
  | "gcash_manual"
  | "bank_transfer"
  | "cash_on_pickup"
  | "cash_on_delivery"
  | "maya_manual"
  | "paymongo_checkout";

/**
 * =========================================================
 * CONVERSATION STATUS
 * =========================================================
 */
export type ConversationStatus =
  | "active"
  | "archived"
  | "completed";

/**
 * =========================================================
 * ORDER TIMELINE EVENT TYPE
 * =========================================================
 * Legacy support only
 */
export type OrderTimelineEventType =
  | "order_created"
  | "order_accepted"
  | "order_quoted"
  | "payment_submitted"
  | "payment_verified"
  | "production_started"
  | "ready_for_pickup"
  | "ready_for_shipment"
  | "order_dispatched"
  | "order_delivered"
  | "order_completed"
  | "order_cancelled"
  | "system_note";

/**
 * =========================================================
 * CHARGE STATUS
 * =========================================================
 */
export type ChargeStatus =
  | "none"
  | "pending"
  | "accepted"
  | "rejected";