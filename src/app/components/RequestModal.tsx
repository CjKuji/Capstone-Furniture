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
  const [description, setDescription] = useState("");

  /**
   * Sync draft when modal opens
   */
  useEffect(() => {
    if (!open) return;
    setDescription(initialValue?.description ?? "");
  }, [open, initialValue]);

  if (!open) return null;

  const canSave = description.trim().length >= 5;

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
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
      />

      {/* MODAL */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-black/10 p-6 space-y-6">

        {/* HEADER */}
        <div>
          <h2 className="text-xl font-semibold text-black">
            Custom Request
          </h2>
          <p className="text-sm text-black mt-1">
            Tell us exactly how you want your furniture modified.
          </p>
        </div>

        {/* TEXTAREA */}
        <div>
          <label className="text-sm font-medium text-black">
            Request Details
          </label>

          <textarea
            className="w-full mt-2 min-h-[140px] border border-black/20 rounded-xl p-3 text-sm text-black focus:outline-none focus:border-black"
            placeholder="Example: resize to 6ft, walnut finish, rounded corners, thicker legs..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* ITEMS PREVIEW */}
        {items.length > 0 && (
          <div className="border border-black/10 rounded-xl p-4 space-y-2">
            <div className="font-semibold text-black text-sm">
              Items in this order
            </div>

            {items.map((i, idx) => (
              <div
                key={idx}
                className="flex justify-between text-sm text-black"
              >
                <span className="truncate pr-4">{i.label}</span>
                <span className="font-medium">x{i.quantity}</span>
              </div>
            ))}
          </div>
        )}

        {/* TIP */}
        <div className="border border-black/10 rounded-xl p-4 text-sm text-black">
          💡 Be specific — size, material, color, inspiration photos, and finish
          help us build exactly what you want.
        </div>

        {/* ACTIONS */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-black text-black font-medium"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={!canSave}
            className="flex-1 py-3 rounded-xl bg-black text-white font-medium disabled:opacity-40"
          >
            Save Request
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}