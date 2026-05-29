"use client";

import { useMemo, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; // Updated to match your admin card
import { useRouter } from "next/navigation";
import type { Order, OrderStatus } from "@/types/order";

import OrderFullDetailModal from "@/app/components/OrderFullDetailModal";
import ChatModal from "@/app/components/chat/ChatModal";
import UserChargesModal from "@/app/components/UserChargesModal";
import PayModal from "@/app/components/PayModal";
import CancelOrderModal from "@/app/components/CancelOrderModal";

import { useOrderCharges } from "@/hooks/useOrderCharges";
import { usePaymentsQuery } from "@/hooks/useFetchPayments";
import { useCancelOrder } from "@/hooks/useCancelOrder";

import { getOrderStatusUI } from "@/lib/orderUserStatusUI";
import { calculatePaymentBreakdown } from "@/utils/paymentCalculator";

/* ── STATUS SYSTEM MESSAGE LOGIC ── */
const getOrderMessage = (order: Order): string => {
  if (!order) return "Processing manifest details...";
  const { order_status, payment_status, cancel_status, charge_status } = order;

  if (order_status === "cancelled") return "This order has been cancelled.";
  if (cancel_status === "requested") return "Your cancellation request is currently under review.";
  if (cancel_status === "rejected") return "Your cancellation request was reviewed and declined.";
  if (order_status === "requested") return "Your order request has been submitted and is awaiting admin review and pricing confirmation.";

  if (order_status === "ready_for_pickup" || order_status === "ready_for_shipment") {
    if (payment_status !== "fully_paid") {
      return order_status === "ready_for_pickup"
        ? "Your order is ready for pickup. Full payment is required before release."
        : "Your order is ready for shipment. Full payment is required before dispatch.";
    }
    return "Your furniture is ready for full release.";
  }

  if (order_status === "accepted") {
    if (charge_status === "pending") return "Your order has been accepted. Please wait for the final pricing confirmation from the admin.";
    if (payment_status === "unpaid" && charge_status === "accepted") return "Your final pricing has been confirmed. Payment is required before production begins.";
    if (payment_status === "partially_paid") return "Partial payment received. Your order is now queued for production.";
    if (payment_status === "fully_paid") return "Payment completed successfully. Your order is now queued for production.";
    return "Your order has been accepted.";
  }

  if (order_status === "in_production") return "Your order is currently in production.";
  if (order_status === "shipped") return "Your order has been shipped.";
  if (order_status === "in_transit") return "Your order is currently in transit.";
  if (order_status === "completed") return "Your order has been completed. Thank you for your purchase.";

  return "Your order is currently being processed.";
};

type Props = {
  order: Order;
  userId: string; 
  conversation?: {
    customer_unread_count?: number;
  };
};

export default function OrderCard({ order: initialOrder, userId, conversation }: Props) {
  const router = useRouter();
  
  // ── LIVE STATE ──
  const [order, setOrder] = useState<Order>(initialOrder);

  // Sync state if props update from parent
  useEffect(() => {
    setOrder(initialOrder);
  }, [initialOrder]);

  // ── REALTIME LISTENER ──
  useEffect(() => {
    if (!order?.id) return;

    const channel = supabase
      .channel(`live-order-status-${order.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${order.id}`,
        },
        (payload: { new: Order }) => {
          // Explicitly typing payload fixes the 'any' error
          setOrder(payload.new);
          router.refresh(); // Syncs server components if necessary
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order.id, router]);

  /* ── MODAL VISIBILITY STATES ── */
  const [openDetail, setOpenDetail] = useState(false);
  const [openChat, setOpenChat] = useState(false);
  const [openCharges, setOpenCharges] = useState(false);
  const [openPay, setOpenPay] = useState(false);
  const [openCancel, setOpenCancel] = useState(false);

  /* ── ACTIVE PIPELINE DATA HOOKS ── */
  const { charges = [] } = useOrderCharges(order?.id);
  const { data: payments, isLoading: paymentsLoading } = usePaymentsQuery(order?.id);
  const { cancelOrder, isLoading: isCancelling } = useCancelOrder();

  /* ── MEMOIZED DATA COMPUTATIONS ── */
  const items = useMemo(() => order?.order_items ?? [], [order?.order_items]);
  const safeCharges = useMemo(() => charges ?? [], [charges]);

  const totalPieces = useMemo(
    () => items.reduce((sum, i) => sum + Number(i?.quantity ?? 0), 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + Number(i?.total_price ?? 0), 0),
    [items]
  );

  const chargesTotal = useMemo(() => {
    return safeCharges.reduce(
      (total, c) =>
        c?.is_additive ? total + Number(c?.amount ?? 0) : total - Number(c?.amount ?? 0),
      0
    );
  }, [safeCharges]);

  const baseTotal = useMemo(() => {
    const quote = Number(order?.quote_total_price ?? 0);
    return quote > 0 ? quote : subtotal;
  }, [order?.quote_total_price, subtotal]);

  const finalTotal = useMemo(() => {
    return order?.charge_status === "accepted"
      ? Number(order?.final_total_price ?? baseTotal)
      : baseTotal + chargesTotal;
  }, [order?.charge_status, order?.final_total_price, baseTotal, chargesTotal]);

  const totalPaid = useMemo(() => Number(payments?.totalPaid ?? 0), [payments?.totalPaid]);

  const breakdown = useMemo(
    () => calculatePaymentBreakdown(finalTotal, totalPaid, "partial"),
    [finalTotal, totalPaid]
  );
  
  const remaining = breakdown?.remaining ?? 0;
  const payNowValue = breakdown?.payNow ?? 0;

  const orderMessage = useMemo(() => getOrderMessage(order), [order]);
  const statusUI = useMemo(() => getOrderStatusUI(order?.order_status), [order?.order_status]);

  /* ── ACTION GATE GUARDS ── */
  const { canCancel, canPay, payButtonLabel } = useMemo(() => {
    if (!order) return { canCancel: false, canPay: false, payButtonLabel: "Pay Now" };

    const isEarlyStatus = order.order_status === "accepted" || order.order_status === "requested";
    const isUnpaid = order.payment_status === "unpaid";
    const hasNoAcceptedCharges = order.charge_status !== "accepted";

    return {
      canCancel: isEarlyStatus && isUnpaid && hasNoAcceptedCharges && order.cancel_status !== "requested",
      canPay: payNowValue > 0 && order.charge_status === "accepted" && order.order_status !== "cancelled",
      payButtonLabel: totalPaid > 0 ? "Pay Remaining" : "Pay Now",
    };
  }, [order?.order_status, order?.payment_status, order?.cancel_status, order?.charge_status, payNowValue, totalPaid]);

  const isPickup = order?.delivery_method === "pickup";
  const unreadCount = conversation?.customer_unread_count ?? 0;

  const chargeStatusBadge = useMemo(() => {
    const status = order?.charge_status ?? "pending";
    if (status === "accepted") return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (status === "rejected") return "text-rose-400 bg-rose-500/10 border-rose-500/20";
    return "text-amber-400 bg-amber-500/10 border-amber-500/20";
  }, [order?.charge_status]);

  const handleConfirmCancel = async (reason: string) => {
    if (!order?.id) return;
    await cancelOrder({ orderId: order.id, userId: userId, reason });
    setOpenCancel(false);
  };

  if (!order || !order.id) return null;

  return (
    <>
      <div className="relative flex flex-col w-full max-w-md mx-auto rounded-2xl overflow-hidden border border-[#423120] bg-gradient-to-b from-[#140F0A] to-[#0E0A06] shadow-[0_12px_40px_rgba(0,0,0,0.7)] transition-all duration-300 ease-out hover:border-[#D4A97A]/50 hover:shadow-[0_20px_48px_rgba(212,169,122,0.08),0_24px_64px_rgba(0,0,0,0.8)]">
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#D4A97A]/80 to-transparent flex-shrink-0" />

        <div className="flex-shrink-0 px-5 pt-4 pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[9px] font-black tracking-[0.22em] text-[#A68056] uppercase mb-0.5">Order Reference</p>
              <h2 className="text-[15px] font-bold text-white tracking-wide leading-tight truncate">{order.order_reference_code ?? "Pending Order"}</h2>
              <p className="text-[10px] text-white/40 mt-0.5">Ordered on {new Date(order.created_at).toLocaleDateString()}</p>
            </div>
            <span className={`flex-shrink-0 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border backdrop-blur-sm bg-black/30 shadow-inner ${statusUI?.color ?? "text-white"}`}>
              {statusUI?.label ?? "Processing"}
            </span>
          </div>
        </div>

        <div className="px-5 mb-4">
          <ProgressBar status={order.order_status} />
        </div>

        <div className="px-5 mb-2.5 flex-shrink-0">
          <div className="flex items-center gap-2 bg-white/[0.02] border border-[#2A1F14] rounded-xl px-3 py-1.5">
            <span className="text-[11px] font-black text-[#D4A97A] bg-[#D4A97A]/10 px-1.5 py-0.5 rounded-md">x{totalPieces}</span>
            <span className="text-[11.5px] font-semibold text-white/90 tracking-wide">Furniture Design</span>
          </div>
        </div>

        <div className="flex-shrink-0 mx-5 mb-2.5">
          <div className="grid grid-cols-3 divide-x divide-[#38291A] rounded-t-xl border-t border-x border-[#38291A] bg-[#070503] overflow-hidden shadow-inner">
            <FinStat label="Total" value={`₱${finalTotal.toLocaleString()}`} color="text-[#E8C98A]" />
            <FinStat label="Paid" value={paymentsLoading ? "…" : `₱${totalPaid.toLocaleString()}`} color="text-emerald-400" />
            <FinStat label="Balance" value={`₱${remaining.toLocaleString()}`} color={remaining > 0 ? "text-amber-500 font-bold" : "text-emerald-400"} />
          </div>
          <div className="flex items-center justify-between border border-[#38291A] bg-[#110B06] px-3 py-1.5 rounded-b-xl text-[10px]">
            <span className="text-white/40 font-medium">Base Quote: <span className="text-white/70">₱{baseTotal.toLocaleString()}</span></span>
            <span className={`font-semibold ${chargesTotal >= 0 ? "text-amber-500" : "text-emerald-400"}`}>
              {chargesTotal >= 0 ? "+" : ""} Fees: ₱{chargesTotal.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex-shrink-0 mx-5 mb-2.5">
          <div className="flex items-start gap-2.5 rounded-xl bg-[#1B120A] border border-[#38291A] px-3.5 py-2">
            <div className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#D4A97A] shadow-[0_0_8px_#D4A97A] ${order.order_status === 'accepted' && payNowValue > 0 ? 'animate-pulse' : ''}`} />
            <p className="text-[11px] leading-relaxed text-white/70 italic">{orderMessage}</p>
          </div>
        </div>

        <div className="flex-shrink-0 mx-5 mb-3.5 space-y-1.5">
          <InfoRow label="Customer" value={order.customer_name ?? "-"} />
          <InfoRow label="Contact" value={order.phone_number ?? "-"} />
          <InfoRow label={isPickup ? "Pickup" : "Shipping"} value={isPickup ? (order.pickup_location ?? "-") : (order.delivery_address ?? "-")} truncate />
        </div>

        <div className="mt-auto border-t border-[#2A1F14] bg-[#080604] px-5 py-3.5 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-[#1C150E] pb-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-black uppercase tracking-[0.18em] text-white/30">Adjustments ({safeCharges.length})</span>
              <span className={`text-[9px] font-bold uppercase tracking-wider border px-1.5 py-0.5 rounded ${chargeStatusBadge}`}>
                {order.charge_status === "accepted" ? "Approved" : order.charge_status === "rejected" ? "Rejected" : "Pending"}
              </span>
            </div>
            <button onClick={() => setOpenCharges(true)} className="text-[10px] font-black uppercase tracking-wider text-[#D4A97A] hover:text-[#E5BC8E] transition-colors">
              Statement →
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 w-full">
            <button onClick={() => setOpenDetail(true)} className="h-9 rounded-xl border border-[#38291A] bg-white/[0.04] text-[10px] font-black uppercase tracking-[0.1em] text-white/70 hover:bg-white/[0.08] hover:text-white/90 transition-all duration-200">
              Details
            </button>
            <button onClick={() => setOpenChat(true)} className="relative h-9 rounded-xl bg-[#C49A6C] hover:bg-[#D4A97A] active:scale-[0.97] text-[10px] font-black uppercase tracking-[0.1em] text-[#0E0A06] transition-all duration-200">
              Chat
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-black text-white shadow-lg animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {canPay && (
            <button onClick={() => setOpenPay(true)} className="h-9 w-full rounded-xl bg-gradient-to-r from-[#C49A6C] via-[#D4A97A] to-[#E8C98A] text-[10px] font-black uppercase tracking-[0.12em] text-[#0E0A06] shadow-[0_4px_12px_rgba(212,169,122,0.2)] hover:shadow-[0_4px_20px_rgba(212,169,122,0.45)] transition-all duration-200">
              {payButtonLabel}
            </button>
          )}

          {canCancel && (
            <div className="pt-1 border-t border-[#1C150E] flex items-center justify-center">
              <button
                onClick={() => setOpenCancel(true)}
                disabled={isCancelling}
                className="text-[9px] font-black uppercase tracking-[0.18em] text-rose-400 hover:text-rose-300 disabled:opacity-40 transition-colors"
              >
                {isCancelling ? "Cancelling…" : "Cancel Order"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── MODALS ── */}
      <OrderFullDetailModal open={openDetail} onClose={() => setOpenDetail(false)} order={order} />
      <ChatModal open={openChat} onClose={() => setOpenChat(false)} order={order} currentUserId={userId} senderType="customer" />
      <UserChargesModal open={openCharges} onClose={() => setOpenCharges(false)} charges={safeCharges} order={order} userId={userId} />
      <PayModal open={openPay} onClose={() => setOpenPay(false)} order={order} totalAmount={finalTotal} />
      <CancelOrderModal open={openCancel} onClose={() => setOpenCancel(false)} order={order} mode="request" onConfirm={handleConfirmCancel} />
    </>
  );
}

/* ── HELPER COMPONENTS ── */

function ProgressBar({ status }: { status: OrderStatus }) {
  const stages: OrderStatus[] = [
    "requested",
    "accepted",
    "in_production",
    "ready_for_shipment",
    "completed",
  ];

  const currentStatus = status === "ready_for_pickup" ? "ready_for_shipment" : status;
  const currentIndex = stages.indexOf(currentStatus);

  return (
    <div className="flex items-center justify-between w-full px-1 pt-2">
      {stages.map((stage, i) => (
        <div key={stage} className="flex items-center flex-1 last:flex-none">
          <div
            className={`h-1.5 w-1.5 rounded-full transition-all duration-500 ${
              i <= currentIndex
                ? "bg-[#D4A97A] shadow-[0_0_8px_#D4A97A]"
                : "bg-white/10"
            }`}
          />
          {i < stages.length - 1 && (
            <div
              className={`h-[1px] flex-1 mx-1 ${
                i < currentIndex ? "bg-[#D4A97A]/50" : "bg-white/5"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function FinStat({ label, value, color = "text-white" }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-2 px-1">
      <p className="text-[8px] font-black uppercase tracking-[0.18em] text-white/30 mb-0.5">{label}</p>
      <p className={`text-[12px] font-bold tracking-wide tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

function InfoRow({ label, value, truncate = false }: { label: string; value: string; truncate?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="flex-shrink-0 text-[9px] font-black uppercase tracking-[0.16em] text-white/35">{label}</span>
      <span className={`text-[11px] font-medium text-white/80 ${truncate ? "max-w-[220px] truncate pl-4" : ""}`}>{value}</span>
    </div>
  );
}