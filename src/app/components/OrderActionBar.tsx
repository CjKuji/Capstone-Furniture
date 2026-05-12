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
};

/**
 * =========================================================
 * BUTTON STYLE SYSTEM (CONSISTENT ADMIN DESIGN)
 * =========================================================
 */

const base =
  "flex-1 rounded-xl py-2 text-sm font-semibold transition border";

const primary =
  "bg-black text-white border-black hover:opacity-90";

const success =
  "bg-green-600 text-white border-green-600 hover:bg-green-700";

const danger =
  "bg-red-600 text-white border-red-600 hover:bg-red-700";

const warning =
  "bg-yellow-500 text-black border-yellow-500 hover:bg-yellow-600";

const info =
  "bg-blue-600 text-white border-blue-600 hover:bg-blue-700";

const neutral =
  "bg-white text-black border-black/20 hover:bg-black hover:text-white";

export default function OrderActionBar({
  order,
  totalPaid,
  finalTotal,
  adminId,
  onOpenFinalize,
}: Props) {
  const flow = useOrderFlow();
  const p = useOrderPermissions(order, totalPaid, finalTotal);

  /**
   * =========================================================
   * SAFE ACTIONS
   * =========================================================
   */
  const safe = {
    accept: () => {
      if (!adminId) return console.error("Missing adminId");
      flow.accept(order.id, adminId);
    },

    start: () => flow.startProduction(order.id),
    ready: () => flow.markReady(order.id),
    ship: () => flow.dispatch(order.id),
    complete: () => flow.complete(order.id),
  };

  const hideFinalizePricing = order.charge_status === "accepted";

  /**
   * =========================================================
   * ACTION PRIORITY (IMPORTANT UX RULE)
   * =========================================================
   * 1. Primary (next required step)
   * 2. Secondary (review / finalize)
   * 3. Progress pipeline (production flow)
   */

  return (
    <div className="space-y-2">

      {/* ================= PRIMARY ROW ================= */}
      <div className="flex gap-2">

        {/* ACCEPT */}
        {p.canAccept && (
          <button onClick={safe.accept} className={`${base} ${info}`}>
            Accept Order
          </button>
        )}

        {/* COMPLETE */}
        {p.canComplete && (
          <button onClick={safe.complete} className={`${base} ${success}`}>
            Mark Complete
          </button>
        )}

      </div>

      {/* ================= SECONDARY ROW ================= */}
      <div className="flex gap-2">

        {/* FINALIZE */}
        {p.canFinalizeCharges && !hideFinalizePricing && (
          <button
            onClick={onOpenFinalize}
            className={`${base} ${neutral}`}
          >
            Finalize Pricing
          </button>
        )}

        {/* CANCEL REVIEW */}
        {p.canReviewCancel && (
          <button className={`${base} ${danger}`}>
            Review Cancellation
          </button>
        )}

      </div>

      {/* ================= PRODUCTION PIPELINE ================= */}
      <div className="flex flex-wrap gap-2">

        {p.canStartProduction && (
          <button onClick={safe.start} className={`${base} ${primary}`}>
            Start Production
          </button>
        )}

        {p.canMarkReady && (
          <button onClick={safe.ready} className={`${base} ${warning}`}>
            Mark Ready
          </button>
        )}

        {p.canDispatch && (
          <button onClick={safe.ship} className={`${base} ${info}`}>
            Dispatch / Ship
          </button>
        )}

      </div>

    </div>
  );
}