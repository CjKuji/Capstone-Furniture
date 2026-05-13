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
    <div className="space-y-4">
      <p className="font-semibold text-[#D4A97A] text-xs uppercase tracking-widest">Finishes & Variants</p>

      {/* DEFAULT */}
      <button
        onClick={() => setVariant(null)}
        className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border transition ${
          active === null
            ? "border-[#D4A97A]/40 bg-[#D4A97A]/5"
            : "border-white/5 bg-white/[0.03] hover:border-white/10"
        }`}
      >
        <div className="flex justify-center items-center bg-white/5 border border-white/10 rounded-lg w-11 h-11 shrink-0">
          <span className="text-[10px] text-white/30">DEF</span>
        </div>
        <div className="text-left">
          <div className="font-medium text-white text-sm">Default Finish</div>
          <div className="text-white/30 text-xs">Base material, no adjustment</div>
        </div>
        {active === null && (
          <div className="bg-[#D4A97A] ml-auto rounded-full w-2 h-2 shrink-0" />
        )}
      </button>

      {/* VARIANTS */}
      <div className="space-y-2">
        {variants
          .filter((v) => !v.isDeleted)
          .map((v) => {
            const id = v.id ?? v.clientId;
            const isActive = active === id;

            return (
              <button
                key={id}
                onClick={() => setVariant(id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition ${
                  isActive
                    ? "border-[#D4A97A]/40 bg-[#D4A97A]/5"
                    : "border-white/5 bg-white/[0.03] hover:border-white/10"
                }`}
              >
                <div className="bg-white/5 border border-white/10 rounded-lg w-11 h-11 overflow-hidden shrink-0">
                  {v.previewUrl ? (
                    <img src={v.previewUrl} alt={v.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex justify-center items-center h-full text-[9px] text-white/20">N/A</div>
                  )}
                </div>
                <div className="text-left">
                  <div className="font-medium text-white text-sm">{v.name}</div>
                  <div className="text-white/30 text-xs">
                    {v.priceAdjustment
                      ? `+₱${Number(v.priceAdjustment).toLocaleString()}`
                      : "No price adjustment"}
                  </div>
                </div>
                {isActive && (
                  <div className="bg-[#D4A97A] ml-auto rounded-full w-2 h-2 shrink-0" />
                )}
              </button>
            );
          })}
      </div>
    </div>
  );
}