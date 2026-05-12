import type { Order } from "@/types/order";

/**
 * =========================================================
 * ACTION TYPES
 * =========================================================
 */
export type OrderAction =
  | "accept"
  | "reject"
  | "cancel"
  | "finalize_price"
  | "mark_production"
  | "mark_ready_pickup"
  | "mark_ready_shipment"
  | "mark_shipped"
  | "mark_completed";

/**
 * =========================================================
 * PAYMENT RULES
 * =========================================================
 */
const isUnpaid = (o: Order) => o.payment_status === "unpaid";
const isPartial = (o: Order) => o.payment_status === "partially_paid";
const isFull = (o: Order) => o.payment_status === "fully_paid";

/**
 * =========================================================
 * ORDER STATE HELPERS
 * =========================================================
 */
const isRequested = (o: Order) => o.order_status === "requested";
const isAccepted = (o: Order) => o.order_status === "accepted";
const isProduction = (o: Order) => o.order_status === "in_production";
const isReadyPickup = (o: Order) => o.order_status === "ready_for_pickup";
const isReadyShipment = (o: Order) => o.order_status === "ready_for_shipment";
const isShipped = (o: Order) => o.order_status === "shipped";
const isCompleted = (o: Order) => o.order_status === "completed";

/**
 * =========================================================
 * BLOCK RULES
 * =========================================================
 */
const isLocked = (o: Order) =>
  ["completed", "shipped", "in_transit", "cancelled"].includes(
    o.order_status
  );

/**
 * =========================================================
 * CORE RULE: CAN SHIP / COMPLETE ONLY IF FULLY PAID
 * =========================================================
 */
const requiresFullPayment = (o: Order) =>
  isPartial(o) || isUnpaid(o);

/**
 * =========================================================
 * MAIN ENGINE
 * =========================================================
 */
export function getAvailableOrderActions(order: Order): {
  actions: OrderAction[];
  warning?: string;
} {
  const actions: OrderAction[] = [];
  let warning: string | undefined;

  /**
   * =========================================================
   * REQUESTED → ACCEPT / REJECT / CANCEL
   * =========================================================
   */
  if (isRequested(order)) {
    actions.push("accept", "reject", "cancel");
    return { actions };
  }

  /**
   * =========================================================
   * ACCEPTED STATE
   * =========================================================
   */
  if (isAccepted(order)) {
    actions.push("cancel");

    // must finalize price before production
    actions.push("finalize_price");

    return { actions };
  }

  /**
   * =========================================================
   * PRODUCTION
   * =========================================================
   */
  if (isProduction(order)) {
    actions.push("mark_ready_pickup", "mark_ready_shipment", "cancel");
    return { actions };
  }

  /**
   * =========================================================
   * READY STATES
   * =========================================================
   */
  if (isReadyPickup(order)) {
    if (requiresFullPayment(order)) {
      warning = "⚠️ Full payment required before completion.";
    }

    actions.push("mark_completed");
    return { actions, warning };
  }

  if (isReadyShipment(order)) {
    if (requiresFullPayment(order)) {
      warning = "⚠️ Full payment required before shipment.";
    }

    actions.push("mark_shipped");
    return { actions, warning };
  }

  /**
   * =========================================================
   * SHIPPED
   * =========================================================
   */
  if (isShipped(order)) {
    if (requiresFullPayment(order)) {
      warning = "⚠️ Cannot complete — full payment required.";
      return { actions: [], warning };
    }

    actions.push("mark_completed");
    return { actions, warning };
  }

  /**
   * =========================================================
   * COMPLETED (LOCKED)
   * =========================================================
   */
  if (isCompleted(order)) {
    return {
      actions: [],
      warning: "Order already completed.",
    };
  }

  /**
   * DEFAULT SAFE STATE
   */
  return { actions: [], warning: "No actions available." };
}

/**
 * =========================================================
 * HUMAN STATUS MESSAGE
 * =========================================================
 */
export function getOrderActionMessage(order: Order) {
  if (isCompleted(order)) return "✅ Order completed.";
  if (isShipped(order)) return "🚚 Order shipped.";
  if (isReadyShipment(order)) return "📦 Ready for shipment.";
  if (isReadyPickup(order)) return "📦 Ready for pickup.";
  if (isProduction(order)) return "🏭 In production.";
  if (isAccepted(order) && isUnpaid(order)) return "⏳ Awaiting payment.";
  if (isAccepted(order) && isPartial(order)) return "💰 Partially paid.";
  if (isAccepted(order) && isFull(order)) return "💰 Fully paid.";
  if (isRequested(order)) return "📩 New order request.";

  return "Processing order.";
}