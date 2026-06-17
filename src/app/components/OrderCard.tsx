"use client";

import { useMemo, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Order, OrderStatus } from "@/types/order";

// Components & Modals
import OrderFullDetailModal from "@/app/components/OrderFullDetailModal";
import ChatModal from "@/app/components/chat/ChatModal";
import UserChargesModal from "@/app/components/UserChargesModal";
import PayModal from "@/app/components/PayModal";
import CancelOrderModal from "@/app/components/CancelOrderModal";

// Hooks
import { useOrderCharges } from "@/hooks/useOrderCharges";
import { usePaymentsQuery } from "@/hooks/useFetchPayments";
import { useCancelOrder } from "@/hooks/useCancelOrder";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

// Libs
import { getOrderStatusUI } from "@/lib/orderUserStatusUI";
import { calculatePaymentBreakdown } from "@/utils/paymentCalculator";

/* ── REVISED STATUS MESSAGE LOGIC BASED ON PIPELINE FLOW ── */
const getOrderMessage = (order: Order): string => {
  if (!order) return "Processing manifest details...";
  
  const { order_status, payment_status, cancel_status, charge_status } = order;

  // 1. Absolute Overrides
  if (order_status === "cancelled") return "This order has been cancelled.";
  if (cancel_status === "requested") return "Your cancellation request is currently under review.";
  if (cancel_status === "rejected") return "Your cancellation request was reviewed and declined.";

  // 2. Requested Phase
  if (order_status === "requested") {
    return "Your order request is awaiting admin review.";
  }

  // 3. Accepted Phase Execution Blocks
  if (order_status === "accepted") {
    if (charge_status === "pending") {
      return "Order recognized. Waiting for administrative pricing confirmation and custom quote updates.";
    }
    if (payment_status === "unpaid") {
      return "Pricing confirmed. Awaiting initial deposit or full payment to enter production queue.";
    }
    if (payment_status === "partially_paid" || payment_status === "fully_paid") {
      return "Payment verified. Your order is safely queued for production.";
    }
  }

  // 4. Production Phase
  if (order_status === "in_production") {
    return "Your custom furniture pieces are currently being crafted in production.";
  }

  // 5. Fulfillment / Release Phase
  if (["ready_for_pickup", "ready_for_shipment"].includes(order_status)) {
    if (payment_status !== "fully_paid") {
      return order_status === "ready_for_pickup"
        ? "Ready for pickup. Remaining balance and full payment required before release."
        : "Ready for shipment. Remaining balance and full payment required before dispatch.";
    }
    return order_status === "ready_for_pickup"
      ? "Your furniture is ready for full release and pickup."
      : "Your furniture is ready for full release and shipment dispatch.";
  }

  // 6. Transit & Delivery
  if (order_status === "shipped" || order_status === "in_transit") {
    return "Your custom furniture delivery is currently on its way.";
  }

  // 7. Completed End-State
  if (order_status === "completed") {
    return "Order completed. Thank you for choosing us!";
  }

  return "Your order is being processed.";
};

type Props = {
  order: Order;
  userId: string;
  conversation?: { id: string; customer_unread_count?: number };
};

export default function OrderCard({ order: propOrder, userId, conversation: propConversation }: Props) {
  const [order, setOrder] = useState<Order>(propOrder);
  const [liveUnreadCount, setLiveUnreadCount] = useState<number>(
    propConversation?.customer_unread_count ?? 0
  );

  useEffect(() => {
    setOrder(propOrder);
  }, [propOrder]);

  useEffect(() => {
    if (propConversation?.customer_unread_count !== undefined) {
      setLiveUnreadCount(propConversation.customer_unread_count);
    }
  }, [propConversation]);

  /* ── REALTIME SUBSCRIPTION: ORDERS ── */
  useEffect(() => {
    if (!order.id) return;

    const channel = supabase
      .channel(`live-order-customer-${order.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${order.id}`,
        },
        (payload) => {
          setOrder((prev) => ({ ...prev, ...(payload.new as Partial<Order>) }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order.id]);

  /* ── REALTIME SUBSCRIPTION: UNREAD CHAT COUNTER ── */
  useEffect(() => {
    const targetConversationId = propConversation?.id;
    if (!targetConversationId) return;

    const chatChannel = supabase
      .channel(`live-chat-counter-${targetConversationId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
          filter: `id=eq.${targetConversationId}`,
        },
        (payload) => {
          const newData = payload.new as { customer_unread_count?: number };
          if (newData && typeof newData.customer_unread_count === "number") {
            setLiveUnreadCount(newData.customer_unread_count);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
    };
  }, [propConversation?.id]);

  /* ── MODAL STATES ── */
  const [modals, setModals] = useState({
    detail: false,
    chat: false,
    charges: false,
    pay: false,
    cancel: false,
  });

  const toggleModal = (key: keyof typeof modals, val: boolean) => {
    setModals((prev) => ({ ...prev, [key]: val }));
    
    if (key === "chat" && val === true && propConversation?.id) {
      setLiveUnreadCount(0);
      supabase
        .from("conversations")
        .update({ customer_unread_count: 0, customer_last_read_at: new Date().toISOString() })
        .eq("id", propConversation.id)
        .then();
    }
  };

  const anyModalOpen = Object.values(modals).some(Boolean);
  useBodyScrollLock(anyModalOpen);

  /* ── DATA HOOKS ── */
  const { charges = [] } = useOrderCharges(order.id);
  const { data: payments, isLoading: paymentsLoading } = usePaymentsQuery(order.id);
  const { cancelOrder, isLoading: isCancelling } = useCancelOrder();

  /* ── CALCULATIONS ── */
  const financialData = useMemo(() => {
    const items = order.order_items ?? [];
    const totalPieces = items.reduce((sum, i) => sum + Number(i?.quantity ?? 0), 0);
    const subtotal = items.reduce((sum, i) => sum + Number(i?.total_price ?? 0), 0);

    const chargesTotal = (charges ?? []).reduce(
      (total, c) =>
        c?.is_additive
          ? total + Number(c?.amount ?? 0)
          : total - Number(c?.amount ?? 0),
      0
    );

    const baseTotal = Number(order.quote_total_price ?? 0) || subtotal;
    const finalTotal =
      order.charge_status === "accepted"
        ? Number(order.final_total_price ?? baseTotal)
        : baseTotal + chargesTotal;

    const totalPaid = Number(payments?.totalPaid ?? 0);
    const breakdown = calculatePaymentBreakdown(finalTotal, totalPaid, "partial");

    return { totalPieces, subtotal, chargesTotal, baseTotal, finalTotal, totalPaid, breakdown };
  }, [order, charges, payments]);

  const { canCancel, cancelMode, canPay, payButtonLabel } = useMemo(() => {
    const isEarly = ["accepted", "requested"].includes(order.order_status);
    const isUnpaid = !order.payment_status || order.payment_status === "unpaid";
    const pricingNotLocked = order.charge_status !== "accepted";

    const qualifiesForInstantCancel = isUnpaid && order.order_status !== "cancelled";

    return {
      canCancel:
        (qualifiesForInstantCancel || (isEarly && pricingNotLocked)) &&
        order.cancel_status !== "requested",
      cancelMode: qualifiesForInstantCancel ? ("instant" as const) : ("request" as const),
      canPay:
        order.charge_status === "accepted" &&
        order.order_status !== "cancelled" &&
        order.payment_status !== "fully_paid",
      payButtonLabel: financialData.totalPaid > 0 ? "Pay Remaining Balance" : "Pay Deposit / Now",
    };
  }, [order, financialData]);

  const statusUI = getOrderStatusUI(order.order_status);

  const handleConfirmCancel = async (reason: string) => {
    if (!order.id) return;
    await cancelOrder({ orderId: order.id, userId, reason });
    toggleModal("cancel", false);
  };

  if (!order.id) return null;

  return (
    <>
      <div className="relative flex flex-col w-full max-w-md mx-auto h-full rounded-2xl overflow-hidden border border-[#423120] bg-gradient-to-b from-[#140F0A] to-[#0E0A06] shadow-[0_12px_40px_rgba(0,0,0,0.7)] transition-all duration-300 hover:border-[#D4A97A]/50">
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#D4A97A]/80 to-transparent flex-shrink-0" />

        {/* ── HEADER CONTAINER ── */}
        <div className="px-5 pt-4 pb-2 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[9px] font-black tracking-[0.22em] text-[#A68056] uppercase mb-0.5">
                Order Reference
              </p>
              <h2 className="text-[15px] font-bold text-white tracking-wide truncate">
                {order.order_reference_code || "Pending"}
              </h2>
              <p className="text-[10px] text-white/40 mt-0.5">
                Ordered on {new Date(order.created_at).toLocaleDateString()}
              </p>
            </div>
            
            {/* TOP-RIGHT CONTROLS STACK */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              <span
                className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border backdrop-blur-sm bg-black/30 shadow-inner ${statusUI?.color}`}
              >
                {statusUI?.label || "Processing"}
              </span>

              {/* CANCELLATION TRIGGER */}
              {canCancel && (
                <button
                  onClick={() => toggleModal("cancel", true)}
                  disabled={isCancelling}
                  className="text-[9px] font-black uppercase text-rose-400/80 hover:text-rose-400 tracking-wider transition-colors bg-rose-500/[0.04] border border-rose-500/10 hover:border-rose-500/30 px-2 py-0.5 rounded-md"
                >
                  {isCancelling ? "Processing..." : "Cancel Order"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* PROGRESS BAR TRACKER */}
        <div className="px-5 mb-4 flex-shrink-0">
          <ProgressBar status={order.order_status} />
        </div>

        {/* ITEM BRIEF INFO */}
        <div className="px-5 mb-2.5 flex-shrink-0">
          <div className="flex items-center gap-2 bg-white/[0.02] border border-[#2A1F14] rounded-xl px-3 py-1.5">
            <span className="text-[11px] font-black text-[#D4A97A] bg-[#D4A97A]/10 px-1.5 py-0.5 rounded-md">
              x{financialData.totalPieces}
            </span>
            <span className="text-[11.5px] font-semibold text-white/90 tracking-wide">
              Furniture Design Specification
            </span>
          </div>
        </div>

        {/* METRICS PANELS */}
        <div className="mx-5 mb-2.5 flex-shrink-0">
          <div className="grid grid-cols-3 divide-x divide-[#38291A] rounded-t-xl border-t border-x border-[#38291A] bg-[#070503]">
            <FinStat
              label="Total"
              value={`₱${financialData.finalTotal.toLocaleString()}`}
              color="text-[#E8C98A]"
            />
            <FinStat
              label="Paid"
              value={paymentsLoading ? "…" : `₱${financialData.totalPaid.toLocaleString()}`}
              color="text-emerald-400"
            />
            <FinStat
              label="Balance"
              value={`₱${financialData.breakdown.remaining.toLocaleString()}`}
              color={
                financialData.breakdown.remaining > 0
                  ? "text-amber-500 font-bold"
                  : "text-emerald-400"
              }
            />
          </div>
          <div className="flex items-center justify-between border border-[#38291A] bg-[#110B06] px-3 py-1.5 rounded-b-xl text-[10px]">
            <span className="text-white/40">
              Base:{" "}
              <span className="text-white/70">
                ₱{financialData.baseTotal.toLocaleString()}
              </span>
            </span>
            <span
              className={`font-semibold ${
                financialData.chargesTotal >= 0 ? "text-amber-500" : "text-emerald-400"
              }`}
            >
              {financialData.chargesTotal >= 0 ? "+" : ""} Adjustments: ₱
              {financialData.chargesTotal.toLocaleString()}
            </span>
          </div>
        </div>

        {/* LIVE WORKFLOW CONTEXT MESSAGE */}
        <div className="mx-5 mb-2.5 flex-shrink-0">
          <div className="flex items-start gap-2.5 rounded-xl bg-[#1B120A] border border-[#38291A] px-3.5 py-2 min-h-[50px]">
            <div
              className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 bg-[#D4A97A] ${
                ["requested", "accepted", "in_production"].includes(order.order_status)
                  ? "animate-pulse shadow-[0_0_8px_#D4A97A]"
                  : ""
              }`}
            />
            <p className="text-[11px] leading-relaxed text-white/70 italic">
              {getOrderMessage(order)}
            </p>
          </div>
        </div>

        <div className="mx-5 mb-3.5 space-y-1.5 flex-1">
          <InfoRow label="Customer" value={order.customer_name || "-"} />
          <InfoRow
            label={order.delivery_method === "pickup" ? "Pickup Track" : "Shipping Track"}
            value={
              (order.delivery_method === "pickup"
                ? order.pickup_location
                : order.delivery_address) || "-"
            }
            truncate
          />
        </div>

        {/* ── FOOTER ACTIONS ── */}
        <div className="mt-auto border-t border-[#2A1F14] bg-[#080604] px-5 py-3.5 flex flex-col gap-3 flex-shrink-0">
          <div className="flex items-center justify-between border-b border-[#1C150E] pb-2 h-7">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-black uppercase text-white/30 tracking-widest">
                Adjustments ({charges.length})
              </span>
              <span
                className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border self-start ${
                  order.charge_status === "accepted"
                    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                    : order.charge_status === "rejected"
                    ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
                    : "text-amber-400 bg-amber-500/10 border-amber-500/20"
                }`}
              >
                {order.charge_status || "Pending"}
              </span>
            </div>
            <button
              onClick={() => toggleModal("charges", true)}
              className="text-[10px] font-black uppercase text-[#D4A97A] hover:text-[#E5BC8E] transition-colors"
            >
              Statement →
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 h-9 shrink-0">
            <button
              onClick={() => toggleModal("detail", true)}
              className="h-full rounded-xl border border-[#38291A] bg-white/[0.04] text-[10px] font-black uppercase text-white/70 hover:bg-white/[0.08] transition-all"
            >
              Details
            </button>
            <button
              onClick={() => toggleModal("chat", true)}
              className="relative h-full rounded-xl bg-[#C49A6C] hover:bg-[#D4A97A] text-[10px] font-black uppercase text-[#0E0A06] transition-all"
            >
              Chat
              {liveUnreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-black text-white animate-pulse">
                  {liveUnreadCount}
                </span>
              )}
            </button>
          </div>

          {/* ACTION BUTTON CONTAINER */}
          <div className="h-9 shrink-0">
            {paymentsLoading ? (
              <button
                disabled
                className="h-full w-full rounded-xl bg-white/[0.02] border border-white/5 text-[10px] font-black uppercase text-white/20"
              >
                Checking Financial Ledger...
              </button>
            ) : canPay ? (
              <button
                onClick={() => toggleModal("pay", true)}
                className="h-full w-full rounded-xl bg-gradient-to-r from-[#C49A6C] to-[#E8C98A] text-[10px] font-black uppercase text-[#0E0A06] shadow-lg hover:shadow-[#D4A97A]/20 transition-all active:scale-[0.98]"
              >
                {payButtonLabel}
              </button>
            ) : (
              <button
                disabled
                className="h-full w-full rounded-xl bg-white/[0.02] border border-white/5 text-[10px] font-black uppercase text-white/20 select-none cursor-not-allowed"
              >
                {order.order_status === "cancelled" 
                  ? "Order Cancelled" 
                  : order.payment_status === "fully_paid" 
                  ? "Paid In Full" 
                  : "Awaiting Pricing Quote Confirmation"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modals Mounting */}
      {modals.detail && (
        <OrderFullDetailModal
          open={modals.detail}
          onClose={() => toggleModal("detail", false)}
          order={order}
        />
      )}
      <ChatModal
        open={modals.chat}
        onClose={() => toggleModal("chat", false)}
        order={order}
        currentUserId={userId}
        senderType="customer"
      />
      <UserChargesModal
        open={modals.charges}
        onClose={() => toggleModal("charges", false)}
        charges={charges}
        order={order}
        userId={userId}
      />
      <PayModal
        open={modals.pay}
        onClose={() => toggleModal("pay", false)}
        order={order}
        totalAmount={financialData.finalTotal}
      />
      <CancelOrderModal
        open={modals.cancel}
        onClose={() => toggleModal("cancel", false)}
        order={order}
        mode={cancelMode}
        onConfirm={handleConfirmCancel}
      />
    </>
  );
}

/* ── COMPONENT HELPERS ── */

function ProgressBar({ status }: { status: OrderStatus }) {
  const stages: OrderStatus[] = [
    "requested",
    "accepted",
    "in_production",
    "ready_for_shipment",
    "completed",
  ];
  
  const current = status === "ready_for_pickup" ? "ready_for_shipment" : status;
  const idx = stages.indexOf(current);

  return (
    <div className="flex items-center justify-between w-full px-1 pt-2">
      {stages.map((stage, i) => (
        <div key={stage} className="flex items-center flex-1 last:flex-none">
          <div
            className={`h-1.5 w-1.5 rounded-full transition-all duration-500 ${
              i <= idx ? "bg-[#D4A97A] shadow-[0_0_8px_#D4A97A]" : "bg-white/10"
            }`}
          />
          {i < stages.length - 1 && (
            <div
              className={`h-[1px] flex-1 mx-1 ${
                i < idx ? "bg-[#D4A97A]/50" : "bg-white/5"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function FinStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center py-2">
      <p className="text-[8px] font-black uppercase text-white/30 mb-0.5 tracking-tighter">
        {label}
      </p>
      <p className={`text-[12px] font-bold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

function InfoRow({
  label,
  value,
  truncate,
}: {
  label: string;
  value: string;
  truncate?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-[9px] font-black uppercase text-white/35 tracking-widest">
        {label}
      </span>
      <span
        className={`text-[11px] font-medium text-white/80 ${
          truncate ? "truncate max-w-[180px]" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}