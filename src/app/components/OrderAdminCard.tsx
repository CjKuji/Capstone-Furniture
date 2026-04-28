"use client";

import { useMemo } from "react";
import type { OrderStatus, PaymentStatus } from "@/types/enums";

import {
  acceptOrder,
  createQuote,
  acceptQuote,
  submitPayment,
  verifyPayment,
  startProduction,
  markReady,
  markShipped,
  markPickedUp,
  markDelivered,
} from "@/services/orders/orderFlowService";

import { usePaymentSummary } from "@/hooks/usePaymentSummary";

type Props = {
  order: {
    id: string;
    status: OrderStatus;
    payment_status: PaymentStatus;
    fulfillment_status?: string;
    quote_total_price?: number;
    customer_name?: string;
  };

  adminId: string;
};

export default function AdminOrderCard({ order, adminId }: Props) {
  const { data: paymentSummary } = usePaymentSummary(order.id);

  /**
   * =========================================================
   * UI RULES (derived ONLY from state)
   * NO BUSINESS LOGIC HERE
   * =========================================================
   */
  const actions = useMemo(() => {
    return {
      canAccept: order.status === "pending_review",
      canQuote: order.status === "in_review",
      canVerifyPayment: order.payment_status === "pending_verification",
      canStartProduction:
        order.status === "processing" &&
        (order.payment_status === "partially_paid" ||
          order.payment_status === "fully_paid"),
      canMarkReady: order.payment_status === "fully_paid",
      canShip: order.fulfillment_status === "ready_for_shipping",
      canPickup: order.fulfillment_status === "ready_for_pickup",
    };
  }, [order]);

  return (
    <div className="border rounded-lg p-4 space-y-3">
      {/* HEADER */}
      <div>
        <h2 className="font-semibold">
          Order #{order.id.slice(0, 8)}
        </h2>

        <p className="text-sm text-gray-500">
          Customer: {order.customer_name ?? "Unknown"}
        </p>
      </div>

      {/* STATUS */}
      <div className="text-xs flex gap-3">
        <span>Status: {order.status}</span>
        <span>Payment: {order.payment_status}</span>
        <span>Fulfillment: {order.fulfillment_status ?? "—"}</span>
      </div>

      {/* PAYMENT SUMMARY (derived from aggregate service) */}
      {paymentSummary && (
        <div className="text-sm bg-gray-50 p-2 rounded">
          <p>Total: ₱{paymentSummary.total}</p>
          <p>Paid: ₱{paymentSummary.paid}</p>
          <p>Remaining: ₱{paymentSummary.remaining}</p>
        </div>
      )}

      {/* ACTIONS */}
      <div className="flex flex-wrap gap-2">
        {actions.canAccept && (
          <button onClick={() => acceptOrder(order.id, adminId)}>
            Accept Order
          </button>
        )}

        {actions.canQuote && (
          <button
            onClick={() =>
              createQuote(order.id, adminId, [
                { name: "Base Price", amount: 1500 },
              ])
            }
          >
            Send Quote
          </button>
        )}

        {order.status === "quoted" && (
          <button onClick={() => acceptQuote(order.id, adminId)}>
            Re-Trigger Quote Accept (Debug/Admin)
          </button>
        )}

        {actions.canVerifyPayment && (
          <button onClick={() => verifyPayment(order.id, adminId)}>
            Verify Payment
          </button>
        )}

        {actions.canStartProduction && (
          <button onClick={() => startProduction(order.id, adminId)}>
            Start Production
          </button>
        )}

        {actions.canMarkReady && (
          <button onClick={() => markReady(order.id, adminId)}>
            Mark Ready
          </button>
        )}

        {actions.canShip && (
          <button onClick={() => markShipped(order.id, adminId)}>
            Mark Shipped
          </button>
        )}

        {actions.canPickup && (
          <button onClick={() => markPickedUp(order.id, adminId)}>
            Mark Picked Up
          </button>
        )}

        {order.status === "completed" && (
          <button onClick={() => markDelivered(order.id, adminId)}>
            Mark Delivered
          </button>
        )}
      </div>
    </div>
  );
}