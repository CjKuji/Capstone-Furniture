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

  const safeAccept = () => {
    if (!adminId) return console.error("Missing adminId");
    flow.accept(order.id, adminId);
  };

  const safeStartProduction = () => {
    flow.startProduction(order.id);
  };

  const safeMarkReady = () => {
    flow.markReady(order.id);
  };

  const safeDispatch = () => {
    flow.dispatch(order.id);
  };

  const safeComplete = () => {
    flow.complete(order.id);
  };

  /**
   * =========================================================
   * UI RULE
   * (UI ONLY — not business logic)
   * =========================================================
   */
  const hideFinalizePricing = order.charge_status === "accepted";

  return (
    <div className="flex flex-wrap gap-2">

      {/* ACCEPT */}
      {p.canAccept && (
        <button
          onClick={safeAccept}
          className="flex-1 rounded-xl bg-blue-600 py-2 text-sm text-white"
        >
          Accept
        </button>
      )}

      {/* CANCEL REVIEW */}
      {p.canReviewCancel && (
        <button className="flex-1 rounded-xl bg-red-500 py-2 text-sm text-white">
          Review Cancel
        </button>
      )}

      {/* FINALIZE PRICING */}
      {p.canFinalizeCharges && !hideFinalizePricing && (
        <button
          onClick={onOpenFinalize}
          className="flex-1 rounded-xl bg-purple-600 py-2 text-sm text-white"
        >
          Finalize Pricing
        </button>
      )}

      {/* START PRODUCTION */}
      {p.canStartProduction && (
        <button
          onClick={safeStartProduction}
          className="flex-1 rounded-xl bg-indigo-600 py-2 text-sm text-white"
        >
          Start Production
        </button>
      )}

      {/* READY */}
      {p.canMarkReady && (
        <button
          onClick={safeMarkReady}
          className="flex-1 rounded-xl bg-yellow-500 py-2 text-sm text-white"
        >
          Ready
        </button>
      )}

      {/* DISPATCH / SHIP */}
      {p.canDispatch && (
        <button
          onClick={safeDispatch}
          className="flex-1 rounded-xl bg-orange-500 py-2 text-sm text-white"
        >
          Ship
        </button>
      )}

      {/* COMPLETE */}
      {p.canComplete && (
        <button
          onClick={safeComplete}
          className="flex-1 rounded-xl bg-green-600 py-2 text-sm text-white"
        >
          Complete
        </button>
      )}
    </div>
  );
}