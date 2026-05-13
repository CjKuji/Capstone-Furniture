"use client";

import type { FurnitureCategory } from "@/types/furniture";

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

export default function BasicInfoSection({ state, categories }: Props) {
  const categoryName =
    categories.find((c) => c.id === state.categoryId)?.name ??
    "Uncategorized";

  return (
    <div className="space-y-5">

      <p className="font-semibold text-[#D4A97A] text-xs uppercase tracking-widest">About this piece</p>

      {/* DESCRIPTION */}
      {state.description ? (
        <p className="text-white/60 text-sm leading-relaxed">
          {state.description}
        </p>
      ) : (
        <p className="text-white/25 text-sm italic">No description provided.</p>
      )}

      {/* META GRID */}
      <div className="gap-3 grid grid-cols-2 pt-1">
        <div className="bg-white/[0.04] px-4 py-3 border border-white/5 rounded-xl">
          <p className="mb-1 text-[10px] text-white/30 uppercase tracking-widest">Category</p>
          <p className="font-medium text-white text-sm capitalize">{categoryName}</p>
        </div>
        <div className="bg-white/[0.04] px-4 py-3 border border-white/5 rounded-xl">
          <p className="mb-1 text-[10px] text-white/30 uppercase tracking-widest">Base Price</p>
          <p className="font-semibold text-[#D4A97A] text-sm">₱{Number(state.basePrice ?? 0).toLocaleString()}</p>
        </div>
      </div>

      {/* DIMENSIONS */}
      {(state.widthCm || state.depthCm || state.heightCm) && (
        <div className="bg-white/[0.04] px-4 py-3 border border-white/5 rounded-xl">
          <p className="mb-2 text-[10px] text-white/30 uppercase tracking-widest">Dimensions (cm)</p>
          <div className="flex items-center gap-3 text-white/70 text-sm">
            <span><span className="mr-1 text-white/30 text-xs">W</span>{state.widthCm ?? "—"}</span>
            <span className="text-white/20">×</span>
            <span><span className="mr-1 text-white/30 text-xs">D</span>{state.depthCm ?? "—"}</span>
            <span className="text-white/20">×</span>
            <span><span className="mr-1 text-white/30 text-xs">H</span>{state.heightCm ?? "—"}</span>
          </div>
        </div>
      )}

    </div>
  );
}