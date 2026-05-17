"use client";

import type { FurnitureCategory } from "@/types/furniture";

/* ========================================================= */

type BasicInfoState = {
  name: string;
  description: string;
  categoryId: string | null;
  basePrice: number | null;
  widthCm: number | null;
  depthCm: number | null;
  heightCm: number | null;
};

type Props = {
  state: BasicInfoState;
  categories: FurnitureCategory[];
};

/* ========================================================= */

export default function BasicInfoSection({ state, categories }: Props) {
  const categoryName =
    categories.find((c) => c.id === state.categoryId)?.name ?? "Uncategorized";

  const hasDimensions = state.widthCm || state.depthCm || state.heightCm;

  return (
    <div className="space-y-5">

      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="w-1 h-4 rounded-full" style={{ background: "#D4A97A" }} />
        <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">
          About this piece
        </p>
      </div>

      {/* DESCRIPTION */}
      {state.description ? (
        <p className="text-sm text-white/60 leading-relaxed">
          {state.description}
        </p>
      ) : (
        <p className="text-sm text-white/25 italic">No description provided.</p>
      )}

      {/* META GRID */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="px-4 py-3 rounded-xl"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Category</p>
          <p className="text-sm font-medium text-white capitalize">{categoryName}</p>
        </div>

        <div
          className="px-4 py-3 rounded-xl"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Base Price</p>
          <p className="text-sm font-semibold" style={{ color: "#D4A97A" }}>
            ₱{Number(state.basePrice ?? 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* DIMENSIONS */}
      {hasDimensions && (
        <div
          className="px-4 py-3 rounded-xl"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">
            Dimensions (cm)
          </p>
          <div className="flex items-center gap-3 text-sm text-white/70">
            <span>
              <span className="text-xs text-white/30 mr-1">W</span>
              {state.widthCm ?? "—"}
            </span>
            <span className="text-white/20">×</span>
            <span>
              <span className="text-xs text-white/30 mr-1">D</span>
              {state.depthCm ?? "—"}
            </span>
            <span className="text-white/20">×</span>
            <span>
              <span className="text-xs text-white/30 mr-1">H</span>
              {state.heightCm ?? "—"}
            </span>
          </div>
        </div>
      )}

    </div>
  );
}