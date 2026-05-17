"use client";

import { useState } from "react";
import type { VariantUI } from "@/types/furniture-ui";

/* ========================================================= */

type Props = {
  variants: VariantUI[];
  onApplyVariant?: (variantId: string | null) => void;
  activeVariantId?: string | null;
};

/* ========================================================= */

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

  const visibleVariants = variants.filter((v) => !v.isDeleted);

  /* ================= SHARED ROW STYLES ================= */

  const rowBase = `
    w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200
  `.trim();

  const rowActive = `border border-[#D4A97A]/35 bg-[#D4A97A]/[0.06]`;
  const rowIdle   = `border border-white/[0.06] bg-white/[0.03] hover:border-white/10 hover:bg-white/[0.05]`;

  /* ================= THUMBNAIL WRAPPER ================= */

  const thumbBase = `
    w-11 h-11 shrink-0 rounded-lg overflow-hidden flex items-center justify-center
  `.trim();

  return (
    <div className="space-y-4">

      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="w-1 h-4 rounded-full" style={{ background: "#D4A97A" }} />
        <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">
          Finishes &amp; Variants
        </p>
      </div>

      {/* DEFAULT FINISH */}
      <button
        onClick={() => setVariant(null)}
        className={`${rowBase} ${active === null ? rowActive : rowIdle}`}
      >
        {/* THUMB */}
        <div
          className={thumbBase}
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <span className="text-[9px] font-semibold text-white/25 tracking-widest">DEF</span>
        </div>

        {/* LABEL */}
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-white">Default Finish</p>
          <p className="text-xs text-white/30 mt-0.5">Base material · no adjustment</p>
        </div>

        {/* ACTIVE DOT */}
        {active === null && (
          <div
            className="shrink-0 w-2 h-2 rounded-full ml-auto"
            style={{ background: "#D4A97A" }}
          />
        )}
      </button>

      {/* VARIANT LIST */}
      <div className="space-y-2">
        {visibleVariants.map((v) => {
          const id = v.id ?? v.clientId;
          const isActive = active === id;

          return (
            <button
              key={id}
              onClick={() => setVariant(id)}
              className={`${rowBase} ${isActive ? rowActive : rowIdle}`}
            >
              {/* THUMB */}
              <div
                className={thumbBase}
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                {v.previewUrl ? (
                  <img
                    src={v.previewUrl}
                    alt={v.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[9px] text-white/20">N/A</span>
                )}
              </div>

              {/* LABEL */}
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-white">{v.name}</p>
                <p className="text-xs text-white/30 mt-0.5">
                  {v.priceAdjustment
                    ? `+₱${Number(v.priceAdjustment).toLocaleString()}`
                    : "No price adjustment"}
                </p>
              </div>

              {/* ACTIVE DOT */}
              {isActive && (
                <div
                  className="shrink-0 w-2 h-2 rounded-full ml-auto"
                  style={{ background: "#D4A97A" }}
                />
              )}
            </button>
          );
        })}
      </div>

    </div>
  );
}