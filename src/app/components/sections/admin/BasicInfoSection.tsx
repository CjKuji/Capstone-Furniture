"use client";

import type { FurnitureCategory } from "@/types/furniture";
import type { ModelDimensions } from "@/types/modelValidation";

/* ========================================================= */

type BasicInfoState = {
  name: string;
  description: string;
  categoryId: string;
  basePrice: number | null;
  widthCm: number | null;
  depthCm: number | null;
  heightCm: number | null;
  dimensionSource: "model" | "manual";
};

type Props = {
  state: BasicInfoState;
  setField: (
    key: keyof BasicInfoState,
    value: BasicInfoState[keyof BasicInfoState]
  ) => void;
  categories: FurnitureCategory[];
  detectedDimensions: ModelDimensions | null;
  isAnalyzing: boolean;
};

/* ========================================================= */

const inputClass = `
  w-full mt-1.5 rounded-xl px-4 py-2.5 text-sm outline-none transition
  bg-white/[0.04] border border-white/10 text-white placeholder:text-white/20
  focus:border-[#D4A97A]/50 focus:bg-white/[0.06]
`.trim();

const labelClass = "text-xs font-medium text-white/40 tracking-wide uppercase";

/* ========================================================= */

export default function BasicInfoSection({
  state,
  setField,
  categories,
  detectedDimensions,
  isAnalyzing,
}: Props) {
  const {
    name,
    description,
    categoryId,
    basePrice,
    widthCm,
    depthCm,
    heightCm,
    dimensionSource,
  } = state;

  return (
    <div
      className="rounded-2xl p-5 space-y-5"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* HEADER */}
      <div className="flex items-center gap-3 pb-1">
        <div
          className="w-1 h-5 rounded-full"
          style={{ background: "#D4A97A" }}
        />
        <div>
          <h3 className="text-sm font-semibold text-white">Basic Information</h3>
          <p className="text-xs mt-0.5" style={{ color: "rgba(212,169,122,0.5)" }}>
            Core product details and pricing
          </p>
        </div>
      </div>

      <div className="space-y-4">

        {/* NAME */}
        <div>
          <label className={labelClass}>Furniture Name</label>
          <input
            value={name}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="e.g. Modern Lounge Chair, Oak Dining Table"
            className={inputClass}
          />
        </div>

        {/* DESCRIPTION */}
        <div>
          <label className={labelClass}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setField("description", e.target.value)}
            rows={3}
            placeholder="Describe the furniture's style, materials, and key features..."
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* CATEGORY + PRICE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Category</label>
            <select
              value={categoryId}
              onChange={(e) => setField("categoryId", e.target.value)}
              className={`${inputClass} appearance-none cursor-pointer`}
              style={{ colorScheme: "dark" }}
            >
              <option value="" className="bg-[#1A1008]">Choose a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#1A1008]">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Base Price (₱)</label>
            <input
              type="number"
              value={basePrice ?? ""}
              onChange={(e) =>
                setField("basePrice", e.target.value === "" ? null : Number(e.target.value))
              }
              placeholder="e.g. 15000"
              className={inputClass}
            />
          </div>
        </div>

        {/* DIMENSIONS */}
        <div>
          <div className="flex items-center justify-between">
            <label className={labelClass}>Dimensions — W × D × H (cm)</label>
            <span
              className="rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide"
              style={{
                color: dimensionSource === "model" ? "#34d399" : "#D4A97A",
                background: dimensionSource === "model"
                  ? "rgba(52,211,153,0.08)"
                  : "rgba(212,169,122,0.08)",
              }}
            >
              {dimensionSource === "model" ? "Detected" : "Edited"}
            </span>
          </div>

          {detectedDimensions && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[11px] text-white/55">
                Detected from model: {Math.round(detectedDimensions.widthCm)} ×{" "}
                {Math.round(detectedDimensions.depthCm)} × {Math.round(detectedDimensions.heightCm)} cm
              </p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 mt-1.5">
            {(
              [
                { key: "widthCm",  value: widthCm,  placeholder: "Width"  },
                { key: "depthCm",  value: depthCm,  placeholder: "Depth"  },
                { key: "heightCm", value: heightCm, placeholder: "Height" },
              ] as const
            ).map(({ key, value, placeholder }) => (
              <input
                key={key}
                type="number"
                value={value ?? ""}
                onChange={(e) =>
                  setField(key, e.target.value === "" ? null : Number(e.target.value))
                }
                placeholder={placeholder}
                className={inputClass}
              />
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] text-white/35">
              Dimensions can be edited independently; changing proportions may stretch the model.
            </p>
            {isAnalyzing && <span className="text-[10px] text-[#D4A97A]">Resizing model…</span>}
          </div>
          <p className="mt-2 text-[10px] text-white/30">
            Confirm the detected dimensions before saving.
          </p>
        </div>

      </div>
    </div>
  );
}