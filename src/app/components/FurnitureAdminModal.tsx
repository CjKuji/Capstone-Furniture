"use client";

import Furniture3DViewer from "@/app/components/Furniture3DViewer";

import type {
  FurnitureCategory,
  FurnitureFormPayload,
} from "@/types/furniture";

import { useFurnitureForm } from "@/hooks/useFurnitureForm";
import { useFurnitureModalController } from "@/hooks/useFurnitureModalController";

import BasicInfoSection from "@/app/components/sections/admin/BasicInfoSection";
import AssetsSection from "@/app/components/sections/admin/AssetsSection";
import VariantsSection from "@/app/components/sections/admin/VariantsSection";

/* ========================================================= */

type Props = {
  isOpen: boolean;
  mode: "create" | "edit";
  item: any | null;
  onClose: () => void;
  onSave: (id: string | null, data: FurnitureFormPayload) => Promise<void> | void;
  categories: FurnitureCategory[];
};

/* ========================================================= */

export default function FurnitureModalContainer({
  isOpen,
  mode,
  item,
  onClose,
  onSave,
  categories,
}: Props) {
  const form = useFurnitureForm({ mode, item });

  const controller = useFurnitureModalController({
    form,
    item,
    isOpen,
    onClose,
    onSave,
  });

  const {
    state,
    variants,
    submitting,
    modelPreviewUrl,
    activeVariantTexture,
    activeVariantId,
    setBasicInfoField,
    setActiveVariantId,
    setField,
    addImages,
    removeImage,
    setPrimaryImage,
    addVariant,
    updateVariant,
    removeVariant,
    handleClose,
    handleSubmit,
    handleVariantFile,
    getKey,
  } = controller;

  /* ================= GUARDS ================= */

  if (!isOpen) return null;

  if (!item && mode === "edit") {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="text-white/60 text-sm">Furniture not found</div>
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="w-full max-w-7xl h-[94vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ background: "#120C07", border: "1px solid rgba(212,169,122,0.15)" }}
      >

        {/* ── TITLE BAR ── */}
        <div
          className="shrink-0 flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div>
            <h2 className="text-base font-semibold text-white tracking-tight">
              {mode === "edit" ? "Edit Furniture" : "Add New Furniture"}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "rgba(212,169,122,0.6)" }}>
              {mode === "edit"
                ? "Update product details, assets and variants"
                : "Fill in details, upload assets and add variants"}
            </p>
          </div>

          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* ── BODY ── */}
        <div className="flex flex-1 min-h-0">

          {/* ── LEFT: LIVE PREVIEW ── */}
          <div
            className="w-[46%] flex flex-col"
            style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div
              className="px-5 py-3 text-xs font-medium tracking-widest uppercase"
              style={{
                color: "rgba(212,169,122,0.5)",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              Live Preview
            </div>

            <div
              className="flex-1 flex items-center justify-center p-6"
              style={{ background: "#0F0A06" }}
            >
              {modelPreviewUrl ? (
                <Furniture3DViewer
                  modelUrl={modelPreviewUrl}
                  selectedVariantTextureUrl={activeVariantTexture}
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-center">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(212,169,122,0.08)" }}
                  >
                    <span className="text-2xl">📦</span>
                  </div>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>
                    No model uploaded yet
                  </p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.12)" }}>
                    Upload a .glb or .gltf file to preview
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: FORM ── */}
          <div className="w-[54%] overflow-y-auto p-5 space-y-4 scrollbar-thin">

            <BasicInfoSection
              state={{
                name: state.name,
                description: state.description,
                categoryId: state.categoryId,
                basePrice: state.basePrice,
                widthCm: state.widthCm,
                depthCm: state.depthCm,
                heightCm: state.heightCm,
              }}
              setField={setBasicInfoField}
              categories={categories}
            />

            <AssetsSection
              state={{
                modelFile: state.modelFile,
                images: state.images,
              }}
              setModelFile={(file) => setField("modelFile", file)}
              addImages={addImages}
              removeImage={removeImage}
              setPrimaryImage={setPrimaryImage}
            />

            <VariantsSection
              variants={variants}
              addVariant={addVariant}
              updateVariant={updateVariant}
              removeVariant={removeVariant}
              setActiveVariantId={setActiveVariantId}
              activeVariantId={activeVariantId}
              handleVariantFile={handleVariantFile}
              getKey={getKey}
            />

          </div>
        </div>

        {/* ── FOOTER ── */}
        <div
          className="shrink-0 flex justify-end gap-3 px-6 py-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <button
            onClick={handleClose}
            className="px-5 py-2 rounded-xl text-sm font-medium transition"
            style={{
              background: "rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.6)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.09)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50"
            style={{
              background: "#D4A97A",
              color: "#1C1209",
            }}
          >
            {submitting ? "Saving…" : mode === "edit" ? "Update" : "Save"}
          </button>
        </div>

      </div>
    </div>
  );
}