"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createFilePreview,
  revokeFilePreview,
} from "@/utils/furnitureUtils";

import type {
  FurnitureFormPayload,
  FurnitureItemAdmin,
} from "@/types/furniture";

import type { useFurnitureForm } from "@/hooks/useFurnitureForm";

/* ========================================================= */

type FormHook = ReturnType<typeof useFurnitureForm>;

type Params = {
  form: FormHook;
  item: FurnitureItemAdmin | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    id: string | null,
    data: FurnitureFormPayload
  ) => Promise<void> | void;
};

/* ========================================================= */

type BasicInfoKeys =
  | "name"
  | "description"
  | "categoryId"
  | "basePrice"
  | "widthCm"
  | "depthCm"
  | "heightCm";

/* ========================================================= */

export function useFurnitureModalController({
  form,
  item,
  isOpen,
  onClose,
  onSave,
}: Params) {
  const {
    state,
    validate,
    buildPayload,
    resetForm,
    addImages,
    removeImage,
    setPrimaryImage,
    addVariant,
    updateVariant,
    removeVariant,
    setField,
    
  } = form;

  /* =========================================================
     UI STATE
  ========================================================= */

  const [submitting, setSubmitting] = useState(false);
  const [activeVariantId, setActiveVariantId] = useState<string | null>(null);

  /* =========================================================
     KEY RESOLVER
  ========================================================= */

  const getKey = useCallback(
    (x: { id?: string; clientId: string }) => x.id ?? x.clientId,
    []
  );

  /* =========================================================
     BASIC INFO FIELD SETTER (STRICT FIX)
  ========================================================= */

  const setBasicInfoField = useCallback(
    <K extends BasicInfoKeys>(key: K, value: any) => {
      setField(key, value);
    },
    [setField]
  );

  /* =========================================================
     MODEL FILE HANDLER (NO setField abuse)
  ========================================================= */

  const setModelFile = useCallback(
    (file?: File) => {
      setField("modelFile", file);
    },
    [setField]
  );

  /* =========================================================
     DERIVED STATE
  ========================================================= */

  const images = useMemo(
    () => state.images.filter((i) => !i.isDeleted),
    [state.images]
  );

  const variants = useMemo(
    () => state.variants.filter((v) => !v.isDeleted),
    [state.variants]
  );

  const activeVariantTexture = useMemo(() => {
    if (!activeVariantId) return null;

    const variant = state.variants.find(
      (v) => getKey(v) === activeVariantId
    );

    return variant?.previewUrl ?? null;
  }, [activeVariantId, state.variants, getKey]);

  /* =========================================================
     MODEL PREVIEW
  ========================================================= */

  const [modelPreviewUrl, setModelPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!state.modelFile) {
      setModelPreviewUrl(item?.model_url ?? null);
      return;
    }

    const url = createFilePreview(state.modelFile);
    setModelPreviewUrl(url);

    return () => {
      if (url.startsWith("blob:")) {
        revokeFilePreview(url);
      }
    };
  }, [state.modelFile, item]);

  /* =========================================================
     CLEANUP
  ========================================================= */

  useEffect(() => {
    return () => {
      state.images.forEach((img) => {
        if (img.url?.startsWith("blob:")) {
          revokeFilePreview(img.url);
        }
      });

      state.variants.forEach((v) => {
        if (v.previewUrl?.startsWith("blob:")) {
          revokeFilePreview(v.previewUrl);
        }
      });
    };
  }, [state.images, state.variants]);

  /* =========================================================
     CLOSE
  ========================================================= */

  const handleClose = useCallback(() => {
    resetForm();
    setActiveVariantId(null);
    onClose();
  }, [resetForm, onClose]);

  /* =========================================================
     SUBMIT
  ========================================================= */

  const handleSubmit = useCallback(async () => {
    if (!isOpen) return;

    setSubmitting(true);

    try {
      const ok = validate();
      if (!ok) return;

      const payload = buildPayload();
      if (!payload) return;

      await onSave(item?.id ?? null, payload);

      resetForm();
      setActiveVariantId(null);
      onClose();
    } finally {
      setSubmitting(false);
    }
  }, [isOpen, validate, buildPayload, onSave, item, resetForm, onClose]);

  /* =========================================================
     VARIANT FILE HANDLER (SAFE)
  ========================================================= */

  const handleVariantFile = useCallback(
    (key: string, file: File | null) => {
      if (!file) return;

      const url = createFilePreview(file);

      updateVariant(key, "materialFile", file as any);
      updateVariant(key, "previewUrl", url as any);
    },
    [updateVariant]
  );

  /* =========================================================
     RETURN API
  ========================================================= */

  return {
    state,

    images,
    variants,

    submitting,

    modelPreviewUrl,
    activeVariantTexture,
    activeVariantId,

    setBasicInfoField,
    setModelFile,

    setActiveVariantId,

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

    validate,
    buildPayload,

    setField,
  };
}