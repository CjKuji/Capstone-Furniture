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

  const totalPaid       = paymentsData?.totalPaid ?? 0;
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

  const payNowAmount      = breakdown.payNow ?? 0;
  const remainingBalance  = Math.max(safeTotalAmount - totalPaid, 0);
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
        userId:  order.user_id,
        type:    hasPaidAnything ? "partial" : paymentType,
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (!open) return null;

  return (
    /* ── OVERLAY ── */
    <div
      className="fixed inset-0 z-[99999] flex justify-center p-4 pb-6 md:pb-8 backdrop-blur-md overflow-hidden bg-black/70"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* ── RESPONSIVE SHEET / CONTAINER ── */}
      <div
        className="
          w-full flex flex-col 
          rounded-2xl max-w-lg
          /* Architecture offsets to guarantee zero navbar overlap layout blockages */
          mt-[76px] h-[calc(100vh-100px)] md:mt-[84px] md:h-[calc(100vh-116px)]
          shadow-[0_24px_64px_rgba(0,0,0,0.8)] transition-all duration-200 overflow-hidden
          border border-[#2A1F14] bg-[#0E0A06]
        "
      >
        {/* TOP ACCENT LINE */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#D4A97A]/60 to-transparent shrink-0" />

        {/* ── HEADER ── */}
        <div className="shrink-0 flex items-center justify-between gap-4 px-5 sm:px-6 py-4 bg-[#0B0704] border-b border-[#2A1F14]">
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#7A5C3A] mb-0.5">Payment</p>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
              Complete Your Payment
            </h2>
            <p className="text-[10px] text-white/30 mt-0.5">
              Order #{order.order_reference_code}
            </p>
          </div>
          <button
            onClick={onClose}
            className="
              shrink-0 flex h-8 w-8 items-center justify-center
              rounded-xl border border-[#2A1F14] bg-white/[0.03]
              text-white/40 hover:text-white/70 hover:bg-white/[0.07]
              transition-all text-xs
            "
          >
            ✕
          </button>
        </div>

        {/* ── INTERNAL SCROLLABLE CONTENT BLOCK ── */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 focus:outline-none custom-scrollbar">

          {/* FINANCIAL STAT SUMMARY STRIP */}
          <div className="grid grid-cols-3 divide-x divide-[#2A1F14] rounded-xl border border-[#2A1F14] bg-[#0B0704] overflow-hidden shadow-inner">
            <FinStat label="Order Total" value={`₱${safeTotalAmount.toLocaleString()}`} color="text-[#E8C98A]" />
            <FinStat label="Paid" value={`₱${totalPaid.toLocaleString()}`} color="text-emerald-400" />
            <FinStat
              label="Balance"
              value={`₱${remainingBalance.toLocaleString()}`}
              color={remainingBalance > 0 ? "text-amber-400 font-bold" : "text-emerald-400"}
            />
          </div>

       {/* ORDER INFO DESCRIPTION CARD */}
<div className="rounded-xl border border-[#2A1F14] bg-[#0B0704] overflow-hidden">
  <div className="px-4 py-2.5 bg-white/[0.01] border-b border-[#2A1F14]/40">
    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/25">Order Details</p>
  </div>
  <div className="px-4 py-3 space-y-2">
    <InfoRow label="Customer" value={order.customer_name ?? "Unknown"} />
    
    {/* FIXED LINE BELOW */}
    <InfoRow label="Delivery" value={order.delivery_method ?? "Standard"} capitalize />
    
    <InfoRow label="Already Paid" value={`₱${totalPaid.toLocaleString()}`} />
  </div>
</div>

          {/* PAYMENT TYPE TOGGLE ACTIONS */}
          {showPaymentOptions && (
            <div className="rounded-xl border border-[#2A1F14] bg-[#0B0704] overflow-hidden">
              <div className="px-4 py-2.5 bg-white/[0.01] border-b border-[#2A1F14]/40">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/25">Payment Option</p>
              </div>
              <div className="p-3 space-y-2">
                {/* PARTIAL SELECTION */}
                <OptionButton
                  selected={paymentType === "partial"}
                  onClick={() => setPaymentType("partial")}
                  title="Partial Payment"
                  subtitle="Pay 50% now, remaining later"
                  amount={`₱${Math.round(safeTotalAmount * 0.5).toLocaleString()}`}
                />

                {/* FULL SELECTION */}
                <OptionButton
                  selected={paymentType === "full"}
                  onClick={() => setPaymentType("full")}
                  title="Full Payment"
                  subtitle="Complete the full payment now"
                  amount={`₱${safeTotalAmount.toLocaleString()}`}
                />
              </div>
            </div>
          )}

          {/* REALTIME AMOUNT DUE PRESENTATION HEADER */}
          <div className="rounded-xl border border-[#2A1F14] bg-[#0B0704] overflow-hidden">
            <div className="flex items-center justify-between gap-4 px-4 py-3.5">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
                  {hasPaidAnything ? "Remaining Payment" : "Amount Due Now"}
                </p>
                <p className="mt-1 text-[22px] sm:text-[26px] font-black tabular-nums text-[#E8C98A] leading-none">
                  ₱{payNowAmount.toLocaleString()}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[9px] text-white/25 uppercase tracking-wider">Type</p>
                <p className="mt-0.5 text-[11px] font-bold text-white/60">
                  {hasPaidAnything ? "Remaining" : paymentType === "full" ? "Full" : "Partial"}
                </p>
              </div>
            </div>
          </div>

          {/* DISMISSABLE ERROR TRACE BOX */}
          {error && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.07] px-4 py-3 text-[11px] text-rose-400">
              {error}
            </div>
          )}
        </div>

        {/* ── FOOTER DOCK ── */}
        <div className="shrink-0 border-t border-[#2A1F14] bg-[#0B0704] px-5 sm:px-6 py-4">
          <div className="flex flex-col-reverse sm:flex-row gap-3 w-full pb-[env(safe-area-inset-bottom)]">
            <button
              onClick={onClose}
              disabled={loading}
              className="
                flex-1 h-10 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition
                border border-[#2A1F14] bg-white/[0.02] text-white/50
                hover:bg-white/[0.05] hover:text-white/80 active:scale-[0.99] disabled:opacity-40
              "
            >
              Cancel
            </button>

            <button
              onClick={handlePay}
              disabled={loading || payNowAmount <= 0}
              className="
                flex-[2] h-10 rounded-xl text-[10px] font-black uppercase tracking-[0.12em] text-[#0E0A06] transition
                bg-gradient-to-r from-[#C49A6C] via-[#D4A97A] to-[#E8C98A]
                shadow-[0_4px_12px_rgba(212,169,122,0.2)] hover:shadow-[0_4px_20px_rgba(212,169,122,0.45)]
                hover:brightness-105 active:scale-[0.99]
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {loading ? "Processing…" : `${payButtonLabel} · ₱${payNowAmount.toLocaleString()}`}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ── SUB-COMPONENTS ── */

function FinStat({
  label,
  value,
  color = "text-white",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-2 px-1">
      <p className="text-[8px] font-black uppercase tracking-[0.16em] text-white/20 mb-0.5 text-center">
        {label}
      </p>
      <p className={`text-[12px] font-bold tracking-wide tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

function InfoRow({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="shrink-0 text-[9px] font-black uppercase tracking-[0.16em] text-white/25">
        {label}
      </span>
      <span className={`text-[11px] font-semibold text-white/70 ${capitalize ? "capitalize" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function OptionButton({
  selected,
  onClick,
  title,
  subtitle,
  amount,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
  amount: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full rounded-xl border p-3.5 text-left transition-all active:scale-[0.99]
        ${selected
          ? "border-[#D4A97A]/40 bg-[#D4A97A]/[0.07]"
          : "border-[#2A1F14] bg-[#0E0A06] hover:bg-white/[0.02]"}
      `}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-[12px] font-bold ${selected ? "text-[#E8C98A]" : "text-white/70"}`}>
            {title}
          </p>
          <p className="mt-0.5 text-[10px] text-white/30">{subtitle}</p>
        </div>
        <div className="text-right shrink-0">
          <p className={`text-[14px] font-black tabular-nums ${selected ? "text-[#E8C98A]" : "text-white/60"}`}>
            {amount}
          </p>
          <p className="text-[9px] text-white/25 uppercase tracking-wider">Due now</p>
        </div>
      </div>
      {selected && (
        <div className="mt-2 h-[1px] w-full bg-gradient-to-r from-transparent via-[#D4A97A]/30 to-transparent" />
      )}
    </button>
  );
}