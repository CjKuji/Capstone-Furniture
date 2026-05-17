"use client";

import type { ImageUI } from "@/types/furniture-ui";

/* ========================================================= */

type AssetsState = {
  modelFile?: File;
  images: ImageUI[];
};

type Props = {
  state: AssetsState;
  setModelFile: (file?: File) => void;
  addImages: (files: FileList | null) => void;
  removeImage: (key: string) => void;
  setPrimaryImage: (key: string) => void;
};

/* ========================================================= */

const labelClass = "text-xs font-medium text-white/40 tracking-wide uppercase";

const fileInputClass = `
  w-full mt-1.5 rounded-xl px-4 py-2.5 text-sm outline-none transition
  bg-white/[0.04] border border-white/10 text-white/60
  file:mr-3 file:rounded-lg file:border-0 file:px-3 file:py-1
  file:text-xs file:font-medium file:cursor-pointer
  file:transition file:bg-[#D4A97A]/20 file:text-[#D4A97A]
  hover:file:bg-[#D4A97A]/30
`.trim();

/* ========================================================= */

export default function AssetsSection({
  state,
  setModelFile,
  addImages,
  removeImage,
  setPrimaryImage,
}: Props) {
  const images = state.images.filter((i) => !i.isDeleted);

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
        <div className="w-1 h-5 rounded-full" style={{ background: "#D4A97A" }} />
        <div>
          <h3 className="text-sm font-semibold text-white">Media Uploads</h3>
          <p className="text-xs mt-0.5" style={{ color: "rgba(212,169,122,0.5)" }}>
            Upload model files and product images
          </p>
        </div>
      </div>

      {/* 3D MODEL */}
      <div
        className="pb-5 space-y-2"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <label className={labelClass}>3D Model (.glb / .gltf)</label>
        <input
          type="file"
          accept=".glb,.gltf,.obj"
          onChange={(e) => setModelFile(e.target.files?.[0] ?? undefined)}
          className={fileInputClass}
        />
        {state.modelFile && (
          <p className="text-xs pl-1" style={{ color: "rgba(212,169,122,0.6)" }}>
            ✓ {state.modelFile.name}
          </p>
        )}
      </div>

      {/* IMAGES */}
      <div className="space-y-3">
        <label className={labelClass}>Product Images</label>

        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => addImages(e.target.files)}
          className={fileInputClass}
        />

        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mt-3">
            {images.map((img) => {
              const key = img.id ?? img.clientId;
              return (
                <div
                  key={key}
                  className="relative group rounded-xl overflow-hidden"
                  style={{
                    border: img.isPrimary
                      ? "1.5px solid #D4A97A"
                      : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {/* IMAGE */}
                  <img
                    src={img.url}
                    className="h-24 w-full object-cover block"
                    alt=""
                  />

                  {/* PRIMARY BADGE */}
                  {img.isPrimary && (
                    <span
                      className="absolute top-1.5 left-1.5 z-20 text-[10px] px-2 py-0.5 rounded-md font-semibold"
                      style={{ background: "#D4A97A", color: "#1C1209" }}
                    >
                      Thumbnail
                    </span>
                  )}

                  {/* DELETE */}
                  <button
                    onClick={() => removeImage(key)}
                    className="absolute top-1.5 right-1.5 z-20 w-6 h-6 rounded-full flex items-center justify-center text-xs transition"
                    style={{ background: "rgba(0,0,0,0.7)", color: "rgba(255,255,255,0.7)" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color = "#ff6b6b";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)";
                    }}
                  >
                    ✕
                  </button>

                  {/* HOVER OVERLAY */}
                  <div className="absolute inset-0 z-10 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => setPrimaryImage(key)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                      style={{ background: "#D4A97A", color: "#1C1209" }}
                    >
                      Set Thumbnail
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {images.length === 0 && (
          <div
            className="rounded-xl py-6 flex flex-col items-center gap-2 text-center"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}
          >
            <span className="text-2xl opacity-30">🖼️</span>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
              No images uploaded yet
            </p>
          </div>
        )}
      </div>

    </div>
  );
}