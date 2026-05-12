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
    <div className="space-y-6">

      {/* TITLE */}
      <div>
        <h3 className="text-sm font-semibold text-[#3A2B22]">
          Product Details
        </h3>
        <p className="text-xs text-[#7A6A5A] mt-1">
          Core information about this design
        </p>
      </div>

      {/* NAME */}
      <div>
        <label className="text-xs text-[#7A6A5A]">Name</label>
        <div className="mt-1 text-sm font-medium">
          {state.name}
        </div>
      </div>

      {/* DESCRIPTION */}
      <div>
        <label className="text-xs text-[#7A6A5A]">Description</label>
        <p className="mt-1 text-sm leading-relaxed text-[#4B3F3F]">
          {state.description || "No description provided."}
        </p>
      </div>

      {/* META GRID */}
      <div className="grid grid-cols-2 gap-4 pt-2">

        <div>
          <label className="text-xs text-[#7A6A5A]">Category</label>
          <div className="mt-1 text-sm">{categoryName}</div>
        </div>

        <div>
          <label className="text-xs text-[#7A6A5A]">Base Price</label>
          <div className="mt-1 text-sm font-semibold text-[#7A4E2D]">
            ₱{Number(state.basePrice ?? 0).toLocaleString()}
          </div>
        </div>

      </div>

      {/* DIMENSIONS */}
      <div>
        <label className="text-xs text-[#7A6A5A]">
          Dimensions (cm)
        </label>

        <div className="mt-2 flex gap-4 text-sm">
          <span>{state.widthCm ?? "—"} W</span>
          <span>×</span>
          <span>{state.depthCm ?? "—"} D</span>
          <span>×</span>
          <span>{state.heightCm ?? "—"} H</span>
        </div>
      </div>

    </div>
  );
}