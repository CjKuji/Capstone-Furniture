"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useUserInquiryCharges } from "@/hooks/useUserInquiryCharges"; 
import { useQuery } from "@tanstack/react-query";
import { SupabaseClient } from "@supabase/supabase-js";
// Import your pre-configured browser client utility here
import { supabase as defaultSupabase } from "@/lib/supabase"; 

interface UserInquiryChargesModalProps {
  isOpen: boolean;
  onClose: () => void;
  supabase?: SupabaseClient; // Made optional to prevent parent-side crash errors
  inquiryId: string;
  userId?: string; 
}

export const UserInquiryChargesModal: React.FC<UserInquiryChargesModalProps> = ({
  isOpen,
  onClose,
  supabase: passedSupabase,
  inquiryId,
  userId,
}) => {
  // Fallback gracefully to the application default browser client if not explicitly passed
  const clientInstance = passedSupabase || defaultSupabase;

  // 1. Core data hook for managing charges line items and mutations
  const {
    charges,
    isLoading: isLoadingCharges,
    error: hookError,
    acceptCharges,
    rejectCharges,
    isFinalizing,
    finalizeError,
  } = useUserInquiryCharges({ supabase: clientInstance, inquiryId, userId, enabled: isOpen });

  // 2. Fetch the parent inquiry safely using the verified schema column configuration
  const { data: inquiry, isLoading: isLoadingInquiry } = useQuery({
    queryKey: ["inquiries", inquiryId],
    queryFn: async () => {
      const { data, error } = await clientInstance
        .from("inquiries")
        .select("charge_status") 
        .eq("id", inquiryId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!inquiryId && isOpen,
  });

  const [localError, setLocalError] = useState<string | null>(null);
  const [confirmReject, setConfirmReject] = useState(false);

  // Combine loading states safely
  const isLoading = isLoadingCharges || isLoadingInquiry;

  // Combine error streams safely
  const activeError = useMemo(() => {
    if (localError) return localError;
    if (hookError) return hookError instanceof Error ? hookError.message : String(hookError);
    if (finalizeError) return finalizeError instanceof Error ? finalizeError.message : String(finalizeError);
    return null;
  }, [localError, hookError, finalizeError]);

  /* ── ESCAPE CLOSE KEYBOARD WATCHER ── */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (confirmReject) { setConfirmReject(false); return; }
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose, confirmReject]);

  /* ── SCROLL LOCK MATRIX ── */
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  /* ── MEMOIZED RUNNING FINANCIAL CALCULATIONS ── */
  const chargesTotal = useMemo(() => {
    return (charges ?? []).reduce((sum, charge) => {
      const amount = Number(charge.amount ?? 0);
      return charge.is_additive ? sum + amount : sum - amount;
    }, 0);
  }, [charges]);

  const hasCharges = (charges ?? []).length > 0;

  /* ── WORKFLOW STATUS MATCHING ENGINE ── */
  const { isAccepted, isRejected, showActions } = useMemo(() => {
    const globalChargeStatus = inquiry?.charge_status;

    const matchAccepted = globalChargeStatus === "accepted";
    const matchRejected = globalChargeStatus === "rejected";
    
    return {
      isAccepted: matchAccepted,
      isRejected: matchRejected,
      // Buttons only show up if there are active charges and the status isn't finalized yet
      showActions: hasCharges && !matchAccepted && !matchRejected
    };
  }, [inquiry, hasCharges]);

  /* ── COMPONENT TRANSACTION MUTATORS ── */
  const handleAction = async (action: "accept" | "reject") => {
    try {
      setLocalError(null);
      if (action === "accept") {
        await acceptCharges();
      } else {
        await rejectCharges();
        setConfirmReject(false);
      }
      onClose(); 
    } catch (err: any) {
      console.error(`Failed to execute pipeline ${action} parameters:`, err);
      setLocalError(err?.message || `Failed to complete request action: ${action}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="
          relative w-full sm:max-w-xl
          flex flex-col
          max-h-[92vh] sm:max-h-[85vh]
          rounded-t-3xl sm:rounded-2xl overflow-hidden
          border-t border-x sm:border border-[#2A1F14]
          bg-[#0E0A06]
          shadow-[0_-8px_60px_rgba(0,0,0,0.8)] sm:shadow-[0_8px_60px_rgba(0,0,0,0.8)]
        "
      >
        {/* TOP THEMATIC BRAND ACCENT LINE */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#D4A97A]/60 to-transparent flex-shrink-0" />

        {/* MOBILE DRAG HANDLE */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
          <div className="h-1 w-10 rounded-full bg-white/15" />
        </div>

        {/* ── HEADER BLOCK ── */}
        <div className="flex-shrink-0 flex items-start justify-between gap-4 px-5 pt-4 sm:pt-5 pb-4 border-b border-[#2A1F14]">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#7A5C3A]">
              Additional Pricing
            </p>
            <h2 className="mt-0.5 text-[17px] font-bold text-white leading-tight">
              Review Inquiry Charges
            </h2>
            <p className="mt-1 text-[11px] text-white/35 font-mono">
              Inquiry Ref: #{inquiryId.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isFinalizing}
            className="
              flex-shrink-0 flex h-8 w-8 items-center justify-center
              rounded-full border border-[#2A1F14] bg-white/[0.03]
              text-white/40 hover:text-white/70 hover:bg-white/[0.07]
              transition-all text-sm disabled:opacity-40
            "
          >
            ✕
          </button>
        </div>

        {/* ── STATS SUMMARY LAYER ── */}
        <div className="flex-shrink-0 mx-5 mt-4">
          <div className="grid grid-cols-2 divide-x divide-[#2A1F14] rounded-xl border border-[#2A1F14] bg-[#0B0704] overflow-hidden">
            <div className="flex flex-col items-center justify-center py-2.5 px-1">
              <p className="text-[8px] font-black uppercase tracking-[0.18em] text-white/20 mb-0.5">Adjustments Amount</p>
              <p className={`text-[12px] font-bold tabular-nums ${chargesTotal >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {chargesTotal >= 0 ? "+" : ""}₱{chargesTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="flex flex-col items-center justify-center py-2.5 px-1">
              <p className="text-[8px] font-black uppercase tracking-[0.18em] text-white/20 mb-0.5">
                {isAccepted ? "Final Added Total" : "Calculated Adjustments"}
              </p>
              <p className="text-[12px] font-bold tabular-nums text-[#E8C98A]">
                ₱{Math.max(0, chargesTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* ── SCROLLABLE WINDOW CORE ── */}
        <div className="flex-1 overflow-y-auto px-5 pt-4 pb-2 space-y-3 min-h-0">

          {/* DYNAMIC BACKEND/HOOK ERROR MONITOR */}
          {activeError && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.07] px-4 py-3 text-[11px] text-rose-400">
              {activeError}
            </div>
          )}

          {/* SYSTEM REAL-TIME STATUS BANNERS */}
          {isAccepted && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-400">Charges Confirmed</p>
              <p className="mt-0.5 text-[10px] text-white/40">These structural line item valuations are locked down into your active configuration summary.</p>
            </div>
          )}

          {isRejected && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.06] px-4 py-3">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-rose-400">Charges Rejected</p>
              <p className="mt-0.5 text-[10px] text-white/40">Our studio team has been flagged. Use the parameter coordination chat screen to process balance corrections.</p>
            </div>
          )}

          {/* WORKSHOP ITEMIZED METRIC ENTRIES BREAKDOWN */}
          <div className="rounded-xl border border-[#2A1F14] bg-[#0B0704] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A1F14]">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/25">Charges Breakdown</p>
              <span className="text-[9px] font-black text-[#7A5C3A]">
                {isLoading ? "..." : `${charges?.length ?? 0} line item${charges?.length !== 1 ? "s" : ""}`}
              </span>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-2">
                <div className="w-4 h-4 rounded-full border-2 border-[#D4A97A] border-t-transparent animate-spin" />
                <p className="text-[10px] text-white/35 font-medium tracking-wide">Syncing workshop item ledger...</p>
              </div>
            ) : !hasCharges ? (
              <div className="flex flex-col items-center justify-center py-8">
                <p className="text-[11px] font-bold text-white/25 uppercase tracking-[0.15em]">No Charges Assigned</p>
                <p className="mt-1 text-[10px] text-white/20">This configuration currently contains no custom line items.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#1A1106]">
                {(charges ?? []).map((charge) => {
                  const amount = Number(charge.amount ?? 0);
                  const isAdditive = charge.is_additive;
                  return (
                    <div key={charge.id} className="flex items-start justify-between gap-4 px-4 py-3 bg-transparent">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex px-1.5 py-0.5 rounded text-[8px] font-black bg-white/[0.04] text-white/50 border border-white/5 uppercase tracking-wider">
                            {charge.type || "Adjustment"}
                          </span>
                          <p className="text-[12px] font-semibold text-white/80 truncate">
                            {charge.label || "Custom Modification"}
                          </p>
                        </div>
                        {charge.description && (
                          <p className="mt-1 text-[10px] text-white/35 leading-relaxed">{charge.description}</p>
                        )}
                      </div>
                      <span className={`
                        flex-shrink-0 rounded-lg px-2.5 py-1
                        text-[11px] font-mono font-black border
                        ${isAdditive
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/20"}
                      `}>
                        {isAdditive ? "+" : "−"}₱{amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {!hasCharges && !isLoading && (
            <div className="rounded-xl border border-[#2A1F14] bg-[#0B0704] px-4 py-3">
              <p className="text-[11px] text-white/35 italic">No interactive verification is requested at this parameter threshold.</p>
            </div>
          )}
        </div>

        {/* ── FOOTER INTERACTION LAYER ── */}
        <div className="flex-shrink-0 border-t border-[#2A1F14] bg-[#0B0704] px-5 py-4">
          {showActions && !isLoading ? (
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmReject(true)}
                disabled={isFinalizing}
                className="
                  h-10 flex-1 rounded-xl
                  border border-rose-500/25 bg-rose-500/[0.06]
                  text-[10px] font-black uppercase tracking-[0.1em] text-rose-400/80
                  hover:bg-rose-500/[0.12] hover:text-rose-400
                  disabled:opacity-40
                  transition-all
                "
              >
                Reject
              </button>
              <button
                onClick={() => handleAction("accept")}
                disabled={isFinalizing}
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
                {isFinalizing ? "Processing Alignment..." : "Accept Charges"}
              </button>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="
                h-10 w-full rounded-xl
                border border-[#2A1F14] bg-white/[0.03]
                text-[10px] font-black uppercase tracking-[0.12em] text-white/60
                hover:bg-white/[0.06] hover:text-white/80
                transition-all
              "
            >
              Close Window
            </button>
          )}
        </div>

        {/* ── ESCALATED MODAL DESTRUCTIVE CONFIRMATION SCREEN ── */}
        {confirmReject && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-5 animate-fade-in">
            <div className="
              w-full max-w-sm rounded-2xl overflow-hidden
              border border-[#2A1F14] bg-[#0E0A06]
              shadow-[0_8px_40px_rgba(0,0,0,0.8)]
            ">
              <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-rose-500/50 to-transparent" />
              <div className="p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-rose-500/20 bg-rose-500/[0.08] text-rose-400 text-sm font-black">
                  !
                </div>
                <h3 className="mt-4 text-[15px] font-bold text-white">Decline Workspace Valuation?</h3>
                <p className="mt-2 text-[11px] text-white/40 leading-relaxed">
                  The configuration appraiser will be automatically notified to reorganize line entry structures inside your chat terminal logs.
                </p>
              </div>
              <div className="flex gap-2 px-5 pb-5">
                <button
                  onClick={() => setConfirmReject(false)}
                  className="
                    h-10 flex-1 rounded-xl
                    border border-[#2A1F14] bg-white/[0.03]
                    text-[10px] font-black uppercase tracking-[0.1em] text-white/50
                    hover:bg-white/[0.06] hover:text-white/70
                    transition-all
                  "
                >
                  Back
                </button>
                <button
                  onClick={() => handleAction("reject")}
                  disabled={isFinalizing}
                  className="
                    h-10 flex-[2] rounded-xl
                    border border-rose-500/25 bg-rose-500/[0.08]
                    text-[10px] font-black uppercase tracking-[0.1em] text-rose-400
                    hover:bg-rose-500/[0.15] hover:text-rose-300
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all
                  "
                >
                  {isFinalizing ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};