"use client";

import React, { useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { 
  MessageSquare, 
  Layers, 
  ArrowRight,
  Eye,
  FileText,
  Clock,
  User
} from "lucide-react";

import ChatModal from "@/app/components/chat/ChatModal";
import InquiryFullDetailModal from "@/app/components/InquiryFullDetailModal"; 
import AdminInquiryCharges from "@/app/components/AdminInquiryCharges"; 
import { InquiryActionButtons } from "@/app/components/InquiryActionButton";
import { markConversationAsRead } from "@/services/chat/chatService";
import { AdminInquiryComposite } from "@/hooks/useAdminInquiry";
import { CustomInquiryStatus } from "@/types/inquiry";
import { usePaymentsQuery } from "@/hooks/useFetchPayments"; 

type AdminInquiryCardProps = {
  inquiry: AdminInquiryComposite & { final_total_price?: number | null };
  conversation: {
    id: string;
    admin_unread_count: number;
    customer_unread_count: number;
  } | null;
  adminId: string;
};

const formatInquiryStatus = (status: CustomInquiryStatus): string => {
  const statusMap: Record<CustomInquiryStatus, string> = {
    requested: "Requested",
    under_review: "Under Review",
    quote_ready: "Price Ready",
    awaiting_payment: "Awaiting Payment",
    verifying_payment: "Verifying Payment",
    in_production: "In Production",
    ready_for_pickup: "Ready for Pickup",
    ready_for_shipment: "Ready for Shipment",
    in_transit: "In Transit",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return statusMap[status] || status;
};

export default function AdminInquiryCard({ inquiry, conversation, adminId }: AdminInquiryCardProps) {
  const [hasClearedChat, setHasClearedChat] = useState<boolean>(false);

  const [modals, setModals] = useState({
    chat: false,
    detail: false,
    charges: false,
  });

  const { data: paymentSummary } = usePaymentsQuery(inquiry.id);

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
      }).catch((err) => console.error("Error clearing admin chat state notification:", err));
    }
  };

  const financialData = useMemo(() => {
    const totalPieces = inquiry.inquiry_items?.reduce((sum, i) => sum + Number(i?.quantity ?? 0), 0) || 0;
    const charges = inquiry.inquiry_charges ?? [];
    const isAwaitingQuote = charges.length === 0 && (inquiry.final_total_price === null || inquiry.final_total_price === undefined);

    const totalCalculatedCost = inquiry.final_total_price !== null && inquiry.final_total_price !== undefined
      ? Number(inquiry.final_total_price)
      : charges.reduce((accumulated, charge) => {
          const chargeValue = Number(charge?.amount ?? 0);
          return charge?.is_additive ? accumulated + chargeValue : accumulated - chargeValue;
        }, 0);

    const totalAmountPaid = paymentSummary?.totalPaid ?? 0;
    const remainingBalance = Math.max(totalCalculatedCost - totalAmountPaid, 0);

    let currentPaymentStatus = "unpaid";
    if (totalAmountPaid > 0) {
      currentPaymentStatus = remainingBalance <= 0 ? "fully_paid" : "partially_paid";
    }

    return {
      totalPieces,
      totalCalculatedCost,
      totalAmountPaid,
      remainingBalance,
      currentPaymentStatus,
      isAwaitingQuote
    };
  }, [inquiry.inquiry_items, inquiry.inquiry_charges, inquiry.final_total_price, paymentSummary]);

  const statusColors = useMemo(() => {
    const targetStatus = inquiry.status;
    if (targetStatus === "cancelled") return "text-rose-400 border-rose-500/20 bg-rose-500/10";
    if (targetStatus === "completed") return "text-emerald-400 border-emerald-500/20 bg-emerald-500/10";
    if (targetStatus === "requested") return "text-sky-400 border-sky-500/20 bg-sky-500/10";
    if (targetStatus === "quote_ready" || targetStatus === "awaiting_payment") return "text-amber-400 border-amber-500/20 bg-amber-500/10";
    return "text-amber-500 border-amber-600/20 bg-amber-600/5";
  }, [inquiry.status]);

  const firstItem = inquiry.inquiry_items?.[0];
  const itemsArray = useMemo(() => inquiry.inquiry_items ?? [], [inquiry.inquiry_items]);
  
  const clientIdentifier = inquiry.profiles?.first_name 
    ? `${inquiry.profiles.first_name} ${inquiry.profiles.last_name || ""}` 
    : inquiry.profiles?.email || "Anonymous Client";

  const isReadOnlyStatus = useMemo(() => {
    const lockStates: string[] = [
      "accepted", 
      "in_production", 
      "ready_for_pickup", 
      "ready_for_shipment", 
      "in_transit", 
      "completed"
    ];
    return lockStates.includes(inquiry.status as string);
  }, [inquiry.status]);

  const internalMessage = useMemo(() => {
    const messages: Record<string, string> = {
      requested: "Our workshop team is reviewing your design details.",
      under_review: "We are currently working on your price estimate.",
      quote_ready: "Your pricing updates have been successfully added below.",
      awaiting_payment: "Pricing approved. Awaiting secure transaction clearance.",
      verifying_payment: "We are verifying your payment details now.",
      in_production: "Your design is now on the production floor.",
      ready_for_pickup: "Finished! Your item is ready for pickup at our workshop.",
      ready_for_shipment: "Packed and ready to be handed to the delivery courier.",
      in_transit: "Your package is on its way to your delivery address.",
      completed: "Order complete. Thank you for working with our team!",
      cancelled: "This custom design inquiry has been cancelled."
    };
    return messages[inquiry.status] || "Reviewing your customized blueprint specs.";
  }, [inquiry.status]);

  return (
    <>
      <div className="relative flex flex-col w-full max-w-md mx-auto rounded-2xl overflow-hidden border border-[#36271a] bg-gradient-to-b from-[#140F0A] to-[#0A0705] shadow-[0_16px_45px_rgba(0,0,0,0.7)] transition-all duration-300 hover:border-[#D4A97A]/40 hover:shadow-[0_20px_50px_rgba(212,169,122,0.05)] group">
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#D4A97A]/40 to-transparent shrink-0" />

        {/* TOP META DATA */}
        <div className="p-5 pb-3">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <User className="w-3 h-3 text-[#A68056] shrink-0" />
                <p className="text-[9px] font-black tracking-[0.25em] text-[#A68056] uppercase truncate max-w-[180px]">
                  {clientIdentifier}
                </p>
              </div>
              <h2 className="text-[15px] font-bold text-white tracking-wide font-mono">
                #{inquiry.id.slice(0, 8).toUpperCase()}
              </h2>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.12em] border backdrop-blur-md shrink-0 transition-all ${statusColors}`}>
              {formatInquiryStatus(inquiry.status)}
            </span>
          </div>
        </div>

        {/* CORE SUMMARY BLOCK */}
        <div className="px-5 pb-4 flex-1 flex flex-col justify-between">
          <div className="bg-white/[0.02] border border-[#261B11] rounded-xl p-3.5 mb-4 relative transition-all group-hover:bg-white/[0.03]">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] font-black text-[#D4A97A] bg-[#D4A97A]/10 px-1.5 py-0.5 rounded-md shrink-0">
                  x{financialData.totalPieces || 1}
                </span>
                <h3 className="font-bold text-xs text-white/90 tracking-wide truncate">
                  {firstItem?.title || "Custom Design Blueprint"}
                </h3>
              </div>
              
              <button 
                onClick={() => toggleModal("detail", true)}
                className="flex items-center gap-1.5 text-[10px] font-bold text-[#D4A97A] hover:text-[#E5BC8E] active:scale-95 transition-all shrink-0 bg-[#D4A97A]/5 hover:bg-[#D4A97A]/10 px-2.5 py-1.5 rounded-md border border-[#D4A97A]/20"
              >
                <Eye className="w-3 h-3" /> View Detail
              </button>
            </div>
            
            <p className="text-[11px] text-white/60 line-clamp-2 leading-relaxed italic">
              &ldquo;{firstItem?.description || "No layout specification notes submitted."}&rdquo;
            </p>

            {itemsArray.length > 1 && (
              <div className="flex items-center gap-1.5 mt-3.5 pt-3 border-t border-white/5 text-[10px] text-white/40">
                <Layers className="w-3 h-3 text-[#D4A97A]/50" />
                <span>+ {itemsArray.length - 1} other items/variants</span>
              </div>
            )}
          </div>

          {/* CHARGES / BILLING MATRIX - LAYOUT SAFE ANCHOR */}
          <div className="bg-black/20 p-3 rounded-xl border border-white/5 min-h-[148px] flex flex-col justify-between overflow-hidden">
            {!financialData.isAwaitingQuote ? (
              <div className="w-full flex-1 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-white/50 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#D4A97A]/70" /> Price Items ({inquiry.inquiry_charges?.length ?? 0})
                  </span>
                  <button 
                    onClick={() => toggleModal("charges", true)} 
                    className="text-[11px] font-bold text-[#D4A97A] hover:text-[#E5BC8E] hover:underline flex items-center gap-1 transition-colors"
                  >
                    {isReadOnlyStatus ? "View Ledger" : "Manage Pricing"}
                  </button>
                </div>

                <div className="h-px w-full bg-white/5" />

                {financialData.totalAmountPaid > 0 && (
                  <div className="space-y-1 text-[11px] border-b border-white/5 pb-1.5">
                    <div className="flex justify-between text-white/40">
                      <span>Total Price:</span>
                      <span className="font-mono">₱{financialData.totalCalculatedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-emerald-400/80">
                      <span>Total Paid:</span>
                      <span className="font-mono">- ₱{financialData.totalAmountPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 mt-auto">
                  <span className="text-[9px] font-black uppercase text-white/40 tracking-widest">
                    {financialData.totalAmountPaid > 0 ? "Remaining Balance" : "Total Cost"}
                  </span>
                  <span className="text-[16px] font-mono font-bold text-[#E8C98A] drop-shadow-[0_2px_10px_rgba(232,201,138,0.15)]">
                    ₱{financialData.remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-full flex-1 flex flex-col justify-between space-y-3">
                <div className="flex-1 flex items-center justify-center py-1">
                  <div className="w-full py-2.5 border border-dashed border-[#543d27] rounded-lg bg-[#140F0A]/50 px-3 flex items-center justify-center gap-2.5">
                    <Clock className="w-4 h-4 text-[#A68056] shrink-0 animate-spin [animation-duration:4s]" />
                    <p className="text-[11px] text-[#A68056] leading-normal font-medium text-center">
                      {internalMessage}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-auto shrink-0">
                  <span className="text-[9px] font-black uppercase text-white/40 tracking-widest">Price Details</span>
                  <button 
                    onClick={() => toggleModal("charges", true)} 
                    className="text-[10px] uppercase tracking-wider font-extrabold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md transition-all active:scale-95"
                  >
                    Build Invoice
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* LOGISTICS ROUTE FOOTER METRICS */}
        <div className="px-5 pb-2 text-[11px] text-white/40 flex flex-row items-center justify-between gap-2">
          <span>Method: <b className="text-white/60 capitalize">{inquiry.delivery_method || "Unassigned"}</b></span>
          {inquiry.phone_number && <span className="font-mono text-[10px]">Tel: {inquiry.phone_number}</span>}
        </div>

        {/* BOTTOM ACTIVE FOOTER ACTION SPLIT */}
        <div className="mt-auto border-t border-[#261B11] bg-[#070503] p-4 flex flex-row gap-3 items-center justify-between h-[76px]">
          <button
            onClick={() => toggleModal("chat", true)}
            className="relative h-11 flex-1 border-[#36271a] bg-white/[0.02] text-white/60 hover:bg-white/[0.05] hover:text-white/80 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 border shadow-inner"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Discuss</span>
            
            {liveUnreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white border-2 border-[#070503] animate-bounce">
                {liveUnreadCount}
              </span>
            )}
          </button>

          {/* PIPELINE MANAGEMENT PANEL CONTAINER */}
          <div className="flex-[1.3] h-11 min-w-0 flex items-center">
            <InquiryActionButtons 
              inquiry={{
                id: inquiry.id,
                status: inquiry.status,
                delivery_method: inquiry.delivery_method,
                payment_status: financialData.currentPaymentStatus
              }}
              supabaseClient={supabase}
              currentAdminId={adminId}
            />
          </div>
        </div>
      </div>

      {/* RENDER PORTS */}
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