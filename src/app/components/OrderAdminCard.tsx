"use client";

import { useMemo, useState } from "react";

import type { Order } from "@/types/order";
import type { Conversation } from "@/hooks/useConversationList";
import type { OrderStatus, OrderCharge, OrderItem } from "@/types/order";

import OrderFullDetailModal from "@/app/components/OrderFullDetailModal";
import ChatModal from "@/app/components/chat/ChatModal";
import ChargesModal from "@/app/components/ChargesModal";
import CancelRequestModal from "@/app/components/CancelRequestModal";
import OrderActionBar from "@/app/components/OrderActionBar";

import { useOrderCharges } from "@/hooks/useOrderCharges";
import { usePaymentsQuery } from "@/hooks/useFetchPayments";
import { useCancelReview } from "@/hooks/useCancelReview";

import {
  chargeStatusUI,
  getOrderStatusUI,
} from "@/lib/orderUserStatusUI";

import { calculatePaymentBreakdown } from "@/utils/paymentCalculator";

/* =========================================================
   MESSAGE LOGIC
========================================================= */

const getOrderMessage = (order: Order): string => {
  const { order_status, payment_status, cancel_status } = order;

  if (order_status === "cancelled") return "🚫 Order cancelled.";

  if (cancel_status === "requested")
    return "⚠️ Cancellation request pending review.";

  if (cancel_status === "rejected")
    return "❌ Cancellation request rejected.";

  if (order_status === "accepted") {
    if (payment_status === "unpaid")
      return "💳 Awaiting payment before production.";

    if (payment_status === "partially_paid")
      return "💰 Partial payment received. Production allowed.";

    if (payment_status === "fully_paid")
      return "✅ Payment complete. Ready for production.";
  }

  if (order_status === "in_production")
    return "🏭 Order is currently in production.";

  if (order_status === "ready_for_pickup") {
    return payment_status !== "fully_paid"
      ? "⚠️ Ready for pickup — awaiting full payment."
      : "📦 Ready for pickup.";
  }

  if (order_status === "ready_for_shipment") {
    return payment_status !== "fully_paid"
      ? "⚠️ Ready for shipment — payment required."
      : "🚚 Ready for shipment.";
  }

  if (order_status === "shipped") return "📦 Order shipped.";

  if (order_status === "in_transit") return "🚚 In transit.";

  if (order_status === "completed") return "🎉 Order completed.";

  return "Processing order.";
};

/* =========================================================
   PROPS
========================================================= */

type Props = {
  order: Order;
  conversation?: Conversation;
  adminId: string;

  onUpdateStatus?: (
    orderId: string,
    status: OrderStatus
  ) => Promise<void>;
};

/* =========================================================
   COMPONENT
========================================================= */

export default function OrderCard({
  order,
  conversation,
  adminId,
}: Props) {
  const [openDetail, setOpenDetail] = useState(false);
  const [openChat, setOpenChat] = useState(false);
  const [openViewCharges, setOpenViewCharges] = useState(false);
  const [openFinalizeCharges, setOpenFinalizeCharges] = useState(false);
  const [openCancel, setOpenCancel] = useState(false);

  /* =========================================================
     HOOKS
  ========================================================= */

  const { charges = [] as OrderCharge[] } = useOrderCharges(order.id);

  const { data: payments, isLoading: paymentsLoading } =
    usePaymentsQuery(order.id);

  const {
    approveCancel,
    rejectCancel,
    isLoading: isProcessingCancel,
  } = useCancelReview();

  /* =========================================================
     SAFE ARRAYS
  ========================================================= */

  const items: OrderItem[] = useMemo(
    () => order.order_items ?? [],
    [order.order_items]
  );

  const safeCharges: OrderCharge[] = useMemo(
    () => charges ?? [],
    [charges]
  );

  /* =========================================================
     CALCULATIONS
  ========================================================= */

  const subtotal = useMemo(() => {
    return items.reduce((sum: number, i: OrderItem) => {
      return sum + Number(i.total_price ?? 0);
    }, 0);
  }, [items]);

  const totalPieces = useMemo(() => {
    return items.reduce((sum: number, i: OrderItem) => {
      return sum + Number(i.quantity ?? 0);
    }, 0);
  }, [items]);

  const chargesTotal = useMemo(() => {
    return safeCharges.reduce((total: number, c: OrderCharge) => {
      const amount = Number(c.amount ?? 0);
      return c.is_additive ? total + amount : total - amount;
    }, 0);
  }, [safeCharges]);

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

  const totalPaid = payments?.totalPaid ?? 0;

  const breakdown = useMemo(() => {
    return calculatePaymentBreakdown(finalTotal, totalPaid, "partial");
  }, [finalTotal, totalPaid]);

  const remaining = breakdown.remaining;

  /* =========================================================
     UI STATE
  ========================================================= */

  const orderMessage = getOrderMessage(order);
  const statusUI = getOrderStatusUI(order.order_status);
  const chargeUI = chargeStatusUI(order.charge_status);

  const isPickup = order.delivery_method === "pickup";
  const unreadCount = conversation?.customer_unread_count ?? 0;

  const canReviewCancel = order.cancel_status === "requested";

  /* =========================================================
     ACTIONS
  ========================================================= */

  const handleApprove = async () => {
    await approveCancel({ orderId: order.id, adminId });
    setOpenCancel(false);
  };

  const handleReject = async (reason?: string) => {
    await rejectCancel({
      orderId: order.id,
      adminId,
      reason: reason ?? "",
    });
    setOpenCancel(false);
  };

  /* =========================================================
     UI
  ========================================================= */

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
            <span className="text-gray-900">{order.customer_name || "-"}</span>
          </div>

          <div className="flex justify-between">
            <span>Phone</span>
            <span className="text-gray-900">{order.phone_number || "-"}</span>
          </div>

          <div className="flex justify-between">
            <span>Method</span>
            <span className="text-gray-900 capitalize">{order.delivery_method}</span>
          </div>

          <div className="flex justify-between">
            <span>{isPickup ? "Pickup" : "Address"}</span>
            <span className="text-right text-gray-900 max-w-[60%]">
              {isPickup ? order.pickup_location || "-" : order.delivery_address || "-"}
            </span>
          </div>
        </div>

        {/* CHARGES */}
        <div className="px-5 pb-4">
          <div className="flex justify-between rounded-xl border bg-gray-50 p-3">
            <div>
              <p className="text-[10px] text-gray-500">CHARGES</p>
              <div className={`mt-1 inline-flex rounded px-2 py-1 text-xs ${chargeUI.color}`}>
                {chargeUI.label} • {safeCharges.length}
              </div>
            </div>

            <button
              onClick={() => setOpenViewCharges(true)}
              className="text-xs text-gray-500 hover:underline"
            >
              View
            </button>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="border-t bg-gray-50 px-5 py-4">
          <OrderActionBar
            order={order}
            totalPaid={totalPaid}
            finalTotal={finalTotal}
            adminId={adminId}
            onOpenFinalize={() => setOpenFinalizeCharges(true)}
          />

          <div className="mt-3 flex gap-2">
            <button onClick={() => setOpenDetail(true)} className="flex-1 rounded-xl border bg-white py-2 text-sm">
              Details
            </button>

            <button onClick={() => setOpenChat(true)} className="flex-1 rounded-xl bg-gray-900 py-2 text-sm text-white">
              Chat {unreadCount > 0 && `(${unreadCount})`}
            </button>

            {canReviewCancel && (
              <button
                onClick={() => setOpenCancel(true)}
                className="flex-1 rounded-xl bg-yellow-500 py-2 text-sm font-semibold text-white"
              >
                Cancel
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
        senderType="admin"
      />

      <ChargesModal
        open={openViewCharges}
        onClose={() => setOpenViewCharges(false)}
        orderId={order.id}
        adminId={adminId}
        chargeStatus={order.charge_status}
        baseQuoteTotal={Number(order.quote_total_price ?? 0)}
      />

      <ChargesModal
        open={openFinalizeCharges}
        onClose={() => setOpenFinalizeCharges(false)}
        orderId={order.id}
        adminId={adminId}
        chargeStatus={order.charge_status}
        baseQuoteTotal={Number(order.quote_total_price ?? 0)}
      />

      <CancelRequestModal
        open={openCancel}
        onClose={() => setOpenCancel(false)}
        reason={order.cancel_reason ?? ""}
        orderStatus={order.order_status}
        paymentStatus={order.payment_status}
        isLoading={isProcessingCancel}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </>
  );
}