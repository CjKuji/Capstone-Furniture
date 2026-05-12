"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * TYPES
 */

type SelectedItem = {
  furniture_id: string;
  variant_id: string | null;
  quantity: number;
  label: string;
  unit_price: number;
};

type RequestData = {
  description: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  items?: SelectedItem[];
  onSave: (data: RequestData) => void;
  initialValue?: RequestData | null;
};

export default function RequestModal({
  open,
  onClose,
  items = [],
  onSave,
  initialValue = null,
}: Props) {
  /**
   * STATE (local draft)
   */
  const [description, setDescription] = useState("");

  /**
   * FIX:
   * Sync when modal opens or initialValue changes
   * (prevents stale value bug)
   */
  useEffect(() => {
    if (open) {
      setDescription(initialValue?.description ?? "");
    }
  }, [open, initialValue]);

  if (!open) return null;

  const canSave = description.trim().length >= 5;

  function handleClose() {
    onClose();
  }

  function handleSave() {
    if (!canSave) return;

    onSave({
      description: description.trim(),
    });

    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={handleClose}
      />

      {/* MODAL */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl p-6 space-y-5 shadow-xl">

        {/* HEADER */}
        <div>
          <h2 className="text-lg font-semibold">Custom Request</h2>
          <p className="text-sm text-black/60">
            Describe changes like size, material, color, or design.
          </p>
        </div>

        {/* INPUT */}
        <textarea
          className="w-full min-h-[140px] border border-black/20 rounded-lg p-3 text-sm outline-none focus:border-black"
          placeholder="Example: resize table to 6ft, walnut finish, rounded edges..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* ITEMS PREVIEW */}
        {items.length > 0 && (
          <div className="border border-black/10 rounded-lg p-3 space-y-1">
            {items.map((i, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span>{i.label}</span>
                <span>x{i.quantity}</span>
              </div>
            ))}
          </div>
        )}

        {/* TIP */}
        <div className="text-xs text-black/60 border border-black/10 rounded-lg p-3">
          💡 Be specific: dimensions, material, finish, references help accuracy.
        </div>

        {/* ACTIONS */}
        <div className="flex gap-3">

          <button
            onClick={handleClose}
            className="flex-1 border border-black/20 py-2 rounded-lg"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={!canSave}
            className="flex-1 bg-black text-white py-2 rounded-lg disabled:opacity-40"
          >
            Save Request
          </button>

        </div>

      </div>
    </div>,
    document.body
  );
}