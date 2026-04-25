"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Furniture3DViewer from "@/app/components/Furniture3DViewer";

import type {
  FurnitureCategory,
  FurnitureFormPayload,
} from "@/types/furniture";

import {
  createFilePreview,
  revokeFilePreview,
} from "@/utils/furnitureUtils";

import { useFurnitureForm } from "@/hooks/useFurnitureForm";

/* ========================================================= */

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: FurnitureFormPayload) => void;
  categories: FurnitureCategory[];
};

/* ========================================================= */

export default function AddFurnitureModal({
  isOpen,
  onClose,
  onSave,
  categories,
}: Props) {
  const {
    state,
    setField,
    addImages,
    removeImage,
    setPrimaryImage,
    addVariant,
    updateVariant,
    removeVariant,
    buildPayload,
    resetForm,
  } = useFurnitureForm({
    mode: "create",
  });

  const {
    name,
    description,
    categoryId,
    basePrice,
    modelFile,
    images,
    variants,
    widthCm,
    depthCm,
    heightCm,
  } = state;

  /* =========================================================
     UI STATE (APPLY VARIANT ONLY)
  ========================================================= */

  const [activeVariantId, setActiveVariantId] = useState<string | null>(null);

  /* =========================================================
     CLOSE
  ========================================================= */

  const handleClose = useCallback(() => {
    resetForm();
    setActiveVariantId(null);
    onClose();
  }, [resetForm, onClose]);

  /* =========================================================
     ACTIVE VARIANT TEXTURE (APPLY ONLY)
  ========================================================= */

  const activeVariantTexture = useMemo(() => {
    if (!activeVariantId) return null;

    return (
      variants.find(v => (v.id ?? v.clientId) === activeVariantId)
        ?.previewUrl ?? null
    );
  }, [activeVariantId, variants]);

  /* =========================================================
     MODEL PREVIEW
  ========================================================= */

  const modelPreviewUrl = useMemo(() => {
    if (!modelFile) return null;
    return createFilePreview(modelFile);
  }, [modelFile]);

  useEffect(() => {
    return () => {
      if (modelPreviewUrl?.startsWith("blob:")) {
        revokeFilePreview(modelPreviewUrl);
      }
    };
  }, [modelPreviewUrl]);

  /* =========================================================
     CLEANUP
  ========================================================= */

  useEffect(() => {
    if (!isOpen) return;

    return () => {
      images.forEach(img => {
        if (img.url.startsWith("blob:")) {
          revokeFilePreview(img.url);
        }
      });

      variants.forEach(v => {
        if (v.previewUrl?.startsWith("blob:")) {
          revokeFilePreview(v.previewUrl);
        }
      });
    };
  }, [isOpen, images, variants]);

  /* =========================================================
     VARIANT FILE HANDLER
  ========================================================= */

  const handleVariantFile = useCallback(
    (key: string, file: File | null) => {
      if (!file) return;

      const url = createFilePreview(file);

      updateVariant(key, "materialFile", file);
      updateVariant(key, "previewUrl", url);
    },
    [updateVariant]
  );

  /* =========================================================
     SUBMIT
  ========================================================= */

  const handleSubmit = useCallback(() => {
    if (!name.trim() || !categoryId) return;

    const payload = buildPayload();
    onSave(payload);

    resetForm();
    setActiveVariantId(null);
    onClose();
  }, [name, categoryId, buildPayload, onSave, resetForm, onClose]);

  if (!isOpen) return null;

/* =========================================================
   UI (PREMIUM ADD MODAL REDESIGN — MATCHES EDIT MODAL)
========================================================= */

return (
  <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="w-full max-w-7xl h-[94vh] bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col">

      {/* =====================================================
          HEADER
      ====================================================== */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-8 py-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">
            Create Furniture
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Upload model, images, dimensions, and optional variants
          </p>
        </div>

        <button
          onClick={handleClose}
          className="w-10 h-10 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-900 transition flex items-center justify-center"
        >
          ✕
        </button>
      </div>

      {/* =====================================================
          BODY
      ====================================================== */}
      <div className="flex flex-1 overflow-hidden bg-gray-50">

        {/* =====================================================
            LEFT PANEL — 3D PREVIEW
        ====================================================== */}
        <div className="w-[48%] border-r border-gray-200 bg-white flex flex-col">

          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">
              Live 3D Preview
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Preview uploaded model and apply variants instantly
            </p>
          </div>

          <div className="flex-1 flex items-center justify-center p-6 bg-white">
            {modelPreviewUrl ? (
              <Furniture3DViewer
                modelUrl={modelPreviewUrl}
                selectedVariantTextureUrl={activeVariantTexture}
              />
            ) : (
              <div className="text-center space-y-2">
                <p className="text-sm font-medium text-gray-500">
                  No 3D model uploaded
                </p>
                <p className="text-xs text-gray-400">
                  Upload .glb / .gltf / .obj to preview here
                </p>
              </div>
            )}
          </div>
        </div>

        {/* =====================================================
            RIGHT PANEL — FORM
        ====================================================== */}
        <div className="w-[52%] overflow-y-auto px-6 py-6 space-y-6">

          {/* =====================================================
              BASIC INFORMATION
          ====================================================== */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Basic Information
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Core product details and pricing
              </p>
            </div>

            <div className="space-y-4">

              {/* NAME */}
              <div>
                <label className="text-xs font-medium text-gray-600">
                  Furniture Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="Premium Sofa"
                  className="w-full mt-2 rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="text-xs font-medium text-gray-600">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setField("description", e.target.value)}
                  rows={4}
                  placeholder="Short description of the furniture..."
                  className="w-full mt-2 rounded-xl border border-gray-200 px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* CATEGORY + PRICE */}
              <div className="grid grid-cols-2 gap-4">

                <div>
                  <label className="text-xs font-medium text-gray-600">
                    Category
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) =>
                      setField("categoryId", e.target.value)
                    }
                    className="w-full mt-2 rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600">
                    Base Price
                  </label>
                  <input
                    type="number"
                    value={basePrice ?? ""}
                    onChange={(e) =>
                      setField(
                        "basePrice",
                        e.target.value === ""
                          ? null
                          : Number(e.target.value)
                      )
                    }
                    placeholder="0.00"
                    className="w-full mt-2 rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

              </div>

              {/* DIMENSIONS */}
              <div>
                <label className="text-xs font-medium text-gray-600">
                  Dimensions (W × D × H cm)
                </label>

                <div className="grid grid-cols-3 gap-3 mt-2">

                  <input
                    type="number"
                    value={widthCm ?? ""}
                    onChange={(e) =>
                      setField(
                        "widthCm",
                        e.target.value === ""
                          ? null
                          : Number(e.target.value)
                      )
                    }
                    placeholder="Width"
                    className="rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />

                  <input
                    type="number"
                    value={depthCm ?? ""}
                    onChange={(e) =>
                      setField(
                        "depthCm",
                        e.target.value === ""
                          ? null
                          : Number(e.target.value)
                      )
                    }
                    placeholder="Depth"
                    className="rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />

                  <input
                    type="number"
                    value={heightCm ?? ""}
                    onChange={(e) =>
                      setField(
                        "heightCm",
                        e.target.value === ""
                          ? null
                          : Number(e.target.value)
                      )
                    }
                    placeholder="Height"
                    className="rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />

                </div>
              </div>

            </div>
          </div>

          {/* =====================================================
              MEDIA
          ====================================================== */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Media Uploads
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Upload model files and product images
              </p>
            </div>

            {/* MODEL */}
            <div className="pb-5 border-b border-gray-100">
              <label className="text-xs font-medium text-gray-600">
                3D Model
              </label>

              <input
                type="file"
                accept=".glb,.gltf,.obj"
                onChange={(e) =>
                  setField(
                    "modelFile",
                    e.target.files?.[0] ?? undefined
                  )
                }
                className="w-full mt-2 text-sm"
              />
            </div>

            {/* IMAGES */}
            <div className="space-y-4">
              <label className="text-xs font-medium text-gray-600">
                Product Images
              </label>

              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => addImages(e.target.files)}
                className="w-full text-sm"
              />

              <div className="grid grid-cols-3 gap-4">
                {images
                  .filter((i) => !i.isDeleted)
                  .map((img) => {
                    const key = img.id ?? img.clientId;

                    return (
                      <div
                        key={key}
                        className="relative group rounded-xl overflow-hidden border border-gray-200 bg-white"
                      >
                        <img
                          src={img.url}
                          className="h-28 w-full object-cover"
                        />

                        {img.isPrimary && (
                          <span className="absolute top-2 left-2 text-[10px] bg-indigo-600 text-white px-2 py-1 rounded-md">
                            Thumbnail
                          </span>
                        )}

                        <button
                          onClick={() => removeImage(key)}
                          className="absolute top-2 right-2 z-20 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm hover:text-red-600 flex items-center justify-center"
                        >
                          ✕
                        </button>

                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                          <button
                            onClick={() => setPrimaryImage(key)}
                            className="bg-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-gray-100"
                          >
                            Set Thumbnail
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* =====================================================
              VARIANTS
          ====================================================== */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Variants
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Optional materials / texture overrides
                </p>
              </div>

              <button
                onClick={addVariant}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50 transition"
              >
                + Add Variant
              </button>
            </div>

            <div className="space-y-4">
              {variants
                .filter((v) => !v.isDeleted)
                .map((v) => {
                  const key = v.id ?? v.clientId;

                  return (
                    <div
                      key={key}
                      className="rounded-2xl border border-gray-200 bg-gray-50 p-4 flex gap-4"
                    >
                      <div className="w-14 h-14 rounded-xl border bg-white overflow-hidden flex items-center justify-center">
                        {(v.previewUrl ||
                          v.texture_url ||
                          v.textureUrl) ? (
                          <img
                            src={
                              v.previewUrl ||
                              v.texture_url ||
                              v.textureUrl
                            }
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[10px] text-gray-400">
                            No Img
                          </span>
                        )}
                      </div>

                      <div className="flex-1 space-y-3">
                        <input
                          value={v.name}
                          onChange={(e) =>
                            updateVariant(
                              key,
                              "name",
                              e.target.value
                            )
                          }
                          placeholder="Variant name"
                          className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm"
                        />

                        <input
                          type="number"
                          value={v.priceAdjustment ?? ""}
                          onChange={(e) =>
                            updateVariant(
                              key,
                              "priceAdjustment",
                              e.target.value === ""
                                ? null
                                : Number(e.target.value)
                            )
                          }
                          placeholder="Add price"
                          className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm"
                        />

                        <input
                          type="file"
                          onChange={(e) =>
                            handleVariantFile(
                              key,
                              e.target.files?.[0] ?? null
                            )
                          }
                          className="w-full text-sm"
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveVariantId(key)
                          }
                          className={`px-3 py-2 rounded-lg text-xs font-medium ${
                            activeVariantId === key
                              ? "bg-green-100 text-green-700"
                              : "bg-white border border-gray-200 text-gray-700"
                          }`}
                        >
                          Apply
                        </button>

                        <button
                          onClick={() => removeVariant(key)}
                          className="px-3 py-2 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

        </div>
      </div>

      {/* =====================================================
          FOOTER
      ====================================================== */}
      <div className="shrink-0 border-t border-gray-200 bg-white px-8 py-5 flex items-center justify-end gap-3">
        <button
          onClick={handleClose}
          className="px-5 py-3 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50 transition"
        >
          Cancel
        </button>

        <button
          onClick={handleSubmit}
          className="px-6 py-3 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition"
        >
          Create Furniture
        </button>
      </div>

    </div>
  </div>
);
}