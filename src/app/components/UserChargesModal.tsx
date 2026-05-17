"use client";

import { useEffect, useMemo, useState } from "react";
import type { Order } from "@/types/order";
import { useChargeDecision } from "@/hooks/useChargeDecision";

type Props = {
  open: boolean;
  onClose: () => void;
  charges: any[];
  order: Order;
  userId: string;
};

export default function UserChargesModal({ open, onClose, charges, order, userId }: Props) {
  const { acceptCharges, rejectCharges, isAccepting, isRejecting } = useChargeDecision();
  const [error, setError] = useState<string | null>(null);
  const [confirmReject, setConfirmReject] = useState(false);

  /* ── ESC CLOSE ── */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (confirmReject) { setConfirmReject(false); return; }
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose, confirmReject]);

  /* ── SCROLL LOCK ── */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  /* ── CALCULATIONS ── */
  const subtotal = useMemo(() => {
    return order.order_items?.reduce((sum, item) => sum + Number(item.total_price ?? 0), 0) ?? 0;
  }, [order.order_items]);

  const chargesTotal = useMemo(() => {
    return (charges ?? []).reduce((sum, charge) => {
      const amount = Number(charge.amount ?? 0);
      return charge.is_additive ? sum + amount : sum - amount;
    }, 0);
  }, [charges]);

  const previewTotal = subtotal + chargesTotal;

  /* ── STATES ── */
  const hasCharges = charges.length > 0;
  const isAccepted = order.charge_status === "accepted";
  const isRejected = order.charge_status === "rejected";
  const isPending = order.charge_status === "pending";
  const showActions = hasCharges && isPending;

  /* ── ACTIONS ── */
  const handleAccept = async () => {
    try {
      setError(null);
      await acceptCharges({ orderId: order.id, userId });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to accept charges");
    }
  };

  const handleReject = async () => {
    try {
      setError(null);
      await rejectCharges({ orderId: order.id, userId });
      setConfirmReject(false);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to reject charges");
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="
          relative w-full sm:max-w-xl
          flex flex-col
          max-h-[92vh] sm:max-h-[85vh]
          rounded-t-3xl sm:rounded-2xl overflow-hidden
          border-t border-x sm:border border-[#2A1F14]
          bg-[#0E0A06]
          shadow-[0_-8px_60px_rgba(0,0,0,0.8)] sm:shadow-[0_8px_60px_rgba(0,0,0,0.8)]
        "
      >
        {/* TOP ACCENT */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#D4A97A]/60 to-transparent flex-shrink-0" />

        {/* DRAG HANDLE (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
          <div className="h-1 w-10 rounded-full bg-white/15" />
        </div>

        {/* ── HEADER ── */}
        <div className="flex-shrink-0 flex items-start justify-between gap-4 px-5 pt-4 sm:pt-5 pb-4 border-b border-[#2A1F14]">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#7A5C3A]">
              Additional Pricing
            </p>
            <h2 className="mt-0.5 text-[17px] font-bold text-white leading-tight">
              Review Charges
            </h2>
            <p className="mt-1 text-[11px] text-white/35">
              Order #{order.order_reference_code || order.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="
              flex-shrink-0 flex h-8 w-8 items-center justify-center
              rounded-full border border-[#2A1F14] bg-white/[0.03]
              text-white/40 hover:text-white/70 hover:bg-white/[0.07]
              transition-all text-sm
            "
          >
            ✕
          </button>
        </div>

        {/* ── SUMMARY STRIP ── */}
        <div className="flex-shrink-0 mx-5 mt-4">
          <div className="grid grid-cols-3 divide-x divide-[#2A1F14] rounded-xl border border-[#2A1F14] bg-[#0B0704] overflow-hidden">
            <FinStat label="Subtotal" value={`₱${subtotal.toLocaleString()}`} color="text-white/70" />
            <FinStat
              label="Charges"
              value={`${chargesTotal >= 0 ? "+" : ""}₱${chargesTotal.toLocaleString()}`}
              color={chargesTotal >= 0 ? "text-emerald-400" : "text-rose-400"}
            />
            <FinStat
              label={isAccepted ? "Final" : "Est. Total"}
              value={`₱${previewTotal.toLocaleString()}`}
              color="text-[#E8C98A]"
            />
          </div>
        </div>

        {/* ── SCROLLABLE CONTENT ── */}
        <div className="flex-1 overflow-y-auto px-5 pt-4 pb-2 space-y-3 min-h-0">

          {/* ERROR */}
          {error && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.07] px-4 py-3 text-[11px] text-rose-400">
              {error}
            </div>
          )}

          {/* STATUS BANNERS */}
          {isAccepted && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-400">Charges Confirmed</p>
              <p className="mt-0.5 text-[10px] text-white/40">These charges are now included in the final order price.</p>
            </div>
          )}

          {isRejected && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.06] px-4 py-3">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-rose-400">Charges Rejected</p>
              <p className="mt-0.5 text-[10px] text-white/40">Admin has been notified. Use the chat to discuss revisions.</p>
            </div>
          )}

          {/* CHARGES LIST */}
          <div className="rounded-xl border border-[#2A1F14] bg-[#0B0704] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A1F14]">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/25">Charges Breakdown</p>
              <span className="text-[9px] font-black text-[#7A5C3A]">{charges.length} item{charges.length !== 1 ? "s" : ""}</span>
            </div>

            {!hasCharges ? (
              <div className="flex flex-col items-center justify-center py-8">
                <p className="text-[11px] font-bold text-white/25 uppercase tracking-[0.15em]">No Charges</p>
                <p className="mt-1 text-[10px] text-white/20">Your order has no additional pricing changes.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#1A1106]">
                {charges.map((charge) => {
                  const amount = Number(charge.amount ?? 0);
                  const isAdditive = charge.is_additive;
                  return (
                    <div key={charge.id} className="flex items-start justify-between gap-4 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-semibold text-white/80 truncate">
                          {charge.label || charge.type}
                        </p>
                        {charge.description && (
                          <p className="mt-0.5 text-[10px] text-white/35">{charge.description}</p>
                        )}
                      </div>
                      <span className={`
                        flex-shrink-0 rounded-lg px-2.5 py-1
                        text-[11px] font-black border
                        ${isAdditive
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/20"}
                      `}>
                        {isAdditive ? "+" : "−"}₱{amount.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* No action needed note */}
          {!hasCharges && (
            <div className="rounded-xl border border-[#2A1F14] bg-[#0B0704] px-4 py-3">
              <p className="text-[11px] text-white/35 italic">No customer action is needed at this time.</p>
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div className="flex-shrink-0 border-t border-[#2A1F14] bg-[#0B0704] px-5 py-4">
          {showActions ? (
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmReject(true)}
                disabled={isAccepting || isRejecting}
                className="
                  h-10 flex-1 rounded-xl
                  border border-rose-500/25 bg-rose-500/[0.06]
                  text-[10px] font-black uppercase tracking-[0.1em] text-rose-400/80
                  hover:bg-rose-500/[0.12] hover:text-rose-400
                  disabled:opacity-40
                  transition-all
                "
              >
                Reject
              </button>
              <button
                onClick={handleAccept}
                disabled={isAccepting || isRejecting}
                className="
                  h-10 flex-[2] rounded-xl
                  bg-gradient-to-r from-[#C49A6C] via-[#D4A97A] to-[#E8C98A]
                  text-[10px] font-black uppercase tracking-[0.12em] text-[#0E0A06]
                  shadow-[0_2px_12px_rgba(212,169,122,0.3)]
                  hover:shadow-[0_4px_20px_rgba(212,169,122,0.45)]
                  hover:brightness-105
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all
                "
              >
                {isAccepting ? "Accepting…" : "Accept Charges"}
              </button>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="
                h-10 w-full rounded-xl
                border border-[#2A1F14] bg-white/[0.03]
                text-[10px] font-black uppercase tracking-[0.12em] text-white/60
                hover:bg-white/[0.06] hover:text-white/80
                transition-all
              "
            >
              Close
            </button>
          )}
        </div>

        {/* ── REJECT CONFIRM OVERLAY ── */}
        {confirmReject && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-5">
            <div className="
              w-full max-w-sm rounded-2xl overflow-hidden
              border border-[#2A1F14] bg-[#0E0A06]
              shadow-[0_8px_40px_rgba(0,0,0,0.8)]
            ">
              <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-rose-500/50 to-transparent" />
              <div className="p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-rose-500/20 bg-rose-500/[0.08] text-rose-400 text-xl font-black">
                  !
                </div>
                <h3 className="mt-4 text-[15px] font-bold text-white">Reject Additional Charges?</h3>
                <p className="mt-2 text-[11px] text-white/40 leading-relaxed">
                  The admin will be notified and can revise the pricing through the order chat.
                </p>
              </div>
              <div className="flex gap-2 px-5 pb-5">
                <button
                  onClick={() => setConfirmReject(false)}
                  className="
                    h-10 flex-1 rounded-xl
                    border border-[#2A1F14] bg-white/[0.03]
                    text-[10px] font-black uppercase tracking-[0.1em] text-white/50
                    hover:bg-white/[0.06] hover:text-white/70
                    transition-all
                  "
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={isRejecting}
                  className="
                    h-10 flex-[2] rounded-xl
                    border border-rose-500/25 bg-rose-500/[0.08]
                    text-[10px] font-black uppercase tracking-[0.1em] text-rose-400
                    hover:bg-rose-500/[0.15] hover:text-rose-300
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all
                  "
                >
                  {isRejecting ? "Rejecting…" : "Confirm Reject"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── SUB-COMPONENTS ── */
function FinStat({ label, value, color = "text-white" }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-2.5 px-1">
      <p className="text-[8px] font-black uppercase tracking-[0.18em] text-white/20 mb-0.5">{label}</p>
      <p className={`text-[12px] font-bold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}