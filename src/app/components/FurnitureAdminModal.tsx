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
  onSave: (
    id: string | null,
    data: FurnitureFormPayload
  ) => Promise<void> | void;
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
  /* =========================================================
     FORM + CONTROLLER (UNIFIED HOOK FLOW)
  ========================================================= */

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

  /* =========================================================
     GUARDS
  ========================================================= */

  if (!isOpen) return null;

  if (!item && mode === "edit") {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="text-white text-sm">Furniture not found</div>
      </div>
    );
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">

      <div className="w-full max-w-7xl h-[94vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden">

        <div className="flex flex-1 min-h-0">

          {/* =====================================================
              LEFT PREVIEW
          ===================================================== */}

          <div className="w-[48%] border-r bg-white flex flex-col">
            <div className="p-5 border-b font-semibold text-sm">
              Live Preview
            </div>

            <div className="flex-1 flex items-center justify-center p-6">
              {modelPreviewUrl ? (
                <Furniture3DViewer
                  modelUrl={modelPreviewUrl}
                  selectedVariantTextureUrl={activeVariantTexture}
                />
              ) : (
                <div className="text-gray-400">
                  No model uploaded
                </div>
              )}
            </div>
          </div>

          {/* =====================================================
              RIGHT FORM
          ===================================================== */}

          <div className="w-[52%] overflow-y-auto p-6 space-y-6">

            {/* ================= BASIC INFO ================= */}

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

            {/* ================= ASSETS ================= */}

            <AssetsSection
              state={{
                modelFile: state.modelFile,
                images: state.images,
              }}
              setModelFile={(file) =>
  setField("modelFile", file)
}
              addImages={addImages}
              removeImage={removeImage}
              setPrimaryImage={setPrimaryImage}
            />

            {/* ================= VARIANTS ================= */}

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

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <div className="shrink-0 border-t bg-white px-6 py-4 flex justify-end gap-3">

          <button
            onClick={handleClose}
            className="px-4 py-2 border rounded-xl text-sm"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm disabled:opacity-50"
          >
            {submitting
              ? "Saving..."
              : mode === "edit"
              ? "Update"
              : "Save"}
          </button>

        </div>

      </div>
    </div>
  );
}