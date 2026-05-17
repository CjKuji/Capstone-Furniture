"use client";

import { useState } from "react";

/* ========================================================= */

type VariantSnapshot = {
  id: string;
  name?: string;
  preview_image_url?: string | null;
  price_adjustment?: number | null;
};

type OrderItem = {
  id: string;
  variant_snapshot?: VariantSnapshot | null;
  furniture_snapshot?: { name?: string } | null;
};

type Props = {
  items?: OrderItem[] | null;
  onApplyVariant?: (itemId: string, variant: VariantSnapshot | null) => void;
};

/* ========================================================= */

export default function OrderVariantsSection({ items, onApplyVariant }: Props) {
  const safe = Array.isArray(items) ? items : [];

  const [active, setActive] = useState<Record<string, string | null>>({});

  const apply = (item: OrderItem, v: VariantSnapshot | null) => {
    setActive((prev) => ({ ...prev, [item.id]: v?.id ?? null }));
    onApplyVariant?.(item.id, v);
  };

  if (!safe.length) {
    return (
      <div
        className="rounded-2xl p-5 text-sm"
        style={{ color: "rgba(255,255,255,0.25)" }}
      >
        No variants available
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-5 space-y-5"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >

      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="w-1 h-4 rounded-full" style={{ background: "#D4A97A" }} />
        <div>
          <h3 className="text-sm font-semibold text-white">Variants</h3>
          <p className="text-xs mt-0.5" style={{ color: "rgba(212,169,122,0.5)" }}>
            Finish applied at order time
          </p>
        </div>
      </div>

      {/* ITEMS */}
      {safe.map((item, i) => {
        const v = item.variant_snapshot;
        const isActive = active[item.id] === (v?.id ?? null);

        return (
          <div key={item.id} className="space-y-2">

            {/* ITEM LABEL */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white/50 uppercase tracking-widest">
                Item {i + 1}
              </span>
              <span className="text-xs text-white/30">
                {item.furniture_snapshot?.name ?? "Unnamed"}
              </span>
            </div>

            {/* NO VARIANT */}
            {!v ? (
              <div
                className="rounded-xl px-4 py-3 text-xs"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px dashed rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.25)",
                }}
              >
                No variant selected for this item
              </div>
            ) : (
              /* VARIANT ROW */
              <div
                className="flex items-center gap-4 p-3 rounded-xl transition-all duration-200"
                style={{
                  background: isActive
                    ? "rgba(212,169,122,0.07)"
                    : "rgba(255,255,255,0.03)",
                  border: isActive
                    ? "1px solid rgba(212,169,122,0.35)"
                    : "1px solid rgba(255,255,255,0.07)",
                }}
              >

                {/* TEXTURE THUMB — only renders img when url exists */}
                <div
                  className="w-12 h-12 shrink-0 rounded-lg overflow-hidden flex items-center justify-center"
                  style={{
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {v.preview_image_url ? (
                    <img
                      src={v.preview_image_url}
                      alt={v.name ?? "Variant"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[9px] text-white/20">N/A</span>
                  )}
                </div>

                {/* LABELS */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {v.name ?? "Unnamed Variant"}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                    {v.price_adjustment
                      ? `+₱${Number(v.price_adjustment).toLocaleString()}`
                      : "No price adjustment"}
                  </p>
                </div>

                {/* APPLY / REMOVE */}
                <button
                  onClick={() => apply(item, isActive ? null : v)}
                  className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                  style={
                    isActive
                      ? {
                          background: "rgba(255,80,80,0.1)",
                          color: "rgba(255,100,100,0.8)",
                          border: "1px solid rgba(255,80,80,0.15)",
                        }
                      : {
                          background: "rgba(212,169,122,0.12)",
                          color: "#D4A97A",
                          border: "1px solid rgba(212,169,122,0.2)",
                        }
                  }
                >
                  {isActive ? "Remove" : "Preview"}
                </button>

              </div>
            )}

          </div>
        );
      })}

    </div>
  );
}