"use client";

import { useMemo, useState } from "react";

import type { Order } from "@/types/order";
import type { Conversation } from "@/hooks/useConversationList";

import OrderFullDetailModal from "@/app/components/OrderFullDetailModal";
import ChatModal from "@/app/components/chat/ChatModal";
import UserChargesModal from "@/app/components/UserChargesModal";
import PayModal from "@/app/components/PayModal";
import CancelOrderModal from "@/app/components/CancelOrderModal";

import { useOrderCharges } from "@/hooks/useOrderCharges";
import { usePaymentsQuery } from "@/hooks/useFetchPayments";
import { useCancelOrder } from "@/hooks/useCancelOrder";

import {
  chargeStatusUI,
  getOrderStatusUI,
} from "@/lib/orderUserStatusUI";

import { calculatePaymentBreakdown } from "@/utils/paymentCalculator";

const getOrderMessage = (order: Order) => {
  const { order_status, payment_status, cancel_status } = order;

  // =========================
  // CANCEL STATES
  // =========================
  if (order_status === "cancelled") {
    return "🚫 This order has been cancelled.";
  }

  if (cancel_status === "requested") {
    return "⚠️ Cancellation request submitted. Waiting for admin review.";
  }

  if (cancel_status === "rejected") {
    return "❌ Cancellation request was rejected.";
  }

  // =========================
  // ACCEPTED (PAYMENT PHASE)
  // =========================
  if (order_status === "accepted") {
    if (payment_status === "unpaid") {
      return "💳 Waiting for payment to start production.";
    }

    if (payment_status === "partially_paid") {
      return "💰 Partial payment received. Your order is now in production queue.";
    }

    if (payment_status === "fully_paid") {
      return "✅ Payment completed. Your order is now in production queue.";
    }

    return "📋 Order accepted. Awaiting payment.";
  }

  // =========================
  // PRODUCTION
  // =========================
  if (order_status === "in_production") {
    return "🏭 Your order is currently being produced.";
  }

  // =========================
  // READY STATES (NO PAYMENT MESSAGING HERE)
  // =========================
  if (order_status === "ready_for_pickup") {
    return "📦 Your order is ready for pickup. You need to pay full price before release.";
  }

  if (order_status === "ready_for_shipment") {
    return "🚚 Your order is ready for shipment. You need to pay full price before release.";
  }

  // =========================
  // SHIPPING FLOW
  // =========================
  if (order_status === "shipped") {
    return "📦 Your order has been shipped.";
  }

  if (order_status === "in_transit") {
    return "🚚 Your order is on the way.";
  }

  // =========================
  // COMPLETION
  // =========================
  if (order_status === "completed") {
    return "🎉 Thank you! Your order is completed.";
  }

  // =========================
  // DEFAULT
  // =========================
  return "📋 Processing your order.";
};
/**
 * =========================================================
 * TYPES
 * =========================================================
 */
type Props = {
  order: Order;
  conversation?: Conversation;
};

export default function OrderCard({ order, conversation }: Props) {
  /**
   * =========================================================
   * MODALS
   * =========================================================
   */
  const [openDetail, setOpenDetail] = useState(false);
  const [openChat, setOpenChat] = useState(false);
  const [openCharges, setOpenCharges] = useState(false);
  const [openPay, setOpenPay] = useState(false);
  const [openCancel, setOpenCancel] = useState(false);
  const [cancelMode, setCancelMode] =
    useState<"instant" | "request">("request");

  /**
   * =========================================================
   * HOOKS
   * =========================================================
   */
  const { cancelOrder, isLoading: isCancelling } = useCancelOrder();
  const { charges = [] } = useOrderCharges(order.id);
  const { data: payments, isLoading: paymentsLoading } =
    usePaymentsQuery(order.id);

  /**
   * =========================================================
   * SAFE VALUES (fix TS null/undefined issues)
   * =========================================================
   */
  const customerName = order.customer_name ?? "-";
  const phoneNumber = order.phone_number ?? "-";
  const deliveryMethod = order.delivery_method ?? "";
  const pickupLocation = order.pickup_location ?? "-";
  const deliveryAddress = order.delivery_address ?? "-";

  /**
   * =========================================================
   * ITEMS
   * =========================================================
   */
  const items = useMemo(() => order.order_items ?? [], [order.order_items]);

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + Number(i.total_price ?? 0), 0),
    [items]
  );

  const totalPieces = useMemo(
    () => items.reduce((sum, i) => sum + Number(i.quantity ?? 0), 0),
    [items]
  );

  /**
   * =========================================================
   * CHARGES
   * =========================================================
   */
  const chargesTotal = useMemo(() => {
    return charges.reduce((total, c) => {
      const amount = Number(c.amount ?? 0);
      return c.is_additive ? total + amount : total - amount;
    }, 0);
  }, [charges]);

  const isChargeAccepted = order.charge_status === "accepted";

  const baseTotal = useMemo(() => {
    const quote = Number(order.quote_total_price ?? 0);
    return quote > 0 ? quote : subtotal;
  }, [order.quote_total_price, subtotal]);

  const finalTotal = useMemo(() => {
    return isChargeAccepted
      ? Number(order.final_total_price ?? baseTotal)
      : baseTotal + chargesTotal;
  }, [isChargeAccepted, order.final_total_price, baseTotal, chargesTotal]);

  /**
   * =========================================================
   * PAYMENTS (FIX: no unused variables warning)
   * =========================================================
   */
  const totalPaid = payments?.totalPaid ?? 0;

  const breakdown = useMemo(
    () => calculatePaymentBreakdown(finalTotal, totalPaid, "partial"),
    [finalTotal, totalPaid]
  );

  const remaining = breakdown.remaining;

  /**
   * =========================================================
   * UI STATES
   * =========================================================
   */
  const orderMessage = getOrderMessage(order);
  const statusUI = getOrderStatusUI(order.order_status);
  const chargeUI = chargeStatusUI(order.charge_status);

  const isPickup = order.delivery_method === "pickup";
  const unreadCount = conversation?.customer_unread_count ?? 0;

  /**
   * =========================================================
   * RULES
   * =========================================================
   */
  const isInProductionFlow =
  order.order_status === "in_production" ||
  order.order_status === "ready_for_pickup" ||
  order.order_status === "ready_for_shipment";

const isPaid =
  order.payment_status === "partially_paid" ||
  order.payment_status === "fully_paid";

const isFinalState =
  order.order_status === "cancelled" ||
  order.order_status === "shipped" ||
  order.order_status === "in_transit" ||
  order.order_status === "completed";

/**
 * 🚫 Cancel is blocked if:
 * - already final state
 * - in production / ready stages
 * - OR already paid (partial/full)
 */
const canCancel =
  !isFinalState &&
  !isInProductionFlow &&
  !isPaid &&
  order.cancel_status !== "requested";

  const canPay =
    breakdown.payNow > 0 &&
    order.charge_status === "accepted" &&
    order.order_status !== "cancelled";

  const payButtonLabel =
    payments && payments.totalPaid > 0 ? "Pay Remaining" : "Pay Now";

  /**
   * =========================================================
   * CANCEL FLOW
   * =========================================================
   */
  const handleCancelClick = () => {
    setCancelMode("request");
    setOpenCancel(true);
  };

  const handleConfirmCancel = async (reason: string) => {
    await cancelOrder({
      orderId: order.id,
      userId: order.user_id,
      reason,
    });

    setOpenCancel(false);
  };

  /**
   * =========================================================
   * RENDER
   * =========================================================
   */
  return (
    <>
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md">

        {/* HEADER */}
        <div className="space-y-3 border-b p-5">
          <div className="flex justify-between">
            <span className={`rounded-full px-3 py-1 text-xs ${statusUI.color}`}>
              {statusUI.label}
            </span>

            <span className="text-xs text-gray-400">
              {new Date(order.created_at).toLocaleDateString()}
            </span>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              {order.order_reference_code ?? "Pending Order"}
            </h2>
            <p className="text-xs text-gray-500">{totalPieces} items</p>
          </div>

          {/* FINANCIAL */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-[10px] text-gray-500">TOTAL</p>
              <p className="text-sm font-semibold">₱{finalTotal.toLocaleString()}</p>
            </div>

            <div className="rounded-xl bg-green-50 p-3">
              <p className="text-[10px] text-gray-500">PAID</p>
              <p className="text-sm font-semibold text-green-600">
                {paymentsLoading ? "..." : `₱${totalPaid.toLocaleString()}`}
              </p>
            </div>

            <div className={`rounded-xl p-3 ${remaining > 0 ? "bg-red-50" : "bg-green-50"}`}>
              <p className="text-[10px] text-gray-500">REMAINING</p>
              <p className={`text-sm font-semibold ${remaining > 0 ? "text-red-600" : "text-green-600"}`}>
                ₱{remaining.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* MESSAGE */}
        <div className="px-5 pt-4">
          <div className="rounded-xl border bg-gray-50 px-3 py-2 text-xs text-gray-600">
            {orderMessage}
          </div>
        </div>

        {/* DETAILS */}
        <div className="grid gap-3 px-5 py-4 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Customer</span>
            <span className="text-gray-900">{customerName}</span>
          </div>

          <div className="flex justify-between">
            <span>Phone</span>
            <span className="text-gray-900">{phoneNumber}</span>
          </div>

          <div className="flex justify-between">
            <span>Method</span>
            <span className="text-gray-900 capitalize">{deliveryMethod}</span>
          </div>

          <div className="flex justify-between">
            <span>{isPickup ? "Pickup" : "Address"}</span>
            <span className="text-right text-gray-900 max-w-[60%]">
              {isPickup ? pickupLocation : deliveryAddress}
            </span>
          </div>
        </div>

        {/* CHARGES */}
        <div className="px-5 pb-4">
          <div className="flex justify-between rounded-xl border bg-gray-50 p-3">
            <div>
              <p className="text-[10px] text-gray-500">CHARGES</p>
              <div className={`mt-1 inline-flex rounded px-2 py-1 text-xs ${chargeUI.color}`}>
                {chargeUI.label} • {charges.length}
              </div>
            </div>

            <button
              onClick={() => setOpenCharges(true)}
              className="text-xs text-gray-500 hover:underline"
            >
              View Charges
            </button>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="border-t bg-gray-50 px-5 py-4">
          <div className="flex flex-wrap gap-2">

            <button
              onClick={() => setOpenDetail(true)}
              className="flex-1 rounded-xl border bg-white py-2 text-sm font-medium"
            >
              Details
            </button>

            <button
              onClick={() => setOpenChat(true)}
              className="relative flex-1 rounded-xl bg-gray-900 py-2 text-sm font-medium text-white"
            >
              Chat
              {unreadCount > 0 && (
                <span className="absolute -right-2 -top-2 rounded-full bg-red-500 px-2 text-[10px]">
                  {unreadCount}
                </span>
              )}
            </button>

            {canCancel && (
              <button
                onClick={handleCancelClick}
                disabled={isCancelling}
                className="flex-1 rounded-xl bg-red-600 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Cancel
              </button>
            )}

            {canPay && (
              <button
                onClick={() => setOpenPay(true)}
                className="flex-1 rounded-xl bg-green-600 py-2 text-sm font-semibold text-white"
              >
                {payButtonLabel}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MODALS */}
      <OrderFullDetailModal open={openDetail} onClose={() => setOpenDetail(false)} order={order} />

      <ChatModal
        open={openChat}
        onClose={() => setOpenChat(false)}
        order={order}
        currentUserId={order.user_id}
        senderType="customer"
      />

      <UserChargesModal
        open={openCharges}
        onClose={() => setOpenCharges(false)}
        charges={charges}
        order={order}
        userId={order.user_id}
      />

      <PayModal
        open={openPay}
        onClose={() => setOpenPay(false)}
        order={order}
        totalAmount={finalTotal}
      />

      <CancelOrderModal
        open={openCancel}
        onClose={() => setOpenCancel(false)}
        order={order}
        mode={cancelMode}
        onConfirm={handleConfirmCancel}
      />
    </>
  );
}