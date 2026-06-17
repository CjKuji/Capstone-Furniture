"use client";

import React from "react";
import { SupabaseClient } from "@supabase/supabase-js";
import { useUpdateInquiryStatus } from "@/hooks/useAdminInquiry"; 
import { CustomInquiryStatus } from "@/types/inquiry";

interface InquiryActionButtonsProps {
  inquiry: {
    id: string;
    status: CustomInquiryStatus;
    charge_status?: "pending" | "accepted" | "rejected" | string | null;
    delivery_method?: "pickup" | "delivery" | null;
    payment_status?: "unpaid" | "partially_paid" | "fully_paid" | string | null;
  };
  supabaseClient: SupabaseClient; 
  currentAdminId?: string;       
}

/* =========================================================
    DESIGN SYSTEM BUTTON PRIMITIVES (MATCHES ORDERS UI/UX)
========================================================= */
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

  const { id: inquiryId, status, charge_status, delivery_method, payment_status } = inquiry;

  const handleTransition = async (targetStatus: CustomInquiryStatus) => {
    try {
      console.log(`Action initiated by admin session: "${currentAdminId}" using client instance: ${!!supabaseClient}`);
      await updateStatus({ inquiryId, status: targetStatus });
    } catch (error) {
      console.error(`Failed executing transition step to ${targetStatus}:`, error);
    }
  };

  // Guardrail Logic Variables
  const isChargesAccepted = charge_status === "accepted";
  const isPaymentReceived = payment_status === "partially_paid" || payment_status === "fully_paid";
  
  // Rule: Start production only if charges are accepted AND deposit/full payment is received
  const isClearedForProduction = isChargesAccepted && isPaymentReceived;
  
  // Rule: Balance must be 100% settled for logistics clearance or closing
  const isClearedForLogisticsAndCompletion = payment_status === "fully_paid";

  // Build an active stack array to cleanly compute layout spacing dynamically like Orders Bar
  const activeButtons: React.ReactNode[] = [];

  // 1. ACCEPT INQUIRY -> MOVE TO UNDER REVIEW
  if (status === "requested") {
    activeButtons.push(
      <button
        key="accept-inquiry"
        type="button"
        disabled={isPending}
        className={`${baseBtnClass} ${styles.primary}`}
        onClick={() => handleTransition("under_review")}
      >
        {isPending ? "Accepting Configuration..." : "Accept Inquiry"}
      </button>
    );
  }

  // 2. START PRODUCTION
  if (status === "under_review") {
    if (isClearedForProduction) {
      activeButtons.push(
        <button
          key="start-production"
          type="button"
          disabled={isPending}
          className={`${baseBtnClass} ${styles.success}`}
          onClick={() => handleTransition("in_production")}
        >
          {isPending ? "Deploying Blueprint..." : "Start Production"}
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

  // 3. MARK PRODUCTION COMPLETE -> ROUTE TO READY STATE
  if (status === "in_production") {
    activeButtons.push(
      <button
        key="production-done"
        type="button"
        disabled={isPending}
        className={`${baseBtnClass} ${styles.warning}`}
        onClick={() =>
          handleTransition(
            delivery_method === "pickup" ? "ready_for_pickup" : "ready_for_shipment"
          )
        }
      >
        {isPending ? "Completing Run..." : "Production Done"}
      </button>
    );
  }

  // 4. SHIP LINE (Only for delivery items)
  if (status === "ready_for_shipment" && delivery_method !== "pickup") {
    if (isClearedForLogisticsAndCompletion) {
      activeButtons.push(
        <button
          key="mark-in-transit"
          type="button"
          disabled={isPending}
          className={`${baseBtnClass} ${styles.primary}`}
          onClick={() => handleTransition("in_transit")}
        >
          {isPending ? "Routing Dispatch..." : "Mark In Transit"}
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
          Collect Balance To Ship
        </button>
      );
    }
  }

  // 5. ARCHIVE / COMPLETE RECORD (Handles delivery in-transit or direct pickup bypass)
  const isEligibleForCompletion = 
    (status === "ready_for_shipment" && delivery_method === "pickup") || 
    status === "ready_for_pickup" || 
    status === "in_transit";

  if (isEligibleForCompletion) {
    if (isClearedForLogisticsAndCompletion) {
      activeButtons.push(
        <button
          key="mark-complete"
          type="button"
          disabled={isPending}
          className={`${baseBtnClass} ${styles.success}`}
          onClick={() => handleTransition("completed")}
        >
          {isPending ? "Archiving Record..." : "Mark Complete"}
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
          Awaiting Final Settlement
        </button>
      );
    }
  }

  if (activeButtons.length === 0) return null;

  return (
    <div
      className={`grid gap-2 w-full pt-1 shrink-0 ${
        activeButtons.length === 1 ? "grid-cols-1" : "grid-cols-2"
      }`}
    >
      {activeButtons}
    </div>
  );
};