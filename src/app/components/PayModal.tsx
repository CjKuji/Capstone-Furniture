"use client";

import { useEffect, useMemo, useState } from "react";
import type { Order } from "@/types/order";
import { PaymentType, usePayment } from "@/hooks/usePayment";
import { usePaymentsQuery } from "@/hooks/useFetchPayments";
import { calculatePaymentBreakdown } from "@/utils/paymentCalculator";

type Props = {
  open: boolean;
  onClose: () => void;
  order: Order;
  totalAmount: number;
};

export default function PayModal({ open, onClose, order, totalAmount }: Props) {
  const { pay, loading, error, resetError } = usePayment();
  const { data: paymentsData } = usePaymentsQuery(order.id);

  const totalPaid = paymentsData?.totalPaid ?? 0;
  const hasPaidAnything = totalPaid > 0;

  const safeTotalAmount = useMemo(() => {
    const parsed = Number(totalAmount);
    return !parsed || parsed <= 0 || isNaN(parsed) ? 0 : parsed;
  }, [totalAmount]);

  const [paymentType, setPaymentType] = useState<PaymentType>("partial");

  const breakdown = useMemo(
    () => calculatePaymentBreakdown(safeTotalAmount, totalPaid, paymentType),
    [safeTotalAmount, totalPaid, paymentType]
  );

  const payNowAmount = breakdown.payNow ?? 0;
  const remainingBalance = Math.max(safeTotalAmount - totalPaid, 0);
  const showPaymentOptions = totalPaid === 0;

  const payButtonLabel = hasPaidAnything
    ? "Pay Remaining"
    : paymentType === "full"
    ? "Pay Full"
    : "Pay Partial";

  /* ── ESC CLOSE ── */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  /* ── SCROLL LOCK ── */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const handlePay = async () => {
    try {
      resetError();
      await pay({
        orderId: order.id,
        userId: order.user_id,
        type: hasPaidAnything ? "partial" : paymentType,
      });
    } catch (err) {
      console.error(err);
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
          relative w-full sm:max-w-lg
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
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#7A5C3A]">Payment</p>
            <h2 className="mt-0.5 text-[17px] font-bold text-white leading-tight">Complete Your Payment</h2>
            <p className="mt-1 text-[11px] text-white/35">Order #{order.order_reference_code}</p>
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
            <FinStat label="Order Total" value={`₱${safeTotalAmount.toLocaleString()}`} color="text-[#E8C98A]" />
            <FinStat label="Paid" value={`₱${totalPaid.toLocaleString()}`} color="text-emerald-400" />
            <FinStat
              label="Balance"
              value={`₱${remainingBalance.toLocaleString()}`}
              color={remainingBalance > 0 ? "text-amber-400" : "text-emerald-400"}
            />
          </div>
        </div>

        {/* ── SCROLLABLE CONTENT ── */}
        <div className="flex-1 overflow-y-auto px-5 pt-4 pb-2 space-y-3 min-h-0">

          {/* ORDER INFO */}
          <div className="rounded-xl border border-[#2A1F14] bg-[#0B0704] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#2A1F14]">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/25">Order Details</p>
            </div>
            <div className="px-4 py-3 space-y-2">
              <InfoRow label="Customer" value={order.customer_name ?? "Unknown"} />
              <InfoRow label="Delivery" value={order.delivery_method} capitalize />
              <InfoRow label="Already Paid" value={`₱${totalPaid.toLocaleString()}`} />
            </div>
          </div>

          {/* PAYMENT OPTIONS */}
          {showPaymentOptions && (
            <div className="rounded-xl border border-[#2A1F14] bg-[#0B0704] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#2A1F14]">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/25">Payment Option</p>
              </div>
              <div className="p-3 space-y-2">
                {/* PARTIAL */}
                <button
                  onClick={() => setPaymentType("partial")}
                  className={`
                    w-full rounded-xl border p-3.5 text-left transition-all
                    ${paymentType === "partial"
                      ? "border-[#D4A97A]/40 bg-[#D4A97A]/[0.07]"
                      : "border-[#2A1F14] bg-[#0E0A06] hover:border-[#2A1F14] hover:bg-white/[0.02]"}
                  `}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`text-[12px] font-bold ${paymentType === "partial" ? "text-[#E8C98A]" : "text-white/70"}`}>
                        Partial Payment
                      </p>
                      <p className="mt-0.5 text-[10px] text-white/30">Pay 50% now, remaining later</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-[15px] font-black tabular-nums ${paymentType === "partial" ? "text-[#E8C98A]" : "text-white/60"}`}>
                        ₱{Math.round(safeTotalAmount * 0.5).toLocaleString()}
                      </p>
                      <p className="text-[9px] text-white/25 uppercase tracking-wider">Due now</p>
                    </div>
                  </div>
                  {/* Selected indicator */}
                  {paymentType === "partial" && (
                    <div className="mt-2 h-[1px] w-full bg-gradient-to-r from-transparent via-[#D4A97A]/30 to-transparent" />
                  )}
                </button>

                {/* FULL */}
                <button
                  onClick={() => setPaymentType("full")}
                  className={`
                    w-full rounded-xl border p-3.5 text-left transition-all
                    ${paymentType === "full"
                      ? "border-[#D4A97A]/40 bg-[#D4A97A]/[0.07]"
                      : "border-[#2A1F14] bg-[#0E0A06] hover:border-[#2A1F14] hover:bg-white/[0.02]"}
                  `}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`text-[12px] font-bold ${paymentType === "full" ? "text-[#E8C98A]" : "text-white/70"}`}>
                        Full Payment
                      </p>
                      <p className="mt-0.5 text-[10px] text-white/30">Complete the full payment now</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-[15px] font-black tabular-nums ${paymentType === "full" ? "text-[#E8C98A]" : "text-white/60"}`}>
                        ₱{safeTotalAmount.toLocaleString()}
                      </p>
                      <p className="text-[9px] text-white/25 uppercase tracking-wider">Due now</p>
                    </div>
                  </div>
                  {paymentType === "full" && (
                    <div className="mt-2 h-[1px] w-full bg-gradient-to-r from-transparent via-[#D4A97A]/30 to-transparent" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* AMOUNT DUE CARD */}
          <div className="rounded-xl border border-[#2A1F14] bg-[#0B0704] overflow-hidden">
            <div className="flex items-center justify-between gap-4 px-4 py-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
                  {hasPaidAnything ? "Remaining Payment" : "Amount Due Now"}
                </p>
                <p className="mt-1 text-[28px] font-black tabular-nums text-[#E8C98A] leading-none">
                  ₱{payNowAmount.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-white/25 uppercase tracking-wider">Type</p>
                <p className="mt-1 text-[11px] font-bold text-white/60">
                  {hasPaidAnything ? "Remaining" : paymentType === "full" ? "Full" : "Partial"}
                </p>
              </div>
            </div>
          </div>

          {/* ERROR */}
          {error && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.07] px-4 py-3 text-[11px] text-rose-400">
              {error}
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div className="flex-shrink-0 border-t border-[#2A1F14] bg-[#0B0704] px-5 py-4 flex gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="
              h-10 flex-1 rounded-xl
              border border-[#2A1F14] bg-white/[0.03]
              text-[10px] font-black uppercase tracking-[0.1em] text-white/50
              hover:bg-white/[0.06] hover:text-white/70
              disabled:opacity-40
              transition-all
            "
          >
            Cancel
          </button>
          <button
            onClick={handlePay}
            disabled={loading || payNowAmount <= 0}
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
            {loading ? "Processing…" : `${payButtonLabel} · ₱${payNowAmount.toLocaleString()}`}
          </button>
        </div>
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

function InfoRow({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="flex-shrink-0 text-[9px] font-black uppercase tracking-[0.16em] text-white/25">{label}</span>
      <span className={`text-[11px] font-semibold text-white/70 ${capitalize ? "capitalize" : ""}`}>{value}</span>
    </div>
  );
}