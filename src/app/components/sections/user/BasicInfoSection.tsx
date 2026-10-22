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
    <div className="space-y-4">

      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="w-1 h-4 rounded-full bg-[var(--accent)]" />
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">
          About this piece
        </p>
      </div>

      {/* DESCRIPTION */}
      {state.description ? (
        <p className="text-sm text-[var(--text)] leading-relaxed">
          {state.description}
        </p>
      ) : (
        <p className="text-sm text-[var(--text-muted)] italic">No description provided.</p>
      )}

      {/* META GRID */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="px-4 py-3 rounded-xl bg-[var(--surface-alt)] border border-[var(--border)]"
        >
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mb-1">Category</p>
          <p className="text-sm font-medium text-[var(--text)] capitalize">{categoryName}</p>
        </div>

        <div
          className="px-4 py-3 rounded-xl bg-[var(--surface-alt)] border border-[var(--border)]"
        >
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mb-1">Base Price</p>
          <p className="text-sm font-semibold text-[var(--primary)]">
            ₱{Number(state.basePrice ?? 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* DIMENSIONS */}
      {hasDimensions && (
        <div
          className="px-4 py-3 rounded-xl bg-[var(--surface-alt)] border border-[var(--border)]"
        >
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mb-2">
            Dimensions (cm)
          </p>
          <div className="flex items-center gap-3 text-sm text-[var(--text)]">
            <span>
              <span className="text-xs text-[var(--text-muted)] mr-1">W</span>
              {state.widthCm ?? "—"}
            </span>
            <span className="text-[var(--text-muted)]">×</span>
            <span>
              <span className="text-xs text-[var(--text-muted)] mr-1">D</span>
              {state.depthCm ?? "—"}
            </span>
            <span className="text-[var(--text-muted)]">×</span>
            <span>
              <span className="text-xs text-[var(--text-muted)] mr-1">H</span>
              {state.heightCm ?? "—"}
            </span>
          </div>
        </div>
      )}

    </div>
  );
}