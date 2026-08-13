"use client";

import { useState, useEffect } from "react";
import type { Order } from "@/types/order";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  order: Order;
  mode: "instant" | "request";
};

/* =========================================================
   MESSAGE LOGIC
========================================================= */
const getMessage = (order: Order, computedMode: "instant" | "request") => {
  if (order.cancel_status === "requested") {
    return "Your cancellation request is already pending admin review.";
  }

  if (computedMode === "instant") {
    return "Your order has no payment transactions on file and will be cancelled immediately after confirmation. This action cannot be undone.";
  }

  if (order.payment_status === "partially_paid") {
    return "Partial payment has already been received. Admin review is required before cancellation approval and refund discussion.";
  }

  if (order.payment_status === "fully_paid") {
    return "This order is already fully paid. Admin review is required before cancellation approval and refund discussion.";
  }

  return "This cancellation request requires admin review before approval.";
};

/* =========================================================
   COMPONENT
========================================================= */
export default function CancelOrderModal({
  open,
  onClose,
  onConfirm,
  order,
  mode,
}: Props) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  // Fallback check: force instant cancel mode if there are no registered payments
  const hasNoPayment = !order.payment_status || order.payment_status === "unpaid";
  const computedMode = hasNoPayment ? "instant" : mode;

  const message = getMessage(order, computedMode);
  const isPending = order.cancel_status === "requested";

  // Reset inputs on close
  useEffect(() => {
    if (!open) {
      setReason("");
      setLoading(false);
    }
  }, [open]);

  // ESC key dismissal
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Prevent parent scroll layout bleed
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    try {
      setLoading(true);
      await onConfirm(reason.trim());
      setReason("");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex justify-center p-4 pt-20 sm:pt-4 pb-6 md:pb-8 backdrop-blur-md overflow-hidden bg-[#0A0705]/65"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="
        w-full flex flex-col 
        rounded-2xl max-w-lg
        h-[calc(100vh-80px)] md:h-[calc(100vh-96px)]
        shadow-[0_24px_64px_rgba(0,0,0,0.8)] transition-all duration-200 overflow-hidden
        border border-[#2A1F14] bg-[#0E0A06]
      "
      onClick={(e) => e.stopPropagation()}
      >
        {/* TOP ACCENT GRADIENT LINE */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#D4A97A]/60 to-transparent flex-shrink-0" />

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 shrink-0 bg-[#0B0704] border-b border-[#2A1F14]">
          <div className="min-w-0">
            <p className="text-[9px] font-black tracking-[0.22em] text-[#7A5C3A] uppercase mb-0.5">
              Order Dismissal
            </p>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
              Cancel Order
            </h2>
            <p className="text-[10px] text-white/30 mt-0.5">
              Order #{order.order_reference_code ?? order.id}
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition text-xs"
          >
            ✕
          </button>
        </div>

        {/* ── INTERNAL SCROLLABLE BODY ── */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-5 focus:outline-none custom-scrollbar">
          
          {/* CRITICAL MODE BADGE */}
          <div>
            <span className={`
              text-[9px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-full border
              ${computedMode === "instant" 
                ? "bg-rose-500/5 text-rose-500 border-rose-500/20" 
                : "bg-[#D4A97A]/5 text-[#D4A97A] border-[#D4A97A]/20"
              }
            `}>
              {computedMode === "instant" ? "Instant Cancellation" : "Admin Review Required"}
            </span>
          </div>

          {/* SYSTEM INFO CONTAINER */}
          <div className={`
            rounded-xl p-4 border text-xs sm:text-sm leading-relaxed
            ${computedMode === "instant"
              ? "bg-rose-500/[0.03] border-rose-500/15 text-rose-500/85"
              : "bg-[#D4A97A]/[0.02] border-[#D4A97A]/15 text-white/60"
            }
          `}>
            <div className="flex gap-2.5 items-start">
              <span className="shrink-0 text-sm mt-0.5">{computedMode === "instant" ? "⚠️" : "📝"}</span>
              <p>{message}</p>
            </div>
          </div>

          {/* STATE METRICS BLOCK */}
          <div className="rounded-xl p-4 space-y-3 bg-[#0B0704] border border-[#2A1F14]">
            <div className="flex justify-between items-baseline py-0.5 border-b border-[#2A1F14]/30">
              <span className="text-[9px] font-black uppercase tracking-[0.16em] text-white/25 shrink-0">Order Status</span>
              <span className="text-[11px] font-semibold text-white/70 text-right capitalize truncate max-w-[70%]">
                {order.order_status?.replace(/_/g, " ")}
              </span>
            </div>

            <div className="flex justify-between items-baseline py-0.5">
              <span className="text-[9px] font-black uppercase tracking-[0.16em] text-white/25 shrink-0">Payment Status</span>
              <span className="text-[11px] font-semibold text-white/70 text-right capitalize truncate max-w-[70%]">
                {order.payment_status?.replace(/_/g, " ") ?? "Unpaid"}
              </span>
            </div>

            {isPending && (
              <div className="mt-2 pt-3 border-t border-[#2A1F14]/40 text-center">
                <p className="text-[10px] font-medium leading-relaxed text-[#7A5C3A]">
                  A cancellation request is processing and holds architectural priority review.
                </p>
              </div>
            )}
          </div>

          {/* TEXTAREA FORM CONTROL */}
          {!isPending && (
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
                Cancellation Reason
              </label>

              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Provide details explaining the intent behind this cancellation..."
                maxLength={500}
                className="
                  min-h-[120px] w-full resize-none rounded-xl border px-4 py-3.5 text-xs sm:text-sm text-white
                  outline-none transition placeholder:text-white/20 bg-[#060403] border-[#2A1F14]
                  focus:border-[#D4A97A]/40 focus:ring-2 focus:ring-[#D4A97A]/10
                "
              />

              <div className="flex justify-between text-[10px] text-white/25">
                <span>Transmitted securely to administration system records.</span>
                <span className="tabular-nums font-medium">{reason.length}/500</span>
              </div>
            </div>
          )}
        </div>

        {/* ── FOOTER ACTIONS ── */}
        <div className="px-5 sm:px-6 py-4 shrink-0 bg-[#0B0704] flex flex-col-reverse sm:flex-row gap-3 border-t border-[#2A1F14]">
          <button
            onClick={onClose}
            disabled={loading}
            className="
              flex-1 h-10 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition
              border border-[#2A1F14] bg-white/[0.02] text-white/50
              hover:bg-white/[0.05] hover:text-white/80 active:scale-[0.99] disabled:opacity-40
            "
          >
            Close
          </button>

          {!isPending && (
            <button
              onClick={handleSubmit}
              disabled={loading || !reason.trim()}
              className={`
                flex-1 h-10 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition
                active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed
                ${computedMode === "instant" 
                  ? "bg-rose-600 text-white border-none hover:bg-rose-500" 
                  : "bg-[#D4A97A]/10 text-[#D4A97A] border border-[#D4A97A]/20 hover:bg-[#D4A97A]/15"
                }
              `}
            >
              {loading
                ? "Processing..."
                : computedMode === "instant"
                ? "Cancel Order"
                : "Submit Request"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}