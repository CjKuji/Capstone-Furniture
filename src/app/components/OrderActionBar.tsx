"use client";

import type { Order } from "@/types/order";
import { useOrderFlow } from "@/hooks/useOrderFlow";
import { useOrderPermissions } from "@/hooks/useOrderPermissions";

type Props = {
  order: Order;
  totalPaid: number;
  finalTotal: number;
  adminId: string;
  onOpenFinalize: () => void;
  onOpenCancelReview: () => void;
};

/* =========================================================
   DESIGN SYSTEM BUTTON PRIMITIVES
========================================================= */
const baseBtnClass =
  "flex items-center justify-center h-9 w-full rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 border backdrop-blur-sm text-center active:scale-[0.97] select-none cursor-pointer";

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
}: Props) {
  const flow = useOrderFlow();
  const p = useOrderPermissions(order, totalPaid, finalTotal);

  const safe = {
    accept: () => adminId && flow.accept(order.id, adminId),
    start: () => flow.startProduction(order.id),
    ready: () => flow.markReady(order.id),
    ship: () => flow.dispatch(order.id),
    complete: () => flow.complete(order.id),
  };

  const isChargesAccepted = order.charge_status === "accepted";

  // Build an active stack array to cleanly compute positions without placeholder gaps
  const activeButtons: React.ReactNode[] = [];

  if (p.canAccept) {
    activeButtons.push(
      <button key="accept" onClick={safe.accept} className={`${baseBtnClass} ${styles.primary}`}>
        Accept Order
      </button>
    );
  }

  if (p.canStartProduction) {
    activeButtons.push(
      <button key="start" onClick={safe.start} className={`${baseBtnClass} ${styles.dark}`}>
        Start Production
      </button>
    );
  }

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

  if (p.canComplete) {
    activeButtons.push(
      <button key="complete" onClick={safe.complete} className={`${baseBtnClass} ${styles.success}`}>
        Complete Order
      </button>
    );
  }

  if (p.canFinalizeCharges && !isChargesAccepted) {
    activeButtons.push(
      <button key="finalize" onClick={onOpenFinalize} className={`${baseBtnClass} ${styles.dark}`}>
        Finalize Pricing
      </button>
    );
  }

  if (p.canReviewCancel) {
    activeButtons.push(
      <button key="review-cancel" onClick={onOpenCancelReview} className={`${baseBtnClass} ${styles.danger}`}>
        Review Cancel
      </button>
    );
  }

  // If no state buttons match permissions, instantly return null to avoid vertical margin bleed
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