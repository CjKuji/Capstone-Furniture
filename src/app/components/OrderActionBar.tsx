"use client";

import React from "react";
import type { OrderAdmin as Order, OrderStatus } from "@/types/order";
import { useOrderFlow } from "@/hooks/useOrderFlow";
import { useOrderPermissions } from "@/hooks/useOrderPermissions";

type Props = {
  order: Order;
  totalPaid: number;
  finalTotal: number;
  adminId: string;
  onOpenFinalize: () => void;
  onOpenCancelReview: () => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => Promise<void>;
};

/* =========================================================
    DESIGN SYSTEM BUTTON PRIMITIVES
========================================================= */
const baseBtnClass =
  "flex items-center justify-center h-9 w-full rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 border backdrop-blur-sm text-center active:scale-[0.97] select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

const styles = {
  primary: "bg-[#D4A97A] text-[#1C1209] border-[#D4A97A] hover:bg-[#E5BC8E] shadow-sm",
  dark: "bg-white/[0.03] text-white/80 border-white/10 hover:border-[#D4A97A]/40 hover:text-white hover:bg-white/[0.06]",
  success: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20 hover:text-emerald-200",
  danger: "bg-rose-500/10 text-rose-300 border-rose-500/20 hover:bg-rose-500/20 hover:text-rose-200",
  warning: "bg-amber-500/10 text-amber-300 border-amber-500/20 hover:bg-amber-500/20 hover:text-amber-200",
};

export default function OrderActionBar({
  order,
  totalPaid,
  finalTotal,
  adminId,
  onOpenFinalize,
  onOpenCancelReview,
  onUpdateStatus,
}: Props) {
  const flow = useOrderFlow();
  const p = useOrderPermissions(order, totalPaid, finalTotal);

  const safe = {
    accept: async () => {
      if (!adminId) return;
      await flow.accept(order.id, adminId);
      await onUpdateStatus(order.id, "accepted");
    },
    start: async () => {
      await flow.startProduction(order.id);
      await onUpdateStatus(order.id, "in_production");
    },
    ready: async () => {
      await flow.markReady(order.id);
      // Logic for pickup vs shipment status
      const nextStatus = order.delivery_method === "pickup" ? "ready_for_pickup" : "ready_for_shipment";
      await onUpdateStatus(order.id, nextStatus);
    },
    ship: async () => {
      await flow.dispatch(order.id);
      await onUpdateStatus(order.id, "shipped");
    },
    complete: async () => {
      await flow.complete(order.id);
      await onUpdateStatus(order.id, "completed");
    },
  };

  const isChargesAccepted = order.charge_status === "accepted";
  const hasPayment = totalPaid > 0;

  // Build an active stack array to cleanly compute positions
  const activeButtons: React.ReactNode[] = [];

  // 1. ACCEPTANCE PHASE
  if (p.canAccept) {
    activeButtons.push(
      <button key="accept" onClick={safe.accept} className={`${baseBtnClass} ${styles.primary}`}>
        Accept Order
      </button>
    );
  }

  // 2. PRICING PHASE
  if (p.canFinalizeCharges && !isChargesAccepted) {
    activeButtons.push(
      <button key="finalize" onClick={onOpenFinalize} className={`${baseBtnClass} ${styles.primary}`}>
        Finalize Pricing
      </button>
    );
  }

  // 3. PRODUCTION PHASE
  if (p.canStartProduction) {
    if (isChargesAccepted && hasPayment) {
      activeButtons.push(
        <button key="start" onClick={safe.start} className={`${baseBtnClass} ${styles.success}`}>
          Start Production
        </button>
      );
    } else if (isChargesAccepted && !hasPayment) {
      activeButtons.push(
        <button key="awaiting-payment" disabled className={`${baseBtnClass} ${styles.dark}`}>
          Awaiting Payment
        </button>
      );
    }
  }

  // 4. READY/FULFILLMENT PHASE
  if (p.canMarkReady) {
    activeButtons.push(
      <button key="ready" onClick={safe.ready} className={`${baseBtnClass} ${styles.warning}`}>
        Mark Ready
      </button>
    );
  }

  if (p.canDispatch) {
    activeButtons.push(
      <button key="ship" onClick={safe.ship} className={`${baseBtnClass} ${styles.primary}`}>
        Dispatch Shipment
      </button>
    );
  }

  // 5. COMPLETION PHASE
  if (p.canComplete) {
    activeButtons.push(
      <button key="complete" onClick={safe.complete} className={`${baseBtnClass} ${styles.success}`}>
        Complete Order
      </button>
    );
  }

  // 6. CANCELLATION OVERRIDE
  if (p.canReviewCancel) {
    activeButtons.push(
      <button key="review-cancel" onClick={onOpenCancelReview} className={`${baseBtnClass} ${styles.danger}`}>
        Review Cancel
      </button>
    );
  }

  if (activeButtons.length === 0) return null;

  return (
    <div
      className={`grid gap-2 w-full ${
        activeButtons.length === 1 ? "grid-cols-1" : "grid-cols-2"
      }`}
    >
      {activeButtons}
    </div>
  );
}