"use client";

import { useEffect, useMemo, useState } from "react";
import type { Order } from "@/types/order";
import { PaymentType, usePayment } from "@/hooks/usePayment";
import { usePaymentsQuery } from "@/hooks/useFetchPayments";
import { calculatePaymentBreakdown } from "@/utils/paymentCalculator";

// Universal loose type fallback representation to map Custom Inquiry models cleanly
type CustomInquiry = {
  id: string;
  user_id: string;
  inquiry_reference_code?: string;
  customer_name?: string;
  delivery_method?: string;
  [key: string]: any;
};

type Props = {
  open: boolean;
  onClose: () => void;
  order?: Order | null;       // Optional to support dual pipelines
  inquiry?: CustomInquiry | null; // Added to support workshop workflows
  totalAmount: number;
};

export default function PayModal({ open, onClose, order, inquiry, totalAmount }: Props) {
  const { pay, loading, error, resetError } = usePayment();

  // 1. DYNAMICALLY CHOOSE THE SOURCE CONTEXT ID AND ROUTE TYPE
  const activeTargetId = order?.id || inquiry?.id || "";
  const targetType = order?.id ? "order" : "inquiry";
  
  // Pass the target context type configuration directly to the query hook wrapper
  const { data: paymentsData } = usePaymentsQuery(activeTargetId, { type: targetType });

  // 2. SAFE EXTRACTOR: Gracefully unpacks object payloads { totalPaid: X } OR raw primitive numeric streams
  const totalPaid = useMemo(() => {
    if (!paymentsData) return 0;
    if (typeof paymentsData === "object" && "totalPaid" in paymentsData) {
      return Number((paymentsData as any).totalPaid ?? 0);
    }
    return Number(paymentsData ?? 0);
  }, [paymentsData]);

  const hasPaidAnything = totalPaid > 0;

  const safeTotalAmount = useMemo(() => {
    const parsed = Number(totalAmount);
    return !parsed || parsed <= 0 || isNaN(parsed) ? 0 : parsed;
  }, [totalAmount]);

  // If a down payment already exists, force the dynamic state selector to fall back to regular collection pipeline
  const [paymentType, setPaymentType] = useState<PaymentType>("partial");

  // Synchronize payment options when historical ledger balances arrive
  useEffect(() => {
    if (hasPaidAnything) {
      setPaymentType("full");
    } else {
      setPaymentType("partial");
    }
  }, [hasPaidAnything]);

  const breakdown = useMemo(
    () => calculatePaymentBreakdown(safeTotalAmount, totalPaid, hasPaidAnything ? "full" : paymentType),
    [safeTotalAmount, totalPaid, paymentType, hasPaidAnything]
  );

  const payNowAmount       = breakdown.payNow ?? 0;
  const remainingBalance  = Math.max(safeTotalAmount - totalPaid, 0);
  
  // Enforce absolute rule: Hide variable split parameters completely if a partial collection signature is found
  const showPaymentOptions = totalPaid === 0 && !hasPaidAnything;

  const payButtonLabel = hasPaidAnything
    ? "Pay Remaining Balance"
    : paymentType === "full"
    ? "Pay Full Amount"
    : "Pay Deposit (50%)";

  /* ── DERIVE DISCARDABLE COMPONENT PRESENTATION METADATA ── */
  const contextMeta = useMemo(() => {
    if (inquiry) {
      return {
        typeLabel: "Custom Request",
        referenceCode: inquiry.inquiry_reference_code || inquiry.id?.substring(0, 8).toUpperCase() || "N/A",
        customerName: inquiry.customer_name || "Custom Client",
        deliveryMethod: inquiry.delivery_method || "Standard Delivery",
      };
    }
    return {
      typeLabel: "Store Order",
      referenceCode: order?.order_reference_code || "N/A",
      customerName: order?.customer_name || "Unknown Customer",
      deliveryMethod: order?.delivery_method || "Standard",
    };
  }, [order, inquiry]);

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
      
      // Conditionally pack parameters safely to align with database entity routers
      await pay({
        orderId: order?.id || undefined,
        inquiryId: inquiry?.id || undefined,
        userId: order?.user_id || inquiry?.user_id || "",
        type: hasPaidAnything ? "full" : paymentType, // Forces full checkout resolution if working down an active balance due
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (!open) return null;

  return (
    /* ── OVERLAY ── */
    <div
      className="fixed inset-0 z-[99999] flex justify-center p-4 pt-20 sm:pt-4 pb-6 md:pb-8 backdrop-blur-md overflow-hidden bg-black/75"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* ── RESPONSIVE SHEET / CONTAINER ── */}
      <div
        className="
          w-full flex flex-col 
          rounded-2xl max-w-lg
          h-[calc(100vh-80px)] md:h-[calc(100vh-96px)]
          shadow-[0_24px_64px_rgba(0,0,0,0.85)] transition-all duration-200 overflow-hidden
          border border-white/[0.06] bg-[#0A0705]
        "
      >
        {/* TOP ACCENT LINE */}
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#D4A97A]/40 to-transparent shrink-0" />

        {/* ── HEADER ── */}
        <div className="shrink-0 flex items-center justify-between gap-4 px-6 py-4 bg-[#0E0A07] border-b border-white/[0.04]">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#D4A97A] mb-0.5">
              {contextMeta.typeLabel} Checkout
            </p>
            <h2 className="text-base font-bold text-white tracking-tight truncate">
              Complete Secure Payment
            </h2>
            <p className="text-[11px] text-white/40 mt-0.5">
              Reference #{contextMeta.referenceCode}
            </p>
          </div>
          <button
            onClick={onClose}
            className="
              shrink-0 flex h-8 w-8 items-center justify-center
              rounded-xl border border-white/[0.06] bg-white/[0.02]
              text-white/40 hover:text-white/80 hover:bg-white/5
              transition-all text-xs
            "
          >
            ✕
          </button>
        </div>

        {/* ── INTERNAL SCROLLABLE CONTENT BLOCK ── */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 focus:outline-none custom-scrollbar bg-gradient-to-b from-[#0A0705] to-[#070504]">

          {/* FINANCIAL STAT SUMMARY STRIP */}
          <div className="grid grid-cols-3 divide-x divide-white/[0.04] rounded-xl border border-white/[0.04] bg-[#0E0A07]/50 overflow-hidden shadow-inner">
            <FinStat label="Total Cost" value={`₱${safeTotalAmount.toLocaleString()}`} color="text-white/90" />
            <FinStat label="Total Paid" value={`₱${totalPaid.toLocaleString()}`} color="text-emerald-400" />
            <FinStat
              label="Remaining"
              value={`₱${remainingBalance.toLocaleString()}`}
              color={remainingBalance > 0 ? "text-[#D4A97A] font-bold" : "text-emerald-400"}
            />
          </div>

          {/* CLIENT INFO DESCRIPTION CARD */}
          <div className="rounded-xl border border-white/[0.04] bg-[#0E0A07]/30 overflow-hidden">
            <div className="px-4 py-2 bg-white/[0.01] border-b border-white/[0.04]">
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/30">
                Summary Records
              </p>
            </div>
            <div className="px-4 py-3 space-y-2.5">
              <InfoRow label="Client Reference" value={contextMeta.customerName} />
              <InfoRow label="Logistics Method" value={contextMeta.deliveryMethod} capitalize />
              <InfoRow label="Ledger History" value={hasPaidAnything ? `Partially Settled (₱${totalPaid.toLocaleString()})` : "No Payments Tracked"} />
            </div>
          </div>

          {/* PAYMENT TYPE TOGGLE ACTIONS */}
          {showPaymentOptions ? (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/30 px-1">Select Terms</p>
              <div className="space-y-2">
                {/* PARTIAL SELECTION */}
                <OptionButton
                  selected={paymentType === "partial"}
                  onClick={() => setPaymentType("partial")}
                  title="Partial Down Payment"
                  subtitle="Pay 50% commitment base deposit now"
                  amount={`₱${Math.round(safeTotalAmount * 0.5).toLocaleString()}`}
                />

                {/* FULL SELECTION */}
                <OptionButton
                  selected={paymentType === "full"}
                  onClick={() => setPaymentType("full")}
                  title="Full Direct Payment"
                  subtitle="Settle entire catalog invoice balance immediately"
                  amount={`₱${safeTotalAmount.toLocaleString()}`}
                />
              </div>
            </div>
          ) : hasPaidAnything ? (
            /* CONTEXT MESSAGE REGARDING PREVIOUS PARTIAL PAYMENTS */
            <div className="rounded-xl border border-[#D4A97A]/20 bg-[#D4A97A]/[0.02] p-4 text-center">
              <p className="text-xs font-semibold text-[#E5BA8B]">Settling Balance Due</p>
              <p className="text-[11px] text-white/40 mt-1 max-w-xs mx-auto leading-relaxed">
                A deposit has already been processed for this transaction. The platform has automatically prepared your final clearance statement.
              </p>
            </div>
          ) : null}

          {/* REALTIME AMOUNT DUE PRESENTATION HEADER */}
          <div className="rounded-xl border border-white/[0.04] bg-[#0E0A07]/60 overflow-hidden shadow-md">
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                  {hasPaidAnything ? "Final Remainder Outstanding" : "Processing Charge Amount"}
                </p>
                <p className="mt-1.5 text-2xl sm:text-3xl font-black tabular-nums text-[#D4A97A] tracking-tight leading-none">
                  ₱{payNowAmount.toLocaleString()}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="inline-flex items-center rounded-md bg-white/5 px-2.5 py-1 text-[10px] font-medium text-white/70 border border-white/10">
                  {hasPaidAnything ? "Final Balance" : paymentType === "full" ? "100% Invoice" : "50% Deposit"}
                </span>
              </div>
            </div>
          </div>

          {/* DISMISSABLE ERROR TRACE BOX */}
          {error && (
            <div className="rounded-xl border border-rose-500/15 bg-rose-500/[0.04] px-4 py-3 text-[11px] text-rose-300 leading-relaxed">
              {error}
            </div>
          )}
        </div>

        {/* ── FOOTER DOCK ── */}
        <div className="shrink-0 border-t border-white/[0.04] bg-[#0E0A07] px-6 py-4">
          <div className="flex flex-col-reverse sm:flex-row gap-3 w-full">
            <button
              onClick={onClose}
              disabled={loading}
              className="
                flex-1 h-10 rounded-xl text-[10px] font-bold uppercase tracking-[0.12em] transition
                border border-white/5 bg-white/[0.01] text-white/40
                hover:bg-white/[0.03] hover:text-white/70 active:scale-[0.98] disabled:opacity-40
              "
            >
              Cancel
            </button>

            <button
              onClick={handlePay}
              disabled={loading || payNowAmount <= 0}
              className="
                flex-[2] h-10 rounded-xl text-[10px] font-bold uppercase tracking-[0.12em] text-[#1C1209] transition
                bg-[#D4A97A] hover:bg-[#E5BA8B]
                shadow-[0_4px_20px_rgba(212,169,122,0.15)]
                active:scale-[0.98]
                disabled:opacity-30 disabled:cursor-not-allowed disabled:pointer-events-none
              "
            >
              {loading ? "Authorizing Security Node…" : payButtonLabel}
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
    <div className="flex flex-col items-center justify-center py-2.5 px-1">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-white/30 mb-0.5 text-center select-none">
        {label}
      </p>
      <p className={`text-[13px] font-bold tracking-tight tabular-nums ${color}`}>{value}</p>
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
      <span className="shrink-0 text-[10px] font-medium text-white/30">
        {label}
      </span>
      <span className={`text-[12px] font-semibold text-white/70 ${capitalize ? "capitalize" : ""}`}>
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
        w-full rounded-xl border p-4 text-left transition-all active:scale-[0.995]
        ${selected
          ? "border-[#D4A97A]/40 bg-[#D4A97A]/[0.04] shadow-inner animate-none"
          : "border-white/[0.04] bg-[#0E0A07]/20 hover:bg-white/[0.02]"}
      `}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className={`text-xs font-bold ${selected ? "text-[#E8C98A]" : "text-white/80"}`}>
            {title}
          </p>
          <p className="mt-0.5 text-[11px] text-white/40">{subtitle}</p>
        </div>
        <div className="text-right shrink-0">
          <p className={`text-[13px] font-bold tabular-nums ${selected ? "text-[#E8C98A]" : "text-white/70"}`}>
            {amount}
          </p>
          <p className="text-[9px] text-white/30 uppercase tracking-wider">Required</p>
        </div>
      </div>
    </button>
  );
}