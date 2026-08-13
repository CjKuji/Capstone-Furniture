"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { X, Loader2, Tag, Info, Lock } from "lucide-react";
import { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useAdminInquiryCharges } from "@/hooks/useAdminInquiryCharges";

interface InquiryChargesModalProps {
  open: boolean;
  onClose: () => void;
  inquiryId: string;
  supabaseClient?: SupabaseClient;
  currentAdminId?: string;
  adminId?: string;
  inquiryStatus?: string; // Clarified name
  chargeStatus?: string;  // Added distinct column prop
  readOnly?: boolean;
}

type ChargeRow = {
  id?: string;
  type: "add_charge" | "deduct_charge";
  label: string;
  amount: number | "";
  is_additive: boolean;
};

export default function InquiryChargesModal({
  open,
  onClose,
  inquiryId,
  supabaseClient,
  currentAdminId,
  adminId,
  inquiryStatus = "none",
  chargeStatus = "none",
  readOnly = false,
}: InquiryChargesModalProps) {
  const activeAdminId = adminId || currentAdminId || "";
  const activeSupabase = supabaseClient || supabase;

  // Hook pipeline integration
  const {
    charges: existingCharges = [],
    isLoading,
    createCharge,
    updateCharge,
    deleteCharge,
  } = useAdminInquiryCharges({ supabase: activeSupabase, inquiryId });

  const [draftCharges, setDraftCharges] = useState<ChargeRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const initializedRef = useRef(false);

  // FIXED: Separated workflow stage check from customer selection column check
  const isReadOnly = useMemo(() => {
    if (readOnly) return true;
    
    const normalizedWorkflow = inquiryStatus?.toLowerCase().trim() || "";
    const normalizedCharge = chargeStatus?.toLowerCase().trim() || "";

    // If the customer already accepted the quote breakdown, freeze edits
    if (normalizedCharge === "accepted") return true;
    
    // Edits are only permitted during early negotiation states
    const allowedEditableStatuses = ["under_review", "pending", "rejected", "none", "requested"];
    return !allowedEditableStatuses.includes(normalizedWorkflow);
  }, [inquiryStatus, chargeStatus, readOnly]);

  const isBusy = isLoading || isSaving || isReadOnly;

  /* ── RESET INITIALIZATION REF WHEN MODAL CLOSES OR ID CHANGES ── */
  useEffect(() => {
    if (!open) {
      initializedRef.current = false;
    }
  }, [open, inquiryId]);

  /* ── SYNC SERVER → LOCAL STATE ── */
  useEffect(() => {
    if (!open || isLoading) return;
    if (initializedRef.current) return;

    if (existingCharges) {
      setDraftCharges(
        existingCharges.map((c: any) => ({
          id: c.id,
          type: c.type ?? "add_charge",
          label: c.label ?? "",
          amount: Number(c.amount ?? 0),
          is_additive: c.is_additive ?? true,
        }))
      );
      initializedRef.current = true;
    }
  }, [open, existingCharges, isLoading]);

  /* ── ESCAPE CLOSURES ── */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  /* ── DYNAMIC RUNTIME TOTALS MULTIPLEXER ── */
  const computedSummary = useMemo(() => {
    return draftCharges.reduce(
      (acc, c) => {
        const amt = Number(c.amount);
        if (!Number.isFinite(amt)) return acc;

        if (c.is_additive) {
          acc.additions += amt;
        } else {
          acc.deductions += amt;
        }
        acc.balance = acc.additions - acc.deductions;
        return acc;
      },
      { additions: 0, deductions: 0, balance: 0 }
    );
  }, [draftCharges]);

  /* ── CLIENT-SIDE STRUCTURAL MUTATORS ── */
  const handleAddChargeLine = () => {
    if (isBusy) return;
    setDraftCharges((prev) => [
      ...prev,
      { type: "add_charge", label: "", amount: "", is_additive: true },
    ]);
  };

  const updateLocalCharge = (index: number, field: keyof ChargeRow, value: any) => {
    if (isReadOnly) return;
    setDraftCharges((prev) =>
      prev.map((c, i) => {
        if (i !== index) return c;
        if (field === "is_additive") {
          return {
            ...c,
            is_additive: value,
            type: value ? "add_charge" : "deduct_charge",
          };
        }
        return { ...c, [field]: value };
      })
    );
  };

  const handleDeleteLocal = (index: number) => {
    if (isBusy) return;
    setDraftCharges((prev) => prev.filter((_, i) => i !== index));
  };

  /* ── ATOMIC BATCH PERSISTENCE LAYER ── */
  const handleFinalizeCharges = async () => {
    if (isBusy) return;
    setFormError(null);
    setIsSaving(true);

    try {
      for (const c of draftCharges) {
        if (!c.label.trim()) throw new Error("All adjustment rows require a description.");
        const parsedAmt = Number(c.amount);
        if (isNaN(parsedAmt) || parsedAmt <= 0) throw new Error("Amounts must be greater than 0.");
      }

      const activeServerRecords = existingCharges ?? [];
      const incomingDraftIds = new Set(draftCharges.map((c) => c.id).filter(Boolean));
      const targetDeletions = activeServerRecords.filter((c: any) => !incomingDraftIds.has(c.id));

      for (const item of targetDeletions) await deleteCharge(item.id);

      for (const c of draftCharges) {
        const targetAmount = Number(c.amount) || 0;
        if (!c.id) {
          await createCharge({
            type: c.type,
            label: c.label.trim(),
            amount: targetAmount,
            isAdditive: c.is_additive,
            createdBy: activeAdminId,
          });
        } else {
          await updateCharge({
            chargeId: c.id,
            label: c.label.trim(),
            amount: targetAmount,
            type: c.type,
            isAdditive: c.is_additive,
          });
        }
      }
      onClose();
    } catch (err: any) {
      setFormError(err?.message || "Error updating ledger.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#140F0A] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
          <h2 className="text-sm font-black text-white uppercase flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#D4A97A]" /> Operational Ledger
          </h2>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* LOCKED BANNER */}
        {isReadOnly && (
          <div className="mx-6 mt-4 p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl flex items-center gap-2.5 text-emerald-400 text-xs">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>This ledger is locked because adjustments can only be modified during custom planning phases.</span>
          </div>
        )}

        {/* SUMMARY STRIP */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-3 gap-2 bg-black/40 border border-white/5 p-3 rounded-xl font-mono text-center">
            <div>
              <span className="text-[8px] text-white/30 uppercase block">Total Fees</span>
              <p className="text-xs font-bold text-amber-400 mt-0.5">+ ₱{computedSummary.additions.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="border-l border-white/5">
              <span className="text-[8px] text-white/30 uppercase block">Total Discounts</span>
              <p className="text-xs font-bold text-emerald-400 mt-0.5">- ₱{computedSummary.deductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="border-l border-white/5">
              <span className="text-[8px] text-white/30 uppercase block">Net Balance</span>
              <p className={`text-xs font-bold mt-0.5 ${computedSummary.balance >= 0 ? "text-white" : "text-emerald-400"}`}>
                {computedSummary.balance >= 0 ? "+" : ""} ₱{computedSummary.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* LIST AREA */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
          {formError && (
            <p className="text-xs text-red-400 bg-red-950/20 p-2.5 rounded-xl flex items-center gap-2">
              <Info className="w-3.5 h-3.5" /> {formError}
            </p>
          )}
          
          {isLoading ? (
            <div className="py-12 text-center text-xs text-white/30">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" /> Syncing...
            </div>
          ) : draftCharges.length === 0 ? (
            <div className="py-12 text-center text-xs text-white/20">
              No adjustments applied to this ledger item.
            </div>
          ) : (
            draftCharges.map((c, i) => (
              <div key={i} className="p-3 bg-black/20 border border-white/5 rounded-xl space-y-2">
                <input 
                  type="text" 
                  value={c.label} 
                  disabled={isReadOnly}
                  onChange={(e) => updateLocalCharge(i, "label", e.target.value)} 
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white disabled:opacity-40 disabled:cursor-not-allowed" 
                  placeholder="Line description"
                />
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    value={c.amount} 
                    disabled={isReadOnly}
                    onChange={(e) => updateLocalCharge(i, "amount", e.target.value)} 
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white disabled:opacity-40 disabled:cursor-not-allowed" 
                    placeholder="0.00"
                  />
                  <select 
                    value={c.is_additive ? "add" : "deduct"} 
                    disabled={isReadOnly}
                    onChange={(e) => updateLocalCharge(i, "is_additive", e.target.value === "add")} 
                    className="bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-[11px] text-white/70 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <option value="add">+ Add</option>
                    <option value="deduct">− Deduct</option>
                  </select>
                  
                  {!isReadOnly && (
                    <button 
                      type="button"
                      onClick={() => handleDeleteLocal(i)} 
                      className="px-3 rounded-lg border border-red-500/10 text-[10px] text-red-400 hover:bg-red-500/5 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* FOOTER CONTROLLER LAYER */}
        <div className="border-t border-white/5 bg-black/40 px-6 py-4">
          {isReadOnly ? (
            <button 
              type="button"
              onClick={onClose}
              className="h-10 w-full rounded-xl border border-white/10 text-[10px] font-black uppercase text-white/60 hover:bg-white/5 transition-colors tracking-wider"
            >
              Close Ledger
            </button>
          ) : (
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={handleAddChargeLine} 
                disabled={isBusy}
                className="h-10 flex-1 rounded-xl border border-white/10 text-[10px] font-black uppercase text-white/50 hover:bg-white/5 disabled:opacity-50 transition-colors"
              >
                + Add Adjustment
              </button>
              <button 
                type="button"
                onClick={handleFinalizeCharges} 
                disabled={isBusy} 
                className="h-10 flex-[2] rounded-xl bg-[#D4A97A] text-[10px] font-black uppercase text-black hover:bg-[#c49869] disabled:opacity-50 transition-colors"
              >
                {isSaving ? "Processing..." : "Finalize Pricing"}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}