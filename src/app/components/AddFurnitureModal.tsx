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
    setDefaultVariant,
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
     LOCAL UI STATE
  ========================================================= */

  const [activeVariantId, setActiveVariantId] = useState<string | null>(null);

  /* =========================================================
     SAFE CLOSE HANDLER (ONLY RESET POINT)
  ========================================================= */

  const handleClose = useCallback(() => {
    resetForm();
    setActiveVariantId(null);
    onClose();
  }, [resetForm, onClose]);

  /* =========================================================
     VARIANT PREVIEW
  ========================================================= */

  const activeVariantTexture = useMemo(() => {
    if (!activeVariantId) return null;

    return (
      variants.find(
        (v) => (v.id ?? v.clientId) === activeVariantId
      )?.previewUrl ?? null
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
     CLEANUP (ONLY ON UNMOUNT)
  ========================================================= */

  useEffect(() => {
    if (!isOpen) return;

    return () => {
      images.forEach((img) => {
        if (img.url.startsWith("blob:")) {
          revokeFilePreview(img.url);
        }
      });

      variants.forEach((v) => {
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
     SUBMIT (RESET AFTER SUCCESS)
  ========================================================= */

  const handleSubmit = useCallback(() => {
    if (!name.trim() || !categoryId) return;

    const payload = buildPayload();
    onSave(payload);

    resetForm();
    setActiveVariantId(null);
    onClose();
  }, [
    name,
    categoryId,
    buildPayload,
    onSave,
    resetForm,
    onClose,
  ]);

  if (!isOpen) return null;

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-xl flex flex-col max-h-[92vh] overflow-hidden">

        {/* HEADER */}
        <div className="px-6 py-4 border-b flex justify-between">
          <div>
            <h2 className="text-lg font-semibold">Create Furniture</h2>
            <p className="text-xs text-neutral-500">
              Upload model, images, variants, and details
            </p>
          </div>

          <button onClick={handleClose}>✕</button>
        </div>

        <div className="flex flex-1 overflow-hidden">

          {/* PREVIEW */}
          <div className="w-1/2 bg-neutral-50 flex items-center justify-center">
            {modelPreviewUrl ? (
              <Furniture3DViewer
                modelUrl={modelPreviewUrl}
                selectedVariantTextureUrl={activeVariantTexture}
              />
            ) : (
              <p className="text-sm text-neutral-400">
                Upload model to preview
              </p>
            )}
          </div>

          {/* FORM */}
          <div className="w-1/2 p-6 overflow-y-auto space-y-5">

            <input
              value={name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="Name"
              className="w-full border px-3 py-2 rounded"
            />

            <textarea
              value={description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Description"
              className="w-full border px-3 py-2 rounded"
            />

            <select
              value={categoryId}
              onChange={(e) => setField("categoryId", e.target.value)}
              className="w-full border px-3 py-2 rounded"
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <input
              type="number"
              value={basePrice}
              onChange={(e) =>
                setField("basePrice", Number(e.target.value))
              }
              className="w-full border px-3 py-2 rounded"
            />

            {/* DIMENSIONS */}
            <div className="grid grid-cols-3 gap-2">
              <input
                value={widthCm ?? ""}
                onChange={(e) =>
                  setField(
                    "widthCm",
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                placeholder="W"
                className="border px-2 py-1 rounded"
              />
              <input
                value={depthCm ?? ""}
                onChange={(e) =>
                  setField(
                    "depthCm",
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                placeholder="D"
                className="border px-2 py-1 rounded"
              />
              <input
                value={heightCm ?? ""}
                onChange={(e) =>
                  setField(
                    "heightCm",
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                placeholder="H"
                className="border px-2 py-1 rounded"
              />
            </div>

            {/* MODEL */}
            <input
              type="file"
              accept=".glb,.gltf,.obj"
              onChange={(e) =>
                setField("modelFile", e.target.files?.[0] ?? undefined)
              }
            />

            {/* IMAGES */}
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => addImages(e.target.files)}
            />

            <div className="grid grid-cols-3 gap-2">
              {images
                .filter((i) => !i.isDeleted)
                .map((img) => {
                  const key = img.id ?? img.clientId;

                  return (
                    <div key={key} className="relative border rounded overflow-hidden">
                      <img src={img.url} className="h-20 w-full object-cover" />

                      <button
                        onClick={() => removeImage(key)}
                        className="absolute top-1 right-1 bg-black text-white text-xs px-1"
                      >
                        ✕
                      </button>

                      <button
                        onClick={() => setPrimaryImage(key)}
                        className="absolute bottom-1 left-1 bg-white text-xs px-1"
                      >
                        {img.isPrimary ? "Main" : "Set"}
                      </button>
                    </div>
                  );
                })}
            </div>

            {/* VARIANTS */}
            <div className="space-y-3">

              <div className="flex justify-between">
                <p className="font-medium">Variants</p>
                <button onClick={addVariant}>+ Add</button>
              </div>

              {variants
                .filter((v) => !v.isDeleted)
                .map((v) => {
                  const key = v.id ?? v.clientId;

                  return (
                    <div key={key} className="border p-3 rounded space-y-2">

                      <input
                        value={v.name}
                        onChange={(e) =>
                          updateVariant(key, "name", e.target.value)
                        }
                        placeholder="Variant name"
                        className="w-full border px-2 py-1 rounded"
                      />

                      <input
                        type="number"
                        value={v.priceAdjustment}
                        onChange={(e) =>
                          updateVariant(
                            key,
                            "priceAdjustment",
                            Number(e.target.value)
                          )
                        }
                        className="w-full border px-2 py-1 rounded"
                      />

                      <input
                        type="file"
                        onChange={(e) =>
                          handleVariantFile(
                            key,
                            e.target.files?.[0] ?? null
                          )
                        }
                      />

                      <div className="flex justify-between">
                        <button onClick={() => setActiveVariantId(key)}>
                          Apply
                        </button>

                        <input
                          type="radio"
                          checked={v.isDefault}
                          onChange={() => setDefaultVariant(key)}
                        />

                        <button onClick={() => removeVariant(key)}>
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>

          </div>
        </div>

        {/* FOOTER */}
        <div className="border-t px-6 py-4 flex justify-end gap-3">
          <button onClick={handleClose}>Cancel</button>
          <button
            onClick={handleSubmit}
            className="bg-black text-white px-4 py-2 rounded"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}