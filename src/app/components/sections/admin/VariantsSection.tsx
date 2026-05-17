"use client";

import type { VariantUI } from "@/types/furniture-ui";

/* ========================================================= */

type VariantKeyed = {
  id?: string;
  clientId: string;
};

type Props = {
  variants: VariantUI[];
  addVariant: () => void;
  updateVariant: <K extends keyof VariantUI>(key: string, field: K, value: VariantUI[K]) => void;
  removeVariant: (key: string) => void;
  setActiveVariantId: (id: string | null) => void;
  activeVariantId: string | null;
  handleVariantFile: (key: string, file: File | null) => void;
  getKey: (v: VariantKeyed) => string;
};

/* ========================================================= */

const labelClass = "text-xs font-medium text-white/40 tracking-wide uppercase";

const inputClass = `
  w-full rounded-xl px-3.5 py-2 text-sm outline-none transition
  bg-white/[0.04] border border-white/10 text-white placeholder:text-white/20
  focus:border-[#D4A97A]/50 focus:bg-white/[0.06]
`.trim();

const fileInputClass = `
  w-full rounded-xl px-3.5 py-2 text-sm outline-none transition
  bg-white/[0.04] border border-white/10 text-white/50
  file:mr-2 file:rounded-lg file:border-0 file:px-2.5 file:py-1
  file:text-xs file:font-medium file:cursor-pointer file:transition
  file:bg-[#D4A97A]/20 file:text-[#D4A97A] hover:file:bg-[#D4A97A]/30
`.trim();

/* ========================================================= */

export default function VariantsSection({
  variants,
  addVariant,
  updateVariant,
  removeVariant,
  setActiveVariantId,
  activeVariantId,
  handleVariantFile,
  getKey,
}: Props) {
  const visibleVariants = variants.filter((v) => !v.isDeleted);

  return (
    <div
      className="rounded-2xl p-5 space-y-5"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1 h-5 rounded-full" style={{ background: "#D4A97A" }} />
          <div>
            <h3 className="text-sm font-semibold text-white">Variants</h3>
            <p className="text-xs mt-0.5" style={{ color: "rgba(212,169,122,0.5)" }}>
              Material or texture overrides — applied live in the 3D viewer
            </p>
          </div>
        </div>

        <button
          onClick={addVariant}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition"
          style={{
            background: "rgba(212,169,122,0.12)",
            color: "#D4A97A",
            border: "1px solid rgba(212,169,122,0.2)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(212,169,122,0.2)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(212,169,122,0.12)";
          }}
        >
          + Add Variant
        </button>
      </div>

      {/* EMPTY STATE */}
      {visibleVariants.length === 0 && (
        <div
          className="rounded-xl py-8 flex flex-col items-center gap-2 text-center"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px dashed rgba(255,255,255,0.08)",
          }}
        >
          <span className="text-2xl opacity-25">🎨</span>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
            No variants yet — add one to apply different textures in the 3D preview
          </p>
        </div>
      )}

      {/* LIST */}
      <div className="space-y-3">
        {visibleVariants.map((v) => {
          const key = getKey(v);

          /* Normalize preview URL across API shapes */
          const preview =
            (v as any).previewUrl ||
            (v as any).textureUrl ||
            (v as any).texture_url ||
            null;

          const isActive = activeVariantId === key;

          return (
            <div
              key={key}
              className="rounded-2xl p-4 flex gap-4 transition-all duration-200"
              style={{
                background: isActive
                  ? "rgba(212,169,122,0.07)"
                  : "rgba(255,255,255,0.03)",
                border: isActive
                  ? "1px solid rgba(212,169,122,0.35)"
                  : "1px solid rgba(255,255,255,0.07)",
              }}
            >

              {/* TEXTURE PREVIEW */}
              <div
                className="shrink-0 w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center"
                style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.3)" }}
              >
                {preview ? (
                  <img
                    src={preview}
                    className="w-full h-full object-cover"
                    alt={v.name || "Variant"}
                  />
                ) : (
                  <span className="text-[10px] text-center leading-tight px-1" style={{ color: "rgba(255,255,255,0.2)" }}>
                    No<br />Texture
                  </span>
                )}
              </div>

              {/* FIELDS */}
              <div className="flex-1 space-y-2 min-w-0">

                <input
                  value={v.name}
                  onChange={(e) => updateVariant(key, "name", e.target.value)}
                  placeholder="Variant name (e.g. Oak, Walnut)"
                  className={inputClass}
                />

                <input
                  type="number"
                  value={v.priceAdjustment ?? ""}
                  onChange={(e) =>
                    updateVariant(
                      key,
                      "priceAdjustment",
                      e.target.value === "" ? null : Number(e.target.value)
                    )
                  }
                  placeholder="Price adjustment (e.g. +500)"
                  className={inputClass}
                />

                <input
                  type="file"
                  onChange={(e) => handleVariantFile(key, e.target.files?.[0] ?? null)}
                  className={fileInputClass}
                />

              </div>

              {/* ACTIONS */}
              <div className="flex flex-col gap-2 shrink-0">

                {/* APPLY / APPLIED */}
                {isActive ? (
                  <div className="flex flex-col gap-1.5">
                    <span
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-center"
                      style={{ background: "rgba(212,169,122,0.2)", color: "#D4A97A" }}
                    >
                      ✓ Applied
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveVariantId(null)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        color: "rgba(255,255,255,0.4)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveVariantId(key)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                    style={{
                      background: "rgba(212,169,122,0.1)",
                      color: "#D4A97A",
                      border: "1px solid rgba(212,169,122,0.2)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(212,169,122,0.2)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(212,169,122,0.1)";
                    }}
                  >
                    Preview
                  </button>
                )}

                {/* REMOVE */}
                <button
                  onClick={() => removeVariant(key)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
                  style={{
                    background: "rgba(255,80,80,0.07)",
                    color: "rgba(255,100,100,0.7)",
                    border: "1px solid rgba(255,80,80,0.12)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,80,80,0.15)";
                    (e.currentTarget as HTMLButtonElement).style.color = "#ff6b6b";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,80,80,0.07)";
                    (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,100,100,0.7)";
                  }}
                >
                  Remove
                </button>

              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}