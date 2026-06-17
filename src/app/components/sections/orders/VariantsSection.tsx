"use client";

import type { VariantSnapshot, OrderItem } from "@/types/order";

/* =========================================================
    TYPES
========================================================= */
type Props = {
  items?: OrderItem[] | null;
};

/* =========================================================
    COMPONENT
========================================================= */
export default function OrderVariantsSection({ items }: Props) {
  const safeItems = Array.isArray(items) ? items : [];

  if (!safeItems.length) {
    return (
      <p className="text-sm text-white/25 italic">No variants available.</p>
    );
  }

  /* ================= STYLE CONSTANTS ================= */
  const rowStyle = `
    w-full flex items-center gap-4 p-3 rounded-xl text-left 
    border border-white/[0.06] bg-white/[0.03]
  `.trim();

  const thumbBase = `
    w-11 h-11 shrink-0 rounded-lg overflow-hidden flex items-center justify-center
  `.trim();

  return (
    <div className="space-y-4">
      {/* SECTION HEADER */}
      <div className="flex items-center gap-3">
        <div className="w-1 h-4 rounded-full" style={{ background: "#D4A97A" }} />
        <div>
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">
            Finishes &amp; Variants
          </p>
          <p className="text-[10px] text-white/20 uppercase tracking-wider mt-0.5">
            Snapshot configuration details
          </p>
        </div>
      </div>

      {/* ITEMS MAP LOOP */}
      <div className="space-y-4">
        {safeItems.map((item, i) => {
          const v = item.variant_snapshot;

          return (
            <div key={item.id} className="space-y-2">
              {/* ITEM METADATA STRIP */}
              <div className="flex items-center justify-between border-b border-white/[0.04] pb-1.5">
                <span className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">
                  Item {i + 1}
                </span>
                <span className="text-xs font-medium text-white/50 max-w-[70%] truncate">
                  {item.furniture_snapshot?.name ?? "Unnamed Base Item"}
                </span>
              </div>

              {/* VARIANT DETAILS OR EMPTY FALLBACK CONTAINER */}
              {!v ? (
                <div
                  className="rounded-xl px-4 py-3.5 text-xs italic text-white/25 text-left"
                  style={{
                    background: "rgba(255,255,255,0.01)",
                    border: "1px dashed rgba(255,255,255,0.06)",
                  }}
                >
                  Standard production: No variants or finish adjustments configured.
                </div>
              ) : (
                <div className={rowStyle}>
                  {/* TEXTURE SPECIMEN PLUG */}
                  <div
                    className={thumbBase}
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    {v.preview_image_url ? (
                      <img
                        src={v.preview_image_url}
                        alt={v.name ?? ""}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[9px] font-semibold text-white/25 tracking-widest">DEF</span>
                    )}
                  </div>

                  {/* LABELS COLUMN */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {v.name ?? "Custom Specification"}
                    </p>
                    <p className="text-xs text-white/30 mt-0.5">
                      {v.price_adjustment
                        ? `+₱${Number(v.price_adjustment).toLocaleString()}`
                        : "No price adjustment"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}