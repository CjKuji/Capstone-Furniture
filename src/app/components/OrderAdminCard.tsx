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

import { chargeStatusUI, getOrderStatusUI } from "@/lib/orderUserStatusUI";
import { calculatePaymentBreakdown } from "@/utils/paymentCalculator";

/* ── MESSAGE LOGIC ── */
const getOrderMessage = (order: Order): string => {
  const { order_status, payment_status, cancel_status, charge_status } = order;

  if (order_status === "cancelled") return "Order has been cancelled.";
  if (cancel_status === "requested") return "Customer requested cancellation — pending review.";
  if (cancel_status === "rejected") return "Cancellation request was rejected.";

  if (order_status === "accepted") {
    if (charge_status === "pending") return "Final pricing is being calculated.";
    if (payment_status === "unpaid") return "Awaiting customer payment before production.";
    if (payment_status === "partially_paid") return "Partial payment received from customer.";
    if (payment_status === "fully_paid") return "Full payment confirmed.";
  }

  if (order_status === "in_production") return "Order is currently in production.";
  if (order_status === "ready_for_pickup") return "Ready for customer pickup.";
  if (order_status === "ready_for_shipment") return "Ready to dispatch for shipment.";
  if (order_status === "shipped") return "Order has been shipped.";
  if (order_status === "in_transit") return "Order is in transit.";
  if (order_status === "completed") return "Order successfully completed.";

  return "Order is being processed.";
};

type Props = {
  order: Order;
  conversation?: Conversation;
  adminId: string;
  onUpdateStatus?: (orderId: string, status: OrderStatus) => Promise<void>;
};

export default function AdminOrderCard({ order, conversation, adminId }: Props) {
  const [openDetail, setOpenDetail] = useState(false);
  const [openChat, setOpenChat] = useState(false);
  const [openViewCharges, setOpenViewCharges] = useState(false);
  const [openFinalizeCharges, setOpenFinalizeCharges] = useState(false);
  const [openCancel, setOpenCancel] = useState(false);

  const { charges = [] as OrderCharge[] } = useOrderCharges(order.id);
  const { data: payments, isLoading: paymentsLoading } = usePaymentsQuery(order.id);
  const { approveCancel, rejectCancel, isLoading: isProcessingCancel } = useCancelReview();

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

  const finalTotal = useMemo(() => {
    const base = Number(
      order.quote_total_price ??
        items.reduce((sum, i) => sum + Number(i.total_price ?? 0), 0)
    );
    return order.charge_status === "accepted"
      ? Number(order.final_total_price ?? base)
      : base + chargesTotal;
  }, [order, items, chargesTotal]);

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
  const unreadCount = conversation?.customer_unread_count ?? 0;

  const hasCancelRequest = order.cancel_status === "requested";

  return (
    <>
      {/* ── CARD — exact same shell as customer card ── */}
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

        {/* ── FOOTER ACTIONS — mirrors customer card slot-for-slot ── */}
        <div className="flex-shrink-0 border-t border-[#2A1F14] bg-[#0B0704] px-5 py-4 space-y-2.5">

          {/* Charges row */}
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-white/25">
              Charges · {safeCharges.length}
            </span>
            <button
              onClick={() => setOpenViewCharges(true)}
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

          {/* Admin action slot — same h-9 full-width slot as customer's Pay button */}
          <div className="h-9">
            <OrderActionBar
              order={order}
              totalPaid={totalPaid}
              finalTotal={finalTotal}
              adminId={adminId}
              onOpenFinalize={() => setOpenFinalizeCharges(true)}
            />
          </div>

          {/* Cancel review slot — same h-5 centered slot as customer's Cancel row */}
          <div className="h-5 flex items-center justify-center">
            {hasCancelRequest ? (
              <button
                onClick={() => setOpenCancel(true)}
                className="
                  text-[9px] font-black uppercase tracking-[0.18em]
                  text-rose-500/70 hover:text-rose-400
                  transition-colors duration-200
                "
              >
                Review Cancellation Request
              </button>
            ) : (
              <div className="h-5" />
            )}
          </div>
        </div>
      </div>

      {/* ── MODALS ── */}
      <OrderFullDetailModal open={openDetail} onClose={() => setOpenDetail(false)} order={order} />

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
        onApprove={async () => {
          await approveCancel({ orderId: order.id, adminId });
          setOpenCancel(false);
        }}
        onReject={async (r) => {
          await rejectCancel({ orderId: order.id, adminId, reason: r ?? "" });
          setOpenCancel(false);
        }}
      />
    </>
  );
}

/* ── SUB-COMPONENTS — identical to customer card ── */

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