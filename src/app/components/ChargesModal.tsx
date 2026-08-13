"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Lock, Info, Loader2 } from "lucide-react";
import { useOrderCharges } from "@/hooks/useOrderCharges";

type Props = {
  open: boolean;
  onClose: () => void;
  orderId: string;
  adminId: string;
  orderStatus?: string;
  chargeStatus?: string;
  baseQuoteTotal?: number;
  mode?: "view" | "edit";
};

type ChargeRow = {
  id?: string;
  type: string;
  label: string;
  amount: number | "";
  is_additive: boolean;
};

export default function ChargesModal({
  open,
  onClose,
  orderId,
  adminId,
  orderStatus,
  chargeStatus,
  baseQuoteTotal = 0,
  mode = "edit",
}: Props) {
  const {
    charges = [],
    isLoading,
    createCharge,
    editCharge,
    removeCharge,
    finalizeCharges,
    isAdding,
    isUpdating,
    isDeleting,
    isFinalizing,
  } = useOrderCharges(orderId);

  const [draftCharges, setDraftCharges] = useState<ChargeRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const initializedRef = useRef(false);

  const normalizedOrderStatus = (orderStatus ?? "").toLowerCase().trim();
  const normalizedChargeStatus = (chargeStatus ?? "").toLowerCase().trim() || "none";

  /* ── MATURED EDIT PERMISSION LIFECYCLE MATRIX ── */
  const isEditable = useMemo(() => {
    if (mode !== "edit") return false;
    
    // Condition 1: If order status is NOT accepted (e.g. requested, completed, cancelled, etc.) -> View Only
    if (normalizedOrderStatus !== "accepted") return false;

    // Condition 2: If order status IS accepted AND charge status is accepted -> View Only
    if (normalizedChargeStatus === "accepted") return false;

    // Condition 3: If order status IS accepted AND charge status is none, pending, or rejected -> Full CRUD
    return ["none", "pending", "rejected", "draft", ""].includes(normalizedChargeStatus);
  }, [mode, normalizedOrderStatus, normalizedChargeStatus]);

  const isBusy = isAdding || isUpdating || isDeleting || isSaving || isLoading || isFinalizing;

  useEffect(() => {
    if (!open) { 
      initializedRef.current = false; 
      setFormError(null);
      return; 
    }
    if (!charges || initializedRef.current) return;
    
    setDraftCharges(
      charges.map((c: any) => ({
        id: c.id,
        type: c.type ?? "fee",
        label: c.label ?? "",
        amount: Number(c.amount ?? 0),
        is_additive: c.is_additive ?? true,
      }))
    );
    initializedRef.current = true;
  }, [open, charges]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const baseTotal = useMemo(() => {
    const v = Number(baseQuoteTotal);
    return Number.isFinite(v) ? v : 0;
  }, [baseQuoteTotal]);

  const adjustments = useMemo(() => {
    return draftCharges.reduce((acc, c) => {
      const amt = Number(c.amount);
      if (!Number.isFinite(amt)) return acc;
      return acc + (c.is_additive ? amt : -amt);
    }, 0);
  }, [draftCharges]);

  const finalTotal = useMemo(() => Math.max(baseTotal + adjustments, 0), [baseTotal, adjustments]);

  const handleAdd = () => {
    if (!isEditable || isBusy) return;
    setDraftCharges((prev) => [...prev, { type: "fee", label: "", amount: "", is_additive: true }]);
  };

  const updateLocalCharge = (index: number, field: keyof ChargeRow, value: any) => {
    if (!isEditable) return;
    setDraftCharges((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  const handleDeleteLocal = (index: number) => {
    if (!isEditable || isBusy) return;
    setDraftCharges((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFinalize = async () => {
    if (!isEditable || isBusy) return;
    setFormError(null);
    setIsSaving(true);
    
    try {
      for (const c of draftCharges) {
        if (!c.label.trim()) throw new Error("All adjustment rows require a clear descriptor.");
        const parsedAmt = Number(c.amount);
        if (isNaN(parsedAmt) || parsedAmt <= 0) throw new Error("Adjustment fields require an amount greater than 0.");
      }

      const existing = charges ?? [];
      const draftIds = new Set(draftCharges.map((c) => c.id).filter(Boolean));
      
      await Promise.all(
        existing.filter((c: any) => !draftIds.has(c.id)).map((c: any) => removeCharge(c.id))
      );
      
      await Promise.all(
        draftCharges.map((c) => {
          const amount = Number(c.amount) || 0;
          if (!c.id) return createCharge({ orderId, adminId, type: c.type, label: c.label.trim(), amount, isAdditive: c.is_additive });
          return editCharge({ chargeId: c.id, adminId, label: c.label.trim(), amount, isAdditive: c.is_additive });
        })
      );
      
      await finalizeCharges({ orderId, adminId });
      onClose();
    } catch (err: any) {
      console.error("Finalize failed:", err);
      setFormError(err?.message || "Failed to finalize ledger pricing configuration.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="
          relative w-full sm:max-w-2xl
          flex flex-col
          max-h-[85vh]
          rounded-t-3xl sm:rounded-2xl overflow-hidden
          border-t border-x sm:border border-[#2A1F14]
          bg-[#0E0A06]
          shadow-[0_-8px_60px_rgba(0,0,0,0.8)] sm:shadow-[0_8px_60px_rgba(0,0,0,0.8)]
        "
      >
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#D4A97A]/60 to-transparent flex-shrink-0" />

        <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
          <div className="h-1 w-10 rounded-full bg-white/15" />
        </div>

        <div className="flex-shrink-0 flex items-start justify-between gap-4 px-5 pt-4 sm:pt-5 pb-4 border-b border-[#2A1F14]">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#7A5C3A]">
              {!isEditable ? "View Only" : "Admin · Pricing"}
            </p>
            <h2 className="mt-0.5 text-[17px] font-bold text-white leading-tight">
              {!isEditable ? "Charges Breakdown" : "Finalize Price"}
            </h2>
            <p className="mt-1 text-[11px] text-white/35">
              {!isEditable ? "Read-only view of applied structural adjustments" : "Edit and confirm final pipeline pricing"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="
              flex-shrink-0 flex h-8 w-8 items-center justify-center
              rounded-full border border-[#2A1F14] bg-white/[0.03]
              text-white/40 hover:text-white/70 hover:bg-white/[0.07]
              transition-all text-sm
            "
          >
            ✕
          </button>
        </div>

        {!isEditable && (
          <div className="mx-5 mt-4 p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl flex items-center gap-2.5 text-amber-400 text-xs flex-shrink-0">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>
              {normalizedOrderStatus !== "accepted"
                ? `This adjustment ledger is view-only because the order is currently "${normalizedOrderStatus}" and has not been officially accepted.`
                : `This ledger is locked because the changes have already been approved by the customer.`}
            </span>
          </div>
        )}

        <div className="flex-shrink-0 mx-5 mt-4">
          <div className="grid grid-cols-3 divide-x divide-[#2A1F14] rounded-xl border border-[#2A1F14] bg-[#0B0704] overflow-hidden">
            <FinStat label="Subtotal" value={`₱${baseTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} color="text-white/70" />
            <FinStat
              label="Adjustments"
              value={`${adjustments >= 0 ? "+" : ""}₱${adjustments.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              color={adjustments >= 0 ? "text-emerald-400" : "text-rose-400"}
            />
            <FinStat label="Final Total" value={`₱${finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} color="text-[#E8C98A]" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pt-4 pb-2 space-y-2 min-h-0 custom-scrollbar">
          {formError && (
            <p className="text-xs text-red-400 bg-red-950/20 p-2.5 rounded-xl flex items-center gap-2">
              <Info className="w-3.5 h-3.5 shrink-0" /> {formError}
            </p>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-xs text-white/30 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-[#D4A97A]" />
              <p className="text-[11px] uppercase tracking-widest">Syncing Ledger...</p>
            </div>
          ) : draftCharges.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 rounded-xl border border-dashed border-[#2A1F14]">
              <p className="text-[11px] font-bold text-white/25 uppercase tracking-[0.15em]">No Charges Applied</p>
              {isEditable && (
                <p className="mt-1 text-[10px] text-white/20">Click "+ Add Charge" below to allocate items</p>
              )}
            </div>
          ) : (
            draftCharges.map((c, i) => (
              <div key={i} className="rounded-xl border border-[#2A1F14] bg-[#0B0704] overflow-hidden">
                {isEditable ? (
                  <div className="p-3 space-y-2">
                    <input
                      type="text"
                      value={c.label}
                      onChange={(e) => updateLocalCharge(i, "label", e.target.value)}
                      placeholder="Charge description..."
                      className="
                        w-full rounded-lg border border-[#2A1F14] bg-[#160F08]
                        px-3 py-2 text-[12px] text-white/80 placeholder-white/20
                        focus:outline-none focus:border-[#D4A97A]/40
                        transition-colors
                      "
                    />
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        value={c.amount}
                        onChange={(e) =>
                          updateLocalCharge(i, "amount", e.target.value === "" ? "" : Number(e.target.value))
                        }
                        placeholder="0.00"
                        className="
                          flex-1 min-w-0 rounded-lg border border-[#2A1F14] bg-[#160F08]
                          px-3 py-2 text-[12px] text-white/80 placeholder-white/20
                          focus:outline-none focus:border-[#D4A97A]/40
                          transition-colors
                        "
                      />
                      <select
                        value={c.is_additive ? "add" : "deduct"}
                        onChange={(e) => updateLocalCharge(i, "is_additive", e.target.value === "add")}
                        className="
                          rounded-lg border border-[#2A1F14] bg-[#160F08]
                          px-2.5 py-2 text-[11px] font-bold text-white/70
                          focus:outline-none focus:border-[#D4A97A]/40
                          transition-colors
                        "
                      >
                        <option value="add">+ Add</option>
                        <option value="deduct">− Deduct</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleDeleteLocal(i)}
                        className="
                          flex-shrink-0 px-2.5 py-2 rounded-lg
                          border border-rose-500/20 bg-rose-500/[0.06]
                          text-[10px] font-black text-rose-400/70
                          hover:bg-rose-500/[0.12] hover:text-rose-400
                          transition-all
                        "
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-white/80 truncate">
                        {c.label || "Charge Component"}
                      </p>
                      <p className="text-[10px] text-white/30 capitalize">{c.type}</p>
                    </div>
                    <span className={`
                      flex-shrink-0 rounded-lg px-2.5 py-1
                      text-[11px] font-black
                      ${c.is_additive
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}
                    `}>
                      {c.is_additive ? "+" : "−"}₱{Number(c.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="flex-shrink-0 border-t border-[#2A1F14] bg-[#0B0704] px-5 py-4">
          {isEditable ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAdd}
                disabled={isBusy}
                className="
                  h-10 flex-1 rounded-xl
                  border border-[#2A1F14] bg-white/[0.03]
                  text-[10px] font-black uppercase tracking-[0.12em] text-white/50
                  hover:bg-white/[0.06] hover:text-white/70
                  disabled:opacity-40
                  transition-all
                "
              >
                + Add Charge
              </button>
              <button
                type="button"
                onClick={handleFinalize}
                disabled={isBusy}
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
                {isSaving ? "Finalizing…" : "Finalize Price"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="
                h-10 w-full rounded-xl
                border border-[#2A1F14] bg-white/[0.03]
                text-[10px] font-black uppercase tracking-[0.12em] text-white/60
                hover:bg-white/[0.06] hover:text-white/80
                transition-all
              "
            >
              Close Breakdown
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function FinStat({ label, value, color = "text-white" }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-2.5 px-1">
      <p className="text-[8px] font-black uppercase tracking-[0.18em] text-white/20 mb-0.5">{label}</p>
      <p className={`text-[12px] font-bold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}