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
    {/* ================= CARD ================= */}
    <div
      className="
        group overflow-hidden rounded-2xl
        border border-white/5
        bg-white/[0.03]
        hover:bg-white/[0.06]
        hover:border-[#D4A97A]/20
        transition-all duration-300
        shadow-sm hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]
        flex flex-col
      "
    >

      {/* ================= HEADER ================= */}
      <div className="p-5 border-b border-white/5 bg-gradient-to-b from-[#1C1209]/40 to-transparent">

        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white group-hover:text-[#D4A97A] transition-colors">
              {order.order_reference_code ?? "Pending Order"}
            </h2>

            <p className="text-xs text-white/40 mt-1">
              {totalPieces} item{totalPieces !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="text-right space-y-2">
            <span
              className={`
                px-3 py-1 rounded-full text-[10px] font-semibold tracking-wide border backdrop-blur-sm
                ${statusUI.color}
              `}
            >
              {statusUI.label}
            </span>

            <p className="text-[10px] text-white/30">
              {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        {/* ================= FINANCIAL SUMMARY ================= */}
        <div className="grid grid-cols-3 gap-3 mt-5">

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
            <p className="text-[10px] text-white/30">TOTAL</p>
            <p className="mt-1 text-sm font-semibold text-white">
              ₱{finalTotal.toLocaleString()}
            </p>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
            <p className="text-[10px] text-white/30">PAID</p>
            <p className="mt-1 text-sm font-semibold text-green-400">
              {paymentsLoading ? "..." : `₱${totalPaid.toLocaleString()}`}
            </p>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
            <p className="text-[10px] text-white/30">BALANCE</p>
            <p className={`mt-1 text-sm font-semibold ${remaining > 0 ? "text-red-400" : "text-green-400"}`}>
              ₱{remaining.toLocaleString()}
            </p>
          </div>

        </div>
      </div>

      {/* ================= BODY ================= */}
      <div className="flex-1 px-5 py-4 space-y-4">

        {/* MESSAGE */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs text-white/60">
          {orderMessage || "No customer message"}
        </div>

        {/* CUSTOMER INFO */}
        <div className="grid gap-2 text-xs">

          <InfoRow label="Customer" value={order.customer_name || "-"} />
          <InfoRow label="Phone" value={order.phone_number || "-"} />
          <InfoRow label="Method" value={order.delivery_method} />

          <div className="flex justify-between">
            <span className="text-white/40">
              {isPickup ? "Pickup" : "Address"}
            </span>

            <span className="text-right text-white font-medium max-w-[65%]">
              {isPickup ? order.pickup_location || "-" : order.delivery_address || "-"}
            </span>
          </div>
        </div>

        {/* CHARGES */}
        <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3">

          <div>
            <p className="text-[10px] text-white/30">CHARGES</p>

            <div className={`mt-1 inline-flex px-2 py-1 rounded-full text-[10px] font-semibold border ${chargeUI.color}`}>
              {chargeUI.label} • {safeCharges.length}
            </div>
          </div>

          <button
            onClick={() => setOpenViewCharges(true)}
            className="
              px-3 py-1 rounded-lg text-xs font-medium
              border border-white/10 text-white/60
              hover:bg-[#D4A97A] hover:text-[#1C1209]
              transition
            "
          >
            View
          </button>

        </div>

      </div>

      {/* ================= ACTIONS ================= */}
      <div className="border-t border-white/5 px-5 py-4 space-y-3">

        {/* PRIMARY ACTIONS */}
        <OrderActionBar
          order={order}
          totalPaid={totalPaid}
          finalTotal={finalTotal}
          adminId={adminId}
          onOpenFinalize={() => setOpenFinalizeCharges(true)}
        />

        {/* SECONDARY ACTIONS */}
        <div className="grid grid-cols-2 gap-2">

          <button
            onClick={() => setOpenDetail(true)}
            className="
              rounded-xl border border-white/10
              bg-white/[0.02] py-2 text-xs font-medium text-white/60
              hover:border-[#D4A97A]/30 hover:text-[#D4A97A]
              transition
            "
          >
            View Details
          </button>

          <button
            onClick={() => setOpenChat(true)}
            className="
              rounded-xl bg-[#D4A97A] py-2 text-xs font-semibold text-[#1C1209]
              hover:opacity-90 transition
            "
          >
            Chat {unreadCount > 0 && `(${unreadCount})`}
          </button>

        </div>

        {/* DANGER ACTION */}
        {canReviewCancel && (
          <button
            onClick={() => setOpenCancel(true)}
            className="
              w-full rounded-xl bg-red-500/10 py-2 text-xs font-semibold text-red-400
              hover:bg-red-500/20 transition
            "
          >
            Cancel Order
          </button>
        )}

      </div>
    </div>

    {/* ================= MODALS ================= */}
    <OrderFullDetailModal
      open={openDetail}
      onClose={() => setOpenDetail(false)}
      order={order}
    />

    <ChatModal
      open={openChat}
      onClose={() => setOpenChat(false)}
      order={order}
      currentUserId={adminId}
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

/* ================= SMALL HELPER ================= */

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-white/40">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}
}