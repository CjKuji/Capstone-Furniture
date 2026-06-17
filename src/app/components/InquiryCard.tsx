"use client";

import React, { useState, useMemo } from "react";
import { 
  MessageSquare, 
  Layers, 
  Truck,
  MapPin,
  Package,
  FileText
} from "lucide-react";

// Components & Modals
import ChatModal from "@/app/components/chat/ChatModal";
import InquiryFullDetailModal from "@/app/components/InquiryFullDetailModal"; 
import { UserInquiryChargesModal } from "@/app/components/UserInquiryCharges";
import PayModal from "@/app/components/PayModal";

// Hooks & Utilities
import { usePaymentsQuery } from "@/hooks/useFetchPayments"; 
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { InquiryData, InquiryItem } from "@/hooks/useUserInquiry";

type HydratedInquiryType = InquiryData & {
  final_total_price?: number | null;
  payment_status?: string;
  cancel_status?: string;
  shipping_address?: string | null;
  delivery_method?: string | null;
};

type InquiryCardProps = {
  inquiry: InquiryData & { 
    final_total_price?: number | null;
    shipping_address?: string | null;
    delivery_method?: string | null;
  };
  conversation: {
    id: string;
    admin_unread_count: number;
    customer_unread_count: number;
  } | null;
  userId: string;
};

/* ── SIMPLIFIED & HIGHLY SCANNABLE CORE MESSAGES ── */
const getInquiryMessage = (inquiry: HydratedInquiryType): string => {
  if (!inquiry) return "Processing blueprint...";
  const { status, charge_status, cancel_status, payment_status } = inquiry;

  if (status === "cancelled") return "Inquiry cancelled.";
  if (cancel_status === "requested") return "Cancellation request under review.";
  if (cancel_status === "rejected") return "Cancellation request declined.";
  if (status === "requested") return "Awaiting administrative review.";

  if (status === "under_review") {
    if (!charge_status || charge_status === "none") return "Preparing your custom design quote.";
    if (charge_status === "pending") return "Quote ready. Please review details below.";
    if (charge_status === "accepted") {
      if (!payment_status || payment_status === "unpaid") return "Quote approved. Awaiting deposit.";
      return "Payment verified. Queued for production.";
    }
  }

  if (status === "in_production") return "Active on workshop production floor.";

  if (["ready_for_pickup", "ready_for_shipment"].includes(status)) {
    if (payment_status !== "fully_paid") {
      return status === "ready_for_pickup"
        ? "Ready for pickup. Balance due for release."
        : "Ready for shipment. Balance due for dispatch.";
    }
    return status === "ready_for_pickup" ? "Ready for release and pickup." : "Ready for shipping dispatch.";
  }

  if (status === "in_transit") return "Your order is currently en route.";
  if (status === "completed") return "Order completed. Thank you!";

  return "Processing specifications.";
};

const formatInquiryStatusUI = (status: string) => {
  const statusMap: Record<string, { label: string; color: string }> = {
    requested: { label: "Requested", color: "text-sky-400 border-sky-500/20 bg-sky-500/10" },
    under_review: { label: "Reviewing", color: "text-amber-400 border-amber-500/20 bg-amber-500/10" },
    in_production: { label: "Production", color: "text-amber-500 border-amber-500/20 bg-amber-500/10" },
    ready_for_pickup: { label: "Ready", color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10" },
    ready_for_shipment: { label: "Ready", color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10" },
    in_transit: { label: "In Transit", color: "text-indigo-400 border-indigo-500/20 bg-indigo-500/10" },
    completed: { label: "Completed", color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10" },
    cancelled: { label: "Cancelled", color: "text-rose-400 border-rose-500/20 bg-rose-500/10" },
  };
  return statusMap[status] || { label: status, color: "text-amber-500 border-amber-600/20 bg-amber-600/5" };
};

export default function InquiryCard({ inquiry, conversation, userId }: InquiryCardProps) {
  const [modals, setModals] = useState({ chat: false, detail: false, charges: false, pay: false });

  const { data: paymentSummary, isLoading: paymentsLoading, isFetching: paymentsFetching } = usePaymentsQuery(inquiry.id);

  const liveUnreadCount = useMemo(() => {
    return Number(conversation?.customer_unread_count ?? 0);
  }, [conversation?.customer_unread_count]);

  const toggleModal = (key: keyof typeof modals, val: boolean) => {
    setModals((prev) => ({ ...prev, [key]: val }));
  };

  const anyModalOpen = Object.values(modals).some(Boolean);
  useBodyScrollLock(anyModalOpen);

  const itemsArray = useMemo(() => (inquiry.inquiry_items ?? []) as InquiryItem[], [inquiry.inquiry_items]);
  const firstItem = itemsArray[0];
  const charges = useMemo(() => inquiry.inquiry_charges ?? [], [inquiry.inquiry_charges]);

  const financialData = useMemo(() => {
    const totalPieces = itemsArray.reduce((sum, i) => sum + Number(i?.quantity ?? 0), 0);
    const chargesTotal = charges.reduce((total, c) => 
      c?.is_additive ? total + Number(c?.amount ?? 0) : total - Number(c?.amount ?? 0), 0
    );
    const finalTotal = inquiry.final_total_price !== null && inquiry.final_total_price !== undefined
      ? Number(inquiry.final_total_price)
      : chargesTotal;

    const totalPaid = Number(paymentSummary?.totalPaid ?? 0);
    const remaining = Math.max(finalTotal - totalPaid, 0);
    const isAwaitingQuote = charges.length === 0 && (inquiry.final_total_price === null || inquiry.final_total_price === undefined);

    let currentPaymentStatus = "unpaid";
    if (totalPaid > 0) {
      currentPaymentStatus = remaining <= 0 ? "fully_paid" : "partially_paid";
    }

    const isSynchronizing = paymentsLoading || paymentsFetching;

    return { totalPieces, chargesTotal, finalTotal, totalPaid, remaining, isAwaitingQuote, currentPaymentStatus, isSynchronizing };
  }, [inquiry, charges, itemsArray, paymentSummary, paymentsLoading, paymentsFetching]);

  const { canPay, payButtonLabel } = useMemo(() => {
    return {
      canPay: inquiry.charge_status === "accepted" && financialData.remaining > 0 && financialData.finalTotal > 0 && inquiry.status !== "cancelled" && !financialData.isSynchronizing,
      payButtonLabel: financialData.totalPaid > 0 ? "Pay Balance" : "Pay Secure Deposit",
    };
  }, [inquiry, financialData]);

  const statusUI = formatInquiryStatusUI(inquiry.status);

  const logisticsData = useMemo(() => {
    const method = inquiry.delivery_method?.toLowerCase() || "unassigned";
    const isPickup = method.includes("pickup");
    const addressString = inquiry.shipping_address || inquiry.delivery_address || (inquiry as any).address;
    
    return {
      isPickup,
      label: isPickup ? "Pickup" : method === "unassigned" ? "Unassigned" : "Shipping",
      address: isPickup ? "Workshop Floor Hub Base" : addressString || "No address configured"
    };
  }, [inquiry]);

  return (
    <>
      <div className="relative flex flex-col w-full h-full rounded-xl overflow-hidden border border-[#362719] bg-gradient-to-b from-[#120D08] to-[#0A0704] shadow-[0_8px_30px_rgba(0,0,0,0.6)] transition-all duration-200 hover:border-[#D4A97A]/40 p-4 gap-3.5">
        
        {/* HEADER BLOCK */}
        <div className="flex items-center justify-between gap-2 border-b border-[#21180F] pb-2.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-[#A68056] uppercase font-mono">
              <span>Ref</span>
              <span className="text-white bg-[#21180F] px-1.5 py-0.5 rounded text-xs font-sans font-semibold">
                #{inquiry.id.slice(0, 8).toUpperCase()}
              </span>
              <div className={`h-1.5 w-1.5 rounded-full shrink-0 bg-[#D4A97A] ${["requested", "under_review", "in_production"].includes(inquiry.status) ? "animate-pulse shadow-[0_0_6px_#D4A97A]" : ""}`} />
            </div>
            <p className="text-[10px] text-white/30 truncate mt-1">
              {new Date(inquiry.created_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})} • {new Date(inquiry.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </p>
          </div>
          
          <div className="flex items-center gap-1.5 shrink-0 self-start mt-0.5">
            {liveUnreadCount > 0 && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[9px] font-bold tracking-wide uppercase animate-pulse">
                {liveUnreadCount} MSG
              </span>
            )}
            <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border bg-black/20 ${statusUI.color}`}>
              {statusUI.label}
            </span>
          </div>
        </div>

        {/* PROGRESS LIFECYCLE LINE TRACKER */}
        <ProgressBar status={inquiry.status} />

        {/* CENTRALIZED DYNAMIC MESSAGE BOX */}
        <div className="flex items-center justify-center text-center bg-white/[0.02] border border-[#21180F] rounded-lg px-3 py-2 min-h-[44px]">
          <p className="text-[12px] text-white/80 font-medium leading-normal tracking-wide">
            {getInquiryMessage({ ...inquiry, payment_status: financialData.currentPaymentStatus })}
          </p>
        </div>

        {/* CORE SPECIFICATIONS SUB-GRID */}
        <div className="flex flex-col gap-2 bg-white/[0.01] border border-[#21180F] p-2.5 rounded-lg text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Layers className="w-3.5 h-3.5 text-[#D4A97A] shrink-0" />
            <span className="text-white/40 text-[10px] uppercase tracking-wider font-medium w-12 shrink-0">Design:</span>
            <span className="text-white/90 truncate min-w-0 flex-1 font-medium">
              {firstItem?.title || "Custom Blueprint Spec"}
            </span>
            <span className="text-[9px] font-bold text-[#D4A97A] bg-[#D4A97A]/10 px-1 py-0.5 rounded shrink-0">
              ×{financialData.totalPieces || 1}
            </span>
          </div>

          <div className="flex items-center gap-2 min-w-0 border-t border-[#1C140C] pt-2">
            <FileText className="w-3.5 h-3.5 text-[#A68056] shrink-0" />
            <span className="text-white/40 text-[10px] uppercase tracking-wider font-medium w-12 shrink-0">Specs:</span>
            <span className="text-white/50 truncate min-w-0 flex-1" title={firstItem?.description || "No specifications attached."}>
              {firstItem?.description || "No specifications attached."}
            </span>
          </div>
        </div>

        {/* LOGISTICS & TRACK DISTRIBUTION BLOCK */}
        <div className="flex flex-col gap-1.5 bg-white/[0.01] border border-[#21180F] p-2.5 rounded-lg">
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-1.5 text-white/40">
              {logisticsData.isPickup ? <Package className="w-3.5 h-3.5 text-emerald-400/80" /> : <Truck className="w-3.5 h-3.5 text-sky-400/80" />}
              <span className="text-[10px] uppercase font-bold tracking-wider">Logistics:</span>
            </div>
            <span className="font-mono font-bold text-[10px] text-white/80 uppercase tracking-wide bg-white/5 px-1.5 py-0.2 rounded">
              {logisticsData.label}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-white/60 text-xs pt-1 border-t border-[#1C140C]/50">
            <MapPin className="w-3 h-3 text-[#A68056] shrink-0" />
            <p className="truncate min-w-0 flex-1 text-white/50 text-[11px]" title={logisticsData.address}>
              {logisticsData.address}
            </p>
          </div>
        </div>

        {/* LEDGER PRICE GRID */}
        <div className="border border-[#291E13] rounded-lg overflow-hidden bg-[#050402]">
          <div className="grid grid-cols-3 divide-x divide-[#291E13]">
            <FinStat
              label="Total Cost"
              value={financialData.isAwaitingQuote ? "—" : `₱${financialData.finalTotal.toLocaleString()}`}
              color="text-[#E8C98A] text-xs font-bold"
            />
            <FinStat
              label="Paid"
              value={financialData.isSynchronizing ? "…" : `₱${financialData.totalPaid.toLocaleString()}`}
              color="text-emerald-400 text-xs font-bold"
            />
            <FinStat
              label="Balance"
              value={financialData.isSynchronizing ? "…" : financialData.isAwaitingQuote ? "—" : `₱${financialData.remaining.toLocaleString()}`}
              color={financialData.remaining > 0 && !financialData.isAwaitingQuote ? "text-amber-500 font-bold" : "text-emerald-400"}
            />
          </div>
          
          <div className="flex items-center justify-between bg-[#0A0704] px-2.5 py-1.5 text-[10px] border-t border-[#291E13]">
            <button 
              type="button"
              onClick={() => toggleModal("charges", true)}
              className="text-white/40 hover:text-[#D4A97A] underline font-medium tracking-wide text-left"
            >
              Statement Accounts →
            </button>
            <span className="font-mono text-white/30 truncate max-w-[50%]">
              {financialData.chargesTotal >= 0 ? "+" : ""}₱{financialData.chargesTotal.toLocaleString()} Adj
            </span>
          </div>
        </div>

        {/* BOTTOM ACTION LAYOUT GRID */}
        <div className="mt-auto pt-1 flex flex-col gap-2.5">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => toggleModal("detail", true)}
              className="h-8 rounded-lg border border-[#291E13] bg-white/[0.02] text-[10px] font-bold uppercase tracking-wider text-white/70 hover:bg-white/[0.05] transition-all"
            >
              Blueprint
            </button>
            <button
              type="button"
              onClick={() => toggleModal("chat", true)}
              className="relative h-8 rounded-lg bg-[#C49A6C] hover:bg-[#D4A97A] text-[10px] font-black uppercase tracking-wider text-[#0E0A06] flex items-center justify-center gap-1.5 transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#0E0A06]" />
              <span>Discuss</span>
              {liveUnreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-black text-white border border-[#080604]">
                  {liveUnreadCount}
                </span>
              )}
            </button>
          </div>

          {/* ACTION BUTTON GATEWAY */}
          <div className="w-full pt-2 border-t border-[#21180F] h-10 flex items-end">
            {financialData.isSynchronizing ? (
              <button
                disabled
                className="w-full h-8 rounded-lg bg-white/[0.02] border border-[#21180F] text-[10px] font-black uppercase tracking-wider text-white/20 select-none cursor-not-allowed"
              >
                Syncing System Ledger...
              </button>
            ) : canPay ? (
              <button
                type="button"
                onClick={() => toggleModal("pay", true)}
                className="w-full h-8 rounded-lg bg-gradient-to-r from-[#C49A6C] to-[#E8C98A] text-[10px] font-black uppercase tracking-wider text-[#0E0A06] shadow-lg hover:shadow-[#D4A97A]/20 transition-all active:scale-[0.99]"
              >
                {payButtonLabel}
              </button>
            ) : (
              <button
                disabled
                className="w-full h-8 rounded-lg bg-white/[0.02] border border-white/5 text-[10px] font-black uppercase tracking-wider text-white/20 select-none cursor-not-allowed"
              >
                {inquiry.status === "cancelled" 
                  ? "Inquiry Cancelled" 
                  : financialData.currentPaymentStatus === "fully_paid" 
                  ? "Paid In Full" 
                  : "Awaiting Quote Approval"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* PORTAL MODALS SYSTEM */}
      {modals.detail && (
        <InquiryFullDetailModal
          open={modals.detail}
          onClose={() => toggleModal("detail", false)}
          inquiry_items={itemsArray.map(item => ({
            ...item,
            updated_at: (item as any).updated_at || inquiry.created_at
          }))}
        />
      )}
      {modals.chat && (
        <ChatModal
          open={modals.chat}
          onClose={() => toggleModal("chat", false)}
          context={{ type: "inquiry", data: inquiry }}
          currentUserId={userId}
          senderType="customer"
        />
      )}
      {modals.charges && (
        <UserInquiryChargesModal
          isOpen={modals.charges}
          onClose={() => toggleModal("charges", false)}
          inquiryId={inquiry.id}
          userId={userId}
        />
      )}
      {modals.pay && (
        <PayModal
          open={modals.pay}
          onClose={() => toggleModal("pay", false)}
          inquiry={{
            id: inquiry.id,
            user_id: userId,
            inquiry_reference_code: inquiry.id.slice(0, 8).toUpperCase(),
            customer_name: "Workshop Client",
            delivery_method: inquiry.delivery_method || "Custom Delivery Arrangement"
          }}
          totalAmount={financialData.finalTotal}
        />
      )}
    </>
  );
}

/* ── SCANNABLE PROGRESS TIMELINE TRACKER ── */
function ProgressBar({ status }: { status: string }) {
  const steps = [
    { key: "requested", label: "Request" },
    { key: "under_review", label: "Review" },
    { key: "in_production", label: "Build" },
    { key: "ready", label: "Ready" },
    { key: "completed", label: "Done" }
  ];
  
  let current = status;
  if (["ready_for_pickup", "ready_for_shipment", "in_transit"].includes(status)) {
    current = status === "in_transit" ? "completed" : "ready";
  }
  
  const idx = steps.findIndex(s => s.key === current);

  return (
    <div className="w-full px-1 py-1 bg-black/20 rounded-lg border border-[#21180F]">
      <div className="flex items-center justify-between w-full px-2 pt-1">
        {steps.map((step, i) => (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className={`h-2 w-2 rounded-full transition-all duration-300 ${i <= idx ? "bg-[#D4A97A] shadow-[0_0_6px_#D4A97A]" : "bg-white/10"}`} />
            {i < steps.length - 1 && (
              <div className={`h-[1px] flex-1 mx-1 ${i < idx ? "bg-[#D4A97A]/40" : "bg-white/5"}`} />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center w-full px-0.5 mt-1 text-[8px] font-mono uppercase font-bold tracking-tight text-white/30">
        {steps.map((step, i) => (
          <span key={step.key} className={`w-10 text-center ${i <= idx ? "text-[#A68056]" : "text-white/20"}`}>
            {step.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function FinStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col items-center py-1.5 px-1 text-center justify-center min-w-0">
      <p className="text-[8px] font-bold uppercase tracking-wider text-white/20 truncate w-full px-0.5 mb-0.5">{label}</p>
      <p className={`font-mono tabular-nums truncate w-full px-0.5 ${color}`}>{value}</p>
    </div>
  );
}