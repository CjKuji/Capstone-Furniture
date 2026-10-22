"use client";

import { useMemo, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Order, OrderStatus } from "@/types/order";

// Components & Modals
import ChatModal from "@/app/components/chat/ChatModal";
import UserChargesModal from "@/app/components/UserChargesModal";
import PayModal from "@/app/components/PayModal";
import CancelOrderModal from "@/app/components/CancelOrderModal";
import OrderFullDetailModal from "@/app/components/OrderFullDetailModal";

// Hooks
import { useOrderCharges } from "@/hooks/useOrderCharges";
import { usePaymentsQuery } from "@/hooks/useFetchPayments";
import { useCancelOrder } from "@/hooks/useCancelOrder";

// Libs
import { getOrderStatusUI } from "@/lib/orderUserStatusUI";
import { calculatePaymentBreakdown } from "@/utils/paymentCalculator";

const getOrderMessage = (order: Order): string => {
  if (!order) return "Processing manifest details...";
  
  const { order_status, payment_status, cancel_status, charge_status } = order;

  if (order_status === "cancelled") return "This order has been cancelled.";
  if (cancel_status === "requested") return "Your cancellation request is currently under review.";
  if (cancel_status === "rejected") return "Your cancellation request was reviewed and declined.";
  if (order_status === "requested") return "Your order request is awaiting admin review.";

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

  if (order_status === "in_production") {
    return "Your custom furniture pieces are currently being crafted in production.";
  }

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

  if (order_status === "shipped" || order_status === "in_transit") {
    return "Your custom furniture delivery is currently on its way.";
  }

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

  const visibleUnreadCount = propConversation?.customer_unread_count ?? liveUnreadCount;

  useEffect(() => {
    setOrder(propOrder);
  }, [propOrder]);

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
  const [openDetail, setOpenDetail] = useState(false);
  const [openChat, setOpenChat] = useState(false);
  const [openCharges, setOpenCharges] = useState(false);
  const [openPay, setOpenPay] = useState(false);
  const [openCancel, setOpenCancel] = useState(false);

  /* ── DATA HOOKS ── */
  const { charges = [] } = useOrderCharges(order.id);
  
  const { data: payments, isLoading: paymentsLoading, refetch: refetchPayments } = usePaymentsQuery(order.id, {
    type: "order"
  });
  
  const { cancelOrder, isLoading: isCancelling } = useCancelOrder();

  /* ── REALTIME SUBSCRIPTION: FORCE REFETCH PAYMENTS ON NEW ENTRY ── */
  useEffect(() => {
    if (!order.id) return;

    const paymentsChannel = supabase
      .channel(`live-payments-tracker-${order.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payments",
          filter: `order_id=eq.${order.id}`,
        },
        () => {
          refetchPayments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(paymentsChannel);
    };
  }, [order.id, refetchPayments]);

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

    const extractedPaid = payments && typeof payments === "object" && "totalPaid" in payments
      ? Number((payments as { totalPaid?: number | string }).totalPaid ?? 0)
      : Number(payments ?? 0);

    const breakdown = calculatePaymentBreakdown(finalTotal, extractedPaid, "partial");

    return { totalPieces, subtotal, chargesTotal, baseTotal, finalTotal, totalPaid: extractedPaid, breakdown };
  }, [order, charges, payments]);

  const { canCancel, cancelMode, canPay, payButtonLabel } = useMemo(() => {
    const isEarly = ["accepted", "requested"].includes(order.order_status);
    const isUnpaid = !order.payment_status || order.payment_status === "unpaid";
    const pricingNotLocked = order.charge_status !== "accepted";

    const qualifiesForInstantCancel = isUnpaid && order.order_status !== "cancelled";
    
    const balanceExists = financialData.totalPaid > 0;

    return {
      canCancel:
        (qualifiesForInstantCancel || (isEarly && pricingNotLocked)) &&
        order.cancel_status !== "requested",
      cancelMode: qualifiesForInstantCancel ? ("instant" as const) : ("request" as const),
      canPay:
        order.charge_status === "accepted" &&
        order.order_status !== "cancelled" &&
        order.payment_status !== "fully_paid",
      payButtonLabel: balanceExists ? "Pay Remaining Balance" : "Pay Deposit / Now",
    };
  }, [order, financialData.totalPaid]);

  const statusUI = getOrderStatusUI(order.order_status);

  const handleConfirmCancel = async (reason: string) => {
    if (!order.id) return;
    await cancelOrder({ orderId: order.id, userId, reason });
    setOpenCancel(false);
  };

  const handleOpenChat = async () => {
    setLiveUnreadCount(0);
    setOpenChat(true);

    if (propConversation?.id) {
      await supabase
        .from("conversations")
        .update({ customer_unread_count: 0 })
        .eq("id", propConversation.id);
    }
  };

  if (!order.id) return null;

  return (
    <>
      <div className="relative flex flex-col w-full h-full rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--surface)] shadow-[0_8px_28px_rgba(59,40,27,0.10)] transition-all duration-300 hover:border-[var(--accent)]">
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent flex-shrink-0" />

        {/* Header Container */}
        <div className="px-5 pt-4 pb-2 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[9px] font-bold tracking-[0.18em] text-[var(--text-muted)] uppercase mb-0.5">
                Order Reference
              </p>
              <h2 className="text-[15px] font-bold text-[var(--text)] tracking-wide truncate">
                {order.order_reference_code || "Pending"}
              </h2>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                Ordered on {new Date(order.created_at).toLocaleDateString()}
              </p>
            </div>
            
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex items-center gap-1.5 shrink-0 self-start mt-0.5">
                {visibleUnreadCount > 0 && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--danger-tint)] border border-[var(--danger)]/25 text-[var(--danger)] text-[9px] font-bold tracking-wide uppercase animate-pulse">
                    {visibleUnreadCount} MSG
                  </span>
                )}
                <span
                  className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-[0.12em] border border-[var(--border)] ${statusUI?.color}`}
                >
                  {statusUI?.label || "Processing"}
                </span>
              </div>

              {canCancel && (
                <button
                  onClick={() => setOpenCancel(true)}
                  disabled={isCancelling}
                  className="text-[9px] font-bold uppercase text-[var(--danger)] tracking-wider transition-colors bg-[var(--danger-tint)] border border-[var(--danger)]/20 hover:border-[var(--danger)]/40 px-2 py-0.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                >
                  {isCancelling ? "Processing..." : "Cancel Order"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-5 mb-4 flex-shrink-0">
          <ProgressBar status={order.order_status} />
        </div>

        {/* Item Specs Brief */}
        <div className="px-5 mb-2.5 flex-shrink-0">
          <div className="flex items-center gap-2 bg-[var(--surface-alt)] border border-[var(--border)] rounded-xl px-3 py-1.5">
            <span className="text-[11px] font-bold text-[var(--primary)] bg-[var(--surface)] px-1.5 py-0.5 rounded-md">
              x{financialData.totalPieces}
            </span>
            <span className="text-[11.5px] font-semibold text-[var(--text)] tracking-wide">
              Furniture Design Specification
            </span>
          </div>
        </div>

        {/* Financial Badges Metric Layout */}
        <div className="mx-5 mb-2.5 flex-shrink-0">
          <div className="grid grid-cols-3 divide-x divide-[var(--border)] rounded-t-xl border-t border-x border-[var(--border)] bg-[var(--surface-alt)]">
            <FinStat
              label="Total"
              value={`₱${financialData.finalTotal.toLocaleString()}`}
              color="text-[var(--primary)]"
            />
            <FinStat
              label="Paid"
              value={paymentsLoading ? "…" : `₱${financialData.totalPaid.toLocaleString()}`}
              color="text-[var(--success)]"
            />
            <FinStat
              label="Balance"
              value={`₱${financialData.breakdown.remaining.toLocaleString()}`}
              color={
                financialData.breakdown.remaining > 0
                  ? "text-[var(--warning)] font-bold"
                  : "text-[var(--success)]"
              }
            />
          </div>
          <div className="flex items-center justify-between border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 rounded-b-xl text-[10px]">
            <span className="text-[var(--text-muted)]">
              Base:{" "}
              <span className="text-[var(--text)]">
                ₱{financialData.baseTotal.toLocaleString()}
              </span>
            </span>
            <span
              className={`font-semibold ${
                financialData.chargesTotal >= 0 ? "text-[var(--warning)]" : "text-[var(--success)]"
              }`}
            >
              {financialData.chargesTotal >= 0 ? "+" : ""} Adjustments: ₱
              {financialData.chargesTotal.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Workflow Message Bubble */}
        <div className="mx-5 mb-2.5 flex-shrink-0">
          <div className="flex items-start gap-2.5 rounded-xl bg-[var(--surface-alt)] border border-[var(--border)] px-3.5 py-2 min-h-[50px]">
            <div
              className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 bg-[var(--accent)] ${
                ["requested", "accepted", "in_production"].includes(order.order_status)
                  ? "animate-pulse shadow-[0_0_8px_var(--accent)]"
                  : ""
              }`}
            />
            <p className="text-[11px] leading-relaxed text-[var(--text)] italic">
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

        {/* Actions Footer */}
        <div className="mt-auto border-t border-[var(--border)] bg-[var(--surface)] px-5 py-3.5 flex flex-col gap-3 flex-shrink-0">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2 h-7">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-bold uppercase text-[var(--text-muted)] tracking-widest">
                Adjustments ({charges.length})
              </span>
              <span
                className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border self-start ${
                  order.charge_status === "accepted"
                    ? "text-[var(--success)] bg-[var(--success-tint)] border-[var(--success)]/25"
                    : order.charge_status === "rejected"
                    ? "text-[var(--danger)] bg-[var(--danger-tint)] border-[var(--danger)]/25"
                    : "text-[var(--warning)] bg-[var(--warning-tint)] border-[var(--warning)]/25"
                }`}
              >
                {order.charge_status || "Pending"}
              </span>
            </div>
            <button
              onClick={() => setOpenCharges(true)}
              className="text-[10px] font-bold uppercase text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded"
            >
              Statement →
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 h-9 shrink-0">
            <button
              onClick={() => setOpenDetail(true)}
              className="h-full rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] text-[10px] font-bold uppercase text-[var(--text)] hover:bg-[var(--surface)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              Details
            </button>
            <button
              onClick={handleOpenChat}
              className="relative h-full rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[10px] font-bold uppercase text-[var(--primary-foreground)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              Chat
              {visibleUnreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-black text-white animate-pulse">
                  {visibleUnreadCount}
                </span>
              )}
            </button>
          </div>

          <div className="h-9 shrink-0">
            {paymentsLoading ? (
              <button
                disabled
                className="h-full w-full rounded-xl bg-[var(--surface-alt)] border border-[var(--border)] text-[10px] font-bold uppercase text-[var(--text-muted)]"
              >
                Checking Financial Ledger...
              </button>
            ) : canPay ? (
              <button
                onClick={() => setOpenPay(true)}
                className="h-full w-full rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[10px] font-bold uppercase text-[var(--primary-foreground)] shadow-md transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                {payButtonLabel}
              </button>
            ) : (
              <button
                disabled
                className="h-full w-full rounded-xl bg-[var(--surface-alt)] border border-[var(--border)] text-[10px] font-bold uppercase text-[var(--text-muted)] select-none cursor-not-allowed"
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
      <OrderFullDetailModal
        open={openDetail}
        onClose={() => setOpenDetail(false)}
        order={order}
      />
      {openChat && (
        <ChatModal
          open={openChat}
          onClose={() => setOpenChat(false)}
          order={order}
          currentUserId={userId}
          senderType="customer"
        />
      )}
      {openCharges && (
        <UserChargesModal
          open={openCharges}
          onClose={() => setOpenCharges(false)}
          charges={charges}
          order={order}
          userId={userId}
        />
      )}
      {openPay && (
        <PayModal
          open={openPay}
          onClose={() => setOpenPay(false)}
          order={order}
          totalAmount={financialData.finalTotal}
        />
      )}
      {openCancel && (
        <CancelOrderModal
          open={openCancel}
          onClose={() => setOpenCancel(false)}
          order={order}
          mode={cancelMode}
          onConfirm={handleConfirmCancel}
        />
      )}
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
              i <= idx ? "bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" : "bg-[var(--border)]"
            }`}
          />
          {i < stages.length - 1 && (
            <div
              className={`h-[1px] flex-1 mx-1 ${
                i < idx ? "bg-[var(--accent)]/50" : "bg-[var(--border)]"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function FinStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col items-center py-2">
      <p className="text-[8px] font-bold uppercase text-[var(--text-muted)] mb-0.5 tracking-tighter">
        {label}
      </p>
      <p className={`text-[12px] font-bold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

function InfoRow({ label, value, truncate }: { label: string; value: string; truncate?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-[9px] font-bold uppercase text-[var(--text-muted)] tracking-widest">
        {label}
      </span>
      <span className={`text-[11px] font-medium text-[var(--text)] ${truncate ? "truncate max-w-[180px]" : ""}`}>
        {value}
      </span>
    </div>
  );
}