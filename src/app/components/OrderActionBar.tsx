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

/* =========================================================
   DESIGN SYSTEM (MATCHES YOUR DARK UI)
========================================================= */

const base =
  "flex-1 rounded-xl py-2 text-xs font-semibold transition border backdrop-blur-sm";

/* PRIMARY ACTION (gold accent) */
const primary =
  "bg-[#D4A97A] text-[#1C1209] border-[#D4A97A] hover:opacity-90";

/* DARK PRIMARY (workflow actions) */
const dark =
  "bg-white/[0.04] text-white border-white/10 hover:border-[#D4A97A]/30 hover:text-[#D4A97A]";

/* SUCCESS (soft green, not neon) */
const success =
  "bg-green-500/10 text-green-300 border-green-500/20 hover:bg-green-500/20";

/* DANGER (soft red) */
const danger =
  "bg-red-500/10 text-red-300 border-red-500/20 hover:bg-red-500/20";

/* WARNING (amber system tone) */
const warning =
  "bg-yellow-500/10 text-yellow-300 border-yellow-500/20 hover:bg-yellow-500/20";

export default function OrderActionBar({
  order,
  totalPaid,
  finalTotal,
  adminId,
  onOpenFinalize,
}: Props) {
  const flow = useOrderFlow();
  const p = useOrderPermissions(order, totalPaid, finalTotal);

  /* ================= SAFE ACTIONS ================= */

  const safe = {
    accept: () => {
      if (!adminId) return;
      flow.accept(order.id, adminId);
    },

    start: () => flow.startProduction(order.id),
    ready: () => flow.markReady(order.id),
    ship: () => flow.dispatch(order.id),
    complete: () => flow.complete(order.id),
  };

  const hideFinalizePricing = order.charge_status === "accepted";

  return (
    <div className="space-y-2">

      {/* ================= PRIMARY ROW ================= */}
      <div className="flex gap-2">

        {p.canAccept && (
          <button onClick={safe.accept} className={`${base} ${primary}`}>
            Accept Order
          </button>
        )}

        {p.canComplete && (
          <button onClick={safe.complete} className={`${base} ${success}`}>
            Complete
          </button>
        )}

      </div>

      {/* ================= SECONDARY ROW ================= */}
      <div className="flex gap-2">

        {p.canFinalizeCharges && !hideFinalizePricing && (
          <button onClick={onOpenFinalize} className={`${base} ${dark}`}>
            Finalize Pricing
          </button>
        )}

        {p.canReviewCancel && (
          <button className={`${base} ${danger}`}>
            Review Cancel
          </button>
        )}

      </div>

      {/* ================= PIPELINE ================= */}
      <div className="flex flex-wrap gap-2">

        {p.canStartProduction && (
          <button onClick={safe.start} className={`${base} ${dark}`}>
            Start Production
          </button>
        )}

        {p.canMarkReady && (
          <button onClick={safe.ready} className={`${base} ${warning}`}>
            Mark Ready
          </button>
        )}

        {p.canDispatch && (
          <button onClick={safe.ship} className={`${base} ${primary}`}>
            Dispatch
          </button>
        )}

      </div>

    </div>
  );
}