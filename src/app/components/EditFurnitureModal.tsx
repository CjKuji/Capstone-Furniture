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
  item: any | null;
  onClose: () => void;
  onSave: (id: string, data: FurnitureFormPayload) => Promise<void> | void;
  categories: FurnitureCategory[];
};

/* ========================================================= */

const getKey = (x: { id?: string; clientId: string }) =>
  x.id ?? x.clientId;

/* ========================================================= */

export default function EditFurnitureModal({
  isOpen,
  item,
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
    mode: "edit",
    item,
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

  const [submitting, setSubmitting] = useState(false);

  /* =========================================================
     APPLY VARIANT (UI ONLY - NO BUSINESS STATE)
  ========================================================= */

  const [appliedVariantId, setAppliedVariantId] = useState<string | null>(null);

  const appliedVariantTextureUrl = useMemo(() => {
    if (!appliedVariantId) return null;

    return (
      variants.find(v => getKey(v) === appliedVariantId)
        ?.previewUrl ?? null
    );
  }, [appliedVariantId, variants]);

  /* =========================================================
     ORDERING (NO DEFAULT LOGIC)
     - purely stable rendering order
  ========================================================= */

  const orderedImages = useMemo(() => {
    return images.filter(i => !i.isDeleted);
  }, [images]);

  const orderedVariants = useMemo(() => {
    return variants.filter(v => !v.isDeleted);
  }, [variants]);

  /* =========================================================
     RESET
  ========================================================= */

  const handleClose = useCallback(() => {
    resetForm();
    setAppliedVariantId(null);
    onClose();
  }, [resetForm, onClose]);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
      setAppliedVariantId(null);
    }
  }, [isOpen, resetForm]);

  /* =========================================================
     MODEL PREVIEW
  ========================================================= */

  const modelPreviewUrl = useMemo(() => {
    if (!modelFile) return item?.model_url ?? null;
    return createFilePreview(modelFile);
  }, [modelFile, item]);

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
        if (img.url?.startsWith("blob:")) {
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
     VARIANT FILE
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

  const handleSubmit = useCallback(async () => {
    if (!isOpen || !item?.id) return;

    setSubmitting(true);

    try {
      const payload = buildPayload();

      await onSave(item.id, payload);

      resetForm();
      setAppliedVariantId(null);
      onClose();
    } catch (err) {
      console.error("❌ UPDATE FAILED:", err);
    } finally {
      setSubmitting(false);
    }
  }, [isOpen, item, buildPayload, onSave, onClose, resetForm]);

  /* ========================================================= */

  if (!isOpen) return null;

  if (!item) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="text-white text-sm">Furniture not found</div>
      </div>
    );
  }

/* =========================================================
   UI (REVISED MODERN CLEAN ADMIN MODAL)
========================================================= */

return (
  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4">
    <div className="w-full max-w-7xl h-[94vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-200">

      {/* =====================================================
          HEADER
      ===================================================== */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-8 py-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Edit Furniture
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage product details, media, dimensions, and variants
          </p>
        </div>

        <button
          onClick={handleClose}
          className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition"
        >
          ✕
        </button>
      </div>

      {/* =====================================================
          BODY
      ===================================================== */}
      <div className="flex flex-1 min-h-0 bg-gray-50">

        {/* =====================================================
            LEFT PANEL — 3D PREVIEW
        ===================================================== */}
        <div className="w-[48%] border-r border-gray-200 bg-white flex flex-col">

          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">
              Live Preview
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Preview uploaded model and applied variant texture
            </p>
          </div>

          <div className="flex-1 flex items-center justify-center p-6">
            {modelPreviewUrl ? (
              <div className="w-full h-full rounded-2xl border border-gray-200 overflow-hidden bg-white">
                <Furniture3DViewer
                  modelUrl={modelPreviewUrl}
                  selectedVariantTextureUrl={appliedVariantTextureUrl}
                />
              </div>
            ) : (
              <div className="w-full h-full rounded-2xl border border-dashed border-gray-300 flex items-center justify-center text-sm text-gray-400 bg-gray-50">
                No 3D model uploaded
              </div>
            )}
          </div>
        </div>

        {/* =====================================================
            RIGHT PANEL — FORM
        ===================================================== */}
        <div className="w-[52%] overflow-y-auto p-6 space-y-6">

          {/* =====================================================
              BASIC INFORMATION
          ===================================================== */}
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
                  placeholder="Enter furniture name"
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
                  placeholder="Product description"
                  className="w-full mt-2 rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
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
                    onChange={(e) => setField("categoryId", e.target.value)}
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
                    placeholder="Width"
                    onChange={(e) =>
                      setField(
                        "widthCm",
                        e.target.value === ""
                          ? null
                          : Number(e.target.value)
                      )
                    }
                    className="rounded-xl border border-gray-200 px-4 py-3 text-sm"
                  />

                  <input
                    type="number"
                    value={depthCm ?? ""}
                    placeholder="Depth"
                    onChange={(e) =>
                      setField(
                        "depthCm",
                        e.target.value === ""
                          ? null
                          : Number(e.target.value)
                      )
                    }
                    className="rounded-xl border border-gray-200 px-4 py-3 text-sm"
                  />

                  <input
                    type="number"
                    value={heightCm ?? ""}
                    placeholder="Height"
                    onChange={(e) =>
                      setField(
                        "heightCm",
                        e.target.value === ""
                          ? null
                          : Number(e.target.value)
                      )
                    }
                    className="rounded-xl border border-gray-200 px-4 py-3 text-sm"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* =====================================================
              MEDIA
          ===================================================== */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Media
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Upload model and product images
              </p>
            </div>

            {/* MODEL */}
            <div>
              <label className="text-xs font-medium text-gray-600">
                3D Model
              </label>

              <input
                type="file"
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
            <div>
              <label className="text-xs font-medium text-gray-600">
                Product Images
              </label>

              <input
                type="file"
                multiple
                onChange={(e) => addImages(e.target.files)}
                className="w-full mt-2 text-sm"
              />

              <div className="grid grid-cols-3 gap-4 mt-4">
                {orderedImages.map((img) => {
                  const key = getKey(img);

                  return (
                    <div
                      key={key}
                      className="relative rounded-xl overflow-hidden border border-gray-200 bg-white group"
                    >
                      <img
                        src={img.url}
                        className="w-full h-28 object-cover"
                      />

                      {img.isPrimary && (
                        <span className="absolute top-2 left-2 text-[10px] font-medium bg-indigo-600 text-white px-2 py-1 rounded-md">
                          Thumbnail
                        </span>
                      )}

                      <button
                        onClick={() => removeImage(key)}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white border shadow-sm flex items-center justify-center text-sm hover:text-red-600"
                      >
                        ✕
                      </button>

                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <button
                          onClick={() => setPrimaryImage(key)}
                          className="bg-white px-4 py-2 rounded-lg text-xs font-medium"
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
          ===================================================== */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Variants
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Manage textures and price adjustments
                </p>
              </div>

              <button
                onClick={addVariant}
                className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm hover:bg-black transition"
              >
                + Add Variant
              </button>
            </div>

            <div className="space-y-4">
              {orderedVariants.map((v) => {
                const key = getKey(v);

                return (
                  <div
                    key={key}
                    className="rounded-2xl border border-gray-200 p-4 bg-gray-50"
                  >
                    <div className="flex gap-4">

                      <div className="w-16 h-16 rounded-xl border bg-white overflow-hidden flex items-center justify-center shrink-0">
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
                            No Image
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
                          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
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
                          placeholder="Price adjustment"
                          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                        />

                        <input
                          type="file"
                          onChange={(e) =>
                            handleVariantFile(
                              key,
                              e.target.files?.[0] ?? null
                            )
                          }
                          className="text-sm"
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => setAppliedVariantId(key)}
                          className={`px-4 py-2 rounded-xl text-xs font-medium ${
                            appliedVariantId === key
                              ? "bg-green-100 text-green-700"
                              : "bg-white border border-gray-200 text-gray-700"
                          }`}
                        >
                          Apply
                        </button>

                        <button
                          onClick={() => removeVariant(key)}
                          className="px-4 py-2 rounded-xl text-xs font-medium text-red-600 border border-red-100 hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </div>

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
      ===================================================== */}
      <div className="shrink-0 border-t border-gray-200 bg-white px-8 py-5 flex justify-end gap-3">
        <button
          onClick={handleClose}
          className="px-5 py-3 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50 transition"
        >
          Cancel
        </button>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="px-6 py-3 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
        >
          {submitting ? "Updating..." : "Update Furniture"}
        </button>
      </div>

    </div>
  </div>
);
}