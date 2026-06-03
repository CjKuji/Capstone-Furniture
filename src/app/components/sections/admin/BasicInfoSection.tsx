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

/** True when all three dimension fields have a positive value. */
function dimensionsFilled(
  w: number | null,
  d: number | null,
  h: number | null
): boolean {
  return w != null && w > 0 && d != null && d > 0 && h != null && h > 0;
}

/* ========================================================= */

export default function BasicInfoSection({ state, setField, categories }: Props) {
  const { name, description, categoryId, basePrice, widthCm, depthCm, heightCm } = state;

  const dimsReady = dimensionsFilled(widthCm, depthCm, heightCm);

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
          {/* Label row — dimensions label + model-unlock badge */}
          <div className="flex items-center justify-between">
            <label className={labelClass}>Dimensions — W × D × H (cm)</label>

            {/* Visual gate indicator */}
            <span
              className="flex items-center gap-1 text-[10px] font-medium tracking-wide transition-all duration-300"
              style={{
                color: dimsReady ? "rgba(212,169,122,0.75)" : "rgba(255,255,255,0.22)",
              }}
            >
              {dimsReady ? (
                /* Unlocked — open padlock SVG */
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  {/* shackle open to the right */}
                  <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                </svg>
              ) : (
                /* Locked — closed padlock SVG */
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              )}
              {dimsReady ? "3D upload unlocked" : "Unlocks 3D upload"}
            </span>
          </div>

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

          {/* Subtle progress dots — one per field */}
          <div className="flex items-center gap-1.5 mt-2">
            {(
              [
                { key: "widthCm", value: widthCm, label: "W" },
                { key: "depthCm", value: depthCm, label: "D" },
                { key: "heightCm", value: heightCm, label: "H" },
              ] as const
            ).map(({ key, value, label }) => {
              const filled = value != null && value > 0;
              return (
                <span
                  key={key}
                  className="flex items-center gap-1 transition-all duration-200"
                >
                  <span
                    className="block w-1.5 h-1.5 rounded-full transition-all duration-300"
                    style={{
                      background: filled
                        ? "#D4A97A"
                        : "rgba(255,255,255,0.12)",
                      boxShadow: filled ? "0 0 4px rgba(212,169,122,0.5)" : "none",
                    }}
                  />
                  <span
                    className="text-[10px] font-medium transition-colors duration-200"
                    style={{
                      color: filled
                        ? "rgba(212,169,122,0.6)"
                        : "rgba(255,255,255,0.18)",
                    }}
                  >
                    {label}
                  </span>
                </span>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}