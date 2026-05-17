"use client";

import type { FurnitureCategory } from "@/types/furniture";

/* ========================================================= */

type BasicInfoState = {
  name: string;
  description: string;
  categoryId: string;
  basePrice: number | null;
  widthCm: number | null;
  depthCm: number | null;
  heightCm: number | null;
};

type Props = {
  state: BasicInfoState;
  setField: <K extends keyof BasicInfoState>(key: K, value: BasicInfoState[K]) => void;
  categories: FurnitureCategory[];
};

/* ========================================================= */

const inputClass = `
  w-full mt-1.5 rounded-xl px-4 py-2.5 text-sm outline-none transition
  bg-white/[0.04] border border-white/10 text-white placeholder:text-white/20
  focus:border-[#D4A97A]/50 focus:bg-white/[0.06]
`.trim();

const labelClass = "text-xs font-medium text-white/40 tracking-wide uppercase";

/* ========================================================= */

export default function BasicInfoSection({ state, setField, categories }: Props) {
  const { name, description, categoryId, basePrice, widthCm, depthCm, heightCm } = state;

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
            placeholder="e.g. Premium Sofa"
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
            placeholder="Short description of the furniture..."
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* CATEGORY + PRICE */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Category</label>
            <select
              value={categoryId}
              onChange={(e) => setField("categoryId", e.target.value)}
              className={`${inputClass} appearance-none cursor-pointer`}
              style={{ colorScheme: "dark" }}
            >
              <option value="" className="bg-[#1A1008]">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#1A1008]">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Base Price</label>
            <input
              type="number"
              value={basePrice ?? ""}
              onChange={(e) =>
                setField("basePrice", e.target.value === "" ? null : Number(e.target.value))
              }
              placeholder="0.00"
              className={inputClass}
            />
          </div>
        </div>

        {/* DIMENSIONS */}
        <div>
          <label className={labelClass}>Dimensions — W × D × H (cm)</label>
          <div className="grid grid-cols-3 gap-3 mt-1.5">
            {(
              [
                { key: "widthCm", value: widthCm, placeholder: "Width" },
                { key: "depthCm", value: depthCm, placeholder: "Depth" },
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
        </div>

      </div>
    </div>
  );
}