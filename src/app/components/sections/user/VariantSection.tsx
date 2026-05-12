"use client";

import { useState } from "react";
import type { VariantUI } from "@/types/furniture-ui";

type Props = {
  variants: VariantUI[];

  /**
   * ONLY for 3D model preview
   */
  onApplyVariant?: (variantId: string | null) => void;

  /**
   * optional external control (controlled mode)
   */
  activeVariantId?: string | null;
};

export default function VariantsSection({
  variants,
  onApplyVariant,
  activeVariantId,
}: Props) {
  /**
   * =========================================================
   * INTERNAL STATE (ONLY USED IF NOT CONTROLLED BY PARENT)
   * =========================================================
   */
  const [internalActive, setInternalActive] = useState<string | null>(null);

  const isControlled = activeVariantId !== undefined;
  const currentActive = isControlled ? activeVariantId : internalActive;

  /**
   * =========================================================
   * APPLY VARIANT (3D PREVIEW ONLY)
   * =========================================================
   */
  const applyVariant = (id: string | null) => {
    if (!isControlled) {
      setInternalActive(id);
    }

    onApplyVariant?.(id);
  };

  /**
   * =========================================================
   * ACTIVE CHECK
   * =========================================================
   */
  const isActive = (id: string | null) => currentActive === id;

  /**
   * =========================================================
   * UI
   * =========================================================
   */
  return (
    <div className="bg-white rounded-2xl border border-black p-6 space-y-4">

      {/* HEADER */}
      <div>
        <h3 className="text-sm font-semibold text-black">
          Variants
        </h3>

        <p className="text-xs text-black mt-1">
          Click a variant to preview it on the 3D model.
        </p>
      </div>

      {/* DEFAULT OPTION */}
      <button
        onClick={() => applyVariant(null)}
        className={`w-full text-left p-4 border rounded-xl transition ${
          isActive(null)
            ? "border-black shadow-sm"
            : "border-black/40"
        }`}
      >
        <div className="text-sm font-semibold text-black">
          Default Furniture
        </div>

        <div className="text-xs text-black">
          Base model (no variant texture)
        </div>
      </button>

      {/* VARIANTS LIST */}
      <div className="space-y-3">
        {variants
          .filter((v) => !v.isDeleted)
          .map((v) => {
            const id = v.id ?? v.clientId;

            return (
              <button
                key={id}
                onClick={() => applyVariant(id)}
                className={`w-full flex items-center gap-3 p-4 border rounded-xl transition ${
                  isActive(id)
                    ? "border-black shadow-sm"
                    : "border-black/40"
                }`}
              >
                {/* IMAGE */}
                <div className="w-12 h-12 border border-black rounded-lg overflow-hidden flex-shrink-0">
                  {v.previewUrl ? (
                    <img
                      src={v.previewUrl}
                      alt={v.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-xs text-black">
                      No Img
                    </div>
                  )}
                </div>

                {/* INFO */}
                <div className="text-left">
                  <div className="text-sm font-semibold text-black">
                    {v.name}
                  </div>

                  <div className="text-xs text-black">
                    {v.priceAdjustment
                      ? `+₱${Number(v.priceAdjustment).toLocaleString()}`
                      : "No price change"}
                  </div>
                </div>
              </button>
            );
          })}
      </div>
    </div>
  );
}