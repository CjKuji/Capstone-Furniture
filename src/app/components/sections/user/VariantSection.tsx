"use client";

import { useState } from "react";
import type { VariantUI } from "@/types/furniture-ui";

type Props = {
  variants: VariantUI[];
  onApplyVariant?: (variantId: string | null) => void;
  activeVariantId?: string | null;
};

export default function VariantsSection({
  variants,
  onApplyVariant,
  activeVariantId,
}: Props) {
  const [internal, setInternal] = useState<string | null>(null);

  const isControlled = activeVariantId !== undefined;
  const active = isControlled ? activeVariantId : internal;

  const setVariant = (id: string | null) => {
    if (!isControlled) setInternal(id);
    onApplyVariant?.(id);
  };

  return (
    <div className="space-y-6">

      {/* TITLE */}
      <div>
        <h3 className="text-sm font-semibold text-[#3A2B22]">
          Variants
        </h3>
        <p className="text-xs text-[#7A6A5A] mt-1">
          Preview different materials and finishes
        </p>
      </div>

      {/* DEFAULT */}
      <button
        onClick={() => setVariant(null)}
        className={`w-full text-left p-4 rounded-xl border transition ${
          active === null
            ? "border-[#7A4E2D] bg-[#F5E8DA]"
            : "border-[#E8D7C8] bg-white"
        }`}
      >
        <div className="text-sm font-medium">
          Default Finish
        </div>
        <div className="text-xs text-[#7A6A5A]">
          Base material
        </div>
      </button>

      {/* VARIANTS */}
      <div className="space-y-3">

        {variants
          .filter((v) => !v.isDeleted)
          .map((v) => {
            const id = v.id ?? v.clientId;

            const isActive = active === id;

            return (
              <button
                key={id}
                onClick={() => setVariant(id)}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border transition ${
                  isActive
                    ? "border-[#7A4E2D] bg-[#F5E8DA]"
                    : "border-[#E8D7C8] bg-white"
                }`}
              >

                {/* IMAGE */}
                <div className="w-12 h-12 rounded-lg overflow-hidden border border-[#E8D7C8] bg-white">
                  {v.previewUrl ? (
                    <img
                      src={v.previewUrl}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-[10px] flex items-center justify-center h-full text-[#9A8A7A]">
                      No image
                    </div>
                  )}
                </div>

                {/* TEXT */}
                <div>
                  <div className="text-sm font-medium">
                    {v.name}
                  </div>
                  <div className="text-xs text-[#7A6A5A]">
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