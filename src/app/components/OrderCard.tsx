"use client";

import { useMemo, useState } from "react";
import type { Order, OrderStatus, OrderCharge, OrderItem } from "@/types/order";
import type { Conversation } from "@/hooks/useConversationList";

import OrderFullDetailModal from "@/app/components/OrderFullDetailModal";
import ChatModal from "@/app/components/chat/ChatModal";
import ChargesModal from "@/app/components/ChargesModal";
import CancelRequestModal from "@/app/components/CancelRequestModal";
import OrderActionBar from "@/app/components/OrderActionBar";

import { useOrderCharges } from "@/hooks/useOrderCharges";
import { usePaymentsQuery } from "@/hooks/useFetchPayments";
import { useCancelReview } from "@/hooks/useCancelReview";

import { getOrderStatusUI } from "@/lib/orderUserStatusUI";
import { calculatePaymentBreakdown } from "@/utils/paymentCalculator";

/* ── MESSAGE STATE LOGIC ── */
const getOrderMessage = (order: Order): string => {
  const { order_status, payment_status, cancel_status, charge_status } = order;

  if (order_status === "cancelled") return "Order has been cancelled.";
  if (cancel_status === "requested") return "Cancellation request — pending review.";
  if (cancel_status === "rejected") return "Cancellation request was rejected.";

  if (order_status === "ready_for_pickup" || order_status === "ready_for_shipment") {
    if (payment_status !== "fully_paid") {
      return "Waiting for full payment before release.";
    }
  }

  if (order_status === "accepted") {
    if (charge_status === "pending") return "Final pricing is being calculated.";
    if (payment_status === "unpaid") return "Awaiting payment before production.";
    if (payment_status === "partially_paid") return "Partial payment confirmed.";
    if (payment_status === "fully_paid") return "Full payment confirmed.";
  }

  if (order_status === "in_production") return "Order is currently in production.";
  if (order_status === "ready_for_pickup") return "Ready for pickup.";
  if (order_status === "ready_for_shipment") return "Ready to dispatch for shipment.";
  if (order_status === "shipped") return "Order has been shipped.";
  if (order_status === "in_transit") return "Order is in transit.";
  if (order_status === "completed") return "Order successfully completed.";

  return "Order is being processed.";
};

type Props = {
  order: Order;
  conversation?: Conversation;
  userId: string;
};

export default function CustomerOrderCard({ order, conversation, userId }: Props) {
  /* ── MODAL VISIBILITY CONFIGURATION ── */
  const [openDetail, setOpenDetail] = useState(false);
  const [openChat, setOpenChat] = useState(false);
  const [openViewCharges, setOpenViewCharges] = useState(false);
  const [openPayModal, setOpenPayModal] = useState(false);
  const [openCancel, setOpenCancel] = useState(false);

  const { charges = [] as OrderCharge[] } = useOrderCharges(order.id);
  const { data: payments, isLoading: paymentsLoading } = usePaymentsQuery(order.id);
  const { approveCancel, isLoading: isProcessingCancel } = useCancelReview();

  const items: OrderItem[] = useMemo(() => order.order_items ?? [], [order.order_items]);
  const safeCharges: OrderCharge[] = useMemo(() => charges ?? [], [charges]);

  const totalPieces = useMemo(
    () => items.reduce((sum, i) => sum + Number(i.quantity ?? 0), 0),
    [items]
  );

  const chargesTotal = useMemo(() => {
    return safeCharges.reduce(
      (total, c) =>
        c.is_additive ? total + Number(c.amount ?? 0) : total - Number(c.amount ?? 0),
      0
    );
  }, [safeCharges]);

  const baseTotal = useMemo(() => {
    return Number(
      order.quote_total_price ??
        items.reduce((sum, i) => sum + Number(i.total_price ?? 0), 0)
    );
  }, [order.quote_total_price, items]);

  const finalTotal = useMemo(() => {
    return order.charge_status === "accepted"
      ? Number(order.final_total_price ?? baseTotal)
      : baseTotal + chargesTotal;
  }, [order.charge_status, order.final_total_price, baseTotal, chargesTotal]);

  const totalPaid = payments?.totalPaid ?? 0;
  const breakdown = useMemo(
    () => calculatePaymentBreakdown(finalTotal, totalPaid, "partial"),
    [finalTotal, totalPaid]
  );
  const remaining = breakdown.remaining;

  const orderMessage = getOrderMessage(order);
  const statusUI = getOrderStatusUI(order.order_status);

  const customerName = order.customer_name ?? "-";
  const phoneNumber = order.phone_number ?? "-";
  const pickupLocation = order.pickup_location ?? "-";
  const deliveryAddress = order.delivery_address ?? "-";

  const isPickup = order.delivery_method === "pickup";
  const unreadCount = conversation?.admin_unread_count ?? 0;
  const hasCancelRequest = order.cancel_status === "requested";

  const getChargeStatusBadge = () => {
    const status = order.charge_status ?? "pending";
    if (status === "accepted") return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (status === "rejected") return "text-rose-400 bg-rose-500/10 border-rose-500/20";
    return "text-amber-400 bg-amber-500/10 border-amber-500/20";
  };

  const formatChargeStatusLabel = () => {
    const status = order.charge_status ?? "pending";
    if (status === "accepted") return "Approved";
    if (status === "rejected") return "Rejected";
    return "Pending Review";
  };

  return (
    <>
      {/* ── CARD CONTAINER SHELL ── */}
      <div className="
        relative flex flex-col
        w-full max-w-md mx-auto
        rounded-2xl overflow-hidden
        border border-[#423120]
        bg-gradient-to-b from-[#140F0A] to-[#0E0A06]
        shadow-[0_12px_40px_rgba(0,0,0,0.7)]
        transition-all duration-300 ease-out
        hover:border-[#D4A97A]/50
        hover:shadow-[0_20px_48px_rgba(212,169,122,0.08),0_24px_64px_rgba(0,0,0,0.8)]
      ">
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#D4A97A]/80 to-transparent flex-shrink-0" />

        {/* ── HEADER ── */}
        <div className="flex-shrink-0 px-5 pt-4 pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[9px] font-black tracking-[0.22em] text-[#A68056] uppercase mb-0.5">
                Order Reference
              </p>
              <h2 className="text-[15px] font-bold text-white tracking-wide leading-tight truncate">
                {order.order_reference_code ?? "Pending Order"}
              </h2>
              <p className="text-[10px] text-white/40 mt-0.5">
                Ordered on {new Date(order.created_at).toLocaleDateString()}
              </p>
            </div>

            <span className={`
              flex-shrink-0 px-3 py-1 rounded-full
              text-[9px] font-black uppercase tracking-[0.15em]
              border backdrop-blur-sm bg-black/30 shadow-inner ${statusUI.color}
            `}>
              {statusUI.label}
            </span>
          </div>
        </div>

        {/* ── HANDCRAFTED COUNT BADGE ── */}
        <div className="px-5 mb-2.5 flex-shrink-0">
          <div className="flex items-center gap-2 bg-white/[0.02] border border-[#2A1F14] rounded-xl px-3 py-1.5">
            <span className="text-[11px] font-black text-[#D4A97A] bg-[#D4A97A]/10 px-1.5 py-0.5 rounded-md">
              x{totalPieces}
            </span>
            <span className="text-[11.5px] font-semibold text-white/90 tracking-wide">
              Handcrafted Items
            </span>
          </div>
        </div>

        {/* ── PRICING ANALYSIS METRICS ── */}
        <div className="flex-shrink-0 mx-5 mb-2.5">
          <div className="grid grid-cols-3 divide-x divide-[#38291A] rounded-t-xl border-t border-x border-[#38291A] bg-[#070503] overflow-hidden shadow-inner">
            <FinStat label="Total" value={`₱${finalTotal.toLocaleString()}`} color="text-[#E8C98A]" />
            <FinStat
              label="Paid"
              value={paymentsLoading ? "…" : `₱${totalPaid.toLocaleString()}`}
              color="text-emerald-400"
            />
            <FinStat
              label="Balance"
              value={`₱${remaining.toLocaleString()}`}
              color={remaining > 0 ? "text-amber-500 font-bold" : "text-emerald-400"}
            />
          </div>

          <div className="flex items-center justify-between border border-[#38291A] bg-[#110B06] px-3 py-1.5 rounded-b-xl text-[10px]">
            <span className="text-white/40 font-medium">
              Base Quote: <span className="text-white/70">₱{baseTotal.toLocaleString()}</span>
            </span>
            <span className={`font-semibold ${chargesTotal >= 0 ? "text-amber-500" : "text-emerald-400"}`}>
              {chargesTotal >= 0 ? "+" : ""} Fees: ₱{chargesTotal.toLocaleString()}
            </span>
          </div>
        </div>

        {/* ── WORKFLOW PIPELINE TRACKING NOTIFICATION ── */}
        <div className="flex-shrink-0 mx-5 mb-2.5">
          <div className="flex items-start gap-2.5 rounded-xl bg-[#1B120A] border border-[#38291A] px-3.5 py-2">
            <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#D4A97A] shadow-[0_0_8px_#D4A97A]" />
            <p className="text-[11px] leading-relaxed text-white/70 italic">
              {orderMessage}
            </p>
          </div>
        </div>

        {/* ── SHIPPING META DATA IDENTIFIERS ── */}
        <div className="flex-shrink-0 mx-5 mb-3.5 space-y-1.5">
          <InfoRow label="Customer" value={customerName} />
          <InfoRow label="Contact" value={phoneNumber} />
          <InfoRow
            label={isPickup ? "Pickup" : "Shipping"}
            value={isPickup ? pickupLocation : deliveryAddress}
            truncate
          />
        </div>

        {/* ── CONTROLLER ACTIONS PLATFORM FOOTER ── */}
        <div className="mt-auto border-t border-[#2A1F14] bg-[#080604] px-5 py-3.5 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-[#1C150E] pb-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-black uppercase tracking-[0.18em] text-white/30">
                Invoice Adjustments ({safeCharges.length})
              </span>
              <span className={`text-[9px] font-bold uppercase tracking-wider border px-1.5 py-0.5 rounded ${getChargeStatusBadge()}`}>
                {formatChargeStatusLabel()}
              </span>
            </div>
            <button
              onClick={() => setOpenViewCharges(true)}
              className="text-[10px] font-black uppercase tracking-wider text-[#D4A97A] hover:text-[#E5BC8E] transition-colors"
            >
              View Statement →
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 w-full">
            <button
              onClick={() => setOpenDetail(true)}
              className="
                h-9 rounded-xl
                border border-[#38291A] bg-white/[0.04]
                text-[10px] font-black uppercase tracking-[0.1em] text-white/70
                hover:bg-white/[0.08] hover:text-white/90 hover:border-[#4E3A25]
                transition-all duration-200
              "
            >
              Details
            </button>

            <button
              onClick={() => setOpenChat(true)}
              className="
                relative h-9 rounded-xl
                bg-[#C49A6C] hover:bg-[#D4A97A] active:scale-[0.97]
                text-[10px] font-black uppercase tracking-[0.1em] text-[#0E0A06]
                shadow-[0_4px_12px_rgba(196,154,108,0.2)]
                transition-all duration-200
              "
            >
              Chat
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-black text-white shadow-lg animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          <OrderActionBar
            order={order}
            totalPaid={totalPaid}
            finalTotal={finalTotal}
            adminId={userId}
            onOpenFinalize={() => setOpenPayModal(true)}
            onOpenCancelReview={() => setOpenCancel(true)}
          />

          {hasCancelRequest && (
            <div className="pt-1 border-t border-[#1C150E] flex items-center justify-center">
              <button
                onClick={() => setOpenCancel(true)}
                className="
                  text-[9px] font-black uppercase tracking-[0.18em]
                  text-rose-400 hover:text-rose-300 underline underline-offset-4
                  transition-colors duration-200
                "
              >
                Cancellation Review Active
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── MODALS (CRITICAL FIX: Always mounted to safeguard the WebGL lifecycle context) ── */}
      <OrderFullDetailModal 
        open={openDetail} 
        onClose={() => setOpenDetail(false)} 
        order={order} 
      />

      <ChatModal 
        open={openChat} 
        onClose={() => setOpenChat(false)} 
        order={order} 
        currentUserId={userId} 
        senderType="customer" 
      />

      <ChargesModal
        open={openViewCharges || openPayModal}
        onClose={() => {
          setOpenViewCharges(false);
          setOpenPayModal(false);
        }}
        orderId={order.id}
        adminId={userId}
        chargeStatus={order.charge_status}
        baseQuoteTotal={baseTotal}
      />

      <CancelRequestModal
        open={openCancel}
        onClose={() => setOpenCancel(false)}
        reason={order.cancel_reason ?? ""}
        orderStatus={order.order_status}
        paymentStatus={order.payment_status}
        isLoading={isProcessingCancel}
        onApprove={async () => {
          await approveCancel({ orderId: order.id, adminId: userId });
          setOpenCancel(false);
        }}
        onReject={async () => {
          setOpenCancel(false);
        }}
      />
    </>
  );
}

/* ── SUB-COMPONENTS ── */
function FinStat({ label, value, color = "text-white" }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-2 px-1">
      <p className="text-[8px] font-black uppercase tracking-[0.18em] text-white/30 mb-0.5">
        {label}
      </p>
      <p className={`text-[12px] font-bold tracking-wide tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

function InfoRow({ label, value, truncate = false }: { label: string; value: string; truncate?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="flex-shrink-0 text-[9px] font-black uppercase tracking-[0.16em] text-white/35">
        {label}
      </span>
      <span className={`text-[11px] font-medium text-white/80 ${truncate ? "max-w-[220px] truncate pl-4" : ""}`}>
        {value}
      </span>
    </div>
  );
}