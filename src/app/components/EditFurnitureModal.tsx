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
    setDefaultVariant,
    buildPayload,
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
  } = state;

  const [submitting, setSubmitting] = useState(false);

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
  }, [images, variants]);

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

      onClose();
    } catch (err) {
      console.error("❌ UPDATE FAILED:", err);
    } finally {
      setSubmitting(false);
    }
  }, [isOpen, item, buildPayload, onSave, onClose]);

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
     UI
  ========================================================= */

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">

      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-xl flex flex-col max-h-[92vh] overflow-hidden">

        {/* HEADER */}
        <div className="px-6 py-4 border-b flex justify-between">
          <h2 className="text-lg font-semibold">Edit Furniture</h2>
          <button onClick={onClose}>✕</button>
        </div>

        <div className="flex flex-1 overflow-hidden">

          {/* PREVIEW */}
          <div className="w-1/2 bg-neutral-50 flex items-center justify-center">
            {modelPreviewUrl ? (
              <Furniture3DViewer
                modelUrl={modelPreviewUrl}
                selectedVariantTextureUrl={null}
              />
            ) : (
              <p>No model</p>
            )}
          </div>

          {/* FORM */}
          <div className="w-1/2 p-6 overflow-y-auto space-y-4">

            {/* BASIC */}
            <input
              value={name}
              onChange={(e) => setField("name", e.target.value)}
            />

            <textarea
              value={description}
              onChange={(e) => setField("description", e.target.value)}
            />

            <select
              value={categoryId}
              onChange={(e) => setField("categoryId", e.target.value)}
            >
              <option value="">Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <input
              type="number"
              value={basePrice}
              onChange={(e) => setField("basePrice", Number(e.target.value))}
            />

            <input
              type="file"
              onChange={(e) =>
                setField("modelFile", e.target.files?.[0] ?? undefined)
              }
            />

            {/* IMAGES */}
            <input
              type="file"
              multiple
              onChange={(e) => addImages(e.target.files)}
            />

            <div className="grid grid-cols-3 gap-2">
              {images.filter(i => !i.isDeleted).map((img) => {
                const key = getKey(img);

                return (
                  <div key={key} className="relative">
                    <img src={img.url} className="h-20 w-full object-cover" />

                    <button onClick={() => removeImage(key)}>✕</button>

                    <button onClick={() => setPrimaryImage(key)}>
                      {img.isPrimary ? "Main" : "Set"}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* VARIANTS */}
            <button onClick={addVariant}>+ Variant</button>

            {variants.filter(v => !v.isDeleted).map((v) => {
              const key = getKey(v);

              return (
                <div key={key} className="space-y-2 border p-2 rounded">

                  <input
                    value={v.name}
                    onChange={(e) =>
                      updateVariant(key, "name", e.target.value)
                    }
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
                  />

                  <input
                    type="file"
                    onChange={(e) =>
                      handleVariantFile(key, e.target.files?.[0] ?? null)
                    }
                  />

                  <div className="flex gap-2">

                    <label>
                      <input
                        type="radio"
                        checked={v.isDefault}
                        onChange={() => setDefaultVariant(key)}
                      />
                      Default
                    </label>

                    <button onClick={() => removeVariant(key)}>
                      Remove
                    </button>

                  </div>
                </div>
              );
            })}

          </div>
        </div>

        {/* FOOTER */}
        <div className="border-t px-6 py-4 flex justify-end gap-3">
          <button onClick={onClose}>Cancel</button>

          <button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Updating..." : "Update"}
          </button>
        </div>

      </div>
    </div>
  );
}