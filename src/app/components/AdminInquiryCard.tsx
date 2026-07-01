"use client";

import React, { useMemo, useState, useCallback } from "react";
import { 
  MessageSquare, 
  Layers, 
  User, 
  Truck, 
  MapPin, 
  Package 
} from "lucide-react";

// Components & Modals
import ChatModal from "@/app/components/chat/ChatModal";
import InquiryFullDetailModal from "@/app/components/InquiryFullDetailModal"; 
import AdminInquiryCharges from "@/app/components/AdminInquiryCharges"; 
import { InquiryActionButtons, type SynchronizedInquiryStatus } from "@/app/components/InquiryActionButton";

// Hooks & Utilities
import { supabase } from "@/lib/supabase";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { AdminInquiryComposite } from "@/hooks/useAdminInquiry";
import { usePaymentsQuery } from "@/hooks/useFetchPayments"; 

type AdminInquiryCardProps = {
  inquiry: AdminInquiryComposite;
  conversation: {
    id: string;
    admin_unread_count: number;
    customer_unread_count: number;
  } | null;
  adminId: string;
};

/* ── ADMINISTRATIVE WORKFLOW MATRIX MESSAGE GENERATOR ── */
const getAdminInquiryMessage = (
  inquiry: AdminInquiryComposite, 
  paymentStatus: "unpaid" | "partially_paid" | "fully_paid" | string,
  resolvedChargeStatus: string
): string => {
  if (!inquiry) return "Loading data.";
  
  const normalizedStatus = inquiry.status?.toLowerCase().trim() || "";
  const normalizedPaymentStatus = paymentStatus?.toLowerCase().trim() || "unpaid";

  if (normalizedStatus === "cancelled") return "This inquiry has been cancelled.";
  if (normalizedStatus === "requested") return "New request received. Review specs and accept to start the design step.";
  
  if (normalizedStatus === "under_review") {
    if (resolvedChargeStatus === "none" || !resolvedChargeStatus) {
      return "Quote needed. Review details and use Build Invoice Plan to submit pricing.";
    }
    if (resolvedChargeStatus === "pending") {
      return "Quote sent. Waiting for the client to review and approve pricing.";
    }
    if (resolvedChargeStatus === "rejected") {
      return "Quote rejected. Review chat with client for required layout adjustments.";
    }
    if (resolvedChargeStatus === "accepted") {
      if (normalizedPaymentStatus === "partially_paid" || normalizedPaymentStatus === "fully_paid") {
        return "Quote approved and payment verified. Ready to send to production.";
      }
      return "Quote approved. Waiting for the client to submit payment before production.";
    }
  }
  
  if (normalizedStatus === "in_production") {
    return "Item is currently on the workshop floor in active production.";
  }
  
  if (["ready_for_pickup", "ready_for_shipment"].includes(normalizedStatus)) {
    return normalizedPaymentStatus !== "fully_paid" 
      ? "Production complete but final balance is due. Hold release until paid." 
      : "Paid in full. Cleared for customer release or courier handoff.";
  }
  
  if (normalizedStatus === "in_transit" || normalizedStatus === "shipped") {
    return "Package has been dispatched and is currently in transit.";
  }
  
  if (normalizedStatus === "completed") {
    return "Order fulfilled and closed out.";
  }

  return "Review project state records.";
};

/* ── STATUS CHIP DESCRIPTOR FORMATTING ── */
const formatInquiryStatusUI = (status: SynchronizedInquiryStatus, chargeStatus: string) => {
  const normalizedStatus = status?.toLowerCase().trim() || "";
  const normalizedCharge = chargeStatus?.toLowerCase().trim() || "";

  if (normalizedStatus === "requested") {
    return { label: "NEW REQUEST", color: "text-sky-400 border-sky-500/30 bg-sky-500/10" };
  }
  if (normalizedStatus === "under_review") {
    if (normalizedCharge === "" || normalizedCharge === "none") return { label: "NEED QUOTE", color: "text-rose-400 border-rose-500/30 bg-rose-500/10" };
    if (normalizedCharge === "pending") return { label: "QUOTE SENT", color: "text-amber-400 border-amber-500/20 bg-amber-500/10" };
    if (normalizedCharge === "accepted") return { label: "QUOTE APPROVED", color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10" };
    if (normalizedCharge === "rejected") return { label: "REJECTED QUOTE", color: "text-rose-500 border-rose-500/30 bg-rose-500/15" };
  }
  if (normalizedStatus === "in_production") {
    return { label: "IN PRODUCTION", color: "text-amber-500 border-amber-600/20 bg-amber-600/5" };
  }
  if (normalizedStatus === "ready_for_pickup") {
    return { label: "READY PICKUP", color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10" };
  }
  if (normalizedStatus === "ready_for_shipment") {
    return { label: "READY SHIP", color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10" };
  }
  if (normalizedStatus === "in_transit" || normalizedStatus === "shipped") {
    return { label: "IN TRANSIT", color: "text-sky-400 border-sky-500/20 bg-sky-500/10" };
  }
  if (normalizedStatus === "completed") {
    return { label: "COMPLETED", color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10" };
  }
  if (normalizedStatus === "cancelled") {
    return { label: "CANCELLED", color: "text-white/20 border-white/10 bg-white/5" };
  }
  return { label: status.toUpperCase(), color: "text-amber-500 border-amber-600/20 bg-amber-600/5" };
};

export default function AdminInquiryCard({ inquiry, conversation, adminId }: AdminInquiryCardProps) {
  const [modals, setModals] = useState({ chat: false, detail: false, charges: false });

  // TanStack asynchronous hook handling
  const { data: paymentSummary, isLoading: paymentsLoading, isFetching: paymentsFetching } = usePaymentsQuery(inquiry.id);

  const liveUnreadCount = useMemo(() => {
    return Number(conversation?.admin_unread_count ?? 0);
  }, [conversation?.admin_unread_count]);

  const toggleModal = (key: keyof typeof modals, val: boolean) => {
    setModals((prev) => ({ ...prev, [key]: val }));
  };

  const anyModalOpen = Object.values(modals).some(Boolean);
  useBodyScrollLock(anyModalOpen);

  const itemsArray = useMemo(() => inquiry.inquiry_items ?? [], [inquiry.inquiry_items]);
  const firstItem = itemsArray[0];
  const charges = useMemo(() => inquiry.inquiry_charges ?? [], [inquiry.inquiry_charges]);

  /* ── SELF-HEALING FINANCIAL INFERENCE LAYER ── */
  const explicitChargeStatus = useMemo(() => {
    if (!inquiry) return "";
    
    const statusField = inquiry.charge_status?.toString().toLowerCase().trim();
    if (statusField && statusField !== "null" && statusField !== "undefined" && statusField !== "") {
      return statusField;
    }

    const totalPaid = Number(paymentSummary?.totalPaid ?? (paymentSummary as any)?.amount_paid ?? 0);
    if (totalPaid > 0) {
      return "accepted";
    }

    if (charges && charges.length > 0) {
      return "pending";
    }

    return "none";
  }, [inquiry, charges, paymentSummary]);

  const financialData = useMemo(() => {
    const totalPieces = itemsArray.reduce((sum: number, i: any) => sum + Number(i?.quantity ?? 0), 0);
    const chargesTotal = charges.reduce((total: number, c: any) => 
      c?.is_additive ? total + Number(c?.amount ?? 0) : total - Number(c?.amount ?? 0), 0
    );
    const finalTotal = inquiry.final_total_price !== null && inquiry.final_total_price !== undefined
      ? Number(inquiry.final_total_price)
      : chargesTotal;

    const totalPaid = Number(paymentSummary?.totalPaid ?? (paymentSummary as any)?.amount_paid ?? 0);
    const remaining = Math.max(finalTotal - totalPaid, 0);
    const isAwaitingQuote = charges.length === 0 && (inquiry.final_total_price === null || inquiry.final_total_price === undefined);

    let currentPaymentStatus = "unpaid";
    if (totalPaid > 0) {
      currentPaymentStatus = remaining <= 0 ? "fully_paid" : "partially_paid";
    }

    const isSynchronizing = paymentsLoading || paymentsFetching;

    return { totalPieces, chargesTotal, finalTotal, totalPaid, remaining, isAwaitingQuote, currentPaymentStatus, isSynchronizing };
  }, [inquiry.final_total_price, charges, itemsArray, paymentSummary, paymentsLoading, paymentsFetching]);

  const clientIdentifier = useMemo(() => {
    return inquiry.profiles?.first_name 
      ? `${inquiry.profiles.first_name} ${inquiry.profiles.last_name || ""}` 
      : inquiry.profiles?.email || "Anonymous Client";
  }, [inquiry.profiles]);

  const isReadOnlyStatus = useMemo(() => {
    const normalizedStatus = inquiry.status?.toLowerCase().trim() || "";
    return !(normalizedStatus === "requested" || (normalizedStatus === "under_review" && explicitChargeStatus !== "accepted"));
  }, [inquiry.status, explicitChargeStatus]);

  const statusUI = formatInquiryStatusUI(inquiry.status, explicitChargeStatus);

  const logisticsData = useMemo(() => {
    const method = inquiry.delivery_method?.toLowerCase() || "unassigned";
    const isPickup = method.includes("pickup");
    const addressString = inquiry.shipping_address || inquiry.delivery_address;
    
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
                #{inquiry.inquiry_reference_code || inquiry.id?.slice(0, 8).toUpperCase()}
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
            {getAdminInquiryMessage(inquiry, financialData.currentPaymentStatus, explicitChargeStatus)}
          </p>
        </div>

        {/* CORE SPECIFICATIONS SUB-GRID */}
        <div className="flex flex-col gap-2 bg-white/[0.01] border border-[#21180F] p-2.5 rounded-lg text-xs">
          <div className="flex items-start gap-2 min-w-0">
            <User className="w-3.5 h-3.5 text-[#A68056] shrink-0 mt-0.5" />
            <span className="text-white/40 text-[10px] uppercase tracking-wider font-medium w-12 shrink-0 mt-0.5">Client:</span>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-bold text-white tracking-wide truncate">
                {clientIdentifier}
              </span>
              {inquiry.phone_number && (
                <span className="text-[11px] text-white/40 font-mono tracking-tight mt-0.5">
                  {inquiry.phone_number}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 min-w-0 border-t border-[#1C140C] pt-2">
            <Layers className="w-3.5 h-3.5 text-[#D4A97A] shrink-0" />
            <span className="text-white/40 text-[10px] uppercase tracking-wider font-medium w-12 shrink-0">Design:</span>
            <span className="text-white/90 truncate min-w-0 flex-1 font-medium">
              {firstItem?.title || "Custom Blueprint Spec"}
            </span>
            <span className="text-[9px] font-bold text-[#D4A97A] bg-[#D4A97A]/10 px-1 py-0.5 rounded shrink-0">
              ×{financialData.totalPieces || 1}
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
              label="Gross Price"
              value={financialData.isAwaitingQuote ? "—" : `₱${financialData.finalTotal.toLocaleString()}`}
              color="text-[#E8C98A] text-xs font-bold"
            />
            <FinStat
              label="Paid Total"
              value={financialData.isSynchronizing ? "…" : `₱${financialData.totalPaid.toLocaleString()}`}
              color="text-emerald-400 text-xs font-bold"
            />
            <FinStat
              label="Balance Due"
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
              {isReadOnlyStatus ? "View Locked Ledger →" : financialData.isAwaitingQuote ? "Build Invoice Plan →" : "Adjust Cost Matrix →"}
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
            ) : (
              <InquiryActionButtons 
                inquiry={{
                  id: inquiry.id,
                  status: inquiry.status,
                  charge_status: explicitChargeStatus,
                  inquiry_charges: charges, 
                  delivery_method: inquiry.delivery_method,
                  payment_status: financialData.currentPaymentStatus
                }}
                supabaseClient={supabase}
                currentAdminId={adminId}
              />
            )}
          </div>
        </div>
      </div>

      {/* PORTAL MODALS SYSTEM */}
      {modals.detail && (
        <InquiryFullDetailModal 
          open={modals.detail} 
          onClose={() => toggleModal("detail", false)} 
          inquiry_items={itemsArray.map((item: any) => ({
            ...item,
            updated_at: item.updated_at || inquiry.created_at
          }))} 
        />
      )}

      {modals.charges && (
        <AdminInquiryCharges 
          open={modals.charges}
          onClose={() => toggleModal("charges", false)}
          inquiryId={inquiry.id}
          adminId={adminId}
          readOnly={isReadOnlyStatus}
        />
      )}

      {modals.chat && (
        <ChatModal 
          open={modals.chat} 
          onClose={() => toggleModal("chat", false)} 
          context={{ type: "inquiry", data: inquiry }} 
          currentUserId={adminId} 
          senderType="admin" 
        />
      )}
    </>
  );
}

/* ── SCANNABLE PROGRESS TIMELINE TRACKER ── */
function ProgressBar({ status }: { status: SynchronizedInquiryStatus }) {
  const steps = [
    { key: "requested", label: "Request" },
    { key: "under_review", label: "Review" },
    { key: "in_production", label: "Build" },
    { key: "ready", label: "Ready" },
    { key: "completed", label: "Done" }
  ];
  
  const normalizedStatus = status?.toLowerCase().trim() || "";
  let current: string = normalizedStatus;
  
  if (["ready_for_pickup", "ready_for_shipment", "in_transit", "shipped"].includes(normalizedStatus)) {
    current = ["in_transit", "shipped"].includes(normalizedStatus) ? "completed" : "ready";
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