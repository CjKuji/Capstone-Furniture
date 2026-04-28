// types/enums.ts

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
 * INQUIRY FLOW
 * =========================================================
 */
export type InquiryStatus =
  | "pending"
  | "responded"
  | "converted"
  | "closed";

/**
 * =========================================================
 * ORDER STATUS (HIGH-LEVEL BUSINESS FLOW)
 * =========================================================
 * This controls admin + customer order lifecycle
 * =========================================================
 */
export type OrderStatus =
  | "pending_review"
  | "in_review"
  | "quoted"
  | "accepted"
  | "processing"
  | "ready"
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
 * USER ROLES
 * =========================================================
 */
export type UserRole =
  | "customer"
  | "admin"
  | "super_admin";

/**
 * =========================================================
 * MESSAGE SENDER
 * =========================================================
 */
export type SenderType =
  | "user"
  | "admin";

/**
 * =========================================================
 * PAYMENT STATUS (CRITICAL FIX)
 * =========================================================
 * This is the correct derived payment state
 * used by paymentAggregateService
 * =========================================================
 */
export type PaymentStatus =
  | "unpaid"
  | "partially_paid"
  | "fully_paid"
  | "pending_verification"
  | "rejected"
  | "refunded";

/**
 * NOTE:
 * - removed incorrect "verified"
 * - removed duplicate confusion with PaymentVerificationStatus
 * - aligns with your DB enum + business logic
 */

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
 * ORDER TIMELINE EVENTS
 * =========================================================
 */
export type OrderTimelineEventType =
  | "order_created"
  | "order_review_started"
  | "quote_sent"
  | "payment_submitted"
  | "payment_verified"
  | "production_started"
  | "order_ready"
  | "order_shipped"
  | "order_delivered"
  | "order_completed"
  | "order_cancelled"
  | "system_note";

/**
 * =========================================================
 * FULFILLMENT STATUS (PHYSICAL WORKFLOW)
 * =========================================================
 */
export type FulfillmentStatus =
  | "in_production"
  | "ready_for_pickup"
  | "picked_up"
  | "ready_for_shipping"
  | "shipped"
  | "delivered";