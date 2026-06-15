"use client";

import React from "react";
import { SupabaseClient } from "@supabase/supabase-js";
import { useUpdateInquiryStatus } from "@/hooks/useAdminInquiry"; 
import { CustomInquiryStatus } from "@/types/inquiry";

interface InquiryActionButtonsProps {
  inquiry: {
    id: string;
    status: CustomInquiryStatus;
    delivery_method?: "pickup" | "delivery" | null;
    payment_status?: "unpaid" | "partially_paid" | "fully_paid" | string | null;
  };
  supabaseClient: SupabaseClient; 
  currentAdminId?: string;       
}

export const InquiryActionButtons: React.FC<InquiryActionButtonsProps> = ({
  inquiry,
  supabaseClient, 
  currentAdminId = "system-admin",
}) => {
  const { mutateAsync: updateStatus, isPending } = useUpdateInquiryStatus();

  const { id: inquiryId, status, delivery_method, payment_status } = inquiry;

  // Premium uniform button base styles
  const btnBase =
    "w-full h-10 rounded-xl text-white text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center shadow-md active:scale-[0.99] disabled:opacity-40";

  const handleTransition = async (targetStatus: CustomInquiryStatus) => {
    try {
      console.log(`Action initiated by admin session: "${currentAdminId}" using client instance: ${!!supabaseClient}`);
      await updateStatus({ inquiryId, status: targetStatus });
    } catch (error) {
      console.error(`Failed executing transition step to ${targetStatus}:`, error);
    }
  };

  // Guardrail Logic Variables
  const isClearedForProduction = payment_status === "partially_paid" || payment_status === "fully_paid";
  const isClearedForLogisticsAndCompletion = payment_status === "fully_paid";

  return (
    <div className="w-full pt-1 shrink-0">
      {/* 1. ACCEPT INQUIRY */}
      {status === "requested" && (
        <button
          type="button"
          disabled={isPending}
          className={`${btnBase} bg-sky-600 hover:bg-sky-500`}
          onClick={() => handleTransition("under_review")}
        >
          {isPending ? "Accepting Configuration..." : "Accept Inquiry"}
        </button>
      )}

      {/* 2. START PRODUCTION (Requires at least partial payment/deposit) */}
      {status === "under_review" && (
        <>
          {isClearedForProduction ? (
            <button
              type="button"
              disabled={isPending}
              className={`${btnBase} bg-purple-600 hover:bg-purple-500`}
              onClick={() => handleTransition("in_production")}
            >
              {isPending ? "Processing..." : "Start Production"}
            </button>
          ) : (
            <button
              type="button"
              disabled={true}
              className={`${btnBase} bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5 shadow-none`}
            >
              Awaiting Deposit / Payment
            </button>
          )}
        </>
      )}

      {/* 3. MARK PRODUCTION COMPLETE (Always accessible once production finishes) */}
      {status === "in_production" && (
        <button
          type="button"
          disabled={isPending}
          className={`${btnBase} bg-indigo-600 hover:bg-indigo-500`}
          onClick={() =>
            handleTransition(
              delivery_method === "pickup" ? "ready_for_pickup" : "ready_for_shipment"
            )
          }
        >
          {isPending ? "Completing Run..." : "Production Done"}
        </button>
      )}

      {/* 4. IN TRANSIT / SHIPPED (Requires Full Payment clearance) */}
      {status === "ready_for_shipment" && delivery_method === "delivery" && (
        <>
          {isClearedForLogisticsAndCompletion ? (
            <button
              type="button"
              disabled={isPending}
              className={`${btnBase} bg-blue-600 hover:bg-blue-500`}
              onClick={() => handleTransition("in_transit")}
            >
              {isPending ? "Routing Dispatch..." : "Mark In Transit"}
            </button>
          ) : (
            <button
              type="button"
              disabled={true}
              className={`${btnBase} bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5 shadow-none`}
            >
              Collect Remaining Balance to Ship
            </button>
          )}
        </>
      )}

      {/* 5. MARK COMPLETE (Requires Full Payment clearance for both pickup and delivery) */}
      {(status === "in_transit" || status === "ready_for_pickup") && (
        <>
          {isClearedForLogisticsAndCompletion ? (
            <button
              type="button"
              disabled={isPending}
              className={`${btnBase} bg-emerald-600 hover:bg-emerald-500`}
              onClick={() => handleTransition("completed")}
            >
              {isPending ? "Archiving Record..." : "Mark Complete"}
            </button>
          ) : (
            <button
              type="button"
              disabled={true}
              className={`${btnBase} bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5 shadow-none`}
            >
              Awaiting Final Settlement
            </button>
          )}
        </>
      )}
    </div>
  );
};