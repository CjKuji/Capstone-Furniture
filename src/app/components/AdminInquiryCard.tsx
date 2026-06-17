"use client";

import React, { useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { 
  MessageSquare, 
  Layers, 
  User, 
  AlertCircle,
  CreditCard,
  DollarSign,
  Truck,
  MapPin,
  Package
} from "lucide-react";

// Components & Modals
import ChatModal from "@/app/components/chat/ChatModal";
import InquiryFullDetailModal from "@/app/components/InquiryFullDetailModal"; 
import AdminInquiryCharges from "@/app/components/AdminInquiryCharges"; 
import { InquiryActionButtons } from "@/app/components/InquiryActionButton";

// Hooks & Utilities
import { markConversationAsRead } from "@/services/chat/chatService";
import { AdminInquiryComposite } from "@/hooks/useAdminInquiry";
import { CustomInquiryStatus } from "@/types/inquiry";
import { usePaymentsQuery } from "@/hooks/useFetchPayments"; 

type AdminInquiryCardProps = {
  inquiry: AdminInquiryComposite & { 
    final_total_price?: number | null;
    charge_status?: string | null;
    shipping_address?: string | null;
    delivery_method?: string | null;
  };
  conversation: {
    id: string;
    admin_unread_count: number;
    customer_unread_count: number;
  } | null;
  adminId: string;
};

/* ── ADMINISTRATIVE HIGH-DENSITY WORKFLOW MATRIX ── */
const getAdminInquiryMessage = (inquiry: any, paymentStatus: string): string => {
  if (!inquiry) return "Processing blueprint...";
  const { status, charge_status } = inquiry;

  if (status === "cancelled") return "Inquiry cancelled by system or user.";
  if (status === "requested") return "New incoming request. Review specifications and files.";
  
  if (status === "under_review") {
    if (!charge_status) return "Awaiting initial cost estimate and statement configuration.";
    if (charge_status === "pending") return "Quote sent to client. Awaiting user approval.";
  }

  if (status === "quote_ready") return "Pricing finalized. Waiting for customer sign-off.";
  if (status === "awaiting_payment") return "Approved by customer. Awaiting initial invoice ledger payment.";
  if (status === "verifying_payment") return "Payment transaction recorded. Awaiting processing confirmation.";
  if (status === "in_production") return "Active production floor tracking sequence running.";
  
  if (["ready_for_pickup", "ready_for_shipment"].includes(status)) {
    return paymentStatus !== "fully_paid" 
      ? "Fulfillment ready. Gated pending outstanding balance settlement." 
      : "Paid in full. Cleared for release and final logistics execution.";
  }
  
  if (status === "in_transit") return "Logistics route active. Dispatch package en route.";
  if (status === "completed") return "Order archive settled. Project cycle finalized.";

  return "Review project state records.";
};

const formatInquiryStatusUI = (status: CustomInquiryStatus) => {
  const statusMap: Record<CustomInquiryStatus, { label: string; color: string }> = {
    requested: { label: "Requested", color: "text-sky-400 border-sky-500/20 bg-sky-500/10" },
    under_review: { label: "Review", color: "text-amber-500 border-amber-600/20 bg-amber-600/5" },
    quote_ready: { label: "Price Ready", color: "text-amber-400 border-amber-500/20 bg-amber-500/10" },
    awaiting_payment: { label: "Awaiting Pay", color: "text-amber-400 border-amber-500/20 bg-amber-500/10" },
    verifying_payment: { label: "Verifying Pay", color: "text-amber-500 border-amber-600/20 bg-amber-600/5" },
    in_production: { label: "Production", color: "text-amber-500 border-amber-600/20 bg-amber-600/5" },
    ready_for_pickup: { label: "Ready Pickup", color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10" },
    ready_for_shipment: { label: "Ready Ship", color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10" },
    in_transit: { label: "In Transit", color: "text-amber-500 border-amber-600/20 bg-amber-600/5" },
    completed: { label: "Completed", color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10" },
    cancelled: { label: "Cancelled", color: "text-rose-400 border-rose-500/20 bg-rose-500/10" },
  };
  return statusMap[status] || { label: status, color: "text-amber-500 border-amber-600/20 bg-amber-600/5" };
};

export default function AdminInquiryCard({ inquiry, conversation, adminId }: AdminInquiryCardProps) {
  const [hasClearedChat, setHasClearedChat] = useState<boolean>(false);
  const [modals, setModals] = useState({ chat: false, detail: false, charges: false });

  const { data: paymentSummary, isLoading: paymentsLoading } = usePaymentsQuery(inquiry.id);

  const liveUnreadCount = useMemo(() => {
    if (hasClearedChat) return 0;
    return conversation?.admin_unread_count ?? 0;
  }, [conversation?.admin_unread_count, hasClearedChat]);

  const toggleModal = (key: keyof typeof modals, val: boolean) => {
    setModals((prev) => ({ ...prev, [key]: val }));
    if (key === "chat" && val === true && conversation?.id) {
      setHasClearedChat(true);
      markConversationAsRead({
        conversationId: conversation.id,
        readerType: "admin"
      }).catch((err) => console.error("Error clearing admin chat:", err));
    }
  };

  const itemsArray = useMemo(() => inquiry.inquiry_items ?? [], [inquiry.inquiry_items]);
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

    return { totalPieces, chargesTotal, finalTotal, totalPaid, remaining, isAwaitingQuote, currentPaymentStatus };
  }, [inquiry, charges, itemsArray, paymentSummary]);

  const clientIdentifier = useMemo(() => {
    return inquiry.profiles?.first_name 
      ? `${inquiry.profiles.first_name} ${inquiry.profiles.last_name || ""}` 
      : inquiry.profiles?.email || "Anonymous Client";
  }, [inquiry.profiles]);

  // Read-only mode is active for everything EXCEPT "under_review" and "accepted"
  const isReadOnlyStatus = useMemo(() => {
    return !["under_review", "accepted"].includes(inquiry.status);
  }, [inquiry.status]);

  const statusUI = formatInquiryStatusUI(inquiry.status);

  const logisticsData = useMemo(() => {
    const method = inquiry.delivery_method?.toLowerCase() || "unassigned";
    const isPickup = method.includes("pickup");
    const addressString = inquiry.shipping_address || (inquiry as any).address;
    
    return {
      isPickup,
      label: isPickup ? "Pickup Track" : method === "unassigned" ? "Unassigned" : "Shipping Track",
      address: isPickup ? "Workshop Floor Base Area" : addressString || "No delivery address configured"
    };
  }, [inquiry]);

  return (
    <>
      {/* COMPACT HIGH DENSITY CARD CONTAINER */}
      <div className="relative flex flex-col w-full h-full rounded-xl overflow-hidden border border-[#362719] bg-gradient-to-b from-[#120D08] to-[#0A0704] shadow-[0_8px_30px_rgba(0,0,0,0.6)] transition-all duration-200 hover:border-[#D4A97A]/40 p-4 gap-3.5">
        
        {/* HEADER BLOCK */}
        <div className="flex items-center justify-between gap-2 border-b border-[#21180F] pb-2.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-[#A68056] uppercase font-mono">
              <span>Blueprint Ref</span>
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
                {liveUnreadCount} Msg
              </span>
            )}
            <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border bg-black/20 ${statusUI.color}`}>
              {statusUI.label}
            </span>
          </div>
        </div>

        {/* PROGRESS TRACKER BAR */}
        <ProgressBar status={inquiry.status} />

        {/* CENTRALIZED DYNAMIC MESSAGE BOX (Fixed height structure layout protection) */}
        <div className="flex items-center justify-center text-center bg-white/[0.02] border border-[#21180F] rounded-lg px-3 py-2 min-h-[44px]">
          <p className="text-[12px] text-white/80 font-medium leading-normal tracking-wide">
            {getAdminInquiryMessage(inquiry, financialData.currentPaymentStatus)}
          </p>
        </div>

        {/* CORE INFORMATION SUB-GRID */}
        <div className="flex flex-col gap-2 bg-white/[0.01] border border-[#21180F] p-2.5 rounded-lg text-xs">
          {/* CLIENT LINE WITH PHONE NUMBER STACKED BELOW */}
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

          {/* BLUEPRINT LINE */}
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

        {/* COMPACT ROUTING & ROUTE CHANNELS PANEL */}
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
              value={paymentsLoading ? "…" : `₱${financialData.totalPaid.toLocaleString()}`}
              color="text-emerald-400 text-xs font-bold"
            />
            <FinStat
              label="Balance"
              value={financialData.isAwaitingQuote ? "—" : `₱${financialData.remaining.toLocaleString()}`}
              color={financialData.remaining > 0 && !financialData.isAwaitingQuote ? "text-amber-500 font-bold" : "text-emerald-400"}
            />
          </div>
          
          <div className="flex items-center justify-between bg-[#0A0704] px-2.5 py-1.5 text-[10px] border-t border-[#291E13]">
            <button 
              onClick={() => toggleModal("charges", true)}
              className="text-white/40 hover:text-[#D4A97A] underline font-medium tracking-wide text-left"
            >
              {isReadOnlyStatus ? "View Price Breakdown →" : financialData.isAwaitingQuote ? "Build Invoice Plan →" : "Manage Calculations →"}
            </button>
            <span className="font-mono text-white/30 truncate max-w-[50%]">
              {financialData.chargesTotal >= 0 ? "+" : ""}₱{financialData.chargesTotal.toLocaleString()} Adj
            </span>
          </div>
        </div>

        {/* BOTTOM MANAGEMENT ROW INTERACTION FOOTHOLD */}
        <div className="mt-auto pt-1 flex flex-col gap-2.5">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => toggleModal("detail", true)}
              className="h-8 rounded-lg border border-[#291E13] bg-white/[0.02] text-[10px] font-bold uppercase tracking-wider text-white/70 hover:bg-white/[0.05] transition-all"
            >
              Blueprint
            </button>
            <button
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

          {/* ACTIVE STEP WORKFLOW PIPELINE BUTTONS */}
          <div className="w-full pt-2 border-t border-[#21180F] h-10 flex items-end">
            <InquiryActionButtons 
              inquiry={{
                id: inquiry.id,
                status: inquiry.status,
                charge_status: inquiry.charge_status,
                delivery_method: inquiry.delivery_method as any,
                payment_status: financialData.currentPaymentStatus
              }}
              supabaseClient={supabase}
              currentAdminId={adminId}
            />
          </div>
        </div>
      </div>

      {/* MODALS */}
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

      {modals.charges && (
        <AdminInquiryCharges 
          open={modals.charges}
          onClose={() => toggleModal("charges", false)}
          inquiryId={inquiry.id}
          adminId={adminId}
          status={inquiry.status}
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

/* ── LAYOUT SUB-HELPERS ── */

function ProgressBar({ status }: { status: string }) {
  const stages = ["requested", "under_review", "in_production", "ready", "completed"];
  
  let current = status;
  if (["ready_for_pickup", "ready_for_shipment", "in_transit"].includes(status)) {
    current = status === "in_transit" ? "completed" : "ready";
  }
  if (status === "awaiting_payment" || status === "verifying_payment" || status === "quote_ready") {
    current = "under_review";
  }
  
  const idx = stages.indexOf(current);

  return (
    <div className="flex items-center justify-between w-full px-0.5">
      {stages.map((stage, i) => (
        <div key={stage} className="flex items-center flex-1 last:flex-none">
          <div className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${i <= idx ? "bg-[#D4A97A] shadow-[0_0_6px_#D4A97A]" : "bg-white/10"}`} />
          {i < stages.length - 1 && (
            <div className={`h-[1px] flex-1 mx-1 ${i < idx ? "bg-[#D4A97A]/30" : "bg-white/5"}`} />
          )}
        </div>
      ))}
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