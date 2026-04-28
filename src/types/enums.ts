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
 * ORDER STATUS (MATCHES SUPABASE EXACTLY)
 * =========================================================
 */
export type OrderStatus =
  | "draft"
  | "requested"
  | "quoted"
  | "awaiting_payment"
  | "processing"
  | "in_production"
  | "ready_for_fulfillment"
  | "ready_for_pickup"
  | "picked_up"
  | "ready_for_shipping"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled";

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
  | "user"
  | "admin";

/**
 * =========================================================
 * PAYMENT STATUS (MATCHES SUPABASE)
 * =========================================================
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
  | "maya_manual";

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
 */
export type OrderTimelineEventType =
  | "order_created"
  | "order_quoted"
  | "order_accepted"
  | "payment_submitted"
  | "payment_verified"
  | "production_started"
  | "order_ready"
  | "order_dispatched"
  | "order_delivered"
  | "order_completed"
  | "order_cancelled"
  | "system_note";