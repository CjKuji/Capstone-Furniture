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
    <div className="group overflow-hidden rounded-2xl border border-[#E8D7C8] bg-white shadow-sm transition hover:shadow-lg">

      {/* =========================================================
         HEADER (status + identity)
      ========================================================= */}
      <div className="border-b border-[#F0E2D6] p-5">

        <div className="flex items-center justify-between">

          {/* STATUS */}
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${statusUI.color}`}
          >
            {statusUI.label}
          </span>

          <span className="text-xs text-[#7A6A5A]">
            {new Date(order.created_at).toLocaleDateString()}
          </span>
        </div>

        {/* ORDER ID */}
        <div className="mt-3">
          <h2 className="text-sm font-semibold text-[#3A2B22]">
            {order.order_reference_code ?? "Pending Order"}
          </h2>

          <p className="text-xs text-[#7A6A5A]">
            {totalPieces} design{totalPieces > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* =========================================================
         FINANCIAL SNAPSHOT (clean cards instead of heavy blocks)
      ========================================================= */}
      <div className="grid grid-cols-3 gap-2 p-5">

        <div className="rounded-xl border border-[#F0E2D6] bg-[#FAF6F1] p-3">
          <p className="text-[10px] text-[#7A6A5A]">TOTAL</p>
          <p className="text-sm font-semibold text-[#3A2B22]">
            ₱{finalTotal.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border border-[#DDEFE0] bg-[#F3FAF5] p-3">
          <p className="text-[10px] text-[#7A6A5A]">PAID</p>
          <p className="text-sm font-semibold text-green-700">
            {paymentsLoading ? "..." : `₱${totalPaid.toLocaleString()}`}
          </p>
        </div>

        <div
          className={`rounded-xl border p-3 ${
            remaining > 0
              ? "border-[#F3D6D6] bg-[#FFF5F5]"
              : "border-[#DDEFE0] bg-[#F3FAF5]"
          }`}
        >
          <p className="text-[10px] text-[#7A6A5A]">REMAINING</p>
          <p
            className={`text-sm font-semibold ${
              remaining > 0 ? "text-red-600" : "text-green-700"
            }`}
          >
            ₱{remaining.toLocaleString()}
          </p>
        </div>

      </div>

      {/* =========================================================
         MESSAGE (soft insight panel)
      ========================================================= */}
      <div className="px-5 pb-4">
        <div className="rounded-xl border border-[#F0E2D6] bg-[#FAF6F1] px-3 py-2 text-xs text-[#6A5646]">
          {orderMessage}
        </div>
      </div>

      {/* =========================================================
         DETAILS (clean 2-column system instead of heavy grid)
      ========================================================= */}
      <div className="px-5 pb-4 space-y-2 text-xs">

        <div className="flex justify-between">
          <span className="text-[#7A6A5A]">Customer</span>
          <span className="text-[#3A2B22] font-medium">{customerName}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-[#7A6A5A]">Phone</span>
          <span className="text-[#3A2B22] font-medium">{phoneNumber}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-[#7A6A5A]">Method</span>
          <span className="text-[#3A2B22] font-medium capitalize">
            {deliveryMethod}
          </span>
        </div>

        <div className="flex justify-between gap-3">
          <span className="text-[#7A6A5A]">
            {isPickup ? "Pickup" : "Address"}
          </span>

          <span className="text-right text-[#3A2B22] font-medium max-w-[65%]">
            {isPickup ? pickupLocation : deliveryAddress}
          </span>
        </div>

      </div>

      {/* =========================================================
         CHARGES (collapsed premium row)
      ========================================================= */}
      <div className="px-5 pb-4">
        <div className="flex items-center justify-between rounded-xl border border-[#E8D7C8] bg-white px-3 py-3">

          <div>
            <p className="text-[10px] text-[#7A6A5A]">CHARGES</p>
            <span className="mt-1 inline-flex rounded-full bg-[#FAF6F1] px-2 py-1 text-xs text-[#3A2B22] border border-[#E8D7C8]">
              {chargeUI.label} • {charges.length}
            </span>
          </div>

          <button
            onClick={() => setOpenCharges(true)}
            className="text-xs text-[#7A4E2D] hover:underline"
          >
            View →
          </button>

        </div>
      </div>

      {/* =========================================================
         ACTIONS (converted into hierarchy instead of equal buttons)
      ========================================================= */}
      <div className="border-t border-[#F0E2D6] bg-[#FAF6F1] p-4">

        <div className="flex flex-wrap gap-2">

          {/* PRIMARY: DETAILS */}
          <button
            onClick={() => setOpenDetail(true)}
            className="flex-1 rounded-xl border border-[#E8D7C8] bg-white py-2 text-sm font-medium text-[#3A2B22] hover:bg-[#F3E2D2] transition"
          >
            Details
          </button>

          {/* PRIMARY: CHAT */}
          <button
            onClick={() => setOpenChat(true)}
            className="relative flex-1 rounded-xl bg-[#3A2B22] py-2 text-sm font-medium text-white hover:bg-black transition"
          >
            Chat

            {unreadCount > 0 && (
              <span className="absolute -right-2 -top-2 rounded-full bg-red-500 px-2 text-[10px] text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* CONDITIONAL ACTIONS */}
          {canPay && (
            <button
              onClick={() => setOpenPay(true)}
              className="flex-1 rounded-xl bg-[#7A4E2D] py-2 text-sm font-semibold text-white hover:bg-[#663D22] transition"
            >
              {payButtonLabel}
            </button>
          )}

          {canCancel && (
            <button
              onClick={handleCancelClick}
              disabled={isCancelling}
              className="flex-1 rounded-xl border border-red-200 bg-white py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 transition"
            >
              Cancel
            </button>
          )}

        </div>
      </div>
    </div>

    {/* =========================================================
       MODALS (unchanged logic)
    ========================================================= */}
    <OrderFullDetailModal
      open={openDetail}
      onClose={() => setOpenDetail(false)}
      order={order}
    />

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