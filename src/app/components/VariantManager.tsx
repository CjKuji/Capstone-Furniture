"use client";

import { useCallback, useMemo, useState } from "react";
import { createFilePreview } from "@/utils/furnitureUtils";
import type { FurnitureVariantPayload } from "@/types/furniture";

/* =========================================================
   TYPES
========================================================= */

export type VariantDraft = {
  id: string;
  name: string;
  file: File | null;
  preview: string | null;
  priceAdjustment: number;
  isDefault: boolean;
};

type Props = {
  variants: VariantDraft[];
  setVariants: React.Dispatch<React.SetStateAction<VariantDraft[]>>;

  activeVariantId: string | null;
  setActiveVariantId: (id: string | null) => void;

  /** optional callback when applied to 3D preview */
  onApply?: (variant: VariantDraft) => void;
};

/* =========================================================
   COMPONENT
========================================================= */

export default function VariantsManager({
  variants,
  setVariants,
  activeVariantId,
  setActiveVariantId,
  onApply,
}: Props) {
  /* =========================================================
     STATE (EDIT DRAWER)
  ========================================================= */

  const [editingId, setEditingId] = useState<string | null>(null);

  const editingVariant = useMemo(
    () => variants.find((v) => v.id === editingId) || null,
    [variants, editingId]
  );

  /* =========================================================
     ACTIONS
  ========================================================= */

  const addVariant = useCallback(() => {
    setVariants((prev) => {
      const newVariant: VariantDraft = {
        id: crypto.randomUUID(),
        name: "",
        file: null,
        preview: null,
        priceAdjustment: 0,
        isDefault: prev.length === 0,
      };

      return [...prev.map((v) => ({ ...v, isDefault: false })), newVariant];
    });
  }, [setVariants]);

  const updateVariant = useCallback(
    (id: string, field: keyof VariantDraft, value: any) => {
      setVariants((prev) =>
        prev.map((v) => (v.id === id ? { ...v, [field]: value } : v))
      );
    },
    [setVariants]
  );

  const deleteVariant = useCallback(
    (id: string) => {
      setVariants((prev) => {
        const filtered = prev.filter((v) => v.id !== id);

        if (!filtered.some((v) => v.isDefault) && filtered.length) {
          filtered[0].isDefault = true;
        }

        return filtered;
      });
    },
    [setVariants]
  );

  const setDefault = useCallback(
    (id: string) => {
      setVariants((prev) =>
        prev.map((v) => ({
          ...v,
          isDefault: v.id === id,
        }))
      );

      setActiveVariantId(id);
    },
    [setVariants, setActiveVariantId]
  );

  const applyVariant = useCallback(
    (variant: VariantDraft) => {
      setActiveVariantId(variant.id);
      onApply?.(variant);
    },
    [setActiveVariantId, onApply]
  );

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="space-y-3">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-sm">Variants</h3>

        <button
          onClick={addVariant}
          className="text-xs px-3 py-1 border rounded-md hover:bg-neutral-100"
        >
          + Add
        </button>
      </div>

      {/* LIST */}
      <div className="space-y-2">

        {variants.map((v) => (
          <div
            key={v.id}
            className={`border rounded-lg p-3 flex items-center justify-between gap-3 transition ${
              activeVariantId === v.id ? "ring-1 ring-black" : ""
            }`}
          >

            {/* LEFT INFO */}
            <div className="flex flex-col">
              <p className="text-sm font-medium">
                {v.name || "Unnamed Variant"}
              </p>

              <p className="text-xs text-neutral-500">
                {v.priceAdjustment >= 0 ? "+" : ""}
                {v.priceAdjustment}
              </p>

              {v.isDefault && (
                <span className="text-[10px] mt-1 px-2 py-[2px] bg-black text-white rounded w-fit">
                  DEFAULT
                </span>
              )}
            </div>

            {/* ACTIONS */}
            <div className="flex items-center gap-2">

              <button
                onClick={() => applyVariant(v)}
                className="text-xs px-2 py-1 border rounded hover:bg-neutral-100"
              >
                Apply
              </button>

              <button
                onClick={() => setEditingId(v.id)}
                className="text-xs px-2 py-1 border rounded hover:bg-neutral-100"
              >
                Edit
              </button>

              <button
                onClick={() => deleteVariant(v.id)}
                className="text-xs px-2 py-1 text-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* =====================================================
         EDIT DRAWER (SIMPLE INLINE VERSION)
      ===================================================== */}

      {editingVariant && (
        <div className="border rounded-lg p-3 space-y-3 bg-neutral-50">

          <div className="flex justify-between items-center">
            <p className="text-sm font-semibold">Edit Variant</p>

            <button
              onClick={() => setEditingId(null)}
              className="text-xs"
            >
              Close
            </button>
          </div>

          <input
            value={editingVariant.name}
            onChange={(e) =>
              updateVariant(editingVariant.id, "name", e.target.value)
            }
            className="w-full border rounded px-2 py-1"
            placeholder="Variant name"
          />

          <input
            type="number"
            value={editingVariant.priceAdjustment}
            onChange={(e) =>
              updateVariant(
                editingVariant.id,
                "priceAdjustment",
                Number(e.target.value)
              )
            }
            className="w-full border rounded px-2 py-1"
            placeholder="Price adjustment"
          />

          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;

              updateVariant(editingVariant.id, "file", file);

              if (file) {
                updateVariant(
                  editingVariant.id,
                  "preview",
                  createFilePreview(file)
                );
              }
            }}
          />

          {editingVariant.preview && (
            <img
              src={editingVariant.preview}
              className="h-16 w-16 object-cover rounded border"
            />
          )}

          <div className="flex items-center gap-2 text-sm">

            <input
              type="radio"
              checked={editingVariant.isDefault}
              onChange={() => setDefault(editingVariant.id)}
            />

            <span className="text-xs text-neutral-600">
              Set as default
            </span>
          </div>

        </div>
      )}
    </div>
  );
}