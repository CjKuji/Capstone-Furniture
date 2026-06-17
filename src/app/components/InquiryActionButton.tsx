"use client";

import React, { useMemo } from "react";
import { SupabaseClient } from "@supabase/supabase-js";
import { useUpdateInquiryStatus } from "@/hooks/useAdminInquiry"; 

export type SynchronizedInquiryStatus = 
  | "requested" 
  | "under_review" 
  | "cancelled" 
  | "in_production" 
  | "in_transit" 
  | "completed" 
  | "ready_for_pickup" 
  | "ready_for_shipment" 
  | "shipped";

interface InquiryActionButtonsProps {
  inquiry: {
    id: string;
    status: SynchronizedInquiryStatus;
    charge_status?: string | null;
    chargeStatus?: string | null;
    delivery_method?: string | null;
    payment_status?: string | null;
    inquiry_charges?: any[] | null; 
  };
  supabaseClient: SupabaseClient; 
  currentAdminId?: string;       
}

const baseBtnClass =
  "flex items-center justify-center h-9 w-full rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 border backdrop-blur-sm text-center active:scale-[0.97] select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

const styles = {
  primary: "bg-[#D4A97A] text-[#1C1209] border-[#D4A97A] hover:bg-[#E5BC8E] shadow-sm",
  dark: "bg-white/[0.03] text-white/80 border-white/10 hover:border-[#D4A97A]/40 hover:text-white hover:bg-white/[0.06]",
  success: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20 hover:text-emerald-200",
  danger: "bg-rose-500/10 text-rose-300 border-rose-500/20 hover:bg-rose-500/20 hover:text-rose-200",
  warning: "bg-amber-500/10 text-amber-300 border-amber-500/20 hover:bg-amber-500/20 hover:text-amber-200",
};

export const InquiryActionButtons: React.FC<InquiryActionButtonsProps> = ({
  inquiry,
  supabaseClient, 
  currentAdminId = "system-admin",
}) => {
  const { mutateAsync: updateStatus, isPending } = useUpdateInquiryStatus();

  // 1. ULTRA DEFENSIVE PROPERTY EVALUATION (MATCHING USER-SIDE COMPUTATIONS)
  const evaluatedMetrics = useMemo(() => {
    const chargesArray = inquiry.inquiry_charges ?? [];
    
    // Fallback parsing strategy checking nested structures and variation names
    const directChargeString = (inquiry.charge_status || inquiry.chargeStatus || "").toLowerCase().trim();
    
    let resolvedChargesAccepted = directChargeString === "accepted";
    
    // If the top level property is missing or out of sync, check relational data values explicitly
    if (!resolvedChargesAccepted && chargesArray.length > 0) {
      // Strategy A: Check if any charges exist and if an explicit parent override token evaluates true
      const hasAcceptedRowProperty = (inquiry as any).explicitChargeStatus === "accepted";
      
      // Strategy B: Pull directly from properties nested inside your relational charge objects 
      const inlineRowStatus = (chargesArray[0] as any)?.charge_status?.toLowerCase().trim();
      
      if (hasAcceptedRowProperty || inlineRowStatus === "accepted") {
        resolvedChargesAccepted = true;
      }
    }

    const normalizedStatus = inquiry.status?.toLowerCase().trim() || "";
    const normalizedPaymentStatus = inquiry.payment_status?.toLowerCase().trim() || "unpaid";
    const normalizedDeliveryMethod = inquiry.delivery_method?.toLowerCase() || "unassigned";
    
    const isPickupTrack = normalizedDeliveryMethod.includes("pickup");
    const isPaymentReceived = normalizedPaymentStatus === "partially_paid" || normalizedPaymentStatus === "fully_paid";
    const isClearedForProduction = resolvedChargesAccepted && isPaymentReceived;
    const isFullyPaid = normalizedPaymentStatus === "fully_paid";

    return {
      normalizedStatus,
      isPickupTrack,
      isChargesAccepted: resolvedChargesAccepted,
      isClearedForProduction,
      isFullyPaid
    };
  }, [inquiry]);

  const { normalizedStatus, isPickupTrack, isChargesAccepted, isClearedForProduction, isFullyPaid } = evaluatedMetrics;
  const activeButtons: React.ReactNode[] = [];

  // ── PHASE 1: REQUESTED INCOMING STATE ──
  if (normalizedStatus === "requested") {
    activeButtons.push(
      <button
        key="accept-inquiry"
        type="button"
        disabled={isPending}
        className={`${baseBtnClass} ${styles.primary}`}
        onClick={() => updateStatus({ inquiryId: inquiry.id, status: "under_review" })}
      >
        {isPending ? "Accepting..." : "Accept Inquiry"}
      </button>
    );
  }

  // ── PHASE 2: ADMINISTRATIVE REVIEW AND PRICING LIFECYCLE ──
  if (normalizedStatus === "under_review") {
    if (isClearedForProduction) {
      activeButtons.push(
        <button
          key="start-production"
          type="button"
          disabled={isPending}
          className={`${baseBtnClass} ${styles.success}`}
          onClick={() => updateStatus({ inquiryId: inquiry.id, status: "in_production" })}
        >
          {isPending ? "Deploying..." : "Start Production"}
        </button>
      );
    } else {
      activeButtons.push(
        <button
          key="awaiting-production-clearance"
          type="button"
          disabled
          className={`${baseBtnClass} ${styles.dark}`}
        >
          {!isChargesAccepted ? "Awaiting Quote Acceptance" : "Awaiting Deposit Payment"}
        </button>
      );
    }
  }

  // ── PHASE 3: LIVE ACTIVE PRODUCTION RUNS ──
  if (normalizedStatus === "in_production") {
    activeButtons.push(
      <button
        key="production-done"
        type="button"
        disabled={isPending}
        className={`${baseBtnClass} ${styles.warning}`}
        onClick={() =>
          updateStatus({
            inquiryId: inquiry.id,
            status: isPickupTrack ? "ready_for_pickup" : "ready_for_shipment"
          })
        }
      >
        {isPending ? "Completing Run..." : "Production Done"}
      </button>
    );
  }

  // ── PHASE 4: DISPATCH OR LOGISTICS SHIPMENT GATES ──
  if (normalizedStatus === "ready_for_shipment" && !isPickupTrack) {
    if (isFullyPaid) {
      activeButtons.push(
        <button
          key="mark-in-transit"
          type="button"
          disabled={isPending}
          className={`${baseBtnClass} ${styles.primary}`}
          onClick={() => updateStatus({ inquiryId: inquiry.id, status: "in_transit" })}
        >
          {isPending ? "Routing..." : "Mark In Transit"}
        </button>
      );
    } else {
      activeButtons.push(
        <button
          key="awaiting-ship-balance"
          type="button"
          disabled
          className={`${baseBtnClass} ${styles.dark}`}
        >
          Collect Full Payment To Ship
        </button>
      );
    }
  }

  // ── PHASE 5: ARCHIVAL COMPLETION LOGISTICS CLOSURES ──
  const isStagedForCompletion = 
    normalizedStatus === "ready_for_pickup" || 
    normalizedStatus === "in_transit" || 
    normalizedStatus === "shipped" ||
    (normalizedStatus === "ready_for_shipment" && isPickupTrack);

  if (isStagedForCompletion) {
    if (isFullyPaid) {
      activeButtons.push(
        <button
          key="mark-complete"
          type="button"
          disabled={isPending}
          className={`${baseBtnClass} ${styles.success}`}
          onClick={() => updateStatus({ inquiryId: inquiry.id, status: "completed" })}
        >
          {isPending ? "Archiving..." : "Mark Complete"}
        </button>
      );
    } else {
      activeButtons.push(
        <button
          key="awaiting-final-settlement"
          type="button"
          disabled
          className={`${baseBtnClass} ${styles.dark}`}
        >
          Awaiting Full Payment
        </button>
      );
    }
  }

  if (activeButtons.length === 0) return null;

  return (
    <div className={`grid gap-2 w-full pt-1 shrink-0 ${activeButtons.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
      {activeButtons}
    </div>
  );
};