"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useOrderCharges } from "@/hooks/useOrderCharges";

type Props = {
  open: boolean;
  onClose: () => void;
  orderId: string;
  adminId: string;
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

  const initializedRef = useRef(false);

  /**
   * =========================================================
   * STATUS NORMALIZATION (FIXED + "none" SUPPORT)
   * =========================================================
   */
  const normalizedStatus = (chargeStatus ?? "")
    .toLowerCase()
    .trim() || "none"; // 🔥 FIX: explicit NONE state

  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";

  const isAccepted = normalizedStatus === "accepted";

  /**
   * =========================================================
   * EDITABILITY RULE (FIXED)
   * =========================================================
   * Editable if:
   * - edit mode
   * - NOT accepted
   * - status is pending / rejected / draft / none
   */
  const isEditable =
    isEditMode &&
    !isAccepted &&
    ["pending", "rejected", "draft", "none", ""].includes(normalizedStatus);

  const isBusy =
    isAdding ||
    isUpdating ||
    isDeleting ||
    isSaving ||
    isLoading ||
    isFinalizing;

  /**
   * =========================================================
   * SYNC SERVER → LOCAL
   * =========================================================
   */
  useEffect(() => {
    if (!open) {
      initializedRef.current = false;
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

  /**
   * =========================================================
   * TOTALS
   * =========================================================
   */
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

  const finalTotal = useMemo(() => {
    return Math.max(baseTotal + adjustments, 0);
  }, [baseTotal, adjustments]);

  /**
   * =========================================================
   * LOCAL EDITS
   * =========================================================
   */
  const handleAdd = () => {
    if (!isEditable || isBusy) return;

    setDraftCharges((prev) => [
      ...prev,
      { type: "fee", label: "", amount: "", is_additive: true },
    ]);
  };

  const updateLocalCharge = (
    index: number,
    field: keyof ChargeRow,
    value: any
  ) => {
    if (!isEditable) return;

    setDraftCharges((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  };

  const handleDeleteLocal = (index: number) => {
    if (!isEditable) return;

    setDraftCharges((prev) => prev.filter((_, i) => i !== index));
  };

  /**
   * =========================================================
   * FINALIZE FLOW
   * =========================================================
   */
  const handleFinalize = async () => {
    if (!isEditable || isBusy) return;

    setIsSaving(true);

    try {
      const existing = charges ?? [];

      const draftIds = new Set(
        draftCharges.map((c) => c.id).filter(Boolean)
      );

      await Promise.all(
        existing
          .filter((c: any) => !draftIds.has(c.id))
          .map((c: any) => removeCharge(c.id))
      );

      await Promise.all(
        draftCharges.map((c) => {
          const amount = Number(c.amount) || 0;

          if (!c.id) {
            return createCharge({
              orderId,
              adminId,
              type: c.type,
              label: c.label || "Charge",
              amount,
              isAdditive: c.is_additive,
            });
          }

          return editCharge({
            chargeId: c.id,
            adminId,
            label: c.label,
            amount,
            isAdditive: c.is_additive,
          });
        })
      );

      await finalizeCharges({
        orderId,
        adminId,
      });

      onClose();
    } catch (err) {
      console.error("Finalize failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* HEADER */}
        <div className="p-5 border-b flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-lg font-semibold">
              {isViewMode ? "Charges Breakdown" : "Finalize Price"}
            </h2>
            <p className="text-xs text-gray-500">
              {isViewMode ? "Read-only view" : "Edit and finalize charges"}
            </p>
          </div>

          <button onClick={onClose} className="text-gray-500 text-lg">
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 space-y-6">

          {/* SUMMARY */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="border rounded-xl p-4 bg-gray-50">
              <p className="text-xs text-gray-500">Subtotal</p>
              <p className="font-semibold">₱{baseTotal.toLocaleString()}</p>
            </div>

            <div className="border rounded-xl p-4 bg-blue-50">
              <p className="text-xs text-gray-500">Adjustments</p>
              <p className="font-semibold">₱{adjustments.toLocaleString()}</p>
            </div>

            <div className="border rounded-xl p-4 bg-black text-white">
              <p className="text-xs opacity-70">Final</p>
              <p className="font-bold text-lg">
                ₱{finalTotal.toLocaleString()}
              </p>
            </div>
          </div>

          {/* CHARGES */}
          <div className="space-y-3">
            {draftCharges.map((c, i) => (
              <div key={i} className="border rounded-xl p-4 space-y-3">

                {isEditable ? (
                  <>
                    <input
                      value={c.label}
                      onChange={(e) =>
                        updateLocalCharge(i, "label", e.target.value)
                      }
                      className="w-full border px-3 py-2 rounded-lg text-sm"
                    />

                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={c.amount}
                        onChange={(e) =>
                          updateLocalCharge(
                            i,
                            "amount",
                            e.target.value === "" ? "" : Number(e.target.value)
                          )
                        }
                        className="flex-1 border px-3 py-2 rounded-lg text-sm"
                      />

                      <select
                        value={c.is_additive ? "add" : "deduct"}
                        onChange={(e) =>
                          updateLocalCharge(
                            i,
                            "is_additive",
                            e.target.value === "add"
                          )
                        }
                        className="border px-3 py-2 rounded-lg text-sm"
                      >
                        <option value="add">Add</option>
                        <option value="deduct">Deduct</option>
                      </select>

                      <button
                        onClick={() => handleDeleteLocal(i)}
                        className="text-red-600 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-sm">
                    <span>{c.label || "Charge"}</span>
                    <span>
                      {c.is_additive ? "+" : "-"}₱
                      {Number(c.amount || 0).toLocaleString()}
                    </span>
                  </div>
                )}

              </div>
            ))}
          </div>

          {/* ACTIONS */}
          {isEditable && (
            <div className="flex justify-between items-center pt-2">
              <button onClick={handleAdd} className="text-sm text-gray-600">
                + Add Charge
              </button>

              <button
                onClick={handleFinalize}
                disabled={isBusy}
                className="bg-black text-white px-6 py-2 rounded-xl text-sm disabled:opacity-50"
              >
                {isSaving ? "Finalizing..." : "Finalize Price"}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}