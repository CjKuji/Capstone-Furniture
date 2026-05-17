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

  if (order_status === "cancelled") return "This order has been cancelled.";
  if (cancel_status === "requested") return "Your cancellation request is currently under review.";
  if (cancel_status === "rejected") return "Your cancellation request was reviewed and declined.";

  if (order_status === "requested") return "Your order request has been submitted and is awaiting admin review and pricing confirmation.";

  if (order_status === "accepted") {
    if (payment_status === "unpaid" && order.charge_status !== "accepted") return "Your order has been accepted. Please wait for the final pricing confirmation from the admin.";
    if (payment_status === "unpaid" && order.charge_status === "accepted") return "Your final pricing has been confirmed. Payment is required before production begins.";
    if (payment_status === "partially_paid") return "Partial payment received. Your order is now queued for production.";
    if (payment_status === "fully_paid") return "Payment completed successfully. Your order is now queued for production.";
    return "Your order has been accepted.";
  }

  if (order_status === "in_production") return "Your order is currently in production.";
  if (order_status === "ready_for_pickup") return "Your order is ready for pickup. Full payment is required before release.";
  if (order_status === "ready_for_shipment") return "Your order is ready for shipment. Full payment is required before dispatch.";
  if (order_status === "shipped") return "Your order has been shipped.";
  if (order_status === "in_transit") return "Your order is currently in transit.";
  if (order_status === "completed") return "Your order has been completed. Thank you for your purchase.";

  return "Your order is currently being processed.";
};

type Props = {
  order: Order;
  conversation?: Conversation;
};

export default function OrderCard({ order, conversation }: Props) {
  const [openDetail, setOpenDetail] = useState(false);
  const [openChat, setOpenChat] = useState(false);
  const [openCharges, setOpenCharges] = useState(false);
  const [openPay, setOpenPay] = useState(false);
  const [openCancel, setOpenCancel] = useState(false);
  const [cancelMode, setCancelMode] = useState<"instant" | "request">("request");

  const { cancelOrder, isLoading: isCancelling } = useCancelOrder();
  const { charges = [] } = useOrderCharges(order.id);
  const { data: payments, isLoading: paymentsLoading } = usePaymentsQuery(order.id);

  const customerName = order.customer_name ?? "-";
  const phoneNumber = order.phone_number ?? "-";
  const pickupLocation = order.pickup_location ?? "-";
  const deliveryAddress = order.delivery_address ?? "-";

  const items = useMemo(() => order.order_items ?? [], [order.order_items]);

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + Number(i.total_price ?? 0), 0),
    [items]
  );

  const totalPieces = useMemo(
    () => items.reduce((sum, i) => sum + Number(i.quantity ?? 0), 0),
    [items]
  );

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

  const totalPaid = payments?.totalPaid ?? 0;

  const breakdown = useMemo(
    () => calculatePaymentBreakdown(finalTotal, totalPaid, "partial"),
    [finalTotal, totalPaid]
  );

  const remaining = breakdown.remaining;

  const orderMessage = getOrderMessage(order);
  const statusUI = getOrderStatusUI(order.order_status);

  const isPickup = order.delivery_method === "pickup";
  const unreadCount = conversation?.customer_unread_count ?? 0;

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

  return (
    <>
      {/* ── CARD ── fixed height via flex column + min-h */}
      <div className="
        relative flex flex-col
        h-[540px]
        rounded-2xl overflow-hidden
        border border-[#2A1F14]
        bg-[#0E0A06]
        shadow-[0_8px_32px_rgba(0,0,0,0.6)]
        transition-all duration-300
        hover:-translate-y-0.5
        hover:border-[#D4A97A]/30
        hover:shadow-[0_16px_48px_rgba(0,0,0,0.7)]
      ">

        {/* TOP ACCENT LINE */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#D4A97A]/60 to-transparent flex-shrink-0" />

        {/* ── HEADER ── */}
        <div className="flex-shrink-0 px-5 pt-4 pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[9px] font-black tracking-[0.22em] text-[#7A5C3A] uppercase mb-0.5">
                Order Reference
              </p>
              <h2 className="text-[15px] font-bold text-white leading-tight truncate">
                {order.order_reference_code ?? "Pending Order"}
              </h2>
              <p className="text-[10px] text-white/30 mt-0.5">
                {totalPieces} item{totalPieces !== 1 ? "s" : ""} · {new Date(order.created_at).toLocaleDateString()}
              </p>
            </div>

            <span className={`
              flex-shrink-0 px-2.5 py-1 rounded-full
              text-[9px] font-black uppercase tracking-[0.15em]
              border ${statusUI.color}
            `}>
              {statusUI.label}
            </span>
          </div>
        </div>

        {/* ── FINANCIALS ── */}
        <div className="flex-shrink-0 mx-5 mb-3">
          <div className="grid grid-cols-3 divide-x divide-[#2A1F14] rounded-xl border border-[#2A1F14] bg-[#0B0704] overflow-hidden">
            <FinStat label="Total" value={`₱${finalTotal.toLocaleString()}`} color="text-[#E8C98A]" />
            <FinStat
              label="Paid"
              value={paymentsLoading ? "…" : `₱${totalPaid.toLocaleString()}`}
              color="text-emerald-400"
            />
            <FinStat
              label="Balance"
              value={`₱${remaining.toLocaleString()}`}
              color={remaining > 0 ? "text-amber-400" : "text-emerald-400"}
            />
          </div>
        </div>

        {/* ── STATUS MESSAGE ── */}
        <div className="flex-shrink-0 mx-5 mb-3">
          <div className="flex items-start gap-2.5 rounded-xl bg-[#160F08] border border-[#2A1F14] px-3.5 py-2.5">
            <div className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#D4A97A]" />
            <p className="text-[11px] leading-relaxed text-white/55 italic">
              {orderMessage}
            </p>
          </div>
        </div>

        {/* ── INFO ROWS ── */}
        <div className="flex-shrink-0 mx-5 mb-3 space-y-1.5">
          <InfoRow label="Customer" value={customerName} />
          <InfoRow label="Contact" value={phoneNumber} />
          <InfoRow
            label={isPickup ? "Pickup" : "Shipping"}
            value={isPickup ? pickupLocation : deliveryAddress}
            truncate
          />
        </div>

        {/* SPACER — pushes footer to bottom */}
        <div className="flex-1" />

        {/* ── FOOTER ACTIONS ── always at bottom */}
        <div className="flex-shrink-0 border-t border-[#2A1F14] bg-[#0B0704] px-5 py-4 space-y-2.5">

          {/* Charges row */}
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-white/25">
              Charges · {charges.length}
            </span>
            <button
              onClick={() => setOpenCharges(true)}
              className="text-[10px] font-bold text-[#D4A97A] hover:text-[#F1C999] transition-colors"
            >
              Manage →
            </button>
          </div>

          {/* Primary row: Details + Chat */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setOpenDetail(true)}
              className="
                h-9 rounded-lg
                border border-[#2A1F14] bg-white/[0.03]
                text-[10px] font-black uppercase tracking-[0.1em] text-white/60
                hover:bg-white/[0.06] hover:text-white/80
                transition-all duration-200
              "
            >
              Details
            </button>

            <button
              onClick={() => setOpenChat(true)}
              className="
                relative h-9 rounded-lg
                bg-[#C49A6C] hover:bg-[#D4A97A]
                text-[10px] font-black uppercase tracking-[0.1em] text-[#0E0A06]
                transition-all duration-200
              "
            >
              Chat
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-black text-white shadow-lg">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Pay button — always reserves height */}
          <div className="h-9">
            {canPay ? (
              <button
                onClick={() => setOpenPay(true)}
                className="
                  h-full w-full rounded-lg
                  bg-gradient-to-r from-[#C49A6C] via-[#D4A97A] to-[#E8C98A]
                  text-[10px] font-black uppercase tracking-[0.12em] text-[#0E0A06]
                  shadow-[0_2px_12px_rgba(212,169,122,0.3)]
                  hover:shadow-[0_4px_20px_rgba(212,169,122,0.45)]
                  hover:brightness-105
                  transition-all duration-200
                "
              >
                {payButtonLabel}
              </button>
            ) : (
              /* Invisible placeholder to keep consistent height */
              <div className="h-full" />
            )}
          </div>

          {/* Cancel — always reserves height */}
          <div className="h-5 flex items-center justify-center">
            {canCancel ? (
              <button
                onClick={handleCancelClick}
                disabled={isCancelling}
                className="
                  text-[9px] font-black uppercase tracking-[0.18em]
                  text-rose-500/70 hover:text-rose-400
                  disabled:opacity-40
                  transition-colors duration-200
                "
              >
                {isCancelling ? "Cancelling…" : "Cancel Order"}
              </button>
            ) : (
              <div className="h-5" />
            )}
          </div>
        </div>
      </div>

      {/* ── MODALS ── */}
      <OrderFullDetailModal open={openDetail} onClose={() => setOpenDetail(false)} order={order} />
      <ChatModal open={openChat} onClose={() => setOpenChat(false)} order={order} currentUserId={order.user_id} senderType="customer" />
      <UserChargesModal open={openCharges} onClose={() => setOpenCharges(false)} charges={charges} order={order} userId={order.user_id} />
      <PayModal open={openPay} onClose={() => setOpenPay(false)} order={order} totalAmount={finalTotal} />
      <CancelOrderModal open={openCancel} onClose={() => setOpenCancel(false)} order={order} mode={cancelMode} onConfirm={handleConfirmCancel} />
    </>
  );
}

/* ── SUB-COMPONENTS ── */

function FinStat({
  label,
  value,
  color = "text-white",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-2.5 px-1">
      <p className="text-[8px] font-black uppercase tracking-[0.18em] text-white/20 mb-0.5">
        {label}
      </p>
      <p className={`text-[12px] font-bold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

function InfoRow({
  label,
  value,
  truncate = false,
}: {
  label: string;
  value: string;
  truncate?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="flex-shrink-0 text-[9px] font-black uppercase tracking-[0.16em] text-white/25">
        {label}
      </span>
      <span className={`text-[11px] font-semibold text-white/70 ${truncate ? "truncate" : ""}`}>
        {value}
      </span>
    </div>
  );
}